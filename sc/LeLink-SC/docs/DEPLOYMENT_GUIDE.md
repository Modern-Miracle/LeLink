# LeLink Smart Contract Deployment Guide

## Overview
This guide covers the deployment of the LeLink smart contract to various networks, with a focus on Sepolia testnet deployment using industry-standard tools and practices.

## Prerequisites

### Required API Keys
1. **Alchemy API Key** - For reliable RPC endpoints
2. **Etherscan API Key** - For contract verification
3. **Private Key** - For deployment wallet

### Recommended Additional Services
1. **Infura API Key** - Backup RPC provider
2. **Tenderly Access Key** - For advanced debugging and monitoring
3. **Defender Admin API** - For secure contract management
4. **The Graph API** - For indexing contract events

## Environment Setup

### 1. Create `.env` file in `/sc/LeLink-SC/`
```bash
# Network RPC URLs
ALCHEMY_API_KEY=your_alchemy_api_key_here
INFURA_API_KEY=your_infura_api_key_here
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/${ALCHEMY_API_KEY}
MAINNET_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}

# Private Keys (NEVER commit these!)
DEPLOYER_PRIVATE_KEY=your_private_key_here
# For production, use hardware wallet or multi-sig
MAINNET_DEPLOYER_PRIVATE_KEY=your_mainnet_private_key_here

# Verification APIs
ETHERSCAN_API_KEY=your_etherscan_api_key_here
POLYGONSCAN_API_KEY=your_polygonscan_api_key_here
ARBISCAN_API_KEY=your_arbiscan_api_key_here
OPTIMISTIC_ETHERSCAN_API_KEY=your_optimistic_etherscan_api_key_here

# Monitoring & Security
TENDERLY_PROJECT=your_tenderly_project
TENDERLY_USERNAME=your_tenderly_username
TENDERLY_ACCESS_KEY=your_tenderly_access_key
DEFENDER_API_KEY=your_defender_api_key
DEFENDER_API_SECRET=your_defender_api_secret

# Gas Configuration
GAS_PRICE_GWEI=30
GAS_LIMIT=3000000

# Contract Configuration
INITIAL_OWNER=0x... # Address that will own the contract
LELINK_CONTRACT_NAME="LeLink Healthcare Audit System"
LELINK_CONTRACT_SYMBOL="LELINK"
```

### 2. Update `hardhat.config.ts`
```typescript
import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import "@openzeppelin/hardhat-upgrades";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "@nomiclabs/hardhat-solhint";
import "hardhat-deploy";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR-based optimizer for better gas efficiency
    },
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "",
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: parseInt(process.env.GAS_PRICE_GWEI || "30") * 1000000000,
    },
    mainnet: {
      url: process.env.MAINNET_RPC_URL || "",
      accounts: process.env.MAINNET_DEPLOYER_PRIVATE_KEY ? [process.env.MAINNET_DEPLOYER_PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: "auto",
    },
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 137,
    },
    arbitrum: {
      url: `https://arb-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 42161,
    },
    optimism: {
      url: `https://opt-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`,
      accounts: process.env.DEPLOYER_PRIVATE_KEY ? [process.env.DEPLOYER_PRIVATE_KEY] : [],
      chainId: 10,
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY || "",
      sepolia: process.env.ETHERSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
      arbitrumOne: process.env.ARBISCAN_API_KEY || "",
      optimisticEthereum: process.env.OPTIMISTIC_ETHERSCAN_API_KEY || "",
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === "true",
    currency: "USD",
    gasPrice: 30,
    token: "ETH",
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    alphaSort: true,
    disambiguatePaths: false,
    runOnCompile: true,
    strict: true,
    only: ["LeLink"],
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    deploy: "./deploy",
    deployments: "./deployments",
  },
  namedAccounts: {
    deployer: {
      default: 0,
      1: process.env.INITIAL_OWNER || 0, // mainnet
    },
    owner: {
      default: 1,
      1: process.env.INITIAL_OWNER || 0, // mainnet
    },
  },
};

