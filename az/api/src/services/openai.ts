/**
 * @fileoverview OpenAI service for managing chat interactions and thread management
 * @module services/openai
 *
 * This service centralizes all OpenAI interactions, providing consistent error handling,
 * retry logic, and logging across the application.
 */

import OpenAI from 'openai';
import { Logger, LOG_LEVELS } from '../utils/logger.js';
import { OpenAIError } from '../utils/errors.js';

export interface AssistantInfo {
  id: string;
  name?: string;
  model: string;
}

export interface MessageParams {
  role?: 'user' | 'assistant';
  content: string;
}

export interface RunOptions {
  instructions?: string;
  tools?: OpenAI.Beta.AssistantTool[];
}

export interface MessagesOptions {
  limit?: number;
  order?: 'asc' | 'desc';
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolCallHandler {
  (toolCall: ToolCall): Promise<string>;
}

export interface RunProcessorCallbacks {
  onTextCreated?: () => void;
  onTextDelta?: (delta: string) => void;
  onToolCallCreated?: (toolCall: ToolCall) => void;
  onToolCallRequiresAction?: (toolCall: ToolCall) => Promise<string>;
  onStepCreated?: (step: OpenAI.Beta.Threads.Runs.RunStep) => void;
  onStepDelta?: (delta: OpenAI.Beta.Threads.Runs.RunStepDelta) => void;
  onStepCompleted?: (step: OpenAI.Beta.Threads.Runs.RunStep) => void;
  onRunCompleted?: (run: OpenAI.Beta.Threads.Run) => void;
  onRunFailed?: (run: OpenAI.Beta.Threads.Run) => void;
  onRunRequiresAction?: (run: OpenAI.Beta.Threads.Run) => Promise<void>;
  onEnd?: () => void;
  onError?: (error: Error) => void;
}

export interface ExecutionResult {
  status: 'completed' | 'failed' | 'cancelled' | 'expired' | 'requires_action';
  run?: OpenAI.Beta.Threads.Run;
  messages?: OpenAI.Beta.Threads.Message[];
  error?: string;
}

/**
 * OpenAI service class for managing chat interactions
 */
export class OpenAIService {
  private client: OpenAI;
  private logger: Logger;
  private maxRetries: number;
  private retryDelay: number;

  constructor(
    options: {
      maxRetries?: number;
      retryDelay?: number;
    } = {}
  ) {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.logger = new Logger({ minLevel: LOG_LEVELS.INFO });
    this.maxRetries = options.maxRetries || 3;
    this.retryDelay = options.retryDelay || 1000;

    this._logOrganizationInfo();
  }

  /**
   * Log organization information
   */
  private async _logOrganizationInfo(): Promise<void> {
    try {
      const apiKey = process.env.OPENAI_API_KEY;
      if (apiKey) {
        this.logger.info('OpenAI Configuration', {
          apiKeyPrefix: apiKey.substring(0, 10) + '...',
          hasOrganizationId: !!process.env.OPENAI_ORGANIZATION_ID,
        });
      }
    } catch (error) {
      this.logger.warn('Could not log OpenAI configuration', { error: error instanceof Error ? error : new Error(String(error)) });
    }
  }

  /**
   * Create a new conversation thread
   */
  public async createThread(messages?: MessageParams[]): Promise<OpenAI.Beta.Threads.Thread> {
    try {
      const threadData: OpenAI.Beta.Threads.ThreadCreateParams = {};

      if (messages && messages.length > 0) {
        threadData.messages = messages.map((msg) => ({
          role: msg.role || 'user',
          content: msg.content,
        }));
      }

      return await this._withRetry(() => this.client.beta.threads.create(threadData));
    } catch (error) {
      throw new OpenAIError('Failed to create thread', 'createThread', {
        originalError: (error as Error).message,
        messageCount: messages?.length || 0,
      });
    }
  }

  /**
   * Add a message to an existing thread
   */
  public async createMessage(threadId: string, params: MessageParams): Promise<OpenAI.Beta.Threads.Message> {
    if (!threadId) {
      throw new OpenAIError('Thread ID is required', 'createMessage');
    }
    if (!params.content) {
      throw new OpenAIError('Message content is required', 'createMessage');
    }

    try {
      return await this._withRetry(() =>
        this.client.beta.threads.messages.create(threadId, {
          role: params.role || 'user',
          content: params.content,
        })
      );
    } catch (error) {
      throw new OpenAIError('Failed to create message', 'createMessage', {
        originalError: (error as Error).message,
        threadId,
        role: params.role,
      });
    }
  }

