/**
 * LeLink Contract React Hooks
 * Comprehensive hooks for interacting with the LeLink smart contract
 * Following the same pattern as DocuVault implementation
 */

// Note: These imports will need to be adjusted based on your actual setup
// You'll need to install these dependencies: @tanstack/react-query, wagmi, viem

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// import { useWalletClient, usePublicClient } from 'wagmi';
// import { type WalletClient, type PublicClient, type Account } from 'viem';
import { LELINK_ABI } from '../abi/lelink.abi';
import { getConfig, type LeLinkConfig } from '../config';
// import { useToast } from './use-toast'; // You'll need to implement this or use your toast library

import {
  getRecord,
  getRecordCount,
  getRecordCreator,
  getRecordHash,
  getRecordId,
  recordExists,
  getOwner,
  isPaused,
  getMultipleRecords,
  checkMultipleRecordsExistence,
  getContractInfo,
} from '../actions/query';

import {
  prepareCreateRecord,
  prepareUpdateRecord,
  prepareDeleteRecord,
  prepareForceDeleteRecord,
  prepareLogAccess,
  prepareLogShareAccess,
  prepareLogRevokeAccess,
  prepareTransferOwnership,
  prepareRenounceOwnership,
  preparePause,
  prepareUnpause,
  prepareBatchCreateRecords,
} from '../actions/mutations';

import type {
  CreateRecordInput,
  UpdateRecordInput,
  DeleteRecordInput,
  ForceDeleteRecordInput,
  LogAccessInput,
  LogShareAccessInput,
  LogRevokeAccessInput,
  TransferOwnershipInput,
} from '../actions/schema';

import type { TransactionPreparation, LeRecordInfo } from '../actions/types';

/**
 * Type for transaction response
 */
type TransactionResponse = {
  success: boolean;
  hash?: `0x${string}`;
  error?: string;
};

/**
 * Process a transaction with the wallet client
 * Note: This function will need to be implemented when you have wagmi/viem setup
 */
const executeTransaction = async (
  walletClient: any, // WalletClient
  publicClient: any, // PublicClient
  transaction: TransactionPreparation,
  account: any // Account
): Promise<TransactionResponse> => {
  try {
    if (!transaction.success || !transaction.transaction) {
      throw new Error(transaction.error || 'Invalid transaction preparation');
    }

    const config = getConfig();

    // Simulate the contract call first
    const { request } = await publicClient.simulateContract({
      address: config.contractAddress,
      abi: LELINK_ABI,
      functionName: transaction.transaction.functionName,
      args: transaction.transaction.args,
      account: account.address,
    });

    // Execute the transaction
    const hash = await walletClient.writeContract(request);

    return {
      success: true,
      hash,
    };
  } catch (error) {
    console.error('Error executing transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown transaction error',
    };
  }
};

/**
 * Query keys for LeLink contract
 */
export const LELINK_KEYS = {
  all: ['lelink'] as const,
  record: {
    info: (resourceId?: string, owner?: string) => [...LELINK_KEYS.all, 'record', 'info', resourceId, owner] as const,
    creator: (resourceId?: string, owner?: string) =>
      [...LELINK_KEYS.all, 'record', 'creator', resourceId, owner] as const,
    hash: (resourceId?: string, owner?: string) => [...LELINK_KEYS.all, 'record', 'hash', resourceId, owner] as const,
    id: (resourceId?: string, owner?: string) => [...LELINK_KEYS.all, 'record', 'id', resourceId, owner] as const,
    exists: (resourceId?: string, owner?: string) =>
      [...LELINK_KEYS.all, 'record', 'exists', resourceId, owner] as const,
  },
  contract: {
    count: () => [...LELINK_KEYS.all, 'contract', 'count'] as const,
    owner: () => [...LELINK_KEYS.all, 'contract', 'owner'] as const,
    paused: () => [...LELINK_KEYS.all, 'contract', 'paused'] as const,
    info: () => [...LELINK_KEYS.all, 'contract', 'info'] as const,
  },
  batch: {
    records: (recordKeys?: string) => [...LELINK_KEYS.all, 'batch', 'records', recordKeys] as const,
    existence: (recordKeys?: string) => [...LELINK_KEYS.all, 'batch', 'existence', recordKeys] as const,
  },
} as const;

