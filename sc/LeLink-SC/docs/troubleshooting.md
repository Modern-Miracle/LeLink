# 🔧 Troubleshooting Guide

Having issues with LeLink? This guide covers the most common problems and their solutions. Most issues can be resolved quickly with the right approach.

## 🚨 Quick Fixes

Before diving deep, try these common solutions:

1. **🔄 Restart everything**: Close terminals, restart Hardhat node, redeploy
2. **🧹 Clean build**: Run `npm run clean && npm run compile`
3. **📦 Reinstall**: Delete `node_modules`, run `npm install`
4. **🔗 Check network**: Ensure you're on the correct network
5. **⛽ Check gas**: Verify sufficient ETH/tokens for transactions

## 📋 Issue Categories

- [Installation Issues](#installation-issues)
- [Compilation Errors](#compilation-errors)
- [Deployment Problems](#deployment-problems)
- [Transaction Failures](#transaction-failures)
- [Network Issues](#network-issues)
- [Contract Interaction Problems](#contract-interaction-problems)
- [Testing Issues](#testing-issues)
- [Performance Problems](#performance-problems)

## 🛠️ Installation Issues

### Node.js Version Problems

**Error Message:**

```
Error: The engine "node" is incompatible with this module
```

**Cause**: Wrong Node.js version  
**Solution**:

```bash
# Check your Node.js version
node --version

# Install Node.js 16+ from nodejs.org
# Or use nvm to manage versions
nvm install 18
nvm use 18
```

### npm Permission Errors (macOS/Linux)

**Error Message:**

```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules'
```

**Solution**:

```bash
# Fix npm permissions
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules

# Or use yarn instead
npm install -g yarn
yarn install
```

### Windows Path Issues

**Error Message:**

```
'npm' is not recognized as an internal or external command
```

**Solution**:

1. Add Node.js to your system PATH
2. Restart Command Prompt as Administrator
3. Use PowerShell instead of Command Prompt

### Package Installation Failures

**Error Message:**

```
npm ERR! peer dep missing: hardhat@^2.0.0
```

**Solution**:

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try yarn
yarn install
```

## 📝 Compilation Errors

### Solidity Version Mismatch

**Error Message:**

```
Error: Solidity version ^0.8.0 is not supported
```

**Solution**:

```typescript
// In hardhat.config.ts, ensure version matches
const config: HardhatUserConfig = {
  solidity: '0.8.28', // Match your contract version
};
```

### Missing Imports

**Error Message:**

```
Error: Source "@openzeppelin/contracts/access/Ownable.sol" not found
```

**Solution**:

```bash
# Install OpenZeppelin contracts
npm install @openzeppelin/contracts

# Or if using yarn
yarn add @openzeppelin/contracts
```

### Compilation Out of Memory

**Error Message:**

```
JavaScript heap out of memory
```

**Solution**:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=8192"
npm run compile

# Or in package.json scripts
"compile": "node --max-old-space-size=8192 ./node_modules/.bin/hardhat compile"
```

### TypeChain Generation Errors

**Error Message:**

```
Error: Cannot find module '../typechain-types'
```

**Solution**:

```bash
# Regenerate TypeChain types
npm run clean
npm run compile
npm run typechain
```

## 🚀 Deployment Problems

### Insufficient Gas/Funds

**Error Message:**

```
Error: insufficient funds for gas * price + value
```

**Solutions**:

```bash
# Check account balance
npx hardhat console --network localhost
const [deployer] = await ethers.getSigners();
console.log(await deployer.provider.getBalance(deployer.address));

# For testnets: Get more test ETH from faucets
# For mainnet: Add more ETH to your account
```

### Network Configuration Issues

**Error Message:**

```
Error: network 'sepolia' is not configured
```

**Solution**:

```typescript
// Ensure hardhat.config.ts has the network
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || '',
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
    },
  },
};
```

### RPC Provider Issues

**Error Message:**

```
Error: could not detect network
```

**Solutions**:

```bash
# Check .env file exists and has correct RPC URL
cat .env

# Test RPC connection
curl -X POST \
  -H "Content-Type: application/json" \
  --data '{"jsonrpc":"2.0","method":"eth_chainId","params":[],"id":1}' \
  YOUR_RPC_URL
```

### Deployment Timeout

**Error Message:**

```
Error: timeout of 20000ms exceeded
```

**Solution**:

```typescript
// Increase timeout in hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL,
      accounts: [process.env.PRIVATE_KEY],
      timeout: 60000, // 60 seconds
    },
  },
};
```

### Nonce Issues

**Error Message:**

```
Error: nonce has already been used
```

**Solutions**:

```bash
# Reset account nonce (MetaMask)
# Settings > Advanced > Reset Account

# Or wait for pending transactions to confirm

# Check pending transactions
npx hardhat console --network sepolia
const [deployer] = await ethers.getSigners();
console.log(await deployer.getNonce());
```

## 💸 Transaction Failures

### Gas Estimation Failed

**Error Message:**

```
Error: cannot estimate gas; transaction may fail
```

**Solutions**:

```javascript
// Manually set gas limit
const tx = await contract.createRecord(resourceId, dataHash, owner, {
  gasLimit: 500000,
});

// Check if function will revert
try {
  await contract.createRecord.staticCall(resourceId, dataHash, owner);
} catch (error) {
  console.log('Transaction would revert:', error.message);
}
```

### Transaction Reverted

**Error Message:**

```
Error: transaction reverted: LeLink__RecordAlreadyExists
```

**Solutions**:

```javascript
// Check if record already exists
const exists = await contract.recordExists(resourceId, owner);
if (exists) {
  console.log('Record already exists');
  return;
}

// Use try-catch for better error handling
try {
  const tx = await contract.createRecord(resourceId, dataHash, owner);
  await tx.wait();
} catch (error) {
  if (error.message.includes('RecordAlreadyExists')) {
    console.log('Record already exists');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Contract Function Not Found

**Error Message:**

```
Error: contract.createRecord is not a function
```

**Solutions**:

```javascript
// Ensure contract is properly connected
const LeLink = await ethers.getContractFactory('LeLink');
const contract = LeLink.attach(contractAddress);

// Check ABI is correct
console.log(contract.interface.functions);

// Reconnect with signer for state-changing functions
const [signer] = await ethers.getSigners();
const contractWithSigner = contract.connect(signer);
```

## 🌐 Network Issues

### Wrong Network Connected

**Error Message:**

```
Error: chainId mismatch. Expected 1, got 11155111
```

**Solutions**:

```bash
# Check current network
npx hardhat console
console.log(await ethers.provider.getNetwork());

# Switch to correct network in MetaMask
# Or use correct --network flag
npx hardhat run script.js --network sepolia
```

### RPC Rate Limiting

**Error Message:**

```
Error: too many requests
```

**Solutions**:

```bash
# Use different RPC provider
# Infura: infura.io
# Alchemy: alchemy.com
# QuickNode: quicknode.com

# Add delays between requests
await new Promise(resolve => setTimeout(resolve, 1000));
```

### Network Congestion

**Error Message:**

```
Error: transaction underpriced
```

**Solutions**:

```javascript
// Increase gas price
const gasPrice = await ethers.provider.getGasPrice();
const tx = await contract.createRecord(resourceId, dataHash, owner, {
  gasPrice: gasPrice * 2n, // Double the gas price
});

// Use EIP-1559 (if supported)
const tx = await contract.createRecord(resourceId, dataHash, owner, {
  maxFeePerGas: ethers.parseUnits('30', 'gwei'),
  maxPriorityFeePerGas: ethers.parseUnits('2', 'gwei'),
});
```

## 🔄 Contract Interaction Problems

### Contract Not Deployed

**Error Message:**

```
Error: call revert exception
```

**Solutions**:

```javascript
// Check if contract exists at address
const code = await ethers.provider.getCode(contractAddress);
if (code === '0x') {
  console.log('No contract at this address');
}

// Verify contract address in deployment files
const deploymentData = require('../deployments/sepolia-latest.json');
console.log('Deployed address:', deploymentData.contractAddress);
```

### Function Access Denied

**Error Message:**

```
Error: LeLink__NotAuthorized
```

**Solutions**:

```javascript
// Check if caller is the record creator
const record = await contract.getRecord(resourceId, owner);
console.log('Record creator:', record.creator);
console.log('Current caller:', signer.address);

// Use correct signer
const correctSigner = await ethers.getSigner(record.creator);
const contractWithCorrectSigner = contract.connect(correctSigner);
```

### Contract Paused

**Error Message:**

```
Error: Pausable: paused
```

**Solutions**:

```javascript
// Check if contract is paused
const isPaused = await contract.paused();
console.log('Contract paused:', isPaused);

// Unpause (if you're the owner)
if (isPaused && isOwner) {
  const tx = await contract.unpause();
  await tx.wait();
}
```

## 🧪 Testing Issues

### Tests Failing Randomly

**Error Message:**

```
Error: timeout of 2000ms exceeded
```

**Solutions**:

```javascript
// Increase test timeout in test files
describe('LeLink Tests', function () {
  this.timeout(60000); // 60 seconds

  it('should create record', async function () {
    // Test code
  });
});

// Use proper async/await
await expect(contract.createRecord(id, hash, owner)).to.emit(contract, 'DataCreated');
```

### Test State Interference

**Error Message:**

```
Error: record already exists in test
```

**Solutions**:

```javascript
// Use beforeEach to reset state
beforeEach(async function () {
  // Redeploy contract for each test
  const LeLink = await ethers.getContractFactory('LeLink');
  contract = await LeLink.deploy();
  await contract.waitForDeployment();
});

// Use unique identifiers
const resourceId = `test-${Date.now()}-${Math.random()}`;
```

### Hardhat Network Issues

**Error Message:**

```
Error: Hardhat network is not running
```

**Solutions**:

```bash
# Start Hardhat network in separate terminal
npx hardhat node

# Or run tests on in-process network
npm test # Uses built-in Hardhat network
```

## ⚡ Performance Problems

### Slow Compilation

**Symptoms**: Compilation takes very long time

**Solutions**:

```typescript
// In hardhat.config.ts, add compilation settings
const config: HardhatUserConfig = {
  solidity: {
    version: '0.8.28',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
};

// Use incremental compilation
// Only compile changed files automatically
```

### Slow Test Execution

**Symptoms**: Tests take minutes to run

**Solutions**:

```bash
# Use faster network for tests
npx hardhat test --network hardhat

# Run tests in parallel (if supported)
npm install --save-dev hardhat-parallel

# Use snapshots for state management
const snapshot = await ethers.provider.send("evm_snapshot");
await ethers.provider.send("evm_revert", [snapshot]);
```

### High Gas Usage

**Symptoms**: Transactions cost too much gas

**Solutions**:

```javascript
// Use events instead of storage for history
// Batch operations when possible
const transactions = [contract.createRecord(id1, hash1, owner1), contract.createRecord(id2, hash2, owner2)];

for (const tx of transactions) {
  await tx.wait();
}

// Use appropriate data types
// uint64 instead of uint256 for timestamps
```

## 🔍 Debugging Techniques

### Enable Debug Logging

```typescript
// In hardhat.config.ts
const config: HardhatUserConfig = {
  networks: {
    hardhat: {
      mining: {
        auto: true,
        interval: 1000,
      },
      loggingEnabled: true,
    },
  },
};
```

### Use Console Logging in Contracts

```solidity
// In your Solidity contract
import "hardhat/console.sol";

function createRecord(...) public {
    console.log("Creating record with ID:", _resourceIdStr);
    // Your function code
}
```

### Transaction Debugging

```javascript
// Get detailed transaction information
const tx = await contract.createRecord(resourceId, dataHash, owner);
const receipt = await tx.wait();

console.log('Transaction hash:', tx.hash);
console.log('Gas used:', receipt.gasUsed.toString());
console.log('Block number:', receipt.blockNumber);
console.log('Events:', receipt.logs);
```

### Event Monitoring

```javascript
// Listen for all contract events
contract.on('*', (event) => {
  console.log('Event:', event);
});

// Listen for specific events
contract.on('DataCreated', (recordId, owner, creator, resourceId, dataHash, timestamp) => {
  console.log('New record created:', {
    recordId,
    owner,
    creator,
    resourceId,
    dataHash,
    timestamp,
  });
});
```

## 🆘 Getting Additional Help

### Information to Gather

When seeking help, provide:

1. **Error message** (complete, not partial)
2. **Code snippet** that's failing
3. **Network** you're using (localhost/sepolia/mainnet)
4. **Node.js version** (`node --version`)
5. **Hardhat version** (`npx hardhat --version`)
6. **Steps to reproduce** the issue

### Diagnostic Commands

```bash
# System information
node --version
npm --version
npx hardhat --version

# Project information
npm list --depth=0
cat package.json | grep version

# Network information
npx hardhat console --network localhost
await ethers.provider.getNetwork()
await ethers.provider.getBlockNumber()

# Contract information
const code = await ethers.provider.getCode("CONTRACT_ADDRESS");
console.log("Contract exists:", code !== "0x");
```

### Community Resources

- **Hardhat Discord**: [hardhat.org/discord](https://hardhat.org/discord)
- **Ethereum Stack Exchange**: [ethereum.stackexchange.com](https://ethereum.stackexchange.com/)
- **OpenZeppelin Forum**: [forum.openzeppelin.com](https://forum.openzeppelin.com/)
- **GitHub Issues**: Create issue in project repository

## 📝 Common Error Reference

| Error                     | Cause                         | Solution                     |
| ------------------------- | ----------------------------- | ---------------------------- |
| `insufficient funds`      | Not enough ETH for gas        | Add ETH to account           |
| `nonce too high`          | Transaction nonce out of sync | Reset account or wait        |
| `transaction underpriced` | Gas price too low             | Increase gas price           |
| `call revert exception`   | Contract doesn't exist        | Check deployment             |
| `timeout exceeded`        | Network slow/congested        | Increase timeout             |
| `network not configured`  | Missing network config        | Add to hardhat.config.ts     |
| `cannot estimate gas`     | Transaction will fail         | Check function parameters    |
| `RecordAlreadyExists`     | Duplicate record creation     | Check if record exists first |
| `NotAuthorized`           | Wrong caller permissions      | Use correct signer           |
| `contract paused`         | Contract operations stopped   | Unpause contract             |

## ✅ Prevention Best Practices

1. **Always test locally first** before deploying to testnets/mainnet
2. **Use version control** to track working states
3. **Keep dependencies updated** but test after updates
4. **Use environment variables** for sensitive data
5. **Implement proper error handling** in your code
6. **Monitor gas prices** before transactions
7. **Backup private keys securely**
8. **Document your deployment addresses** and network configurations

---

**Still having issues?**

- Check our [FAQ](./faq.md) for quick answers
- Review the [API Reference](./api-reference.md) for function details
- Visit our [Examples](./examples.md) for working code patterns

**Found a bug?** Please report it with detailed reproduction steps!
