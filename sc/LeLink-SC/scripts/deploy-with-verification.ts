import { ethers, run, network } from "hardhat";
import fs from "fs";
import path from "path";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

async function main() {
  console.log("🚀 Starting LeLink deployment to", network.name);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Check if we have sufficient balance
  const balance = await ethers.provider.getBalance(deployer.address);
  const minimumBalance = ethers.parseEther("0.1");
  
  if (balance < minimumBalance) {
    console.error("❌ Insufficient balance. Need at least 0.1 ETH for deployment.");
    process.exit(1);
  }

  // Deploy contract
  console.log("📝 Deploying LeLink contract...");
  const LeLink = await ethers.getContractFactory("LeLink");
  
  // Estimate gas
  const deployTx = await LeLink.getDeployTransaction();
  const gasEstimate = await ethers.provider.estimateGas(deployTx);
  console.log("⛽ Estimated gas:", gasEstimate.toString());
  
  const lelink = await LeLink.deploy();
  await lelink.waitForDeployment();
  
  const contractAddress = await lelink.getAddress();
  console.log("✅ LeLink deployed to:", contractAddress);

  // Get deployment transaction details
  const deploymentTx = lelink.deploymentTransaction();
  if (deploymentTx) {
    console.log("📄 Transaction hash:", deploymentTx.hash);
    console.log("⛽ Gas used:", deploymentTx.gasLimit?.toString());
    console.log("💰 Gas price:", ethers.formatUnits(deploymentTx.gasPrice || 0, "gwei"), "Gwei");
  }

  // Wait for confirmations
  console.log("⏳ Waiting for confirmations...");
  if (deploymentTx) {
    const receipt = await deploymentTx.wait(6); // Wait for 6 confirmations
    console.log("✅ Confirmed in block:", receipt?.blockNumber);
    console.log("⛽ Actual gas used:", receipt?.gasUsed.toString());
  }

  // Test contract functionality
  console.log("🧪 Testing contract functionality...");
  try {
    const owner = await lelink.owner();
    console.log("✅ Contract owner:", owner);
    
    // Test creating a record
    const testTx = await lelink.createRecord(
      "test-resource-id",
      "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
      "Test deployment record"
    );
    await testTx.wait();
    console.log("✅ Test record created successfully");
    
    // Check record count
    const recordCount = await lelink.getRecordCount();
    console.log("✅ Total records:", recordCount.toString());
  } catch (error) {
    console.error("❌ Contract functionality test failed:", error);
  }

  // Verify contract on Etherscan
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await run("verify:verify", {
        address: contractAddress,
        constructorArguments: [],
        contract: "contracts/LeLink.sol:LeLink",
      });
      console.log("✅ Contract verified successfully!");
    } catch (error: any) {
      if (error.message.toLowerCase().includes("already verified")) {
        console.log("✅ Contract already verified!");
      } else {
        console.error("❌ Verification failed:", error);
      }
    }
  }

  // Get network information
  const networkInfo = await ethers.provider.getNetwork();
  const blockNumber = await ethers.provider.getBlockNumber();
  const gasPrice = await ethers.provider.getFeeData();

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: Number(networkInfo.chainId),
    contractAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    blockNumber,
    transactionHash: deploymentTx?.hash,
    gasUsed: deploymentTx?.gasLimit?.toString(),
    gasPrice: ethers.formatUnits(deploymentTx?.gasPrice || 0, "gwei"),
    currentGasPrice: ethers.formatUnits(gasPrice.gasPrice || 0, "gwei"),
    contractName: "LeLink",
    compilerVersion: "0.8.28",
    optimizerEnabled: true,
    optimizerRuns: 200,
  };

  // Ensure deployments directory exists
  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  // Save deployment with timestamp
  const timestamp = Date.now();
  const filename = `${network.name}-${timestamp}.json`;
  const filepath = path.join(deploymentsDir, filename);
  fs.writeFileSync(filepath, JSON.stringify(deploymentInfo, null, 2));

  // Update latest deployment
  const latestFilepath = path.join(deploymentsDir, `${network.name}-latest.json`);
  fs.writeFileSync(latestFilepath, JSON.stringify(deploymentInfo, null, 2));

  console.log("📄 Deployment info saved to:", filename);

  // Update project root .env with contract address for integration
  const rootEnvPath = path.join(__dirname, "..", "..", "..", ".env");
  if (fs.existsSync(rootEnvPath)) {
    let envContent = fs.readFileSync(rootEnvPath, "utf8");
    const envVar = `LELINK_CONTRACT_ADDRESS_${network.name.toUpperCase()}=${contractAddress}`;
    
    // Check if variable already exists
    const regex = new RegExp(`LELINK_CONTRACT_ADDRESS_${network.name.toUpperCase()}=.*`, 'g');
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, envVar);
    } else {
      envContent += `\n${envVar}\n`;
    }
    
    fs.writeFileSync(rootEnvPath, envContent);
    console.log("📝 Updated root .env with contract address");
  }

  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Network:", network.name);
  console.log("Chain ID:", networkInfo.chainId.toString());
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Block Number:", blockNumber);
  console.log("Transaction Hash:", deploymentTx?.hash || "N/A");
  console.log("Gas Used:", deploymentTx?.gasLimit?.toString() || "N/A");
  console.log("Gas Price:", ethers.formatUnits(deploymentTx?.gasPrice || 0, "gwei"), "Gwei");
  
  if (network.name !== "localhost" && network.name !== "hardhat") {
    console.log("\n🔗 Useful Links:");
    console.log("========================");
    
    const explorerUrls: Record<string, string> = {
      mainnet: "https://etherscan.io",
      sepolia: "https://sepolia.etherscan.io",
      polygon: "https://polygonscan.com",
      arbitrum: "https://arbiscan.io",
      optimism: "https://optimistic.etherscan.io",
    };
    
    const explorerUrl = explorerUrls[network.name];
    if (explorerUrl) {
      console.log("Contract:", `${explorerUrl}/address/${contractAddress}`);
      if (deploymentTx?.hash) {
        console.log("Transaction:", `${explorerUrl}/tx/${deploymentTx.hash}`);
      }
    }
  }
  
  console.log("\n📋 Next Steps:");
  console.log("========================");
  console.log("1. Update frontend with new contract address");
  console.log("2. Set up monitoring and alerts");
  console.log("3. Test contract interactions");
  console.log("4. Configure access controls if needed");
  console.log("========================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });