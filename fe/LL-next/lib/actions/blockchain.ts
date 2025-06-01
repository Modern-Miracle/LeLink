'use server';

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { ethers } from 'ethers';
import { revalidatePath } from 'next/cache';

// Contract ABI (minimal interface for reading audit logs)
const LELINK_ABI = [
  'event RecordCreated(string indexed recordId, bytes32 indexed hash, address indexed owner, uint256 timestamp)',
  'event RecordShared(string indexed recordId, address indexed owner, address indexed sharedWith, uint256 timestamp)',
  'event AccessRevoked(string indexed recordId, address indexed owner, address indexed revokedFrom, uint256 timestamp)',
  'function getRecordHash(string memory recordId) public view returns (bytes32)',
  'function hasAccess(string memory recordId, address user) public view returns (bool)',
];

// Input validation schemas
const getAuditLogsSchema = z.object({
  recordId: z.string().optional(),
  patientAddress: z.string().optional(),
  fromBlock: z.number().optional().default(0),
  toBlock: z.string().optional().default('latest'),
});

const verifyRecordSchema = z.object({
  recordId: z.string().min(1),
  expectedHash: z.string().optional(),
});

// Response types
export interface AuditLog {
  type: 'created' | 'shared' | 'revoked';
  recordId: string;
  hash?: string;
  owner: string;
  sharedWith?: string;
  revokedFrom?: string;
  timestamp: string;
  transactionHash: string;
  blockNumber: number;
}

export interface BlockchainStatus {
  connected: boolean;
  network: string;
  contractAddress: string;
  blockNumber: number;
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Get blockchain connection status
 * @returns Current blockchain status
 */
export async function getBlockchainStatus(): Promise<ActionResult<BlockchainStatus>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS;

    if (!contractAddress) {
      return {
        success: false,
        error: 'Contract address not configured',
      };
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const network = await provider.getNetwork();
    const blockNumber = await provider.getBlockNumber();

    return {
      success: true,
      data: {
        connected: true,
        network: network.name,
        contractAddress,
        blockNumber,
      },
    };
  } catch (error) {
    console.error('Get blockchain status error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get blockchain status',
    };
  }
}

/**
 * Get audit logs from blockchain
 * @param filters - Filter parameters
 * @returns Array of audit logs
 */
export async function getAuditLogs(filters?: z.infer<typeof getAuditLogsSchema>): Promise<ActionResult<AuditLog[]>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedFilters = getAuditLogsSchema.parse(filters || {});

    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS;

    if (!contractAddress) {
      return {
        success: false,
        error: 'Contract address not configured',
      };
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, LELINK_ABI, provider);

    // Build event filters
    const eventFilters: any[] = [];

    // RecordCreated events
    const createdFilter = contract.filters.RecordCreated(
      validatedFilters.recordId || null,
      null,
      validatedFilters.patientAddress || null
    );
    eventFilters.push({ filter: createdFilter, type: 'created' });

    // RecordShared events
    const sharedFilter = contract.filters.RecordShared(
      validatedFilters.recordId || null,
      validatedFilters.patientAddress || null,
      null
    );
    eventFilters.push({ filter: sharedFilter, type: 'shared' });

    // AccessRevoked events
    const revokedFilter = contract.filters.AccessRevoked(
      validatedFilters.recordId || null,
      validatedFilters.patientAddress || null,
      null
    );
    eventFilters.push({ filter: revokedFilter, type: 'revoked' });

    // Query events
    const logs: AuditLog[] = [];

    for (const { filter, type } of eventFilters) {
      const events = await contract.queryFilter(filter, validatedFilters.fromBlock, validatedFilters.toBlock);

      for (const event of events) {
        const block = await event.getBlock();
        const log: AuditLog = {
          type,
          recordId: event.args![0],
          owner: type === 'created' ? event.args![2] : event.args![1],
          timestamp: new Date(block.timestamp * 1000).toISOString(),
          transactionHash: event.transactionHash,
          blockNumber: event.blockNumber,
        };

        if (type === 'created') {
          log.hash = event.args![1];
        } else if (type === 'shared') {
          log.sharedWith = event.args![2];
        } else if (type === 'revoked') {
          log.revokedFrom = event.args![2];
        }

        logs.push(log);
      }
    }

    // Sort by timestamp descending
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      success: true,
      data: logs,
    };
  } catch (error) {
    console.error('Get audit logs error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get audit logs',
    };
  }
}

/**
 * Verify a record's integrity on blockchain
 * @param recordId - Record ID to verify
 * @param expectedHash - Optional expected hash to compare
 * @returns Verification result
 */
