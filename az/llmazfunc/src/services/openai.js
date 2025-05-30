/**
 * @fileoverview OpenAI service for managing chat interactions and thread management
 * @module services/openai
 * 
 * This service centralizes all OpenAI interactions, providing consistent error handling,
 * retry logic, and logging across the application.
 */

const OpenAI = require('openai');
const { Logger } = require('../utils/logger');
const { OpenAIError } = require('../utils/errors');

class OpenAIService {
    /**
     * Initialize OpenAI service with API key from environment
     */
    constructor() {
        if (!process.env.OPENAI_API_KEY) {
            throw new OpenAIError('OPENAI_API_KEY environment variable is required', 'initialization');
        }

        this.client = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            timeout: 120000, // 2 minutes timeout for API calls
            maxRetries: 3
        });
        this.logger = new Logger();
        
        // Default retry configuration
        this.maxRetries = 3;
        this.retryDelay = 1000;

        // Log organization info
        this._logOrganizationInfo();
    }

    /**
     * Log organization information
     * @private
     */
    async _logOrganizationInfo() {
        try {
            this.logger.info('OpenAI Configuration', {
                apiKeyPrefix: process.env.OPENAI_API_KEY.substring(0, 10) + '...',
                hasOrganizationId: !!process.env.OPENAI_ORGANIZATION_ID
            });
        } catch (error) {
            this.logger.warn('Could not log OpenAI configuration', {
                error: error.message
            });
        }
    }

    /**
     * List all available assistants
     * @returns {Promise<Array>} List of assistants
     */
    async listAssistants() {
        try {
            this.logger.debug('Listing all assistants', {
                apiKey: `${process.env.OPENAI_API_KEY.substring(0, 7)}...`,
                organizationId: process.env.OPENAI_ORGANIZATION_ID
            });
            const assistants = await this._withRetry(() =>
                this.client.beta.assistants.list({
                    limit: 100,
                    order: 'desc'
                })
            );
            this.logger.debug('Assistants retrieved', { 
                count: assistants.data.length,
                assistants: assistants.data.map(a => ({
                    id: a.id,
                    name: a.name,
                    model: a.model
                })),
                organizationId: process.env.OPENAI_ORGANIZATION_ID
            });
            return assistants.data;
        } catch (error) {
            this.logger.error('Error listing assistants', {
                error: error.message,
                status: error.status,
                type: error.type,
                headers: error.response?.headers,
                responseData: error.response?.data,
                organizationId: process.env.OPENAI_ORGANIZATION_ID
            });
            throw error;
        }
    }

    /**
     * Verify if an assistant exists
     * @param {string} assistantId - The ID of the assistant to verify
     * @returns {Promise<boolean>} Whether the assistant exists
     */
    async verifyAssistant(assistantId) {
        if (!assistantId) {
            throw new OpenAIError('Assistant ID is required', 'verifyAssistant');
        }

        try {
            await this.client.beta.assistants.retrieve(assistantId);
            return true;
        } catch (error) {
            this.logger.error('Error verifying assistant', {
                assistantId,
                error: error.message,
                status: error.status,
                type: error.type
            });
            
            // If assistant not found, try to list all assistants
            if (error.status === 404) {
                try {
                    const assistants = await this.listAssistants();
                    this.logger.debug('Current assistants after 404', {
                        searchedId: assistantId,
                        availableIds: assistants.map(a => ({
                            id: a.id,
                            name: a.name,
                            model: a.model
                        }))
                    });
                } catch (listError) {
                    throw new OpenAIError('Failed to list assistants after verification failed', 'listAssistants', {
                        originalError: listError.message,
                        assistantId
                    });
                }
                return false;
            }
            throw new OpenAIError('Failed to verify assistant', 'verifyAssistant', {
                originalError: error.message,
                assistantId,
                status: error.status
            });
        }
    }

    /**
     * Create a new conversation thread
     * @returns {Promise<Object>} Thread object from OpenAI
     */
    async createThread() {
        try {
            return await this._withRetry(() => 
                this.client.beta.threads.create()
            );
        } catch (error) {
            throw new OpenAIError('Failed to create thread', 'createThread', {
                originalError: error.message
            });
        }
    }

    /**
     * Add a message to an existing thread
     * @param {string} threadId - The ID of the thread
     * @param {Object} params - Message parameters
     * @param {string} params.role - Message role (default: 'user')
     * @param {string} params.content - Message content
     * @returns {Promise<Object>} Created message object
     */
    async createMessage(threadId, { role, content }) {

        if (!threadId) {
            throw new OpenAIError('Thread ID is required', 'createMessage');
        }
        if (!content) {
            throw new OpenAIError('Message content is required', 'createMessage');
        }

        try {
            const message = await this._withRetry(async () => {
                const result = await this.client.beta.threads.messages.create(threadId, {
                    role: role || 'user',
                    content
                });
                
                return result;
            });
            
            return message;
        } catch (error) {
            throw new OpenAIError('Failed to create message', 'createMessage', {
                originalError: error.message,
                threadId,
                role
            });
        }
    }

    /**
     * Run an assistant on a thread with specific instructions and tools
     * @param {string} threadId - The ID of the thread
     * @param {string} assistantId - The ID of the assistant to use
     * @param {Object} options - Run options including instructions and tools
     * @returns {Promise<Object>} Run object
     */
    async runAssistant(threadId, assistantId, options = {}) {
        if (!threadId) {
            throw new OpenAIError('Thread ID is required', 'runAssistant');
        }
        if (!assistantId) {
            throw new OpenAIError('Assistant ID is required', 'runAssistant');
        }

        try {
            return await this._withRetry(() =>
                this.client.beta.threads.runs.create(threadId, {
                    assistant_id: assistantId,
                    instructions: options.instructions,
                    tools: options.tools
                })
            );
        } catch (error) {
            throw new OpenAIError('Failed to run assistant', 'runAssistant', {
                originalError: error.message,
                threadId,
                assistantId,
                hasInstructions: !!options.instructions,
                hasTools: !!options.tools
            });
        }
    }

    /**
     * Wait for an assistant run to complete, handling tool calls
     * @param {string} threadId - The ID of the thread
     * @param {string} runId - The ID of the run
     * @param {Object} options - Options including tool handlers
     * @returns {Promise<Object>} Completed run results
     */
    async waitForRunCompletion(threadId, runId, { toolHandlers = {}, timeout = 120000, context = {} } = {}) {
        const startTime = Date.now();
        let lastStatus = null;
        const toolResults = [];

        while (true) {
            const run = await this.client.beta.threads.runs.retrieve(threadId, runId);
            const duration = Date.now() - startTime;
            const status = run.status;

            if (status !== lastStatus) {
                this.logger.debug('Run status check', {
                    threadId,
                    runId,
                    status,
                    duration,
                    hasToolCalls: run.required_action?.submit_tool_outputs?.tool_calls?.length > 0
                });
                lastStatus = status;
            }

            if (status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'expired') {
                return {
                    status,
                    completedAt: run.completed_at,
                    duration,
                    toolResults
                };
            }

            if (status === 'requires_action' && run.required_action?.type === 'submit_tool_outputs') {
                const toolCalls = run.required_action.submit_tool_outputs.tool_calls;
                const toolOutputs = [];

                this.logger.debug('Tool handlers available', { 
                    availableHandlers: Object.keys(toolHandlers),
                    toolCallsCount: toolCalls.length 
                });

                for (const toolCall of toolCalls) {
                    const { name: functionName, arguments: functionArgs } = toolCall.function;
                    
                    this.logger.debug('Processing tool call', {
                        functionName,
                        hasHandler: !!toolHandlers[functionName],
                        toolCallId: toolCall.id
                    });
                    
                    const handler = toolHandlers[functionName];

                    if (!handler) {
                        this.logger.warn(`No handler found for tool ${functionName}`, {
                            availableHandlers: Object.keys(toolHandlers)
                        });
                        continue;
                    }

                    try {
                        this.logger.debug('Executing tool call', {
                            functionName,
                            arguments: functionArgs
                        });

                        // Parse arguments and add context
                        const args = JSON.parse(functionArgs);
                        const output = await handler(args, context);

                        toolOutputs.push({
                            tool_call_id: toolCall.id,
                            output: JSON.stringify(output)
                        });

                        toolResults.push({
                            name: functionName,
                            arguments: args,
                            output
                        });

                        this.logger.debug('Tool call completed', {
                            functionName,
                            outputSize: output ? JSON.stringify(output).length : 0,
                            output
                        });
                    } catch (error) {
                        this.logger.error('Tool call failed', {
                            error,
                            functionName,
                            arguments: functionArgs
                        });
                        throw error;
                    }
                }

                if (toolOutputs.length > 0) {
                    await this.client.beta.threads.runs.submitToolOutputs(
                        threadId,
                        runId,
                        { tool_outputs: toolOutputs }
                    );
                } else {
                    // If no tool outputs were processed but tools were called, submit empty output
                    const emptyOutputs = toolCalls.map(toolCall => ({
                        tool_call_id: toolCall.id,
                        output: JSON.stringify({ success: false, error: 'No handler available' })
                    }));
                    
                    await this.client.beta.threads.runs.submitToolOutputs(
                        threadId,
                        runId,
                        { tool_outputs: emptyOutputs }
                    );
                }
            }

            if (duration > timeout) {
                throw new Error(`Run timed out after ${duration}ms`);
            }

            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }

    /**
     * Retrieve messages from a thread
     * @param {string} threadId - The ID of the thread
     * @param {Object} options - List options including limit
     * @returns {Promise<Object>} Messages list object
     */
    async getMessages(threadId, options = {}) {
        if (!threadId) {
            throw new OpenAIError('Thread ID is required', 'getMessages');
        }

        try {
            return await this._withRetry(() =>
                this.client.beta.threads.messages.list(threadId, {
                    limit: options.limit || 10,
                    order: options.order || 'desc'
                })
            );
        } catch (error) {
            throw new OpenAIError('Failed to retrieve messages', 'getMessages', {
                originalError: error.message,
                threadId,
                options
            });
        }
    }

    /**
     * Execute function with retry logic
     * @private
     * @param {Function} fn - Function to execute
     * @returns {Promise<any>} Function result
     */
    async _withRetry(fn) {
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                return await fn();
            } catch (error) {
                lastError = error;
                if (!this._isRetryableError(error) || attempt === this.maxRetries) {
                    throw error;
                }
                this.logger.warn('Retrying OpenAI request', {
                    attempt,
                    error: error.message
                });
                await new Promise(resolve => 
                    setTimeout(resolve, this.retryDelay * attempt)
                );
            }
        }
        throw new OpenAIError('Max retries exceeded', 'retry', {
            originalError: lastError.message,
            attempts: this.maxRetries
        });
    }

    /**
     * Check if an error is retryable
     * @private
     * @param {Error} error - Error to check
     * @returns {boolean} Whether the error is retryable
     */
    _isRetryableError(error) {
        return (
            error.status === 429 || // Rate limit
            error.status >= 500 || // Server errors
            error.message.includes('timeout') ||
            error.message.includes('network')
        );
    }
}

// Export singleton instance
module.exports = new OpenAIService(); 