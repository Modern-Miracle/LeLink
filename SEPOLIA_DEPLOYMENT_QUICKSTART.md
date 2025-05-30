# LeLink Sepolia Deployment Quick Start

## 📋 Prerequisites Checklist

### Required Services & API Keys
1. **Alchemy Account** - Get free API key from [https://dashboard.alchemy.com/](https://dashboard.alchemy.com/)
2. **Etherscan Account** - Get free API key from [https://etherscan.io/apis](https://etherscan.io/apis)
3. **Sepolia ETH** - Get testnet ETH from [https://sepoliafaucet.com/](https://sepoliafaucet.com/)

### Recommended Additional Services
4. **Tenderly** (Optional) - Advanced debugging: [https://tenderly.co/](https://tenderly.co/)
5. **OpenZeppelin Defender** (Optional) - Security monitoring: [https://defender.openzeppelin.com/](https://defender.openzeppelin.com/)
6. **Infura** (Optional) - Backup RPC: [https://infura.io/](https://infura.io/)

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Environment
```bash
cd sc/LeLink-SC
cp .env.example .env
```

Edit `.env` with your keys:
```bash
# Required
ALCHEMY_API_KEY=your_alchemy_api_key_here
ETHERSCAN_API_KEY=your_etherscan_api_key_here
DEPLOYER_PRIVATE_KEY=0x...your_private_key_here

# Optional but recommended
INFURA_API_KEY=your_infura_api_key_here
TENDERLY_ACCESS_KEY=your_tenderly_access_key_here
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Run Pre-deployment Checks
```bash
npm run pre-deploy
```

### Step 4: Deploy to Sepolia
```bash
npm run deploy:sepolia
```

## 📝 Deployment Commands

### Standard Deployment
```bash
# Deploy to Sepolia testnet
npm run deploy:sepolia

# Deploy to mainnet (production)
npm run deploy:mainnet

# Deploy with full safety checks
npm run deploy:sepolia:safe
```

### Multi-chain Deployment
```bash
# Deploy to Polygon
npm run deploy:polygon

# Deploy to Arbitrum
npm run deploy:arbitrum

# Deploy to Optimism
npm run deploy:optimism
```

### Testing & Verification
```bash
# Run all tests
npm test

# Run tests with gas reporting
npm run gas-report

# Verify deployed contract
npm run verify:sepolia CONTRACT_ADDRESS

# Check contract size
npm run size
```

## 🔧 Network Configuration

### Sepolia Testnet
- **Chain ID**: 11155111
- **RPC URL**: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`
- **Explorer**: https://sepolia.etherscan.io/
- **Faucets**: 
  - https://sepoliafaucet.com/
  - https://faucet.sepolia.dev/

### Ethereum Mainnet
- **Chain ID**: 1
- **RPC URL**: `https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY`
- **Explorer**: https://etherscan.io/

## 💰 Cost Estimation

### Sepolia (Testnet)
- **Deployment**: FREE (uses testnet ETH)
- **Gas Required**: ~2,000,000 gas

### Mainnet
- **At 30 Gwei**: ~0.06 ETH (~$120)
- **At 100 Gwei**: ~0.2 ETH (~$400)

## 🔍 Expected Output

After successful deployment, you should see:

```
🚀 Starting LeLink deployment to sepolia
📍 Deploying contracts with account: 0x...
💰 Account balance: 1.5 ETH
📝 Deploying LeLink contract...
✅ LeLink deployed to: 0x1234...abcd
🔍 Verifying contract on Etherscan...
✅ Contract verified successfully!

🎉 Deployment Summary:
========================
Network: sepolia
Contract Address: 0x1234...abcd
Deployer: 0x5678...efgh
Block Number: 12345678
========================

🔗 Useful Links:
========================
Contract: https://sepolia.etherscan.io/address/0x1234...abcd
Transaction: https://sepolia.etherscan.io/tx/0x9abc...def0
```

## 🛠️ Troubleshooting

### Common Issues

#### "Insufficient funds"
```bash
# Get testnet ETH from faucets
# Sepolia: https://sepoliafaucet.com/
```

#### "Nonce too low"
```bash
# Reset MetaMask account or manually set nonce
```

#### "Cannot estimate gas"
```bash
# Check network configuration
# Ensure contract compiles without errors
npm run compile
```

#### "Contract already verified"
```bash
# This is fine - contract is already on Etherscan
```

## 📋 Post-Deployment Checklist

### ✅ Immediate Actions
- [ ] Save contract address
- [ ] Verify contract on Etherscan
- [ ] Test basic contract functions
- [ ] Update frontend with new address

### ✅ Security Actions
- [ ] Transfer ownership to multi-sig (production)
- [ ] Set up monitoring alerts
- [ ] Configure access controls
- [ ] Backup deployment keys

### ✅ Integration Actions
- [ ] Update environment variables
- [ ] Configure frontend integration
- [ ] Set up blockchain logging
- [ ] Test end-to-end flow

## 🔐 Security Best Practices

### For Testnet
- Use a dedicated testnet wallet
- Never use mainnet private keys
- Test all functionality thoroughly

### For Mainnet
- Use hardware wallet (Ledger/Trezor)
- Use multi-signature wallet for ownership
- Perform security audit
- Use staging environment first

## 📚 Additional Resources

- [Deployment Guide (Full)](./DEPLOYMENT_GUIDE.md)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Alchemy Documentation](https://docs.alchemy.com/)
- [Etherscan API](https://docs.etherscan.io/)

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review the full deployment guide
3. Check Hardhat documentation
4. Verify network status on status pages

---

**Ready to deploy?** Run `npm run deploy:sepolia` in the `sc/LeLink-SC` directory!