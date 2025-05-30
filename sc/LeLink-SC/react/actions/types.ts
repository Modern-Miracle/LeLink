/**
 * LeLink Contract Types
 * Contains all input/output types for contract interactions
 */

/**
 * Base record information from the contract
 */
export interface LeRecordInfo {
  recordId: `0x${string}`;
  resourceId: string;
  owner: `0x${string}`;
  creator: `0x${string}`;
  dataHash: `0x${string}`;
  createdAt: bigint;
  lastModified: bigint;
}

/**
 * Input types for record management
 */
export interface CreateRecordInput {
  resourceId: string;
  dataHash: string;
  owner: `0x${string}`;
}

export interface UpdateRecordInput {
  resourceId: string;
  newDataHash: string;
}

export interface DeleteRecordInput {
  resourceId: string;
}

export interface ForceDeleteRecordInput {
  resourceId: string;
  owner: `0x${string}`;
}

/**
 * Input types for access management
 */
export interface LogAccessInput {
  resourceId: string;
  owner: `0x${string}`;
}

export interface LogShareAccessInput {
  resourceId: string;
  owner: `0x${string}`;
  recipient: `0x${string}`;
}

export interface LogRevokeAccessInput {
  resourceId: string;
  owner: `0x${string}`;
  userToRevoke: `0x${string}`;
}

/**
 * Input types for record queries
 */
export interface GetRecordInput {
  resourceId: string;
  owner: `0x${string}`;
}

export interface RecordExistsInput {
  resourceId: string;
  owner: `0x${string}`;
}

export interface GetRecordIdInput {
  resourceId: string;
  owner: `0x${string}`;
}

/**
 * Input types for ownership management
 */
export interface TransferOwnershipInput {
  newOwner: `0x${string}`;
}

/**
 * Output types for contract responses
 */
export interface GetRecordResponse {
  creator: `0x${string}`;
  dataHash: `0x${string}`;
  createdAt: bigint;
  lastModified: bigint;
}

export interface GetRecordCountResponse {
  count: bigint;
}

export interface GetRecordCreatorResponse {
  creator: `0x${string}`;
}

export interface GetRecordHashResponse {
  dataHash: `0x${string}`;
}

export interface GetRecordIdResponse {
  recordId: `0x${string}`;
}

export interface RecordExistsResponse {
  exists: boolean;
}

export interface GetOwnerResponse {
  owner: `0x${string}`;
}

export interface IsPausedResponse {
  paused: boolean;
}

/**
 * Transaction preparation type
 */
export interface TransactionPreparation {
  success: boolean;
  transaction?: {
    functionName: string;
    args: readonly unknown[];
  };
  error?: string;
}

/**
 * Contract configuration
 * Note: This is kept for backward compatibility, but you should use LeLinkConfig from config.ts
 */
export interface ContractConfig {
  contractAddress: `0x${string}`;
  chainId: number;
  rpcUrl: string;
}

/**
 * Event types for contract events
 */
export interface DataCreatedEvent {
  recordId: `0x${string}`;
  owner: `0x${string}`;
  creator: `0x${string}`;
  resourceId: string;
  dataHash: `0x${string}`;
  timestamp: bigint;
}

export interface DataUpdatedEvent {
  recordId: `0x${string}`;
  updater: `0x${string}`;
  resourceId: string;
  newDataHash: `0x${string}`;
  timestamp: bigint;
}

export interface DataDeletedEvent {
  recordId: `0x${string}`;
  deleter: `0x${string}`;
  resourceId: string;
  timestamp: bigint;
}

export interface DataAccessedEvent {
  recordId: `0x${string}`;
  accessor: `0x${string}`;
  resourceId: string;
  timestamp: bigint;
}

export interface DataSharedEvent {
  recordId: `0x${string}`;
  sharer: `0x${string}`;
  recipient: `0x${string}`;
  resourceId: string;
  timestamp: bigint;
}

export interface DataAccessRevokedEvent {
  recordId: `0x${string}`;
  revoker: `0x${string}`;
  revokedUser: `0x${string}`;
  resourceId: string;
  timestamp: bigint;
}

/**
 * Error types
 */
export enum LeErrorType {
  CannotLogRevocationFromSelf = 'LeLink__CannotLogRevocationFromSelf',
  CannotLogSharingToSelf = 'LeLink__CannotLogSharingToSelf',
  EmptyHashNotAllowed = 'LeLink__EmptyHashNotAllowed',
  InvalidInput = 'LeLink__InvalidInput',
  NotAuthorized = 'LeLink__NotAuthorized',
  RecipientAddressCannotBeZero = 'LeLink__RecipientAddressCannotBeZero',
  RecordAlreadyExists = 'LeLink__RecordAlreadyExists',
  RecordDoesNotExist = 'LeLink__RecordDoesNotExist',
  UserAddressCannotBeZero = 'LeLink__UserAddressCannotBeZero',
  EnforcedPause = 'EnforcedPause',
  ExpectedPause = 'ExpectedPause',
  OwnableInvalidOwner = 'OwnableInvalidOwner',
  OwnableUnauthorizedAccount = 'OwnableUnauthorizedAccount',
}

/**
 * Common response type for transaction operations
 */
export interface TransactionResponse {
  success: boolean;
  hash?: `0x${string}`;
  error?: string;
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T = unknown> {
  success: boolean;
  results: T[];
  successCount: number;
  failureCount: number;
  errors: string[];
}

/**
 * Contract method call options
 */
export interface CallOptions {
  gasLimit?: bigint;
  gasPrice?: bigint;
  value?: bigint;
  nonce?: number;
}

/**
 * Event filter options
 */
export interface EventFilterOptions {
  fromBlock?: bigint | 'latest' | 'earliest' | 'pending';
  toBlock?: bigint | 'latest' | 'earliest' | 'pending';
  address?: `0x${string}` | `0x${string}`[];
  topics?: (string | string[] | null)[];
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  page?: number;
  limit?: number;
  offset?: number;
}

/**
 * Sort options
 */
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

/**
 * Query options for contract calls
 */
export interface QueryOptions extends PaginationOptions {
  sort?: SortOptions;
  filter?: Record<string, unknown>;
  includeEvents?: boolean;
  includeMetadata?: boolean;
}

/**
 * Extended record information with metadata
 */
export interface ExtendedRecordInfo extends LeRecordInfo {
  exists: boolean;
  isExpired?: boolean;
  metadata?: Record<string, unknown>;
  events?: DataCreatedEvent[];
}

/**
 * Utility type for making all properties optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type for making specific properties required
 */
export type RequiredBy<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    timestamp: number;
    version: string;
    requestId?: string;
  };
}