/**
 * Record information interface for UI
 */
export interface RecordInfo {
  resourceId: string;
  owner: `0x${string}`;
  creator: `0x${string}`;
  dataHash: `0x${string}`;
  createdAt: bigint;
  lastModified: bigint;
}

/**
 * Hook to get record information
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecord(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.record.info(resourceId, owner),
    queryFn: async () => {
      if (!resourceId || !owner) {
        throw new Error('Resource ID and owner are required');
      }
      return await getRecord(resourceId, owner as `0x${string}`, config);
    },
    enabled: !!resourceId && !!owner,
  });
}

/**
 * Hook to get record creator
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecordCreator(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.record.creator(resourceId, owner),
    queryFn: async () => {
      if (!resourceId || !owner) {
        throw new Error('Resource ID and owner are required');
      }
      return await getRecordCreator(resourceId, owner as `0x${string}`, config);
    },
    enabled: !!resourceId && !!owner,
  });
}

/**
 * Hook to get record hash
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecordHash(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.record.hash(resourceId, owner),
    queryFn: async () => {
      if (!resourceId || !owner) {
        throw new Error('Resource ID and owner are required');
      }
      return await getRecordHash(resourceId, owner as `0x${string}`, config);
    },
    enabled: !!resourceId && !!owner,
  });
}

/**
 * Hook to get record ID
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecordId(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.record.id(resourceId, owner),
    queryFn: async () => {
      if (!resourceId || !owner) {
        throw new Error('Resource ID and owner are required');
      }
      return await getRecordId(resourceId, owner as `0x${string}`, config);
    },
    enabled: !!resourceId && !!owner,
  });
}

/**
 * Hook to check if record exists
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecordExists(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.record.exists(resourceId, owner),
    queryFn: async () => {
      if (!resourceId || !owner) {
        throw new Error('Resource ID and owner are required');
      }
      return await recordExists(resourceId, owner as `0x${string}`, config);
    },
    enabled: !!resourceId && !!owner,
  });
}

/**
 * Hook to get total record count
 * @param config - Optional contract configuration
 */
export function useRecordCount(config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.contract.count(),
    queryFn: () => getRecordCount(config),
  });
}

/**
 * Hook to get contract owner
 * @param config - Optional contract configuration
 */
export function useContractOwner(config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.contract.owner(),
    queryFn: () => getOwner(config),
  });
}

/**
 * Hook to check if contract is paused
 * @param config - Optional contract configuration
 */
export function useIsPaused(config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.contract.paused(),
    queryFn: () => isPaused(config),
  });
}

/**
 * Hook to get contract information summary
 * @param config - Optional contract configuration
 */
export function useContractInfo(config?: Partial<LeLinkConfig>) {
  return useQuery({
    queryKey: LELINK_KEYS.contract.info(),
    queryFn: () => getContractInfo(config),
  });
}

/**
 * Hook to get multiple records
 * @param records - Array of {resourceId, owner} pairs
 * @param config - Optional contract configuration
 */
export function useMultipleRecords(
  records?: Array<{ resourceId: string; owner: string }>,
  config?: Partial<LeLinkConfig>
) {
  const recordsKey = records?.map((r) => `${r.resourceId}-${r.owner}`).join(',');

  return useQuery({
    queryKey: LELINK_KEYS.batch.records(recordsKey),
    queryFn: async () => {
      if (!records || records.length === 0) {
        throw new Error('Records array is required');
      }
      const typedRecords = records.map((r) => ({
        resourceId: r.resourceId,
        owner: r.owner as `0x${string}`,
      }));
      return await getMultipleRecords(typedRecords, config);
    },
    enabled: !!records && records.length > 0,
  });
}

