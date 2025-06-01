/**
 * @fileoverview Blockchain service for Ethereum interactions
 * @module services/blockchain
 *
 * Provides blockchain functionality for storing FHIR resource hashes
 * and managing smart contract interactions.
 */

import { ethers, Contract, Provider, Wallet } from 'ethers';
import { Logger } from '../utils/logger.js';
import { BlockchainError } from '../utils/errors.js';

export interface BlockchainConfig {
  enabled: boolean;
  rpcUrl: string;
  network: string;
  privateKey: string;
  contractAddress?: string;
}

export interface TransactionResult {
  transactionHash: string;
  blockNumber?: number;
  gasUsed?: string;
  status?: number;
}

export interface ContractCallResult {
  result: any;
  transactionHash?: string;
  gasUsed?: string;
}

export interface FHIRHashRecord {
  resourceId: string;
  resourceType: string;
  patientId: string;
  hash: string;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
}

/**
 * Blockchain service class for Ethereum interactions
 */
export class BlockchainService {
  private provider: Provider | null = null;
  private wallet: Wallet | null = null;
  private contract: Contract | null = null;
  private logger: Logger;
  private config: BlockchainConfig;
  private isEnabled: boolean;

  constructor(config: BlockchainConfig) {
    this.logger = new Logger();
    this.config = config;
    this.isEnabled = config.enabled;

    if (this.isEnabled) {
      // Note: Initialization will happen on first use (lazy loading)
      this.logger.info('Blockchain service configured for lazy initialization');
    } else {
      this.logger.info('Blockchain service disabled');
    }
  }

