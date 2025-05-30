/**
 * LeLink Contract Query Functions
 * Contains all read-only functions for querying the LeLink contract
 */

import { createPublicClient, http, type PublicClient } from 'viem';
import { LELINK_ABI } from '../abi/lelink.abi';
import { getConfig, type LeLinkConfig } from '../config';
import type {
  GetRecordResponse,
  GetRecordCountResponse,
  GetRecordCreatorResponse,
  GetRecordHashResponse,
  GetRecordIdResponse,
  RecordExistsResponse,
  GetOwnerResponse,
  IsPausedResponse,
  ContractConfig,
} from './types';

/**
 * Create a public client for contract interactions
 */
const createClient = (config?: Partial<LeLinkConfig>): PublicClient => {
  const mergedConfig = { ...getConfig(), ...config };

  return createPublicClient({
    transport: http(mergedConfig.rpcUrl),
  });
};

/**
 * Get the contract configuration with optional overrides
 */
const getContractConfig = (config?: Partial<LeLinkConfig>): LeLinkConfig => {
  return { ...getConfig(), ...config };
};

/**
 * Get record information from the contract
 * @param resourceId - The resource identifier
 * @param owner - The owner address
 * @param config - Optional contract configuration
 */
export const getRecord = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<GetRecordResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'getRecord',
      args: [resourceId, owner],
    });

    const [creator, dataHash, createdAt, lastModified] = result as [`0x${string}`, `0x${string}`, bigint, bigint];

    return {
      creator,
      dataHash,
      createdAt,
      lastModified,
    };
  } catch (error) {
    console.error('Error getting record:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get record');
  }
};

/**
 * Get total record count from the contract
 * @param config - Optional contract configuration
 */
export const getRecordCount = async (config?: Partial<LeLinkConfig>): Promise<GetRecordCountResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'getRecordCount',
      args: [],
    });

    return {
      count: result as bigint,
    };
  } catch (error) {
    console.error('Error getting record count:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get record count');
  }
};

/**
 * Get record creator address
 * @param resourceId - The resource identifier
 * @param owner - The owner address
 * @param config - Optional contract configuration
 */
export const getRecordCreator = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<GetRecordCreatorResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'getRecordCreator',
      args: [resourceId, owner],
    });

    return {
      creator: result as `0x${string}`,
    };
  } catch (error) {
    console.error('Error getting record creator:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get record creator');
  }
};

/**
 * Get record data hash
 * @param resourceId - The resource identifier
 * @param owner - The owner address
 * @param config - Optional contract configuration
 */
export const getRecordHash = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<GetRecordHashResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'getRecordHash',
      args: [resourceId, owner],
    });

    return {
      dataHash: result as `0x${string}`,
    };
  } catch (error) {
    console.error('Error getting record hash:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get record hash');
  }
};

/**
 * Generate record ID from resource ID and owner
 * @param resourceId - The resource identifier
 * @param owner - The owner address
 * @param config - Optional contract configuration
 */
export const getRecordId = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<GetRecordIdResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'getRecordId',
      args: [resourceId, owner],
    });

    return {
      recordId: result as `0x${string}`,
    };
  } catch (error) {
    console.error('Error getting record ID:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get record ID');
  }
};

/**
 * Check if a record exists
 * @param resourceId - The resource identifier
 * @param owner - The owner address
 * @param config - Optional contract configuration
 */
export const recordExists = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<RecordExistsResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'recordExists',
      args: [resourceId, owner],
    });

    return {
      exists: result as boolean,
    };
  } catch (error) {
    console.error('Error checking record existence:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check record existence');
  }
};

/**
 * Get contract owner
 * @param config - Optional contract configuration
 */
export const getOwner = async (config?: Partial<LeLinkConfig>): Promise<GetOwnerResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'owner',
      args: [],
    });

    return {
      owner: result as `0x${string}`,
    };
  } catch (error) {
    console.error('Error getting owner:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get owner');
  }
};

/**
 * Check if contract is paused
 * @param config - Optional contract configuration
 */