/**
 * Hook to check multiple records existence
 * @param records - Array of {resourceId, owner} pairs
 * @param config - Optional contract configuration
 */
export function useMultipleRecordsExistence(
  records?: Array<{ resourceId: string; owner: string }>,
  config?: Partial<LeLinkConfig>
) {
  const recordsKey = records?.map((r) => `${r.resourceId}-${r.owner}`).join(',');

  return useQuery({
    queryKey: LELINK_KEYS.batch.existence(recordsKey),
    queryFn: async () => {
      if (!records || records.length === 0) {
        throw new Error('Records array is required');
      }
      const typedRecords = records.map((r) => ({
        resourceId: r.resourceId,
        owner: r.owner as `0x${string}`,
      }));
      return await checkMultipleRecordsExistence(typedRecords, config);
    },
    enabled: !!records && records.length > 0,
  });
}

/**
 * Hook to create a record
 * @param config - Optional contract configuration
 */
export function useCreateRecord(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();
  // const { data: walletClient } = useWalletClient();
  // const publicClient = usePublicClient();
  // const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: CreateRecordInput) => {
      // Note: Uncomment when wagmi is setup
      // if (!walletClient || !publicClient) {
      //   throw new Error('Wallet not connected');
      // }

      try {
        // const account = walletClient.account;
        // if (!account) {
        //   throw new Error('No account found in wallet client');
        // }

        const preparation = await prepareCreateRecord(input, config);

        // Note: Uncomment when wagmi is setup
        // return executeTransaction(walletClient, publicClient, preparation, account);

        // Temporary return for now
        return {
          success: preparation.success,
          error: preparation.error,
        };
      } catch (error) {
        console.error('Error preparing transaction:', error);
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    },
    onSuccess: (result: any, variables: CreateRecordInput) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.info(variables.resourceId, variables.owner),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.exists(variables.resourceId, variables.owner),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.count(),
        });

        // Note: Uncomment when toast is available
        // toast.success('Record created successfully', {
        //   description: `Record ${variables.resourceId} has been created`,
        // });

        console.log('Record created successfully:', variables.resourceId);
      } else if (result.error) {
        // toast.error('Failed to create record', {
        //   description: result.error,
        // });
        console.error('Failed to create record:', result.error);
      }
    },
    onError: (error: any) => {
      // toast.error('Failed to create record', {
      //   description: error instanceof Error ? error.message : 'Unknown error occurred',
      // });
      console.error('Failed to create record:', error);
    },
  });
}

/**
 * Hook to update a record
 * @param config - Optional contract configuration
 */