export default config;
```

## Deployment Scripts

### 1. Create deployment script with verification
Create `scripts/deploy-with-verification.ts`:

```typescript
import { ethers, run, network } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  console.log("🚀 Starting LeLink deployment to", network.name);
  
  // Get deployer
  const [deployer] = await ethers.getSigners();
  console.log("📍 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)));

  // Deploy contract
  console.log("📝 Deploying LeLink contract...");
  const LeLink = await ethers.getContractFactory("LeLink");
  const lelink = await LeLink.deploy();
  await lelink.waitForDeployment();
  
  const contractAddress = await lelink.getAddress();
  console.log("✅ LeLink deployed to:", contractAddress);

  // Wait for confirmations
  console.log("⏳ Waiting for confirmations...");
  const deployTx = lelink.deploymentTransaction();
  if (deployTx) {
    await deployTx.wait(6); // Wait for 6 confirmations
  }

  // Verify contract
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

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contractAddress,
    deployer: deployer.address,
    deploymentDate: new Date().toISOString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    gasPrice: (await ethers.provider.getFeeData()).gasPrice?.toString(),
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir);
  }

  const filename = `${network.name}-${Date.now()}.json`;
  fs.writeFileSync(
    path.join(deploymentsDir, filename),
    JSON.stringify(deploymentInfo, null, 2)
  );

  // Update latest deployment
  fs.writeFileSync(
    path.join(deploymentsDir, `${network.name}-latest.json`),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("📄 Deployment info saved to:", filename);
  console.log("\n🎉 Deployment Summary:");
  console.log("========================");
  console.log("Network:", network.name);
  console.log("Contract Address:", contractAddress);
  console.log("Deployer:", deployer.address);
  console.log("Block Number:", deploymentInfo.blockNumber);
  console.log("========================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
```

### 2. Create deployment checklist script
Create `scripts/deployment-checklist.ts`:

```typescript
import { ethers, network } from "hardhat";
import chalk from "chalk";

async function preDeploymentChecklist() {
  console.log(chalk.blue("🔍 Running Pre-Deployment Checklist...\n"));

  const checks = {
    network: false,
    balance: false,
    gasPrice: false,
    apiKeys: false,
    contract: false,
  };

  // 1. Check network
  console.log(chalk.yellow("1. Checking network configuration..."));
  if (network.name && network.config.chainId) {
    console.log(chalk.green(`   ✓ Network: ${network.name} (Chain ID: ${network.config.chainId})`));
    checks.network = true;
  } else {
    console.log(chalk.red("   ✗ Network configuration missing"));
  }

  // 2. Check deployer balance
  console.log(chalk.yellow("\n2. Checking deployer balance..."));
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  const balanceInEth = ethers.formatEther(balance);
  
  if (parseFloat(balanceInEth) > 0.1) {
    console.log(chalk.green(`   ✓ Balance: ${balanceInEth} ETH`));
    checks.balance = true;
  } else {
    console.log(chalk.red(`   ✗ Insufficient balance: ${balanceInEth} ETH (need at least 0.1 ETH)`));
  }

  // 3. Check gas price
  console.log(chalk.yellow("\n3. Checking gas prices..."));
  const feeData = await ethers.provider.getFeeData();
  if (feeData.gasPrice) {
    const gasPriceGwei = ethers.formatUnits(feeData.gasPrice, "gwei");
    console.log(chalk.green(`   ✓ Current gas price: ${gasPriceGwei} Gwei`));
    checks.gasPrice = true;
  }

  // 4. Check API keys
  console.log(chalk.yellow("\n4. Checking API keys..."));
  const requiredEnvVars = [
    "ALCHEMY_API_KEY",
    "ETHERSCAN_API_KEY",
    "DEPLOYER_PRIVATE_KEY",
  ];
  
  let allKeysPresent = true;
  for (const envVar of requiredEnvVars) {
    if (process.env[envVar]) {
      console.log(chalk.green(`   ✓ ${envVar} is set`));
    } else {
      console.log(chalk.red(`   ✗ ${envVar} is missing`));
      allKeysPresent = false;
    }
  }
  checks.apiKeys = allKeysPresent;

  // 5. Check contract compilation
  console.log(chalk.yellow("\n5. Checking contract compilation..."));
  try {
    await ethers.getContractFactory("LeLink");
    console.log(chalk.green("   ✓ Contract compiled successfully"));
    checks.contract = true;
  } catch (error) {
    console.log(chalk.red("   ✗ Contract compilation failed"));
  }

  // Summary
  console.log(chalk.blue("\n📊 Checklist Summary:"));
  console.log(chalk.blue("===================="));
  
  const allChecksPassed = Object.values(checks).every((check) => check);
  
  for (const [check, passed] of Object.entries(checks)) {
    console.log(`${passed ? chalk.green("✓") : chalk.red("✗")} ${check}`);
  }

  if (allChecksPassed) {
    console.log(chalk.green("\n✅ All checks passed! Ready for deployment."));
    return true;
  } else {
    console.log(chalk.red("\n❌ Some checks failed. Please fix the issues before deploying."));
    return false;
  }
}

// Run if called directly
if (require.main === module) {
  preDeploymentChecklist()
    .then((passed) => process.exit(passed ? 0 : 1))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { preDeploymentChecklist };
```

### 3. Create multi-network deployment script
Create `scripts/deploy-multichain.ts`:

```typescript
import { ethers, network } from "hardhat";
import { preDeploymentChecklist } from "./deployment-checklist";

const NETWORKS_TO_DEPLOY = ["sepolia", "polygon", "arbitrum", "optimism"];

async function deployToNetwork(networkName: string) {
  console.log(`\n🌐 Deploying to ${networkName}...`);
  
  // Run deployment script for specific network
  const { spawn } = require("child_process");
  
  return new Promise((resolve, reject) => {
    const deploy = spawn("npx", ["hardhat", "run", "scripts/deploy-with-verification.ts", "--network", networkName], {
      stdio: "inherit",
    });

    deploy.on("close", (code: number) => {
      if (code === 0) {
        resolve(true);
      } else {
        reject(new Error(`Deployment to ${networkName} failed with code ${code}`));
      }
    });
  });
}

async function main() {
  console.log("🚀 Starting multi-chain deployment...\n");

  const deploymentResults: Record<string, boolean> = {};

  for (const networkName of NETWORKS_TO_DEPLOY) {
    try {
      await deployToNetwork(networkName);
      deploymentResults[networkName] = true;
    } catch (error) {
      console.error(`❌ Failed to deploy to ${networkName}:`, error);
      deploymentResults[networkName] = false;
    }
  }

  // Summary
  console.log("\n📊 Deployment Summary:");
  console.log("====================");
  
  for (const [network, success] of Object.entries(deploymentResults)) {
    console.log(`${success ? "✅" : "❌"} ${network}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

## Package.json Scripts

Update `package.json` with deployment scripts:

```json
{
  "scripts": {
    // ... existing scripts
    "deploy:checklist": "hardhat run scripts/deployment-checklist.ts",
    "deploy:sepolia": "hardhat run scripts/deploy-with-verification.ts --network sepolia",
    "deploy:mainnet": "hardhat run scripts/deploy-with-verification.ts --network mainnet",
    "deploy:polygon": "hardhat run scripts/deploy-with-verification.ts --network polygon",
    "deploy:arbitrum": "hardhat run scripts/deploy-with-verification.ts --network arbitrum",
    "deploy:optimism": "hardhat run scripts/deploy-with-verification.ts --network optimism",
    "deploy:multichain": "hardhat run scripts/deploy-multichain.ts",
    "verify": "hardhat verify --network",
    "gas-report": "REPORT_GAS=true hardhat test",
    "size": "hardhat size-contracts"
  }
}
```

## Security Best Practices

### 1. Pre-deployment Security Audit
```bash
# Run security checks
npm run lint
npm run test
npm audit

# Run Slither static analyzer
pip install slither-analyzer
slither . --config-file slither.config.json
```

### 2. Create `slither.config.json`:
```json
{
  "detectors_to_exclude": "solc-version,similar-names",
  "exclude_informational": false,
  "exclude_low": false,
  "exclude_medium": false,
  "exclude_high": false,
  "disable_color": false,
  "filter_paths": "node_modules",
  "legacy_ast": false
}
```

### 3. Multi-signature Deployment
For production deployments, use a multi-sig wallet:

```typescript
// Deploy with Gnosis Safe
const GNOSIS_SAFE_ADDRESS = "0x..."; // Your Gnosis Safe address

// Transfer ownership after deployment
await lelink.transferOwnership(GNOSIS_SAFE_ADDRESS);
```

## Monitoring and Post-Deployment

### 1. Set up Tenderly Monitoring
```typescript
// Add to deployment script
if (network.name !== "localhost") {
  console.log("📡 Setting up Tenderly monitoring...");
  
  await tenderly.persistArtifacts({
    name: "LeLink",
    address: contractAddress,
  });
  
  await tenderly.verify({
    name: "LeLink",
    address: contractAddress,
  });
}
```

### 2. Configure OpenZeppelin Defender
```typescript
// defender-config.js
module.exports = {
  contracts: {
    LeLink: {
      network: 'sepolia',
      address: process.env.LELINK_CONTRACT_ADDRESS,
    },
  },
  monitor: {
    lelink: {
      network: 'sepolia',
      address: process.env.LELINK_CONTRACT_ADDRESS,
      name: 'LeLink Monitor',
      abi: require('./artifacts/contracts/LeLink.sol/LeLink.json').abi,
      alerts: [
        {
          name: 'Large Transaction',
          expression: 'value > 1000000000000000000', // 1 ETH
        },
      ],
    },
  },
};
```

## Deployment Workflow

### Step 1: Prepare Environment
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your keys

# Compile contracts
npm run compile
```

### Step 2: Run Pre-deployment Checks
```bash
# Run tests
npm test

# Check contract size
npm run size

# Run deployment checklist
npm run deploy:checklist
```

### Step 3: Deploy to Testnet
```bash
# Deploy to Sepolia
npm run deploy:sepolia

# Verify the contract is working
# Test transactions on Sepolia
```

### Step 4: Production Deployment
```bash
# Final security audit
npm audit
slither .

# Deploy to mainnet (use hardware wallet!)
npm run deploy:mainnet
```

### Step 5: Post-deployment
```bash
# Verify ownership transfer
# Set up monitoring
# Configure alerts
# Update frontend with new addresses
```

## Cost Estimation

### Sepolia Deployment
- Gas Required: ~2,000,000 gas
- Cost: Free (testnet ETH from faucets)

### Mainnet Deployment
- Gas Required: ~2,000,000 gas
- At 30 Gwei: ~0.06 ETH
- At 100 Gwei: ~0.2 ETH

### Multi-chain Deployment Costs
- Polygon: ~$0.10 - $1
- Arbitrum: ~$1 - $5
- Optimism: ~$1 - $5

## Troubleshooting

### Common Issues

1. **"Insufficient funds"**
   - Get testnet ETH from faucets
   - Sepolia: https://sepoliafaucet.com/

2. **"Nonce too low"**
   - Reset account in MetaMask
   - Or manually set nonce in config

3. **"Contract already verified"**
   - This is fine, contract is already on Etherscan

4. **"Cannot estimate gas"**
   - Check contract constructor
   - Ensure proper network configuration

## Additional Resources

- [Alchemy Documentation](https://docs.alchemy.com/)
- [Etherscan API](https://docs.etherscan.io/)
- [OpenZeppelin Defender](https://docs.openzeppelin.com/defender/)
- [Tenderly Platform](https://docs.tenderly.co/)
- [Hardhat Deploy Plugin](https://github.com/wighawag/hardhat-deploy)