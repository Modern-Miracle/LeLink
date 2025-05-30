import { ethers } from 'ethers';
import { LELINK_ABI } from '../../../../sc/LeLink-SC/react/abi/lelink.abi';

export interface BlockchainConfig {
  rpcUrl?: string;
  contractAddress?: string;
  privateKey?: string; // Only for write operations in development
}

export interface AuditLogEntry {
  recordId: string;
  resourceId: string;
  eventType: 'created' | 'accessed' | 'updated' | 'shared' | 'revoked' | 'deleted';
  actor: string;
  recipient?: string;
  timestamp: number;
  dataHash?: string;
  transactionHash: string;
  blockNumber: number;
}

export class BlockchainService {
  private provider: ethers.JsonRpcProvider | ethers.BrowserProvider;
  private contract: ethers.Contract;
  private signer?: ethers.Signer;

  constructor(config?: BlockchainConfig) {
    const rpcUrl = config?.rpcUrl || process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const contractAddress = config?.contractAddress || process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS || '';

    // During build time, allow missing contract address
    if (!contractAddress && typeof window !== 'undefined') {
      throw new Error('LeLink contract address not configured');
    }

    // Use a dummy address during build if not configured
    const addressToUse = contractAddress || '0x0000000000000000000000000000000000000000';

    // Initialize provider
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Use MetaMask if available
      this.provider = new ethers.BrowserProvider((window as any).ethereum);
    } else {
      // Use JSON-RPC provider
      this.provider = new ethers.JsonRpcProvider(rpcUrl);
    }

    // Initialize contract
    this.contract = new ethers.Contract(addressToUse, LELINK_ABI, this.provider);

    // Setup signer for write operations
    this.setupSigner(config?.privateKey);
  }

  private async setupSigner(privateKey?: string) {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      // Request account access if needed
      try {
        await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
        this.signer = await (this.provider as ethers.BrowserProvider).getSigner();
        this.contract = this.contract.connect(this.signer);
      } catch (error) {
        console.error('Failed to connect wallet:', error);
      }
    } else if (privateKey) {
      // Use private key for server-side operations
      this.signer = new ethers.Wallet(privateKey, this.provider);
      this.contract = this.contract.connect(this.signer);
    }
  }

  /**
   * Connect wallet (for browser environments)
   */
  async connectWallet(): Promise<string | null> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('MetaMask not available');
    }

    try {
      await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
      const signer = await (this.provider as ethers.BrowserProvider).getSigner();
      this.signer = signer;
      this.contract = this.contract.connect(signer);
      return await signer.getAddress();
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      return null;
    }
  }

  /**
   * Get current connected address
   */
  async getConnectedAddress(): Promise<string | null> {
    if (!this.signer) return null;
    try {
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }

  /**
   * Create a new record on the blockchain
   */
  async createRecord(
    resourceId: string,
    dataHash: string,
    owner?: string
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet first.');
    }

    try {
      const ownerAddress = owner || await this.signer.getAddress();
      const tx = await this.contract.createRecord(resourceId, dataHash, ownerAddress);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to create record:', error);
      return null;
    }
  }

  /**
   * Update an existing record
   */
  async updateRecord(
    resourceId: string,
    newDataHash: string
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.updateRecord(resourceId, newDataHash);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to update record:', error);
      return null;
    }
  }

  /**
   * Log access to a record
   */
  async logAccess(
    resourceId: string,
    owner: string
  ): Promise<ethers.TransactionReceipt | null> {
    if (!this.signer) {
      throw new Error('No signer available. Please connect wallet first.');
    }

    try {
      const tx = await this.contract.logAccess(resourceId, owner);
      const receipt = await tx.wait();
      return receipt;
    } catch (error) {
      console.error('Failed to log access:', error);
      return null;
    }
  }

  /**
   * Get record details
   */
  async getRecord(resourceId: string, owner: string): Promise<{
    creator: string;
    dataHash: string;
    createdAt: number;
    lastModified: number;
  } | null> {
    try {
      const record = await this.contract.getRecord(resourceId, owner);
      return {
        creator: record[0],
        dataHash: record[1],
        createdAt: Number(record[2]),
        lastModified: Number(record[3])
      };
    } catch (error) {
      console.error('Failed to get record:', error);
      return null;
    }
  }

  /**
   * Check if record exists
   */
  async recordExists(resourceId: string, owner: string): Promise<boolean> {
    try {
      return await this.contract.recordExists(resourceId, owner);
    } catch (error) {
      console.error('Failed to check record existence:', error);
      return false;
    }
  }

  /**
   * Get record hash
   */
  async getRecordHash(resourceId: string, owner: string): Promise<string | null> {
    try {
      return await this.contract.getRecordHash(resourceId, owner);
    } catch (error) {
      console.error('Failed to get record hash:', error);
      return null;
    }
  }

  /**
   * Get audit logs for a specific resource
   */
  async getAuditLogs(resourceId: string, owner: string): Promise<AuditLogEntry[]> {
    try {
      const recordId = await this.contract.getRecordId(resourceId, owner);
      const logs: AuditLogEntry[] = [];

      // Define event filters
      const filters = [
        this.contract.filters.DataCreated(recordId),
        this.contract.filters.DataAccessed(recordId),
        this.contract.filters.DataUpdated(recordId),
        this.contract.filters.DataShared(recordId),
        this.contract.filters.DataAccessRevoked(recordId),
        this.contract.filters.DataDeleted(recordId)
      ];

      // Query each event type
      for (const filter of filters) {
        const events = await this.contract.queryFilter(filter);
        
        for (const event of events) {
          const parsedLog = this.parseEventLog(event);
          if (parsedLog) {
            logs.push(parsedLog);
          }
        }
      }

      // Sort by timestamp
      return logs.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('Failed to get audit logs:', error);
      return [];
    }
  }

  /**
   * Parse event log into AuditLogEntry
   */
  private parseEventLog(event: ethers.EventLog | ethers.Log): AuditLogEntry | null {
    try {
      const parsedEvent = event as ethers.EventLog;
      if (!parsedEvent.args) return null;

      const baseEntry = {
        recordId: parsedEvent.args[0],
        transactionHash: parsedEvent.transactionHash,
        blockNumber: parsedEvent.blockNumber,
      };

      switch (parsedEvent.fragment.name) {
        case 'DataCreated':
          return {
            ...baseEntry,
            eventType: 'created',
            actor: parsedEvent.args[2], // creator
            resourceId: parsedEvent.args[3],
            dataHash: parsedEvent.args[4],
            timestamp: Number(parsedEvent.args[5])
          };

        case 'DataAccessed':
          return {
            ...baseEntry,
            eventType: 'accessed',
            actor: parsedEvent.args[1], // accessor
            resourceId: parsedEvent.args[2],
            timestamp: Number(parsedEvent.args[3])
          };

        case 'DataUpdated':
          return {
            ...baseEntry,
            eventType: 'updated',
            actor: parsedEvent.args[1], // updater
            resourceId: parsedEvent.args[2],
            dataHash: parsedEvent.args[3],
            timestamp: Number(parsedEvent.args[4])
          };

        case 'DataShared':
          return {
            ...baseEntry,
            eventType: 'shared',
            actor: parsedEvent.args[1], // sharer
            recipient: parsedEvent.args[2],
            resourceId: parsedEvent.args[3],
            timestamp: Number(parsedEvent.args[4])
          };

        case 'DataAccessRevoked':
          return {
            ...baseEntry,
            eventType: 'revoked',
            actor: parsedEvent.args[1], // revoker
            recipient: parsedEvent.args[2], // revoked user
            resourceId: parsedEvent.args[3],
            timestamp: Number(parsedEvent.args[4])
          };

        case 'DataDeleted':
          return {
            ...baseEntry,
            eventType: 'deleted',
            actor: parsedEvent.args[1], // deleter
            resourceId: parsedEvent.args[2],
            timestamp: Number(parsedEvent.args[3])
          };

        default:
          return null;
      }
    } catch (error) {
      console.error('Failed to parse event log:', error);
      return null;
    }
  }

  /**
   * Get contract status
   */
  async getContractStatus(): Promise<{
    address: string;
    owner: string;
    paused: boolean;
    recordCount: number;
  } | null> {
    try {
      const [owner, paused, recordCount] = await Promise.all([
        this.contract.owner(),
        this.contract.paused(),
        this.contract.getRecordCount()
      ]);

      return {
        address: await this.contract.getAddress(),
        owner,
        paused,
        recordCount: Number(recordCount)
      };
    } catch (error) {
      console.error('Failed to get contract status:', error);
      return null;
    }
  }

  /**
   * Verify data integrity by comparing hashes
   */
  async verifyDataIntegrity(
    resourceId: string,
    owner: string,
    currentDataHash: string
  ): Promise<boolean> {
    try {
      const onChainHash = await this.getRecordHash(resourceId, owner);
      return onChainHash === currentDataHash;
    } catch (error) {
      console.error('Failed to verify data integrity:', error);
      return false;
    }
  }
}