export async function verifyRecordIntegrity(
  recordId: string,
  expectedHash?: string
): Promise<ActionResult<{ verified: boolean; hash: string; onChain: boolean }>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Validate input
    const validatedInput = verifyRecordSchema.parse({ recordId, expectedHash });

    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS;

    if (!contractAddress) {
      return {
        success: false,
        error: 'Contract address not configured',
      };
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, LELINK_ABI, provider);

    // Get record hash from blockchain
    try {
      const onChainHash = await contract.getRecordHash(validatedInput.recordId);
      const hashString = onChainHash.toString();

      // Check if record exists on chain (non-zero hash)
      const onChain = hashString !== '0x0000000000000000000000000000000000000000000000000000000000000000';

      // Verify against expected hash if provided
      const verified = !validatedInput.expectedHash || hashString === validatedInput.expectedHash;

      return {
        success: true,
        data: {
          verified,
          hash: hashString,
          onChain,
        },
      };
    } catch (contractError) {
      // Record not found on blockchain
      return {
        success: true,
        data: {
          verified: false,
          hash: '0x0000000000000000000000000000000000000000000000000000000000000000',
          onChain: false,
        },
      };
    }
  } catch (error) {
    console.error('Verify record integrity error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify record',
    };
  }
}

/**
 * Get access permissions for a record
 * @param recordId - Record ID
 * @param userAddress - User address to check
 * @returns Access permission status
 */
export async function checkRecordAccess(
  recordId: string,
  userAddress?: string
): Promise<ActionResult<{ hasAccess: boolean; address: string }>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Use current user's address if not provided
    const checkAddress = userAddress || session.user.id;

    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';
    const contractAddress = process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS;

    if (!contractAddress) {
      return {
        success: false,
        error: 'Contract address not configured',
      };
    }

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const contract = new ethers.Contract(contractAddress, LELINK_ABI, provider);

    // Check access
    const hasAccess = await contract.hasAccess(recordId, checkAddress);

    return {
      success: true,
      data: {
        hasAccess,
        address: checkAddress,
      },
    };
  } catch (error) {
    console.error('Check record access error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check access',
    };
  }
}

/**
 * Get blockchain transaction details
 * @param transactionHash - Transaction hash
 * @returns Transaction details
 */
export async function getTransactionDetails(transactionHash: string): Promise<ActionResult<any>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const rpcUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC_URL || 'http://localhost:8545';

    // Connect to blockchain
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Get transaction
    const tx = await provider.getTransaction(transactionHash);
    if (!tx) {
      return {
        success: false,
        error: 'Transaction not found',
      };
    }

    // Get transaction receipt
    const receipt = await provider.getTransactionReceipt(transactionHash);

    // Get block details
    const block = await provider.getBlock(tx.blockNumber!);

    return {
      success: true,
      data: {
        hash: tx.hash,
        from: tx.from,
        to: tx.to,
        value: ethers.formatEther(tx.value),
        gasPrice: ethers.formatUnits(tx.gasPrice!, 'gwei'),
        gasUsed: receipt ? receipt.gasUsed.toString() : null,
        blockNumber: tx.blockNumber,
        timestamp: block ? new Date(block.timestamp * 1000).toISOString() : null,
        status: receipt ? receipt.status === 1 : null,
      },
    };
  } catch (error) {
    console.error('Get transaction details error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get transaction details',
    };
  }
}

/**
 * Export blockchain audit trail
 * @param recordId - Optional record ID to filter
 * @param format - Export format
 * @returns Export data or URL
 */
export async function exportAuditTrail(
  recordId?: string,
  format: 'csv' | 'json' = 'json'
): Promise<ActionResult<{ url?: string; data?: any }>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Get audit logs
    const logsResult = await getAuditLogs({ recordId, fromBlock: 0, toBlock: 'latest' });
    if (!logsResult.success) {
      return logsResult;
    }

    const logs = logsResult.data || [];

    if (format === 'json') {
      return {
        success: true,
        data: {
          data: logs,
        },
      };
    }

    // Convert to CSV
    const headers = [
      'Type',
      'Record ID',
      'Hash',
      'Owner',
      'Shared With',
      'Revoked From',
      'Timestamp',
      'Transaction Hash',
      'Block Number',
    ];
    const rows = logs.map((log) => [
      log.type,
      log.recordId,
      log.hash || '',
      log.owner,
      log.sharedWith || '',
      log.revokedFrom || '',
      log.timestamp,
      log.transactionHash,
      log.blockNumber,
    ]);

    const csv = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${cell}"`).join(','))].join('\n');

    // In a real implementation, this would save to a file and return URL
    return {
      success: true,
      data: {
        data: csv,
        url: `/api/export/audit-trail/${recordId || 'all'}.csv`,
      },
    };
  } catch (error) {
    console.error('Export audit trail error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export audit trail',
    };
  }
}
