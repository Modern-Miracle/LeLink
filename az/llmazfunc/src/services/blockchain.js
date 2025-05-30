const { ethers } = require('ethers');
const crypto = require('crypto');
const config = require('../utils/config');
const { Logger } = require('../utils/logger');

const logger = new Logger({ context: 'BlockchainService' });

// LeLink contract ABI (minimal interface needed)
const LELINK_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "resourceId", "type": "string" },
      { "internalType": "string", "name": "dataHash", "type": "string" },
      { "internalType": "address", "name": "owner", "type": "address" }
    ],
    "name": "createRecord",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

class BlockchainService {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.contract = null;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    try {
      // Check if blockchain logging is enabled
      if (!config.blockchain.enabled) {
        logger.info('Blockchain logging is disabled');
        return;
      }

      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(config.blockchain.rpcUrl);

      // Initialize wallet
      this.wallet = new ethers.Wallet(config.blockchain.privateKey, this.provider);

      // Initialize contract
      this.contract = new ethers.Contract(
        config.blockchain.contractAddress,
        LELINK_ABI,
        this.wallet
      );

      this.initialized = true;
      logger.info('Blockchain service initialized', {
        network: config.blockchain.network,
        contractAddress: config.blockchain.contractAddress,
        walletAddress: this.wallet.address
      });
    } catch (error) {
      logger.error('Failed to initialize blockchain service', error);
      throw error;
    }
  }

  /**
   * Hash FHIR resource data
   * @param {Object} resource - FHIR resource object
   * @returns {string} SHA-256 hash of the resource
   */
  hashResource(resource) {
    const resourceString = JSON.stringify(resource);
    return crypto.createHash('sha256').update(resourceString).digest('hex');
  }

  /**
   * Log FHIR resources to blockchain
   * @param {Array} resources - Array of FHIR resources to log
   * @param {string} patientId - Patient identifier
   * @returns {Object} Transaction details
   */
  async logResources(resources, patientId = null) {
    if (!config.blockchain.enabled) {
      logger.debug('Blockchain logging disabled, skipping');
      return null;
    }

    if (!this.initialized) {
      await this.initialize();
    }

    if (!this.contract) {
      logger.warn('Blockchain service not properly initialized');
      return null;
    }

    const results = [];

    try {
      for (const resource of resources) {
        const resourceId = `${resource.resourceType}-${resource.id}`;
        const dataHash = this.hashResource(resource);
        
        // Use wallet address as owner if no patient ID provided
        const owner = patientId ? 
          ethers.getAddress(ethers.id(patientId).slice(0, 42)) : 
          this.wallet.address;

        logger.info('Logging resource to blockchain', {
          resourceId,
          dataHash: dataHash.substring(0, 16) + '...',
          owner
        });

        // Send transaction
        const tx = await this.contract.createRecord(resourceId, dataHash, owner);
        
        // Wait for confirmation
        const receipt = await tx.wait();

        results.push({
          resourceId,
          dataHash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString()
        });

        logger.info('Resource logged to blockchain successfully', {
          resourceId,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber
        });
      }

      return {
        success: true,
        results,
        contractAddress: config.blockchain.contractAddress,
        network: config.blockchain.network
      };
    } catch (error) {
      logger.error('Failed to log resources to blockchain', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get transaction details
   * @param {string} txHash - Transaction hash
   * @returns {Object} Transaction details
   */
  async getTransaction(txHash) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);
      
      return {
        hash: tx.hash,
        blockNumber: receipt.blockNumber,
        from: tx.from,
        to: tx.to,
        gasUsed: receipt.gasUsed.toString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      logger.error('Failed to get transaction details', error);
      throw error;
    }
  }
}

// Export singleton instance
module.exports = new BlockchainService();