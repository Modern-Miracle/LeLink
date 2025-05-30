import { ethers } from 'hardhat';
import { HardhatEthersSigner } from '@nomicfoundation/hardhat-ethers/signers';
import { LeLink, LeLink__factory } from '../typechain-types';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// Type Definitions & Interfaces
// ============================================================================

/**
 * Interface for deployment configuration
 */
interface DeploymentConfig {
  readonly contractName: string;
  readonly gasLimit?: number;
  readonly gasPrice?: string;
  readonly verify?: boolean;
}

/**
 * Interface for deployment result information
 */
interface DeploymentResult {
  readonly contract: LeLink;
  readonly address: string;
  readonly owner: string;
  readonly deploymentHash: string;
  readonly blockNumber: number;
  readonly gasUsed: bigint;
}

/**
 * Interface for deployment metadata to be saved to file
 */
interface DeploymentMetadata {
  readonly contractAddress: string;
  readonly contractName: string;
  readonly owner: string;
  readonly network: string;
  readonly blockNumber: number;
  readonly deploymentTime: string;
  readonly deployerAddress: string;
  readonly deploymentHash: string;
  readonly gasUsed: string;
  readonly compiler: {
    readonly version: string;
    readonly settings: Record<string, unknown>;
  };
}

/**
 * Interface for network configuration
 */
interface NetworkInfo {
  readonly name: string;
  readonly chainId: number;
  readonly blockNumber: number;
}

// ============================================================================
// Utility Types
// ============================================================================

type DeploymentStatus = 'pending' | 'success' | 'failed';
type NetworkName = 'localhost' | 'sepolia' | 'mainnet' | 'hardhat';

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_CONFIG: DeploymentConfig = {
  contractName: 'LeLink',
  verify: false,
} as const;

const DEPLOYMENT_TIMEOUT = 300000; // 5 minutes in milliseconds

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Formats wei amount to human readable format
 */
function formatEther(wei: bigint): string {
  return ethers.formatEther(wei);
}

/**
 * Validates deployment environment
 */
function validateEnvironment(): void {
  if (!process.env.HARDHAT_NETWORK && process.argv.includes('--network')) {
    const networkIndex = process.argv.indexOf('--network') + 1;
    if (networkIndex < process.argv.length) {
      process.env.HARDHAT_NETWORK = process.argv[networkIndex];
    }
  }
}

/**
 * Creates deployment directory if it doesn't exist
 */
function ensureDeploymentDirectory(): string {
  const deploymentsDir = path.join(__dirname, '..', 'deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  return deploymentsDir;
}

/**
 * Gets network information
 */
async function getNetworkInfo(): Promise<NetworkInfo> {
  const network = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();

  return {
    name: network.name,
    chainId: Number(network.chainId),
    blockNumber,
  };
}

/**
 * Validates deployer account balance
 */
async function validateDeployerBalance(deployer: HardhatEthersSigner, minimumBalance = '0.1'): Promise<void> {
  const balance = await deployer.provider.getBalance(deployer.address);
  const minimumWei = ethers.parseEther(minimumBalance);

  if (balance < minimumWei) {
    throw new Error(`Insufficient balance. Required: ${minimumBalance} ETH, Available: ${formatEther(balance)} ETH`);
  }
}

/**
 * Deploys the contract with proper error handling
 */
async function deployContract(deployer: HardhatEthersSigner, config: DeploymentConfig): Promise<DeploymentResult> {
  console.log(`\n📦 Deploying ${config.contractName} contract...`);

  try {
    // Get the contract factory with proper typing
    const LeLinkFactory = await ethers.getContractFactory('LeLink');

    // Deploy the contract with the deployer signer (LeLink has no constructor arguments)
    const contract = (await LeLinkFactory.connect(deployer).deploy()) as LeLink;
    const deploymentTx = contract.deploymentTransaction();

    if (!deploymentTx) {
      throw new Error('Deployment transaction not found');
    }

    await contract.waitForDeployment();

    const contractAddress = await contract.getAddress();
    const receipt = await deploymentTx.wait();

    if (!receipt) {
      throw new Error('Transaction receipt not found');
    }

    const owner = await contract.owner();

    return {
      contract,
      address: contractAddress,
      owner,
      deploymentHash: deploymentTx.hash,
      blockNumber: receipt.blockNumber,
      gasUsed: receipt.gasUsed,
    };
  } catch (error) {
    console.error('❌ Contract deployment failed:', error);
    throw error;
  }
}

/**
 * Verifies deployment by checking contract state
 */
async function verifyDeployment(result: DeploymentResult, deployer: HardhatEthersSigner): Promise<boolean> {
  console.log('\n🔍 Verifying deployment...');

  try {
    const { contract, address, owner } = result;

    // Basic contract verification
    const code = await ethers.provider.getCode(address);
    if (code === '0x') {
      throw new Error('No contract code found at deployment address');
    }

    // Contract-specific verification
    const recordCount = await contract.getRecordCount();
    const isPaused = await contract.paused();

    console.log('📋 Contract verification results:');
    console.log(`   • Contract address: ${address}`);
    console.log(`   • Contract owner: ${owner}`);
    console.log(`   • Initial record count: ${recordCount.toString()}`);
    console.log(`   • Is paused: ${isPaused}`);
    console.log(`   • Code size: ${(code.length - 2) / 2} bytes`);

    // Verify owner matches deployer
    const isOwnerValid = owner.toLowerCase() === deployer.address.toLowerCase();
    if (!isOwnerValid) {
      throw new Error(`Owner mismatch: expected ${deployer.address}, got ${owner}`);
    }

    console.log('✅ Deployment verification successful!');
    return true;
  } catch (error) {
    console.error('❌ Deployment verification failed:', error);
    return false;
  }
}

/**
 * Saves deployment metadata to file
 */
async function saveDeploymentMetadata(
  result: DeploymentResult,
  deployer: HardhatEthersSigner,
  networkInfo: NetworkInfo
): Promise<void> {
  const deploymentsDir = ensureDeploymentDirectory();

  const metadata: DeploymentMetadata = {
    contractAddress: result.address,
    contractName: DEFAULT_CONFIG.contractName,
    owner: result.owner,
    network: networkInfo.name,
    blockNumber: result.blockNumber,
    deploymentTime: new Date().toISOString(),
    deployerAddress: deployer.address,
    deploymentHash: result.deploymentHash,
    gasUsed: result.gasUsed.toString(),
    compiler: {
      version: '0.8.28', // Update with actual version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200,
        },
      },
    },
  };

  const fileName = `${networkInfo.name}-${Date.now()}.json`;
  const filePath = path.join(deploymentsDir, fileName);

  fs.writeFileSync(filePath, JSON.stringify(metadata, null, 2), 'utf8');

  // Also save as latest deployment for this network
  const latestFilePath = path.join(deploymentsDir, `${networkInfo.name}-latest.json`);
  fs.writeFileSync(latestFilePath, JSON.stringify(metadata, null, 2), 'utf8');

  console.log(`💾 Deployment metadata saved to: ${filePath}`);
}

