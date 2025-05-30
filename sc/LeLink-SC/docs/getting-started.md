# 🚀 Quick Start Guide

Get LeLink up and running in 10 minutes! This guide will help you deploy and interact with the LeLink smart contract, even if you're new to blockchain development.

## ⏱️ What You'll Accomplish

In the next 10 minutes, you'll:

1. ✅ Set up your development environment
2. ✅ Deploy the LeLink contract locally
3. ✅ Create your first healthcare record
4. ✅ Query and interact with the contract

## 🛠️ Prerequisites Check

Before starting, make sure you have:

- [x] Node.js (version 16 or later) - [Download here](https://nodejs.org/)
- [x] A code editor (VS Code recommended) - [Download here](https://code.visualstudio.com/)
- [x] Basic command line knowledge

> 💡 **New to these tools?** Check our [Prerequisites Guide](./prerequisites.md) for detailed setup instructions.

## 🏃‍♂️ 5-Minute Setup

### Step 1: Clone and Install (2 minutes)

```bash
# Navigate to your project directory
cd /home/baloz/uV/MM/LeLink/LeLink/smart-contract

# Install all dependencies
npm install

# Compile the smart contracts
npm run compile
```

### Step 2: Start Local Blockchain (1 minute)

```bash
# Start a local Hardhat network (keep this terminal open)
npm run node
```

You should see output like:

```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/
```

### Step 3: Deploy Contract (1 minute)

Open a **new terminal** and run:

```bash
# Deploy to local network
npm run deploy:localhost
```

You should see a deployment summary with your contract address!

### Step 4: Verify Everything Works (1 minute)

```bash
# Run the test suite to ensure everything is working
npm test
```

All tests should pass ✅

## 🎯 Your First Healthcare Record

Now let's create and interact with a healthcare record using the Hardhat console:

### Step 1: Open Hardhat Console

```bash
npx hardhat console --network localhost
```

### Step 2: Get Your Contract

```javascript
// Get the deployed contract
const LeLink = await ethers.getContractFactory('LeLink');
const [deployer] = await ethers.getSigners();

// Get the deployed contract address from your deployment output
const contractAddress = 'YOUR_CONTRACT_ADDRESS'; // Replace with actual address
const lelink = LeLink.attach(contractAddress);

console.log('Contract loaded at:', contractAddress);
```

### Step 3: Create a Healthcare Record

```javascript
// Create a new healthcare record
const resourceId = 'patient-123-record-001';
const dataHash = 'QmX1eVtVf9QjK2H3N4P5R6S7T8U9V0W1X2Y3Z4A5B6C7D8E'; // Example hash
const ownerAddress = deployer.address;

// Create the record
const tx = await lelink.createRecord(resourceId, dataHash, ownerAddress);
await tx.wait();

console.log('✅ Healthcare record created!');
console.log('Transaction hash:', tx.hash);
```

### Step 4: Query Your Record

```javascript
// Check if record exists
const exists = await lelink.recordExists(resourceId, ownerAddress);
console.log('Record exists:', exists);

// Get record details
const record = await lelink.getRecord(resourceId, ownerAddress);
console.log('Record details:', {
  creator: record.creator,
  dataHash: record.dataHash,
  createdAt: new Date(Number(record.createdAt) * 1000),
  lastModified: new Date(Number(record.lastModified) * 1000),
});

// Get total record count
const count = await lelink.getRecordCount();
console.log('Total records:', count.toString());
```

### Step 5: Log Access to the Record

```javascript
// Log that someone accessed this record
const accessTx = await lelink.logAccess(resourceId, ownerAddress);
await accessTx.wait();

console.log('✅ Access logged!');
console.log('Transaction hash:', accessTx.hash);
```

## 🎉 Congratulations!

You've successfully:

- ✅ Deployed the LeLink smart contract
- ✅ Created a healthcare record
- ✅ Queried record information
- ✅ Logged record access

## 🔄 What's Next?

Now that you have LeLink running, here are your next steps:

### For Healthcare Organizations

- [Learn about data privacy and security](./security.md)
- [Understand the complete API](./api-reference.md)
- [See real-world examples](./examples.md)

### For Developers

- [Set up for production deployment](./deployment-guide.md)
- [Integrate with your application](./interaction-guide.md)
- [Learn about gas optimization](./gas-optimization.md)

### For System Administrators

- [Configure for different networks](./configuration.md)
- [Set up monitoring](./monitoring-guide.md)
- [Plan for scaling](./architecture.md)

## 🆘 Need Help?

If something didn't work:

1. **Check our [Troubleshooting Guide](./troubleshooting.md)** - covers 90% of common issues
2. **Review the [FAQ](./faq.md)** - quick answers to frequent questions
3. **Verify your setup** with our [Prerequisites Guide](./prerequisites.md)

## 📊 Understanding the Results

### What Just Happened?

1. **Local Blockchain**: You started a local Ethereum-like blockchain for testing
2. **Smart Contract**: You deployed LeLink to this test network
3. **Healthcare Record**: You created a record with a unique ID and data hash
4. **Blockchain Events**: Each action was recorded as an immutable event
5. **Gas Fees**: Transactions used "fake" ETH for gas (free on local network)

### Key Concepts

- **Resource ID**: A unique string identifier for your healthcare data
- **Data Hash**: A cryptographic fingerprint of the actual healthcare data
- **Owner**: The wallet address that controls the record
- **Creator**: The address that initially created the record
- **Events**: Immutable logs of all actions (create, access, share, etc.)

### Security Note

The actual healthcare data is **never stored on the blockchain**. Only cryptographic hashes and metadata are stored, ensuring privacy while maintaining verifiability.

---

🎯 **Total time**: ~10 minutes  
🎉 **Status**: You're now a LeLink operator!
