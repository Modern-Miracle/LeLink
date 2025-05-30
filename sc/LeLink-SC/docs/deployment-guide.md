# 🚀 Deployment Guide

This guide covers deploying the LeLink smart contract to different networks, from local development to production mainnet deployment. Follow these step-by-step instructions to get your LeLink contract running anywhere.

## 📋 Overview

LeLink can be deployed to:

- **Local Network** (Free) - For development and testing
- **Testnets** (Free ETH from faucets) - For staging and testing
- **Mainnet** (Real ETH costs) - For production use

## 🛠️ Prerequisites

Before deploying, ensure you have:

- ✅ Completed the [Prerequisites Guide](./prerequisites.md)
- ✅ Node.js and npm installed
- ✅ Project dependencies installed (`npm install`)
- ✅ Contract compiled successfully (`npm run compile`)

## 🏠 Local Deployment

Perfect for development and testing without any costs.

### Step 1: Start Local Network

```bash
# Terminal 1: Start Hardhat node
npm run node
```

This starts a local blockchain with:

- 20 test accounts with 10,000 ETH each
- Hardhat Network running on `http://127.0.0.1:8545`
- Mining transactions instantly

### Step 2: Deploy Contract

```bash
# Terminal 2: Deploy to local network
npm run deploy:localhost
```

**Expected Output:**

```
🚀 Starting LeLink smart contract deployment...
🌐 Network: hardhat (Chain ID: 31337)
👤 Deployer: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Balance: 10000.0 ETH
📦 Deploying LeLink contract...
✅ Deployment verification successful!
💾 Deployment metadata saved to: deployments/hardhat-latest.json

🎉 Deployment Summary
==================================================
Contract Name:     LeLink
Contract Address:  0x5FbDB2315678afecb367f032d93F642f64180aa3
Network:           hardhat (Chain ID: 31337)
==================================================
```

### Step 3: Test Your Deployment

```bash
# Run tests against deployed contract
npm test

# Check contract in Hardhat console
npx hardhat console --network localhost
```

### Local Network Benefits

- ✅ **Instant transactions** - No waiting for block confirmations
- ✅ **Free testing** - No gas costs
- ✅ **Full control** - Reset state anytime
- ✅ **Fast iteration** - Quick development cycles

## 🧪 Testnet Deployment

Deploy to test networks that simulate real blockchain conditions.

### Supported Testnets

#### Sepolia (Ethereum Testnet) - Recommended

**Network Details:**

- Chain ID: 11155111
- Currency: Sepolia ETH (free from faucets)
- Block time: ~12 seconds
- Good for final testing before mainnet

### Step 1: Get Test ETH

You need test ETH to pay for gas fees:

