import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';

// Helper to check if a private key is valid (64 hex chars)
const isValidPrivateKey = (key: string | undefined): key is string => {
  return !!key && key.startsWith('0x') && key.length === 66;
};

const config: HardhatUserConfig = {
  solidity: '0.8.28',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    ...(process.env.SEPOLIA_URL && isValidPrivateKey(process.env.TESTNET_PRIVATE_KEY) ? {
      sepolia: {
        url: process.env.SEPOLIA_URL,
        accounts: [process.env.TESTNET_PRIVATE_KEY!],
      }
    } : {}),
    ...(process.env.MAINNET_URL && isValidPrivateKey(process.env.MAINNET_PRIVATE_KEY) ? {
      mainnet: {
        url: process.env.MAINNET_URL,
        accounts: [process.env.MAINNET_PRIVATE_KEY!],
      }
    } : {}),
  },
  etherscan: {
    apiKey: {
      sepolia: process.env.ETHERSCAN_API_KEY || '',
      mainnet: process.env.ETHERSCAN_API_KEY || '',
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS === 'true',
    currency: 'USD',
    gasPrice: 100,
  },
};

export default config;
