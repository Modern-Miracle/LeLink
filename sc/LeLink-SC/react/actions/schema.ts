/**
 * LeLink Contract Input Validation Schemas using Zod
 * Contains validation schemas for all contract input types
 */

import { z } from 'zod';

/**
 * Base validation schemas for common types
 */
export const ethereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
  .refine((addr) => addr !== '0x0000000000000000000000000000000000000000', 'Cannot be zero address');

export const nonZeroEthereumAddressSchema = z
  .string()
  .regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid Ethereum address')
  .refine((addr) => addr !== '0x0000000000000000000000000000000000000000', 'Cannot be zero address');

export const hashSchema = z
  .string()
  .min(1, 'Hash cannot be empty')
  .refine(
    (hash) => /^0x[a-fA-F0-9]{64}$/.test(hash) || /^[a-fA-F0-9]{64}$/.test(hash),
    'Must be a valid 64-character hash (with or without 0x prefix)'
  );

export const resourceIdSchema = z
  .string()
  .min(1, 'Resource ID must be a non-empty string')
  .max(256, 'Resource ID cannot exceed 256 characters');

/**
 * Validation schemas for record management inputs
 */
export const createRecordSchema = z.object({
  resourceId: resourceIdSchema,
  dataHash: hashSchema,
  owner: ethereumAddressSchema,
});

export const updateRecordSchema = z.object({
  resourceId: resourceIdSchema,
  newDataHash: hashSchema,
});

export const deleteRecordSchema = z.object({
  resourceId: resourceIdSchema,
});

export const forceDeleteRecordSchema = z.object({
  resourceId: resourceIdSchema,
  owner: ethereumAddressSchema,
});

/**
 * Validation schemas for access management inputs
 */
export const logAccessSchema = z.object({
  resourceId: resourceIdSchema,
  owner: ethereumAddressSchema,
});

export const logShareAccessSchema = z
  .object({
    resourceId: resourceIdSchema,
    owner: ethereumAddressSchema,
    recipient: ethereumAddressSchema,
  })
  .refine((data) => data.owner.toLowerCase() !== data.recipient.toLowerCase(), {
    message: 'Owner and recipient cannot be the same address',
    path: ['recipient'],
  });

export const logRevokeAccessSchema = z
  .object({
    resourceId: resourceIdSchema,
    owner: ethereumAddressSchema,
    userToRevoke: ethereumAddressSchema,
  })
  .refine((data) => data.owner.toLowerCase() !== data.userToRevoke.toLowerCase(), {
    message: 'Owner cannot revoke access from themselves',
    path: ['userToRevoke'],
  });

/**
 * Validation schemas for query inputs
 */
export const getRecordSchema = z.object({
  resourceId: resourceIdSchema,
  owner: ethereumAddressSchema,
});

export const recordExistsSchema = z.object({
  resourceId: resourceIdSchema,
  owner: ethereumAddressSchema,
});

export const getRecordIdSchema = z.object({
  resourceId: resourceIdSchema,
  owner: ethereumAddressSchema,
});

/**
 * Validation schemas for ownership management
 */
export const transferOwnershipSchema = z.object({
  newOwner: nonZeroEthereumAddressSchema,
});

/**
 * Batch operation schemas
 */
export const batchCreateRecordsSchema = z.array(createRecordSchema).min(1, 'At least one record is required');

/**
 * Contract configuration schema
 */
export const contractConfigSchema = z.object({
  contractAddress: ethereumAddressSchema,
  chainId: z.number().positive('Chain ID must be positive'),
  rpcUrl: z.string().url('Must be a valid URL'),
});

/**
 * Utility types inferred from schemas
 */
export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type DeleteRecordInput = z.infer<typeof deleteRecordSchema>;
export type ForceDeleteRecordInput = z.infer<typeof forceDeleteRecordSchema>;
export type LogAccessInput = z.infer<typeof logAccessSchema>;
export type LogShareAccessInput = z.infer<typeof logShareAccessSchema>;
export type LogRevokeAccessInput = z.infer<typeof logRevokeAccessSchema>;
export type GetRecordInput = z.infer<typeof getRecordSchema>;
export type RecordExistsInput = z.infer<typeof recordExistsSchema>;
export type GetRecordIdInput = z.infer<typeof getRecordIdSchema>;
export type TransferOwnershipInput = z.infer<typeof transferOwnershipSchema>;
export type BatchCreateRecordsInput = z.infer<typeof batchCreateRecordsSchema>;
export type ContractConfigInput = z.infer<typeof contractConfigSchema>;

/**
 * Enhanced validation function with better error handling
 */
export const validateInput = <T>(input: unknown, schema: z.ZodSchema<T>): T => {
  try {
    return schema.parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      throw new Error(`Validation failed: ${errorMessages.join('; ')}`);
    }
    throw error;
  }
};

/**
 * Safe validation function that returns result instead of throwing
 */
export const safeValidateInput = <T>(
  input: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; error: string } => {
  try {
    const data = schema.parse(input);
    return { success: true, data };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      return { success: false, error: `Validation failed: ${errorMessages.join('; ')}` };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};

/**
 * Validation middleware for contract inputs (throws on validation failure)
 */
export const validateAndThrow = <T>(input: unknown, schema: z.ZodSchema<T>): T => {
  return validateInput(input, schema);
};

/**
 * Async validation function for complex validations
 */
export const validateInputAsync = async <T>(input: unknown, schema: z.ZodSchema<T>): Promise<T> => {
  try {
    return await schema.parseAsync(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map((err) => {
        const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
        return `${path}${err.message}`;
      });
      throw new Error(`Validation failed: ${errorMessages.join('; ')}`);
    }
    throw error;
  }
};

/**
 * Utility function to format Zod errors
 */
export const formatZodError = (error: z.ZodError): string => {
  return error.errors
    .map((err) => {
      const path = err.path.length > 0 ? `${err.path.join('.')}: ` : '';
      return `${path}${err.message}`;
    })
    .join('; ');
};

/**
 * Legacy compatibility - keeping old function names for backward compatibility
 */
export const isValidAddress = (address: string): boolean => {
  return ethereumAddressSchema.safeParse(address).success;
};

export const isValidHash = (hash: string): boolean => {
  return hashSchema.safeParse(hash).success;
};

export const isNonEmptyString = (str: string): boolean => {
  return z.string().min(1).safeParse(str).success;
};

/**
 * Format validation errors utility
 */
export const formatValidationErrors = (errors: string[]): string => {
  return errors.join('; ');
};
