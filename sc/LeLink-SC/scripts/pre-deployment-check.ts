import { ethers, network } from 'hardhat';
import chalk from 'chalk';
import * as dotenv from 'dotenv';

dotenv.config();

async function preDeploymentChecklist() {
  console.log(chalk.blue('🔍 Running Pre-Deployment Checklist...\n'));

  const checks = {
    network: false,
    balance: false,
    gasPrice: false,
    apiKeys: false,
    contract: false,
    compilation: false,
    tests: false,
  };

  // 1. Check network
  console.log(chalk.yellow('1. Checking network configuration...'));
  if (network.name && network.config.chainId) {
    console.log(chalk.green(`   ✓ Network: ${network.name} (Chain ID: ${network.config.chainId})`));
    checks.network = true;
  } else {
    console.log(chalk.red('   ✗ Network configuration missing'));
  }

  // 2. Check deployer balance
  console.log(chalk.yellow('\n2. Checking deployer balance...'));
  try {
    const [deployer] = await ethers.getSigners();
    const balance = await ethers.provider.getBalance(deployer.address);
    const balanceInEth = ethers.formatEther(balance);

    const minimumBalance = network.name === 'localhost' ? 0.001 : 0.1;

    if (parseFloat(balanceInEth) > minimumBalance) {
      console.log(chalk.green(`   ✓ Address: ${deployer.address}`));
      console.log(chalk.green(`   ✓ Balance: ${balanceInEth} ETH`));
      checks.balance = true;
    } else {
      console.log(chalk.red(`   ✗ Insufficient balance: ${balanceInEth} ETH (need at least ${minimumBalance} ETH)`));
    }
  } catch (error) {
    console.log(chalk.red('   ✗ Cannot check balance - check private key configuration'));
  }

  // 3. Check gas price
  console.log(chalk.yellow('\n3. Checking gas prices...'));
  try {
    const feeData = await ethers.provider.getFeeData();
    if (feeData.gasPrice) {
      const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, 'gwei');
      console.log(chalk.green(`   ✓ Current gas price: ${gasPriceGwei} Gwei`));

      if (parseFloat(gasPriceGwei) > 100) {
        console.log(chalk.yellow(`   ⚠ High gas price - consider waiting for lower gas`));
      }
      checks.gasPrice = true;
    }
  } catch (error) {
    console.log(chalk.red('   ✗ Cannot fetch gas price'));
  }

  // 4. Check API keys
  console.log(chalk.yellow('\n4. Checking API keys...'));
  const requiredEnvVars = ['ALCHEMY_API_KEY', 'ETHERSCAN_API_KEY', 'DEPLOYER_PRIVATE_KEY'];

  let allKeysPresent = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      const maskedValue = `${process.env[envVar]?.substring(0, 6)}...${process.env[envVar]?.substring(
        process.env[envVar]?.length - 4
      )}`;
      console.log(chalk.green(`   ✓ ${envVar}: ${maskedValue}`));
    } else {
      console.log(chalk.red(`   ✗ ${envVar} is missing`));
      allKeysPresent = false;
    }
  }
  checks.apiKeys = allKeysPresent;

  // 5. Check contract compilation
  console.log(chalk.yellow('\n5. Checking contract compilation...'));
  try {
    const LeLink = await ethers.getContractFactory('LeLink');
    console.log(chalk.green('   ✓ Contract compiled successfully'));

    // Estimate deployment gas
    const deployTx = await LeLink.getDeployTransaction();
    const gasEstimate = await ethers.provider.estimateGas(deployTx);
    console.log(chalk.green(`   ✓ Estimated deployment gas: ${gasEstimate.toString()}`));

    checks.contract = true;
  } catch (error) {
    console.log(chalk.red('   ✗ Contract compilation failed'));
    console.log(chalk.red(`   Error: ${error}`));
  }

  // 6. Check compilation status
  console.log(chalk.yellow('\n6. Checking project compilation...'));
  try {
    // This will throw if compilation fails
    await import('../typechain-types');
    console.log(chalk.green('   ✓ TypeChain types generated'));
    checks.compilation = true;
  } catch (error) {
    console.log(chalk.yellow("   ⚠ TypeChain types not found - run 'npm run compile'"));
  }

  // Summary
  console.log(chalk.blue('\n📊 Checklist Summary:'));
  console.log(chalk.blue('===================='));

  const allChecksPassed = Object.values(checks).every((check) => check);

  for (const [check, passed] of Object.entries(checks)) {
    const icon = passed ? chalk.green('✓') : chalk.red('✗');
    const label = check.charAt(0).toUpperCase() + check.slice(1);
    console.log(`${icon} ${label}`);
  }

  // Network-specific warnings
  if (network.name === 'mainnet') {
    console.log(chalk.red('\n⚠️  MAINNET DEPLOYMENT WARNINGS:'));
    console.log(chalk.red('   - This will deploy to Ethereum mainnet!'));
    console.log(chalk.red('   - Real ETH will be spent!'));
    console.log(chalk.red('   - Consider using a hardware wallet'));
    console.log(chalk.red('   - Ensure you have performed adequate testing'));
  }

  if (network.name === 'sepolia') {
    console.log(chalk.yellow('\n💡 Sepolia Testnet Info:'));
    console.log(chalk.yellow('   - This is a testnet deployment'));
    console.log(chalk.yellow('   - Get free ETH: https://sepoliafaucet.com/'));
    console.log(chalk.yellow('   - Explorer: https://sepolia.etherscan.io/'));
  }

  // Cost estimation
  if (checks.gasPrice && checks.contract) {
    console.log(chalk.blue('\n💰 Estimated Deployment Cost:'));
    try {
      const feeData = await ethers.provider.getFeeData();
      const LeLink = await ethers.getContractFactory('LeLink');
      const deployTx = await LeLink.getDeployTransaction();
      const gasEstimate = await ethers.provider.estimateGas(deployTx);

      if (feeData.gasPrice) {
        const cost = gasEstimate * feeData.gasPrice;
        const costInEth = ethers.formatEther(cost);
        console.log(chalk.blue(`   Gas estimate: ${gasEstimate.toString()}`));
        console.log(chalk.blue(`   Cost: ${costInEth} ETH`));

        if (network.name === 'mainnet') {
          // Rough USD estimate assuming $2000 ETH
          const usdEstimate = parseFloat(costInEth) * 2000;
          console.log(chalk.blue(`   ~$${usdEstimate.toFixed(2)} USD (assuming ETH = $2000)`));
        }
      }
    } catch (error) {
      console.log(chalk.yellow('   Could not estimate cost'));
    }
  }

  if (allChecksPassed) {
    console.log(chalk.green('\n✅ All checks passed! Ready for deployment.'));
    console.log(chalk.green(`\n🚀 To deploy: npm run deploy:${network.name}`));
    return true;
  } else {
    console.log(chalk.red('\n❌ Some checks failed. Please fix the issues before deploying.'));

    // Helpful commands
    console.log(chalk.yellow('\n💡 Helpful commands:'));
    if (!checks.compilation) {
      console.log(chalk.yellow('   npm run compile'));
    }
    if (!checks.balance && network.name === 'sepolia') {
      console.log(chalk.yellow('   Get Sepolia ETH: https://sepoliafaucet.com/'));
    }
    if (!checks.apiKeys) {
      console.log(chalk.yellow('   cp .env.example .env && edit .env'));
    }

    return false;
  }
}

// Run if called directly
if (require.main === module) {
  preDeploymentChecklist()
    .then((passed) => process.exit(passed ? 0 : 1))
    .catch((error) => {
      console.error(chalk.red('❌ Pre-deployment check failed:'), error);
      process.exit(1);
    });
}

export { preDeploymentChecklist };
