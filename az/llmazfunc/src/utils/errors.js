/**
 * @fileoverview Custom error classes for the application
 * @description Defines custom error classes for different types of errors
 * that can occur in the application.
 */

/**
 * Base error class for all custom errors
 */
class ApplicationError extends Error {
    constructor(message, code = 'INTERNAL_ERROR', statusCode = 500) {
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
class ValidationError extends ApplicationError {
    constructor(message, details = {}) {
        super(message, 'VALIDATION_ERROR', 400);
        this.details = details;
    }
}

/**
 * Error for FHIR resource operations
 */
class FHIRError extends ApplicationError {
    constructor(message, operation, resource) {
        super(message, 'FHIR_ERROR', 500);
        this.operation = operation;
        this.resource = resource;
    }
}

/**
 * Error for OpenAI API operations
 */
class OpenAIError extends ApplicationError {
    constructor(message, operation, details = {}) {
        super(message, 'OPENAI_ERROR', 500);
        this.operation = operation;
        this.details = details;
    }
}

/**
 * Error for safety check failures
 */
class SafetyError extends ApplicationError {
    constructor(message, details = {}) {
        super(message, 'SAFETY_ERROR', 400);
        this.details = details;
    }
}

/**
 * Error for storage operations
 */
class StorageError extends ApplicationError {
    constructor(message, operation, details = {}) {
        super(message, 'STORAGE_ERROR', 500);
        this.operation = operation;
        this.details = details;
    }
}

module.exports = {
    ApplicationError,
    ValidationError,
    FHIRError,
    OpenAIError,
    SafetyError,
    StorageError
}; 