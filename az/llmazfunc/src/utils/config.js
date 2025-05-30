/**
 * @fileoverview Configuration for OpenAI assistants and blockchain integration
 * @module utils/config
 */

const config = {
    assistants: {
        conversation: process.env.OPENAI_CONVERSATION_ASSISTANT_ID
    },
    blockchain: {
        enabled: process.env.ENABLE_BLOCKCHAIN_LOGGING === 'true',
        rpcUrl: process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545',
        network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
        privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
        contractAddress: process.env.LELINK_CONTRACT_ADDRESS
    },
    fhirStorage: {
        enabled: process.env.ENABLE_FHIR_STORAGE !== 'false', // Default to true
        mode: process.env.NODE_ENV === 'production' ? 'fhir-service' : 'azurite',
        azurite: {
            connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || 
                'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=Eby8vdM02xNOcqFlqUwJPLlmEtlCDXJ1OUzFT50uSRZ6IFsuFq2UVErCz4I6tq/K1SZFPTOtr/KBHBeksoGMGw==;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;'
        },
        fhirService: {
            url: process.env.FHIR_SERVER_URL,
            bearerToken: process.env.FHIR_SERVER_BEARER_TOKEN
        }
    }
};

/**
 * Get configuration value
 * @param {string} key - Configuration key path (dot notation)
 * @param {*} defaultValue - Default value if key not found
 * @returns {*} Configuration value
 */
function get(key, defaultValue = null) {
    return key.split('.').reduce((obj, k) => obj?.[k], config) ?? defaultValue;
}

module.exports = { get, ...config }; 