/**
 * LeLink React Integration - Main Export File
 *
 * This file exports all the main functionality from the LeLink React integration,
 * providing a single entry point for importing hooks, types, and utilities.
 */

import { getConfig } from './config';

// Export all hooks
export * from './hooks/use-lelink';

// Export all types and interfaces
export type {
  CreateRecordInput,
  UpdateRecordInput,
  DeleteRecordInput,
  ForceDeleteRecordInput,
  LogAccessInput,
  LogShareAccessInput,
  LogRevokeAccessInput,
  TransferOwnershipInput,
  GetRecordResponse,
  GetRecordCountResponse,
  GetRecordCreatorResponse,
  GetRecordHashResponse,
  GetRecordIdResponse,
  RecordExistsResponse,
  GetOwnerResponse,
  IsPausedResponse,
  LeRecordInfo,
  TransactionPreparation,
  TransactionResponse,
  ContractConfig,
  DataCreatedEvent,
  DataUpdatedEvent,
  DataDeletedEvent,
  DataAccessedEvent,
  DataSharedEvent,
  DataAccessRevokedEvent,
  LeErrorType,
} from './actions/types';

// Export configuration and utilities
export {
  getConfig,
  validateConfig,
  getBlockExplorerUrl,
  formatAddress,
  formatTxHash,
  isValidAddress,
  getNetworkName,
  NETWORK_CONFIGS,
  DEPLOYMENT_INFO,
} from './config';

export type { LeLinkConfig } from './config';

// Export validation schemas (if needed for custom validation)
export {
  validateAndThrow,
  createRecordSchema,
  updateRecordSchema,
  deleteRecordSchema,
  forceDeleteRecordSchema,
  logAccessSchema,
  logShareAccessSchema,
  logRevokeAccessSchema,
  transferOwnershipSchema,
  formatValidationErrors,
} from './actions/schema';

// Export query functions (for advanced usage)
export {
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
} from './actions/query';

// Export mutation preparation functions (for advanced usage)
export {
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
  getContractAddress,
} from './actions/mutations';

// Export ABI
export { LELINK_ABI } from './abi/lelink.abi';

// Export query keys for manual query management
export { LELINK_KEYS } from './hooks/use-lelink';

/**
 * Re-export default config for convenience
 */
export { default as defaultConfig } from './config';

/**
 * Version information
 */
export const LELINK_REACT_VERSION = '1.0.0';

/**
 * Utility to check if the LeLink integration is properly configured
 */
export const checkLeLinkSetup = (): {
  isConfigured: boolean;
  issues: string[];
  recommendations: string[];
} => {
  const config = getConfig();
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check contract address
  if (config.contractAddress === '0x0000000000000000000000000000000000000000') {
    issues.push('Contract address is not set (using zero address)');
    recommendations.push('Update NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS in your .env file');
  }

  // Check RPC URL
  if (config.rpcUrl.includes('localhost') && typeof window !== 'undefined') {
    recommendations.push('Using localhost RPC - ensure local blockchain is running');
  }

  // Check if required environment variables are set
  if (!process.env.NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS) {
    recommendations.push('Set NEXT_PUBLIC_LELINK_CONTRACT_ADDRESS in your environment');
  }

  if (!process.env.NEXT_PUBLIC_CHAIN_ID) {
    recommendations.push('Set NEXT_PUBLIC_CHAIN_ID in your environment');
  }

  return {
    isConfigured: issues.length === 0,
    issues,
    recommendations,
  };
};

/**
 * Utility to get contract information for debugging
 */
export const getLeLinkInfo = () => {
  const config = getConfig();
  const setup = checkLeLinkSetup();

  return {
    version: LELINK_REACT_VERSION,
    config,
    setup,
    contractAddress: config.contractAddress,
    chainId: config.chainId,
    networkName: config.networkName,
  };
};
