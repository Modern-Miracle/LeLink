/**
 * LeLink Contract Configuration
 * Centralized configuration for contract address, network settings, and environment variables
 */

/**
 * Contract configuration interface
 */
export interface LeLinkConfig {
  contractAddress: `0x${string}`;
  chainId: number;
  rpcUrl: string;
  blockExplorer?: string;
  networkName?: string;
}

/**
 * Environment variables for contract configuration
 */
export const ENV = {
  LELINK_CONTRACT_ADDRESS: process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS,
  CHAIN_ID: process.env.NEXT_PUBLIC_CHAIN_ID,
  RPC_URL: process.env.NEXT_PUBLIC_RPC_URL,
  BLOCK_EXPLORER: process.env.NEXT_PUBLIC_BLOCK_EXPLORER,
  NETWORK_NAME: process.env.NEXT_PUBLIC_NETWORK_NAME,
} as const;

/**
 * Default configuration for different networks
 */
export const NETWORK_CONFIGS: Record<string, LeLinkConfig> = {
  localhost: {
    contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`,
    chainId: 31337,
    rpcUrl: 'http://localhost:8545',
    blockExplorer: 'http://localhost:8545',
    networkName: 'Localhost',
  },
  sepolia: {
    contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Replace with actual deployed address
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
    networkName: 'Sepolia Testnet',
  },
  mainnet: {
    contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Replace with actual deployed address
    chainId: 1,
    rpcUrl: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://etherscan.io',
    networkName: 'Ethereum Mainnet',
  },
  polygon: {
    contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Replace with actual deployed address
    chainId: 137,
    rpcUrl: 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://polygonscan.com',
    networkName: 'Polygon',
  },
  polygonMumbai: {
    contractAddress: '0x0000000000000000000000000000000000000000' as `0x${string}`, // Replace with actual deployed address
    chainId: 80001,
    rpcUrl: 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://mumbai.polygonscan.com',
    networkName: 'Polygon Mumbai',
  },
} as const;

/**
 * Get configuration based on environment variables or default to localhost
 */
export const getConfig = (): LeLinkConfig => {
  const chainId = ENV.CHAIN_ID ? parseInt(ENV.CHAIN_ID) : 31337;

  // Find network config by chain ID
  const networkConfig = Object.values(NETWORK_CONFIGS).find((config) => config.chainId === chainId);

  if (networkConfig) {
    return {
      ...networkConfig,
      contractAddress: (ENV.LELINK_CONTRACT_ADDRESS as `0x${string}`) || networkConfig.contractAddress,
      rpcUrl: ENV.RPC_URL || networkConfig.rpcUrl,
      blockExplorer: ENV.BLOCK_EXPLORER || networkConfig.blockExplorer,
      networkName: ENV.NETWORK_NAME || networkConfig.networkName,
    };
  }

  // Default to localhost config with environment overrides
  return {
    contractAddress: (ENV.LELINK_CONTRACT_ADDRESS as `0x${string}`) || NETWORK_CONFIGS.localhost.contractAddress,
    chainId,
    rpcUrl: ENV.RPC_URL || NETWORK_CONFIGS.localhost.rpcUrl,
    blockExplorer: ENV.BLOCK_EXPLORER || NETWORK_CONFIGS.localhost.blockExplorer,
    networkName: ENV.NETWORK_NAME || NETWORK_CONFIGS.localhost.networkName,
  };
};

/**
 * Validate configuration
 */
export const validateConfig = (config: LeLinkConfig): boolean => {
  return (
    config.contractAddress !== '0x0000000000000000000000000000000000000000' &&
    config.chainId > 0 &&
    config.rpcUrl.length > 0
  );
};

/**
 * Get block explorer URL for a transaction or address
 */
export const getBlockExplorerUrl = (
  hash: string,
  type: 'tx' | 'address' | 'block' = 'tx',
  config?: LeLinkConfig
): string => {
  const currentConfig = config || getConfig();
  const baseUrl = currentConfig.blockExplorer || 'https://etherscan.io';

  switch (type) {
    case 'tx':
      return `${baseUrl}/tx/${hash}`;
    case 'address':
      return `${baseUrl}/address/${hash}`;
    case 'block':
      return `${baseUrl}/block/${hash}`;
    default:
      return baseUrl;
  }
};

/**
 * Format address for display (truncate middle)
 */
export const formatAddress = (address: string, startChars = 6, endChars = 4): string => {
  if (address.length <= startChars + endChars) {
    return address;
  }
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
};

/**
 * Format transaction hash for display
 */
export const formatTxHash = (hash: string): string => {
  return formatAddress(hash, 8, 6);
};

/**
 * Check if an address is valid Ethereum address
 */
export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

/**
 * Convert chain ID to network name
 */
export const getNetworkName = (chainId: number): string => {
  const config = Object.values(NETWORK_CONFIGS).find((c) => c.chainId === chainId);
  return config?.networkName || `Chain ${chainId}`;
};

/**
 * Contract deployment addresses for tracking
 */
export const DEPLOYMENT_INFO = {
  localhost: {
    deployedAt: 'TBD', // Block number when deployed
    deploymentTx: 'TBD', // Transaction hash of deployment
    deployer: 'TBD', // Address that deployed the contract
  },
  sepolia: {
    deployedAt: 'TBD',
    deploymentTx: 'TBD',
    deployer: 'TBD',
  },
  mainnet: {
    deployedAt: 'TBD',
    deploymentTx: 'TBD',
    deployer: 'TBD',
  },
} as const;

/**
 * Export the current configuration as default
 */
export default getConfig();