/**
 * Prints deployment summary
 */
function printDeploymentSummary(
  result: DeploymentResult,
  networkInfo: NetworkInfo,
  deployer: HardhatEthersSigner
): void {
  console.log('\n🎉 Deployment Summary');
  console.log('='.repeat(50));
  console.log(`Contract Name:     ${DEFAULT_CONFIG.contractName}`);
  console.log(`Contract Address:  ${result.address}`);
  console.log(`Owner Address:     ${result.owner}`);
  console.log(`Deployer Address:  ${deployer.address}`);
  console.log(`Network:           ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`);
  console.log(`Block Number:      ${result.blockNumber}`);
  console.log(`Transaction Hash:  ${result.deploymentHash}`);
  console.log(`Gas Used:          ${result.gasUsed.toLocaleString()}`);
  console.log(`Deployment Time:   ${new Date().toISOString()}`);
  console.log('='.repeat(50));
}

// ============================================================================
// Main Deployment Function
// ============================================================================

/**
 * Main deployment function with comprehensive error handling and logging
 */
async function main(): Promise<DeploymentResult> {
  let deploymentStatus: DeploymentStatus = 'pending';

  try {
    console.log('🚀 Starting LeLink smart contract deployment...');
    console.log('='.repeat(60));

    // Environment validation
    validateEnvironment();

    // Get network information
    const networkInfo = await getNetworkInfo();
    console.log(`🌐 Network: ${networkInfo.name} (Chain ID: ${networkInfo.chainId})`);

    // Get deployer account
    const [deployer]: HardhatEthersSigner[] = await ethers.getSigners();
    if (!deployer) {
      throw new Error('No deployer account available');
    }

    const deployerBalance = await deployer.provider.getBalance(deployer.address);
    console.log(`👤 Deployer: ${deployer.address}`);
    console.log(`💰 Balance: ${formatEther(deployerBalance)} ETH`);

    // Validate sufficient balance
    await validateDeployerBalance(deployer);

    // Deploy contract
    const deploymentResult = await deployContract(deployer, DEFAULT_CONFIG);

    // Verify deployment
    const isVerified = await verifyDeployment(deploymentResult, deployer);
    if (!isVerified) {
      throw new Error('Deployment verification failed');
    }

    // Save deployment metadata
    await saveDeploymentMetadata(deploymentResult, deployer, networkInfo);

    // Print summary
    printDeploymentSummary(deploymentResult, networkInfo, deployer);

    deploymentStatus = 'success';
    return deploymentResult;
  } catch (error) {
    deploymentStatus = 'failed';
    console.error('\n❌ Deployment failed:');
    console.error(error);
    throw error;
  } finally {
    console.log(`\n📊 Final Status: ${deploymentStatus.toUpperCase()}`);
  }
}

// ============================================================================
// Script Execution
// ============================================================================

// Execute deployment with proper error handling
if (require.main === module) {
  main()
    .then((result: DeploymentResult) => {
      console.log('\n🎉 Deployment completed successfully!');
      process.exit(0);
    })
    .catch((error: Error) => {
      console.error('\n💥 Deployment script failed:', error.message);
      process.exit(1);
    });
}

// Export for testing and reuse
export { main, DeploymentResult, DeploymentConfig, DeploymentMetadata };
export default main;
