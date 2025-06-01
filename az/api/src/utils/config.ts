/**
 * @fileoverview Configuration for OpenAI assistants and blockchain integration
 * @module utils/config
 */

export interface AssistantsConfig {
  conversation?: string;
}

export interface BlockchainConfig {
  enabled: boolean;
  rpcUrl: string;
  network: string;
  privateKey: string;
  contractAddress?: string;
}

export interface AzuriteConfig {
  connectionString: string;
}

export interface FHIRServiceConfig {
  url?: string;
  bearerToken?: string;
}

export interface FHIRStorageConfig {
  enabled: boolean;
  mode: 'fhir-service' | 'azurite';
  azurite: AzuriteConfig;
  fhirService: FHIRServiceConfig;
}

export interface AppConfig {
  assistants: AssistantsConfig;
  blockchain: BlockchainConfig;
  fhirStorage: FHIRStorageConfig;
}

const config: AppConfig = {
  assistants: {
    conversation: process.env.OPENAI_CONVERSATION_ASSISTANT_ID,
  },
  blockchain: {
    enabled: process.env.ENABLE_BLOCKCHAIN_LOGGING === 'true',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
    network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
    privateKey:
      process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
    contractAddress: process.env.LELINK_CONTRACT_ADDRESS,
  },
  fhirStorage: {
    enabled: process.env.ENABLE_FHIR_STORAGE !== 'false', // Default to true
    mode: process.env.NODE_ENV === 'production' ? 'fhir-service' : 'azurite',
    azurite: {
      connectionString:
        process.env.AZURE_STORAGE_CONNECTION_STRING ||
        'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;',
    },
    fhirService: {
      url: process.env.FHIR_SERVER_URL,
      bearerToken: process.env.FHIR_SERVER_BEARER_TOKEN,
    },
  },
};

/**
 * Get configuration value using dot notation
 * @param key - Configuration key path (dot notation)
 * @param defaultValue - Default value if key not found
 * @returns Configuration value
 */
export function get<T = any>(key: string, defaultValue: T | null = null): T | null {
  const value = key.split('.').reduce((obj: any, k: string) => obj?.[k], config);
  return value !== undefined ? value : defaultValue;
}

// Export individual config sections for convenience
export const assistantsConfig = config.assistants;
export const blockchainConfig = config.blockchain;
export const fhirStorageConfig = config.fhirStorage;

// Export the entire config as default
export default config;