  /**
   * Initialize blockchain connection
   */
  private async _initialize(): Promise<void> {
    try {
      if (!this.config.rpcUrl) {
        throw new BlockchainError('RPC URL is required', 'initialization');
      }
      if (!this.config.privateKey) {
        throw new BlockchainError('Private key is required', 'initialization');
      }

      // Connect to provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Create wallet
      this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);

      // Verify connection
      await this._verifyConnection();

      this.logger.info('Blockchain service initialized', {
        network: this.config.network,
        rpcUrl: this.config.rpcUrl,
        walletAddress: this.wallet.address,
      });

      // Initialize contract if address provided
      if (this.config.contractAddress) {
        await this._initializeContract();
      }
    } catch (error) {
      this.logger.error('Failed to initialize blockchain service', {
        error: error instanceof Error ? error : new Error(String(error)),
      });
      throw new BlockchainError('Failed to initialize blockchain service', 'initialization', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Verify blockchain connection
   */
  private async _verifyConnection(): Promise<void> {
    if (!this.provider || !this.wallet) {
      throw new BlockchainError('Provider or wallet not initialized', 'verification');
    }

    try {
      const network = await this.provider.getNetwork();
      const balance = await this.provider.getBalance(this.wallet.address);
      const blockNumber = await this.provider.getBlockNumber();

      this.logger.info('Blockchain connection verified', {
        chainId: network.chainId.toString(),
        networkName: network.name,
        balance: ethers.formatEther(balance),
        currentBlock: blockNumber,
        walletAddress: this.wallet.address,
      });
    } catch (error) {
      throw new BlockchainError('Failed to verify blockchain connection', 'verification', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Initialize smart contract
   */
  private async _initializeContract(): Promise<void> {
    if (!this.wallet || !this.config.contractAddress) {
      throw new BlockchainError('Wallet or contract address not available', 'contractInit');
    }

    try {
      // LeLink contract ABI (minimal interface needed) - matching JavaScript version
      const contractABI = [
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

      this.contract = new ethers.Contract(this.config.contractAddress, contractABI, this.wallet);

      this.logger.info('Smart contract initialized', {
        contractAddress: this.config.contractAddress,
      });
    } catch (error) {
      throw new BlockchainError('Failed to initialize contract', 'contractInit', {
        originalError: (error as Error).message,
        contractAddress: this.config.contractAddress,
      });
    }
  }

  /**
   * Store FHIR resource hash on blockchain
   */
  public async storeFHIRHash(
    resourceId: string,
    resourceType: string,
    patientId: string,
    hash: string
  ): Promise<TransactionResult> {
    if (!this.isEnabled) {
      throw new BlockchainError('Blockchain service is disabled', 'storeFHIRHash');
    }

    if (!this.contract) {
      throw new BlockchainError('Contract not initialized', 'storeFHIRHash');
    }

    try {
      this.logger.info('Storing FHIR hash on blockchain', {
        resourceId,
        resourceType,
        patientId,
        hash,
      });

      const tx = await this.contract.storeFHIRHash(resourceId, resourceType, patientId, hash);
      const receipt = await tx.wait();

      const result: TransactionResult = {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed?.toString(),
        status: receipt.status,
      };

      this.logger.info('FHIR hash stored on blockchain', {
        resourceId,
        transactionHash: result.transactionHash,
        blockNumber: result.blockNumber,
        gasUsed: result.gasUsed,
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to store FHIR hash on blockchain', {
        error: error as Error,
        resourceId,
        resourceType,
        patientId,
      });
      throw new BlockchainError('Failed to store FHIR hash', 'storeFHIRHash', {
        originalError: (error as Error).message,
        resourceId,
        resourceType,
        patientId,
      });
    }
  }

  /**
   * Retrieve FHIR resource hash from blockchain
   */
  public async getFHIRHash(resourceId: string): Promise<FHIRHashRecord | null> {
    if (!this.isEnabled) {
      throw new BlockchainError('Blockchain service is disabled', 'getFHIRHash');
    }

    if (!this.contract) {
      throw new BlockchainError('Contract not initialized', 'getFHIRHash');
    }

    try {
      const result = await this.contract.getFHIRHash(resourceId);

      // If no record found, result[0] (resourceId) will be empty
      if (!result[0]) {
        return null;
      }

      const record: FHIRHashRecord = {
        resourceId: result[0],
        resourceType: result[1],
        patientId: result[2],
        hash: result[3],
        timestamp: Number(result[4]),
        blockNumber: 0, // Would need to be retrieved separately
        transactionHash: '', // Would need to be retrieved separately
      };

      this.logger.debug('FHIR hash retrieved from blockchain', {
        resourceId,
        record,
      });

      return record;
    } catch (error) {
      this.logger.error('Failed to retrieve FHIR hash from blockchain', {
        error: error as Error,
        resourceId,
      });
      throw new BlockchainError('Failed to retrieve FHIR hash', 'getFHIRHash', {
        originalError: (error as Error).message,
        resourceId,
      });
    }
  }

  /**
   * Verify FHIR resource hash on blockchain
   */
  public async verifyFHIRHash(resourceId: string, hash: string): Promise<boolean> {
    if (!this.isEnabled) {
      throw new BlockchainError('Blockchain service is disabled', 'verifyFHIRHash');
    }

    if (!this.contract) {
      throw new BlockchainError('Contract not initialized', 'verifyFHIRHash');
    }

    try {
      const isValid = await this.contract.verifyFHIRHash(resourceId, hash);

      this.logger.debug('FHIR hash verification result', {
        resourceId,
        hash,
        isValid,
      });

      return isValid;
    } catch (error) {
      this.logger.error('Failed to verify FHIR hash on blockchain', {
        error: error as Error,
        resourceId,
        hash,
      });
      throw new BlockchainError('Failed to verify FHIR hash', 'verifyFHIRHash', {
        originalError: (error as Error).message,
        resourceId,
        hash,
      });
    }
  }

  /**
   * Log multiple FHIR resources to the blockchain
   * @param resources Array of FHIR resources to log
   * @param patientId Optional patient ID for ownership
   * @returns Promise of blockchain logging results
   */
  public async logResources(resources: any[], patientId?: string): Promise<{
    success: boolean;
    network: string;
    contractAddress: string;
    results: Array<{
      resourceId: string;
      dataHash: string;
      transactionHash: string;
      blockNumber: number;
    }>;
  } | null> {
    if (!this.config.enabled) {
      this.logger.debug('Blockchain logging disabled, skipping');
      return null;
    }

    if (!this.isReady()) {
      try {
        await this._initialize();
      } catch (error) {
        this.logger.error('Failed to initialize blockchain service for logging', {
          error: error instanceof Error ? error : new Error(String(error))
        });
        return null;
      }
    }

    if (!this.contract) {
      this.logger.warn('Blockchain service not properly initialized after initialization attempt');
      return null;
    }

    const results = [];
    
    // Get initial nonce for batch processing
    let currentNonce = await this.wallet!.getNonce('pending');

    try {
      for (const resource of resources) {
        const resourceId = `${resource.resourceType}-${resource.id}`;
        const dataHash = this.hashResource(resource);
        
        // Use wallet address as owner if no patient ID provided
        const owner = patientId ? 
          ethers.getAddress(ethers.id(patientId).slice(0, 42)) : 
          this.wallet!.address;

        this.logger.info('Logging resource to blockchain', {
          resourceId,
          resourceType: resource.resourceType,
          dataHash: dataHash.substring(0, 16) + '...',
          owner: owner.substring(0, 10) + '...',
          patientId,
          nonce: currentNonce
        });

        // Send transaction using createRecord method with explicit nonce
        const tx = await this.contract.createRecord(resourceId, dataHash, owner, {
          nonce: currentNonce
        });
        
        // Wait for confirmation  
        const receipt = await tx.wait();
        
        // Increment nonce for next transaction
        currentNonce++;

        results.push({
          resourceId,
          dataHash,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber
        });

        this.logger.info('Resource logged to blockchain successfully', {
          resourceId,
          txHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          nonce: receipt.nonce
        });
      }

      return {
        success: true,
        network: this.config.network,
        contractAddress: this.config.contractAddress || '',
        results
      };

    } catch (error) {
      this.logger.error('Failed to log resources to blockchain', {
        error: error instanceof Error ? error : new Error(String(error)),
        resourceCount: resources.length,
        patientId
      });

      throw new BlockchainError('Failed to log resources to blockchain', 'logResources', {
        originalError: (error as Error).message,
        resourceCount: resources.length,
        patientId
      });
    }
  }

  /**
   * Hash FHIR resource data (matching JavaScript implementation)
   */
  public hashResource(resource: any): string {
    try {
      const resourceString = JSON.stringify(resource);
      return ethers.keccak256(ethers.toUtf8Bytes(resourceString));
    } catch (error) {
      throw new BlockchainError('Failed to hash FHIR resource', 'hashResource', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Generate hash for FHIR resource (alias for compatibility)
   */
  public generateFHIRHash(resourceData: any): string {
    return this.hashResource(resourceData);
  }

  /**
   * Get current gas price
   */
  public async getCurrentGasPrice(): Promise<string> {
    if (!this.provider) {
      throw new BlockchainError('Provider not initialized', 'getCurrentGasPrice');
    }

    try {
      const gasPrice = await this.provider.getFeeData();
      return ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
    } catch (error) {
      throw new BlockchainError('Failed to get gas price', 'getCurrentGasPrice', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get wallet balance
   */
  public async getWalletBalance(): Promise<string> {
    if (!this.provider || !this.wallet) {
      throw new BlockchainError('Provider or wallet not initialized', 'getWalletBalance');
    }

    try {
      const balance = await this.provider.getBalance(this.wallet.address);
      return ethers.formatEther(balance);
    } catch (error) {
      throw new BlockchainError('Failed to get wallet balance', 'getWalletBalance', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Get network information
   */
  public async getNetworkInfo(): Promise<{
    chainId: string;
    name: string;
    currentBlock: number;
  }> {
    if (!this.provider) {
      throw new BlockchainError('Provider not initialized', 'getNetworkInfo');
    }

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        chainId: network.chainId.toString(),
        name: network.name,
        currentBlock: blockNumber,
      };
    } catch (error) {
      throw new BlockchainError('Failed to get network info', 'getNetworkInfo', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Check if blockchain service is enabled and ready
   */
  public isReady(): boolean {
    return this.isEnabled && this.provider !== null && this.wallet !== null;
  }

  /**
   * Get service status
   */
  public getStatus(): {
    enabled: boolean;
    ready: boolean;
    network: string;
    walletAddress?: string;
    contractAddress?: string;
  } {
    return {
      enabled: this.isEnabled,
      ready: this.isReady(),
      network: this.config.network,
      walletAddress: this.wallet?.address,
      contractAddress: this.config.contractAddress,
    };
  }
}

// Configuration matching the JavaScript version
const config = {
  blockchain: {
    enabled: process.env.BLOCKCHAIN_ENABLED === 'true',
    rpcUrl: process.env.BLOCKCHAIN_RPC_URL || '',
    network: process.env.BLOCKCHAIN_NETWORK || 'localhost',
    privateKey: process.env.BLOCKCHAIN_PRIVATE_KEY || '',
    contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
  }
};

// Export singleton instance
export const blockchainService = new BlockchainService({
  enabled: config.blockchain.enabled,
  rpcUrl: config.blockchain.rpcUrl,
  network: config.blockchain.network,
  privateKey: config.blockchain.privateKey,
  contractAddress: config.blockchain.contractAddress,
});

// Export for compatibility with JavaScript version
export default blockchainService;