export const isPaused = async (config?: Partial<LeLinkConfig>): Promise<IsPausedResponse> => {
  try {
    const contractConfig = getContractConfig(config);
    const client = createClient(config);

    const result = await client.readContract({
      address: contractConfig.contractAddress,
      abi: LELINK_ABI,
      functionName: 'paused',
      args: [],
    });

    return {
      paused: result as boolean,
    };
  } catch (error) {
    console.error('Error checking pause status:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check pause status');
  }
};

/**
 * Utility function to get multiple records efficiently
 * @param records - Array of {resourceId, owner} pairs
 * @param config - Optional contract configuration
 */
export const getMultipleRecords = async (
  records: Array<{ resourceId: string; owner: `0x${string}` }>,
  config?: Partial<LeLinkConfig>
): Promise<Array<GetRecordResponse & { resourceId: string; owner: `0x${string}` }>> => {
  try {
    const promises = records.map(async ({ resourceId, owner }) => {
      const recordData = await getRecord(resourceId, owner, config);
      return {
        ...recordData,
        resourceId,
        owner,
      };
    });

    return await Promise.all(promises);
  } catch (error) {
    console.error('Error getting multiple records:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get multiple records');
  }
};

/**
 * Utility function to check multiple record existence
 * @param records - Array of {resourceId, owner} pairs
 * @param config - Optional contract configuration
 */
export const checkMultipleRecordsExistence = async (
  records: Array<{ resourceId: string; owner: `0x${string}` }>,
  config?: Partial<LeLinkConfig>
): Promise<Array<RecordExistsResponse & { resourceId: string; owner: `0x${string}` }>> => {
  try {
    const promises = records.map(async ({ resourceId, owner }) => {
      const existsData = await recordExists(resourceId, owner, config);
      return {
        ...existsData,
        resourceId,
        owner,
      };
    });

    return await Promise.all(promises);
  } catch (error) {
    console.error('Error checking multiple records existence:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to check multiple records existence');
  }
};

/**
 * Get contract information summary
 * @param config - Optional contract configuration
 */
export const getContractInfo = async (
  config?: Partial<LeLinkConfig>
): Promise<{
  owner: `0x${string}`;
  paused: boolean;
  recordCount: bigint;
  contractAddress: `0x${string}`;
  chainId: number;
  networkName?: string;
}> => {
  try {
    const contractConfig = getContractConfig(config);

    const [ownerResult, pausedResult, countResult] = await Promise.all([
      getOwner(config),
      isPaused(config),
      getRecordCount(config),
    ]);

    return {
      owner: ownerResult.owner,
      paused: pausedResult.paused,
      recordCount: countResult.count,
      contractAddress: contractConfig.contractAddress,
      chainId: contractConfig.chainId,
      networkName: contractConfig.networkName,
    };
  } catch (error) {
    console.error('Error getting contract info:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to get contract info');
  }
};

/**
 * Utility function to validate record parameters before queries
 * @param resourceId - Resource identifier to validate
 * @param owner - Owner address to validate
 */
export const validateRecordParams = (resourceId: string, owner: `0x${string}`): void => {
  if (!resourceId || resourceId.trim().length === 0) {
    throw new Error('Resource ID cannot be empty');
  }

  if (!owner || !/^0x[a-fA-F0-9]{40}$/.test(owner)) {
    throw new Error('Invalid owner address');
  }

  if (owner === '0x0000000000000000000000000000000000000000') {
    console.warn('Using zero address as owner - this may not be intended');
  }
};

/**
 * Safe wrapper for record queries with validation
 * @param resourceId - Resource identifier
 * @param owner - Owner address
 * @param config - Optional contract configuration
 */
export const getRecordSafe = async (
  resourceId: string,
  owner: `0x${string}`,
  config?: Partial<LeLinkConfig>
): Promise<{ success: true; data: GetRecordResponse } | { success: false; error: string }> => {
  try {
    validateRecordParams(resourceId, owner);
    const data = await getRecord(resourceId, owner, config);
    return { success: true, data };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};