// Lazy singleton instance
let _blockchainService: BlockchainService | null = null;

export function getBlockchainService(): BlockchainService {
  if (!_blockchainService) {
    try {
      _blockchainService = new BlockchainService();
    } catch (error) {
      console.error('Failed to initialize blockchain service:', error);
      // Return a dummy service during build time
      if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS) {
        throw error;
      }
    }
  }
  return _blockchainService!;
}

// Export function to create custom instances
export function createBlockchainService(config?: BlockchainConfig): BlockchainService {
  return new BlockchainService(config);
}

// For backward compatibility
export const blockchainService = {
  get connectWallet() { return getBlockchainService().connectWallet.bind(getBlockchainService()); },
  get getConnectedAddress() { return getBlockchainService().getConnectedAddress.bind(getBlockchainService()); },
  get createRecord() { return getBlockchainService().createRecord.bind(getBlockchainService()); },
  get updateRecord() { return getBlockchainService().updateRecord.bind(getBlockchainService()); },
  get logAccess() { return getBlockchainService().logAccess.bind(getBlockchainService()); },
  get getRecord() { return getBlockchainService().getRecord.bind(getBlockchainService()); },
  get recordExists() { return getBlockchainService().recordExists.bind(getBlockchainService()); },
  get getRecordHash() { return getBlockchainService().getRecordHash.bind(getBlockchainService()); },
  get getAuditLogs() { return getBlockchainService().getAuditLogs.bind(getBlockchainService()); },
  get getContractStatus() { return getBlockchainService().getContractStatus.bind(getBlockchainService()); },
  get verifyDataIntegrity() { return getBlockchainService().verifyDataIntegrity.bind(getBlockchainService()); },
};