  /**
   * Run an assistant on a thread
   */
  public async runAssistant(
    threadId: string,
    assistantId: string,
    options: RunOptions = {}
  ): Promise<OpenAI.Beta.Threads.Run> {
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
          tools: options.tools,
        })
      );
    } catch (error) {
      throw new OpenAIError('Failed to run assistant', 'runAssistant', {
        originalError: (error as Error).message,
        threadId,
        assistantId,
      });
    }
  }

  /**
   * Wait for a run to complete and process events
   */
  public async processRun(
    threadId: string,
    run: OpenAI.Beta.Threads.Run,
    callbacks: RunProcessorCallbacks = {},
    toolHandlers: Record<string, ToolCallHandler> = {}
  ): Promise<ExecutionResult> {
    try {
      let currentRun = run;

      while (currentRun.status === 'queued' || currentRun.status === 'in_progress' || currentRun.status === 'requires_action') {
        if (currentRun.status === 'requires_action') {
          currentRun = await this._handleRequiredAction(threadId, currentRun, callbacks, toolHandlers);
        } else {
          // Wait and check again
          await new Promise((resolve) => setTimeout(resolve, 1000));
          currentRun = await this.client.beta.threads.runs.retrieve(threadId, currentRun.id);
        }
      }

      if (currentRun.status === 'completed') {
        callbacks.onRunCompleted?.(currentRun);
        const messages = await this.getMessages(threadId);
        return { status: 'completed', run: currentRun, messages: messages.data };
      } else {
        callbacks.onRunFailed?.(currentRun);
        return {
          status: currentRun.status as 'failed' | 'cancelled' | 'expired',
          run: currentRun,
          error: `Run ${currentRun.status}: ${currentRun.last_error?.message || 'Unknown error'}`,
        };
      }
    } catch (error) {
      const errorMessage = (error as Error).message;
      callbacks.onError?.(error as Error);
      return { status: 'failed', error: errorMessage };
    }
  }

  /**
   * Handle required actions for tool calls
   */
  private async _handleRequiredAction(
    threadId: string,
    run: OpenAI.Beta.Threads.Run,
    callbacks: RunProcessorCallbacks,
    toolHandlers: Record<string, ToolCallHandler>
  ): Promise<OpenAI.Beta.Threads.Run> {
    const toolCalls = run.required_action?.submit_tool_outputs?.tool_calls || [];
    const toolOutputs: OpenAI.Beta.Threads.Runs.RunSubmitToolOutputsParams.ToolOutput[] = [];

    for (const toolCall of toolCalls) {
      if (toolCall.type === 'function') {
        callbacks.onToolCallCreated?.(toolCall);

        const handler = toolHandlers[toolCall.function.name];
        if (handler) {
          try {
            const output = await handler(toolCall);
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output,
            });
          } catch (error) {
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: `Error: ${(error as Error).message}`,
            });
          }
        } else {
          toolOutputs.push({
            tool_call_id: toolCall.id,
            output: `Error: No handler found for function ${toolCall.function.name}`,
          });
        }
      }
    }

    return await this.client.beta.threads.runs.submitToolOutputs(threadId, run.id, {
      tool_outputs: toolOutputs,
    });
  }

  /**
   * Retrieve messages from a thread
   */
  public async getMessages(threadId: string, options: MessagesOptions = {}): Promise<OpenAI.Beta.Threads.MessagesPage> {
    if (!threadId) {
      throw new OpenAIError('Thread ID is required', 'getMessages');
    }

    try {
      return await this._withRetry(() =>
        this.client.beta.threads.messages.list(threadId, {
          limit: options.limit || 10,
          order: options.order || 'desc',
        })
      );
    } catch (error) {
      throw new OpenAIError('Failed to retrieve messages', 'getMessages', {
        originalError: (error as Error).message,
        threadId,
      });
    }
  }

  /**
   * Cancel a running operation
   */
  public async cancelRun(threadId: string, runId: string): Promise<OpenAI.Beta.Threads.Run> {
    try {
      return await this._withRetry(() => this.client.beta.threads.runs.cancel(threadId, runId));
    } catch (error) {
      throw new OpenAIError('Failed to cancel run', 'cancelRun', {
        originalError: (error as Error).message,
        threadId,
        runId,
      });
    }
  }

  /**
   * List available assistants
   */
  public async listAssistants(): Promise<AssistantInfo[]> {
    try {
      const assistants = await this._withRetry(() => this.client.beta.assistants.list());

      return assistants.data.map((assistant) => ({
        id: assistant.id,
        name: assistant.name || undefined,
        model: assistant.model,
      }));
    } catch (error) {
      throw new OpenAIError('Failed to list assistants', 'listAssistants', {
        originalError: (error as Error).message,
      });
    }
  }

  /**
   * Execute function with retry logic
   */
  private async _withRetry<T>(fn: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (!this._isRetryableError(lastError) || attempt === this.maxRetries) {
          throw error;
        }

        this.logger.warn('Retrying OpenAI request', {
          attempt,
          error: new Error(lastError.message),
        });

        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * attempt));
      }
    }

    throw new OpenAIError('Max retries exceeded', 'retry', {
      originalError: lastError!.message,
      attempts: this.maxRetries,
    });
  }

  /**
   * Check if an error is retryable
   */
  private _isRetryableError(error: Error): boolean {
    const retryableErrors = ['ECONNRESET', 'ENOTFOUND', 'ECONNREFUSED', 'ETIMEDOUT'];

    if (retryableErrors.some((code) => error.message.includes(code))) {
      return true;
    }

    // Check for rate limiting (429) or server errors (5xx)
    if (error.message.includes('429') || error.message.includes('500')) {
      return true;
    }

    return false;
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
