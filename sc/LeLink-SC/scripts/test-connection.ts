import { ethers, network } from "hardhat";
import * as dotenv from "dotenv";

dotenv.config();

async function testConnection() {
  console.log("🔍 Testing network connection...");
  console.log("Network name:", network.name);
  console.log("Network config:", network.config);
  console.log("Environment variables:");
  console.log("- ALCHEMY_API_KEY:", process.env.ALCHEMY_API_KEY ? `${process.env.ALCHEMY_API_KEY.substring(0, 10)}...` : "NOT SET");
  console.log("- DEPLOYER_PRIVATE_KEY:", process.env.DEPLOYER_PRIVATE_KEY ? `${process.env.DEPLOYER_PRIVATE_KEY.substring(0, 10)}...` : "NOT SET");
  console.log("- SEPOLIA_URL:", process.env.SEPOLIA_URL);

  try {
    console.log("Attempting to get chain ID...");
    const chainId = await ethers.provider.getNetwork();
    console.log("✅ Chain ID:", chainId.chainId);
    
    console.log("Attempting to get signers...");
    const [signer] = await ethers.getSigners();
    console.log("✅ Signer address:", signer.address);
    
    console.log("Attempting to get balance...");
    const balance = await ethers.provider.getBalance(signer.address);
    console.log("✅ Balance:", ethers.formatEther(balance), "ETH");
    
  } catch (error) {
    console.error("❌ Connection test failed:", error);
  }
}

testConnection().catch(console.error);