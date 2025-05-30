/**
 * LeLink Contract Mutation Functions
 * Contains all write functions for interacting with the LeLink contract
 */

import { getConfig, type LeLinkConfig } from '../config';
import {
  validateAndThrow,
  createRecordSchema,
  updateRecordSchema,
  deleteRecordSchema,
  forceDeleteRecordSchema,
  logAccessSchema,
  logShareAccessSchema,
  logRevokeAccessSchema,
  transferOwnershipSchema,
  batchCreateRecordsSchema,
  type CreateRecordInput,
  type UpdateRecordInput,
  type DeleteRecordInput,
  type ForceDeleteRecordInput,
  type LogAccessInput,
  type LogShareAccessInput,
  type LogRevokeAccessInput,
  type TransferOwnershipInput,
  type BatchCreateRecordsInput,
} from './schema';
import type { TransactionPreparation } from './types';

/**
 * Get the contract configuration with optional overrides
 */
const getContractConfig = (config?: Partial<LeLinkConfig>): LeLinkConfig => {
  return { ...getConfig(), ...config };
};

/**
 * Prepare createRecord transaction
 * @param input - Create record input parameters
 * @param config - Optional contract configuration
 */
export const prepareCreateRecord = async (
  input: CreateRecordInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: CreateRecordInput = validateAndThrow(input, createRecordSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'createRecord',
        args: [validatedInput.resourceId, validatedInput.dataHash, validatedInput.owner] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing createRecord transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare updateRecord transaction
 * @param input - Update record input parameters
 * @param config - Optional contract configuration
 */
export const prepareUpdateRecord = async (
  input: UpdateRecordInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: UpdateRecordInput = validateAndThrow(input, updateRecordSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'updateRecord',
        args: [validatedInput.resourceId, validatedInput.newDataHash] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing updateRecord transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare deleteRecord transaction
 * @param input - Delete record input parameters
 * @param config - Optional contract configuration
 */
export const prepareDeleteRecord = async (
  input: DeleteRecordInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: DeleteRecordInput = validateAndThrow(input, deleteRecordSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'deleteRecord',
        args: [validatedInput.resourceId] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing deleteRecord transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare forceDeleteRecord transaction
 * @param input - Force delete record input parameters
 * @param config - Optional contract configuration
 */
export const prepareForceDeleteRecord = async (
  input: ForceDeleteRecordInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: ForceDeleteRecordInput = validateAndThrow(input, forceDeleteRecordSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'forceDeleteRecord',
        args: [validatedInput.resourceId, validatedInput.owner] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing forceDeleteRecord transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare logAccess transaction
 * @param input - Log access input parameters
 * @param config - Optional contract configuration
 */
export const prepareLogAccess = async (
  input: LogAccessInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: LogAccessInput = validateAndThrow(input, logAccessSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'logAccess',
        args: [validatedInput.resourceId, validatedInput.owner] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing logAccess transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare logShareAccess transaction
 * @param input - Log share access input parameters
 * @param config - Optional contract configuration
 */
export const prepareLogShareAccess = async (
  input: LogShareAccessInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: LogShareAccessInput = validateAndThrow(input, logShareAccessSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'logShareAccess',
        args: [validatedInput.resourceId, validatedInput.owner, validatedInput.recipient] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing logShareAccess transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare logRevokeAccess transaction
 * @param input - Log revoke access input parameters
 * @param config - Optional contract configuration
 */
export const prepareLogRevokeAccess = async (
  input: LogRevokeAccessInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: LogRevokeAccessInput = validateAndThrow(input, logRevokeAccessSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'logRevokeAccess',
        args: [validatedInput.resourceId, validatedInput.owner, validatedInput.userToRevoke] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing logRevokeAccess transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare transferOwnership transaction
 * @param input - Transfer ownership input parameters
 * @param config - Optional contract configuration
 */
export const prepareTransferOwnership = async (
  input: TransferOwnershipInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation> => {
  try {
    // Validate input using Zod schema
    const validatedInput: TransferOwnershipInput = validateAndThrow(input, transferOwnershipSchema);
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'transferOwnership',
        args: [validatedInput.newOwner] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing transferOwnership transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare renounceOwnership transaction
 * @param config - Optional contract configuration
 */
export const prepareRenounceOwnership = async (config?: Partial<LeLinkConfig>): Promise<TransactionPreparation> => {
  try {
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'renounceOwnership',
        args: [] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing renounceOwnership transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare pause transaction
 * @param config - Optional contract configuration
 */
export const preparePause = async (config?: Partial<LeLinkConfig>): Promise<TransactionPreparation> => {
  try {
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'pause',
        args: [] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing pause transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Prepare unpause transaction
 * @param config - Optional contract configuration
 */
export const prepareUnpause = async (config?: Partial<LeLinkConfig>): Promise<TransactionPreparation> => {
  try {
    const contractConfig = getContractConfig(config);

    return {
      success: true,
      transaction: {
        functionName: 'unpause',
        args: [] as const,
      },
    };
  } catch (error) {
    console.error('Error preparing unpause transaction:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to prepare transaction',
    };
  }
};

/**
 * Batch prepare multiple record creation transactions
 * @param inputs - Array of create record inputs
 * @param config - Optional contract configuration
 */
export const prepareBatchCreateRecords = async (
  inputs: BatchCreateRecordsInput,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation[]> => {
  try {
    // Validate the entire batch using Zod schema
    const validatedInputs: BatchCreateRecordsInput = validateAndThrow(inputs, batchCreateRecordsSchema);

    const preparations = await Promise.all(
      validatedInputs.map((input: CreateRecordInput) => prepareCreateRecord(input, config))
    );

    return preparations;
  } catch (error) {
    console.error('Error preparing batch create records:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to prepare batch create records');
  }
};

/**
 * Utility function to estimate gas for a transaction
 * Note: This would require additional setup with a public client
 * For now, returning a placeholder
 */
export const estimateGas = async (
  functionName: string,
  args: readonly unknown[],
  config?: Partial<LeLinkConfig>
): Promise<bigint> => {
  // TODO: Implement gas estimation using viem publicClient
  // This would require importing and setting up the public client
  console.warn('Gas estimation not yet implemented');
  return BigInt(0);
};

/**
 * Get contract address for the current configuration
 * @param config - Optional contract configuration
 */
export const getContractAddress = (config?: Partial<LeLinkConfig>): `0x${string}` => {
  const contractConfig = getContractConfig(config);
  return contractConfig.contractAddress;
};

/**
 * Utility function to prepare multiple transactions efficiently
 * @param transactions - Array of transaction preparation functions
 * @param config - Optional contract configuration
 */
export const prepareBatchTransactions = async <T>(
  transactions: Array<() => Promise<TransactionPreparation>>,
  config?: Partial<LeLinkConfig>
): Promise<TransactionPreparation[]> => {
  try {
    const preparations = await Promise.all(transactions.map((tx) => tx()));
    return preparations;
  } catch (error) {
    console.error('Error preparing batch transactions:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to prepare batch transactions');
  }
};

/**
 * Validate transaction preparation result
 * @param preparation - Transaction preparation to validate
 */
export const validateTransactionPreparation = (preparation: TransactionPreparation): void => {
  if (!preparation.success && !preparation.error) {
    throw new Error('Invalid transaction preparation: must have either success=true or error message');
  }

  if (preparation.success && !preparation.transaction) {
    throw new Error('Invalid transaction preparation: successful preparation must include transaction data');
  }

  if (preparation.success && preparation.transaction) {
    const { functionName, args } = preparation.transaction;
    if (!functionName || typeof functionName !== 'string') {
      throw new Error('Invalid transaction preparation: functionName must be a non-empty string');
    }

    if (!Array.isArray(args)) {
      throw new Error('Invalid transaction preparation: args must be an array');
    }
  }
};