1. **Get Sepolia ETH from faucets:**

   - [Alchemy Sepolia Faucet](https://sepoliafaucet.com/)
   - [Chainlink Sepolia Faucet](https://faucets.chain.link/sepolia)
   - [Infura Sepolia Faucet](https://www.infura.io/faucet)

2. **Requirements:**
   - Usually need to connect with GitHub/Twitter
   - Minimum 0.1 ETH recommended for deployment

### Step 2: Configure RPC Provider

Create a `.env` file in your project root:

```bash
# .env file
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_here

# Or use Alchemy
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
```

**Getting RPC URLs:**

- **Infura**: Sign up at [infura.io](https://infura.io/), create project, copy endpoint
- **Alchemy**: Sign up at [alchemy.com](https://www.alchemy.com/), create app, copy key

### Step 3: Check Hardhat Configuration

Verify your `hardhat.config.ts` includes Sepolia:

```typescript
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import * as dotenv from 'dotenv';

dotenv.config();

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};

export default config;
```

### Step 4: Deploy to Sepolia

```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia
```

**Expected Output:**

```
🚀 Starting LeLink smart contract deployment...
🌐 Network: sepolia (Chain ID: 11155111)
👤 Deployer: 0x742d35Cc6564C0532E0F98F87C5cE515d90C8c23
💰 Balance: 0.5 ETH
📦 Deploying LeLink contract...
✅ Deployment verification successful!

🎉 Deployment Summary
==================================================
Contract Name:     LeLink
Contract Address:  0x1234...abcd
Network:           sepolia (Chain ID: 11155111)
Block Number:      4567890
Transaction Hash:  0xabcd...1234
Gas Used:          1,234,567
==================================================
```

### Step 5: Verify Deployment

```bash
# Check contract on Etherscan
echo "View on Etherscan: https://sepolia.etherscan.io/address/YOUR_CONTRACT_ADDRESS"

# Test interaction
npx hardhat console --network sepolia
```

## 🌍 Mainnet Deployment

Deploy to production Ethereum mainnet or alternative networks.

### Mainnet Options

#### Ethereum Mainnet

- **Pros**: Most secure, highest adoption
- **Cons**: High gas fees ($50-200+ per deployment)
- **Use for**: High-value applications, maximum security

#### Polygon (Recommended for Healthcare)

- **Pros**: Low fees ($0.01-1), fast transactions
- **Cons**: Different security model than Ethereum
- **Use for**: Cost-effective healthcare applications

#### Other Options

- **Arbitrum**: Layer 2 Ethereum scaling
- **Optimism**: Layer 2 Ethereum scaling
- **BSC**: Binance Smart Chain

### Ethereum Mainnet Deployment

⚠️ **WARNING**: Mainnet deployment costs real money! Test thoroughly on testnets first.

#### Step 1: Prepare Mainnet Environment

```bash
# .env file
MAINNET_RPC_URL=https://mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_mainnet_private_key
ETHERSCAN_API_KEY=your_etherscan_api_key
```

#### Step 2: Fund Your Account

You need real ETH:

- **Minimum**: 0.1 ETH for deployment + buffer
- **Recommended**: 0.2-0.5 ETH for multiple operations
- **Buy from**: Coinbase, Binance, Kraken, etc.

#### Step 3: Configure Mainnet

Update `hardhat.config.ts`:

```typescript
const config: HardhatUserConfig = {
  networks: {
    mainnet: {
      url: process.env.MAINNET_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 1,
      gasPrice: 20000000000, // 20 gwei - adjust based on network conditions
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};
```

#### Step 4: Deploy to Mainnet

```bash
# Deploy to Ethereum mainnet
npm run deploy:mainnet
```

#### Step 5: Verify Contract on Etherscan

```bash
# Verify contract source code
npx hardhat verify --network mainnet YOUR_CONTRACT_ADDRESS
```

### Polygon Deployment (Recommended)

More cost-effective for healthcare applications:

#### Step 1: Configure Polygon

```bash
# .env file
POLYGON_RPC_URL=https://polygon-mainnet.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key
POLYGONSCAN_API_KEY=your_polygonscan_api_key
```

Update `hardhat.config.ts`:

```typescript
const config: HardhatUserConfig = {
  networks: {
    polygon: {
      url: process.env.POLYGON_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 137,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process.env.POLYGONSCAN_API_KEY,
    },
  },
};
```

#### Step 2: Get MATIC Tokens

- Buy MATIC from exchanges
- Bridge ETH to Polygon using [Polygon Bridge](https://wallet.polygon.technology/bridge)

#### Step 3: Deploy

```bash
# Add polygon deployment script
npm run deploy:polygon
```

## 🔧 Advanced Deployment Options

### Custom Gas Configuration

For better control over deployment costs:

```typescript
// In your deployment script
const gasPrice = ethers.parseUnits('20', 'gwei'); // Adjust based on network conditions
const gasLimit = 2000000; // Adjust based on contract complexity

const contract = await LeLinkFactory.deploy({
  gasPrice,
  gasLimit,
});
```

### Multi-Network Deployment Script

Create a script to deploy to multiple networks:

```javascript
// scripts/deploy-multi.js
const networks = ['localhost', 'sepolia', 'polygon'];

async function deployToNetwork(networkName) {
  console.log(`\n🚀 Deploying to ${networkName}...`);

  // Switch network logic
  const provider = new ethers.JsonRpcProvider(networkUrls[networkName]);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  // Deploy contract
  const LeLinkFactory = await ethers.getContractFactory('LeLink', wallet);
  const lelink = await LeLinkFactory.deploy();
  await lelink.waitForDeployment();

  console.log(`✅ Deployed to ${networkName}: ${await lelink.getAddress()}`);

  return {
    network: networkName,
    address: await lelink.getAddress(),
    deploymentTx: lelink.deploymentTransaction().hash,
  };
}

async function main() {
  const deployments = [];

  for (const network of networks) {
    try {
      const deployment = await deployToNetwork(network);
      deployments.push(deployment);
    } catch (error) {
      console.error(`❌ Failed to deploy to ${network}:`, error.message);
    }
  }

  console.log('\n📊 Deployment Summary:');
  console.table(deployments);
}
```

## 📊 Deployment Verification

After successful deployment, verify everything works:

### Basic Functionality Test

```javascript
// test-deployment.js
async function testDeployment(contractAddress, networkName) {
  const provider = new ethers.JsonRpcProvider(networkUrls[networkName]);
  const contract = new ethers.Contract(contractAddress, abi, provider);

  // Test view functions
  const recordCount = await contract.getRecordCount();
  console.log(`✅ Record count: ${recordCount}`);

  const owner = await contract.owner();
  console.log(`✅ Contract owner: ${owner}`);

  const isPaused = await contract.paused();
  console.log(`✅ Contract paused: ${isPaused}`);

  console.log(`✅ ${networkName} deployment verified!`);
}
```

### Integration Test

```javascript
// Create a test record to verify full functionality
async function integrationTest(contractAddress, signer) {
  const contract = new ethers.Contract(contractAddress, abi, signer);

  const resourceId = `test-${Date.now()}`;
  const dataHash = ethers.keccak256(ethers.toUtf8Bytes('test data'));

  // Create record
  const tx = await contract.createRecord(resourceId, dataHash, signer.address);
  await tx.wait();
  console.log('✅ Record created successfully');

  // Verify record exists
  const exists = await contract.recordExists(resourceId, signer.address);
  console.log(`✅ Record exists: ${exists}`);

  // Clean up
  const deleteTx = await contract.deleteRecord(resourceId);
  await deleteTx.wait();
  console.log('✅ Record deleted successfully');
}
```

## 💰 Gas Cost Optimization

### Deployment Costs by Network

| Network   | Estimated Cost | Time        | Security         |
| --------- | -------------- | ----------- | ---------------- |
| Localhost | Free           | Instant     | Development only |
| Sepolia   | Free (testnet) | ~12 seconds | Test only        |
| Polygon   | $0.01-0.10     | ~2 seconds  | Production ready |
| Ethereum  | $50-200+       | ~12 seconds | Maximum security |
| Arbitrum  | $1-10          | ~1 second   | L2 security      |

### Gas Optimization Tips

1. **Deploy during low network activity**

   - Use [ETH Gas Station](https://ethgasstation.info/) to track prices
   - Deploy during weekends or off-peak hours

2. **Use efficient deployment scripts**

   - Minimize constructor parameters
   - Use create2 for deterministic addresses

3. **Consider Layer 2 solutions**
   - Polygon: 1000x cheaper than Ethereum
   - Arbitrum/Optimism: 10-100x cheaper

## 🛡️ Security Considerations

### Private Key Security

- ✅ **Never commit private keys** to version control
- ✅ **Use hardware wallets** for mainnet deployments
- ✅ **Use different keys** for different networks
- ✅ **Enable 2FA** on all accounts

### Contract Security

- ✅ **Audit contracts** before mainnet deployment
- ✅ **Test thoroughly** on testnets
- ✅ **Use pause functionality** for emergency stops
- ✅ **Set up monitoring** for unusual activity

### Access Control

- ✅ **Use multi-sig wallets** for contract ownership
- ✅ **Implement timelock** for critical operations
- ✅ **Regular security reviews** of access patterns

## 📋 Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (`npm test`)
- [ ] Contract compiled successfully (`npm run compile`)
- [ ] Security audit completed (for mainnet)
- [ ] Gas costs calculated and approved
- [ ] Private keys secured
- [ ] RPC providers configured
- [ ] Test ETH/tokens acquired (for testnets/mainnet)

### During Deployment

- [ ] Deployment transaction confirmed
- [ ] Contract address recorded
- [ ] Transaction hash saved
- [ ] Gas usage documented
- [ ] Deployment metadata saved

### Post-Deployment

- [ ] Contract verified on block explorer
- [ ] Basic functionality tested
- [ ] Integration tests passed
- [ ] Monitoring set up
- [ ] Documentation updated with contract address
- [ ] Team notified of successful deployment

## 🆘 Troubleshooting

### Common Deployment Issues

#### "Insufficient funds for gas"

```bash
Error: insufficient funds for gas * price + value
```

**Solution:** Add more ETH/tokens to your deployment account

#### "Nonce too high"

```bash
Error: nonce has already been used
```

**Solution:** Reset your account nonce or wait for pending transactions

#### "Contract creation code storage out of gas"

```bash
Error: out of gas
```

**Solution:** Increase gas limit in deployment script

#### "Network not configured"

```bash
Error: network 'sepolia' is not configured
```

**Solution:** Check `hardhat.config.ts` network configuration

### Getting Help

- **Network issues**: Check [Ethereum Status](https://ethstatus.io/)
- **Gas prices**: Monitor [ETH Gas Station](https://ethgasstation.info/)
- **Hardhat help**: Visit [Hardhat Documentation](https://hardhat.org/docs)
- **LeLink specific**: Check our [FAQ](./faq.md) and [Troubleshooting](./troubleshooting.md)

## 🎯 Next Steps

After successful deployment:

1. **📊 Set up monitoring** - Track contract usage and events
2. **📚 Update documentation** - Record contract addresses and networks
3. **🔧 Configure applications** - Update frontend/backend with new addresses
4. **🧪 Run integration tests** - Verify end-to-end functionality
5. **📢 Announce deployment** - Notify stakeholders and users

---

**Deployed successfully?** 🎉 Check out our [Interaction Guide](./interaction-guide.md) to start using your LeLink contract!

**Need help?** Visit our [Troubleshooting Guide](./troubleshooting.md) for common issues and solutions.
