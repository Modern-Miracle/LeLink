/**
 * @fileoverview Custom error classes for the application
 * @description Defines custom error classes for different types of errors
 * that can occur in the application.
 */

export interface ErrorDetails {
  [key: string]: any;
}

export interface ApplicationErrorOptions {
  code?: string;
  statusCode?: number;
}

/**
 * Base error class for all custom errors
 */
export class ApplicationError extends Error {
  public readonly code: string;
  public readonly statusCode: number;

  constructor(message: string, code: string = 'INTERNAL_ERROR', statusCode: number = 500) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error for validation failures
 */
export class ValidationError extends ApplicationError {
  public readonly details: ErrorDetails;

  constructor(message: string, details: ErrorDetails = {}) {
    super(message, 'VALIDATION_ERROR', 400);
    this.details = details;
  }
}

/**
 * Error for FHIR resource operations
 */
export class FHIRError extends ApplicationError {
  public readonly operation: string;
  public readonly resource?: string;

  constructor(message: string, operation: string, resource?: string) {
    super(message, 'FHIR_ERROR', 500);
    this.operation = operation;
    this.resource = resource;
  }
}

/**
 * Error for OpenAI API operations
 */
export class OpenAIError extends ApplicationError {
  public readonly operation: string;
  public readonly details: ErrorDetails;

  constructor(message: string, operation: string, details: ErrorDetails = {}) {
    super(message, 'OPENAI_ERROR', 500);
    this.operation = operation;
    this.details = details;
  }
}

/**
 * Error for safety check failures
 */
export class SafetyError extends ApplicationError {
  public readonly details: ErrorDetails;

  constructor(message: string, details: ErrorDetails = {}) {
    super(message, 'SAFETY_ERROR', 400);
    this.details = details;
  }
}

/**
 * Error for storage operations
 */
export class StorageError extends ApplicationError {
  public readonly operation: string;
  public readonly details: ErrorDetails;

  constructor(message: string, operation: string, details: ErrorDetails = {}) {
    super(message, 'STORAGE_ERROR', 500);
    this.operation = operation;
    this.details = details;
  }
}

/**
 * Error for blockchain operations
 */
export class BlockchainError extends ApplicationError {
  public readonly operation: string;
  public readonly details: ErrorDetails;

  constructor(message: string, operation: string, details: ErrorDetails = {}) {
    super(message, 'BLOCKCHAIN_ERROR', 500);
    this.operation = operation;
    this.details = details;
  }
}