export function useUpdateRecord(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateRecordInput) => {
      const preparation = await prepareUpdateRecord(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: UpdateRecordInput) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.info(variables.resourceId, undefined),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.hash(variables.resourceId, undefined),
        });

        console.log('Record updated successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to delete a record
 * @param config - Optional contract configuration
 */
export function useDeleteRecord(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteRecordInput) => {
      const preparation = await prepareDeleteRecord(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: DeleteRecordInput) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.info(variables.resourceId, undefined),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.exists(variables.resourceId, undefined),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.count(),
        });

        console.log('Record deleted successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to force delete a record (admin only)
 * @param config - Optional contract configuration
 */
export function useForceDeleteRecord(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ForceDeleteRecordInput) => {
      const preparation = await prepareForceDeleteRecord(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: ForceDeleteRecordInput) => {
      if (result.success) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.info(variables.resourceId, variables.owner),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.record.exists(variables.resourceId, variables.owner),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.count(),
        });

        console.log('Record force deleted successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to log access to a record
 * @param config - Optional contract configuration
 */
export function useLogAccess(config?: Partial<LeLinkConfig>) {
  return useMutation({
    mutationFn: async (input: LogAccessInput) => {
      const preparation = await prepareLogAccess(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: LogAccessInput) => {
      if (result.success) {
        console.log('Access logged successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to log share access
 * @param config - Optional contract configuration
 */
export function useLogShareAccess(config?: Partial<LeLinkConfig>) {
  return useMutation({
    mutationFn: async (input: LogShareAccessInput) => {
      const preparation = await prepareLogShareAccess(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: LogShareAccessInput) => {
      if (result.success) {
        console.log('Share access logged successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to log revoke access
 * @param config - Optional contract configuration
 */
export function useLogRevokeAccess(config?: Partial<LeLinkConfig>) {
  return useMutation({
    mutationFn: async (input: LogRevokeAccessInput) => {
      const preparation = await prepareLogRevokeAccess(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any, variables: LogRevokeAccessInput) => {
      if (result.success) {
        console.log('Revoke access logged successfully:', variables.resourceId);
      }
    },
  });
}

/**
 * Hook to transfer ownership
 * @param config - Optional contract configuration
 */
export function useTransferOwnership(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: TransferOwnershipInput) => {
      const preparation = await prepareTransferOwnership(input, config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.owner(),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.info(),
        });

        console.log('Ownership transferred successfully');
      }
    },
  });
}

/**
 * Hook to renounce ownership
 * @param config - Optional contract configuration
 */
export function useRenounceOwnership(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const preparation = await prepareRenounceOwnership(config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.owner(),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.info(),
        });

        console.log('Ownership renounced successfully');
      }
    },
  });
}

/**
 * Hook to pause the contract
 * @param config - Optional contract configuration
 */
export function usePauseContract(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const preparation = await preparePause(config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.paused(),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.info(),
        });

        console.log('Contract paused successfully');
      }
    },
  });
}

/**
 * Hook to unpause the contract
 * @param config - Optional contract configuration
 */
export function useUnpauseContract(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const preparation = await prepareUnpause(config);
      return {
        success: preparation.success,
        error: preparation.error,
      };
    },
    onSuccess: (result: any) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.paused(),
        });
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.info(),
        });

        console.log('Contract unpaused successfully');
      }
    },
  });
}

/**
 * Hook to create multiple records in batch
 * @param config - Optional contract configuration
 */
export function useBatchCreateRecords(config?: Partial<LeLinkConfig>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inputs: CreateRecordInput[]) => {
      const preparations = await prepareBatchCreateRecords(inputs, config);
      return preparations.map((prep) => ({
        success: prep.success,
        error: prep.error,
      }));
    },
    onSuccess: (results: any, variables: CreateRecordInput[]) => {
      const successCount = results.filter((r: any) => r.success).length;
      if (successCount > 0) {
        // Invalidate relevant queries
        queryClient.invalidateQueries({
          queryKey: LELINK_KEYS.contract.count(),
        });

        // Invalidate individual record queries
        variables.forEach((input) => {
          queryClient.invalidateQueries({
            queryKey: LELINK_KEYS.record.info(input.resourceId, input.owner),
          });
          queryClient.invalidateQueries({
            queryKey: LELINK_KEYS.record.exists(input.resourceId, input.owner),
          });
        });

        console.log(`${successCount} records created successfully`);
      }
    },
  });
}

/**
 * Hook to get comprehensive record information with all related data
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export function useRecordDetails(resourceId?: string, owner?: string, config?: Partial<LeLinkConfig>) {
  const recordQuery = useRecord(resourceId, owner, config);
  const existsQuery = useRecordExists(resourceId, owner, config);
  const recordIdQuery = useRecordId(resourceId, owner, config);

  return {
    data: {
      record: recordQuery.data,
      exists: existsQuery.data?.exists,
      recordId: recordIdQuery.data?.recordId,
    },
    isLoading: recordQuery.isLoading || existsQuery.isLoading || recordIdQuery.isLoading,
    isError: recordQuery.isError || existsQuery.isError || recordIdQuery.isError,
    error: recordQuery.error || existsQuery.error || recordIdQuery.error,
  };
}
