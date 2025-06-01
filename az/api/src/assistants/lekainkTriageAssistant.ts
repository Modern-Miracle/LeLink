/**
 * @fileoverview LeLink Triage Assistant for processing patient messages
 * @module assistants/lekainkTriageAssistant
 *
 * Provides AI-powered triage capabilities with FHIR resource generation
 * and blockchain logging integration.
 */

import { CONVERSATION_STAGES } from '../utils/constants';
import { blockchainService } from '../services/blockchain';
import { fhirStorageService } from '../services/fhirStorage';
import type { OpenAIService } from '../services/openai';
import type { Logger } from '../utils/logger';
import type { Message } from 'openai/resources/beta/threads/messages';

// Type definitions for OpenAI responses - using the actual OpenAI types
interface OpenAIRun {
  id: string;
  status: string;
}

interface OpenAIRunResult {
  status: string;
  toolResults?: ToolCallResult[];
}

interface ToolCallResult {
  name: string;
  arguments: any;
}

// FHIR Resource Types
interface FHIRResource {
  resourceType: string;
  id: string;
  [key: string]: any;
}

interface RiskAssessmentData {
  id?: string;
  status?: string;
  subject?: { reference: string };
  occurrenceDateTime?: string;
  prediction?: any[];
  identifier?: any;
  code?: any;
  encounter?: any;
  performer?: any;
  reason?: any;
  mitigation?: any;
  note?: any;
}

interface ObservationData {
  id?: string;
  status?: string;
  code?: any;
  subject?: { reference: string };
  identifier?: any;
  category?: any;
  encounter?: any;
  effectiveDateTime?: string;
  issued?: string;
  performer?: any;
  valueString?: string;
  valueCodeableConcept?: any;
  note?: any;
  component?: any;
}

interface ConversationStatusData {
  isComplete: boolean;
  risk?: {
    level?: string;
    condition?: string;
  };
}

// Tool handlers type
interface ToolHandlers {
  createRiskAssessment: (args: RiskAssessmentData) => Promise<{ success: boolean }>;
  createObservation: (args: ObservationData) => Promise<{ success: boolean }>;
  conversationStatusCheck: (args: ConversationStatusData) => Promise<{
    success: boolean;
    status: string;
    timestamp: string;
  }>;
}

// Response types
interface ProcessMessageResponse {
  reply: string;
  completionStatus: {
    isComplete: boolean;
    status: string;
    risk: any;
  };
  resources: {
    RiskAssessment: FHIRResource | null;
    Observation: FHIRResource | null;
    ConversationStatus: ConversationStatusData | null;
  };
  toolCalls: ToolCallResult[];
  blockchain?: {
    success: boolean;
    network: string;
    contractAddress: string;
    results: Array<{
      resourceId: string;
      dataHash: string;
      transactionHash: string;
      blockNumber: number;
    }>;
  };
  fhirStorage?: {
    success: boolean;
    mode: string;
    results: Array<{
      resourceType: string;
      resourceId: string;
      storageMode: string;
      blobName?: string;
      location?: string;
    }>;
  };
}

interface StorageResult {
  success: boolean;
  storageMode: string;
  resourceType: string;
  resourceId: string;
  blobName?: string;
  location?: string;
}

export class LekinkTriageAssistant {
  private openAI: OpenAIService;
  private logger: Logger;
  private toolCalls: Map<string, any>;
  private currentPatientId: string = '';
  private currentUserContext?: { email?: string; name?: string; isAuthenticated: boolean };

  constructor(openAIService: OpenAIService, logger: Logger) {
    this.openAI = openAIService;
    this.logger = logger;
    this.toolCalls = new Map(); // Track tool calls for resource generation
  }

  /**
   * Process a message from the patient
   */
  public async processMessage(
    message: string, 
    threadId: string, 
    patientId: string, 
    userContext?: { email?: string; name?: string; isAuthenticated: boolean }
  ): Promise<ProcessMessageResponse & { threadId: string }> {
    try {
      // Store current patient context for FHIR resource generation
      this.currentPatientId = patientId;
      this.currentUserContext = userContext;
      
      this.logger.info('Starting message processing', {
        messagePreview: message.substring(0, 100) + '...',
        threadId,
        patientId,
        isAuthenticated: userContext?.isAuthenticated || false,
      });

      // Add the message to the thread (with active run handling)
      let createdMessage: Message;
      try {
        createdMessage = await this.openAI.createMessage(threadId, {
          role: 'user',
          content: message,
        });

        this.logger.info('Message added to thread', {
          messageId: createdMessage.id,
          threadId,
        });
      } catch (error: any) {
        // Handle the case where there's an active run
        if (error.message && error.message.includes('while a run') && error.message.includes('is active')) {
          this.logger.warn('Thread has active run, creating new thread', {
            originalThreadId: threadId,
            error: error.message,
          });
          
          // Create a new thread to avoid conflicts
          const newThread = await this.openAI.createThread();
          threadId = newThread.id;
          
          this.logger.info('Created new thread due to active run conflict', {
            newThreadId: threadId,
          });
          
          // Try adding the message to the new thread
          createdMessage = await this.openAI.createMessage(threadId, {
            role: 'user',
            content: message,
          });

          this.logger.info('Message added to new thread', {
            messageId: createdMessage.id,
            threadId,
          });
        } else {
          throw error;
        }
      }

      // Create a run to process the message
      const assistantId = process.env.OPENAI_CONVERSATION_ASSISTANT_ID;
      if (!assistantId) {
        throw new Error('OPENAI_CONVERSATION_ASSISTANT_ID environment variable is required');
      }

      this.logger.info('Running assistant', { assistantId, threadId });

      const run = await this.openAI.runAssistant(threadId, assistantId);
      this.logger.info('Assistant run created', {
        runId: run.id,
        threadId,
        status: run.status,
      });

      // Prepare tool handlers
      const toolHandlers: Record<string, (toolCall: any) => Promise<string>> = {
        createRiskAssessment: async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments);
          this.logger.info('Creating RiskAssessment', { args });
          this.toolCalls.set('RiskAssessment', args);
          return JSON.stringify({ success: true });
        },
        createObservation: async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments);
          this.logger.info('Creating Observation', { args });
          this.toolCalls.set('Observation', args);
          return JSON.stringify({ success: true });
        },
        conversationStatusCheck: async (toolCall) => {
          const args = JSON.parse(toolCall.function.arguments);
          this.logger.info('Processing conversation status check', {
            isComplete: args.isComplete,
            riskLevel: args.risk?.level,
            condition: args.risk?.condition,
          });

          this.toolCalls.set('ConversationStatus', {
            isComplete: args.isComplete,
            risk: args.risk,
          });

          return JSON.stringify({
            success: true,
            status: 'acknowledged',
            timestamp: new Date().toISOString(),
          });
        },
      };

      // Process the run with tool handlers
      const runResult = await this.openAI.processRun(threadId, run, {}, toolHandlers);

      this.logger.info('Run completed', {
        runId: run.id,
        status: runResult.status,
      });

      // Get messages from the thread after run completion
      // Make sure to get the most recent messages first
      const messages = await this.openAI.getMessages(threadId, {
        limit: 20, // Increase limit to get more messages
        order: 'desc', // Newest first
      });

      this.logger.info('Retrieved thread messages', {
        messageCount: messages.data?.length || 0,
        threadId,
        firstMessageId: messages.data?.[0]?.id,
        messagesAfterLastUserMessage:
          messages.data
            ?.filter((m) => m.role === 'assistant')
            ?.filter((m) => new Date(m.created_at * 1000) > new Date(createdMessage.created_at * 1000))?.length || 0,
      });

      // Process the results
      const conversationStatus = this.toolCalls.get('ConversationStatus') as ConversationStatusData | undefined;
      const response: ProcessMessageResponse = {
        reply: this._extractBotReply(messages.data || []),
        completionStatus: {
          isComplete: conversationStatus?.isComplete || false,
          status: runResult.status,
          risk: conversationStatus?.risk || null,
        },
        resources: this._processResourceGeneration(),
        toolCalls: [],
      };

      // Log FHIR resources to blockchain if available
      if (response.resources) {
        // Get resources as array (comma-separated and unique)
        const resourcesToLog: FHIRResource[] = this._getResourcesAsArray();

        // Log to blockchain
        if (resourcesToLog.length > 0) {
          try {
            this.logger.info('Logging FHIR resources to blockchain', {
              resourceCount: resourcesToLog.length,
              patientId,
            });

            // Log resources to blockchain using the blockchain service
            const blockchainResult = await blockchainService.logResources(resourcesToLog, patientId);
            
            if (blockchainResult && blockchainResult.success) {
              response.blockchain = blockchainResult;
              this.logger.info('FHIR resources logged to blockchain successfully', {
                resourceCount: blockchainResult.results.length,
                network: blockchainResult.network,
                contractAddress: blockchainResult.contractAddress,
              });
            }
          } catch (blockchainError) {
            this.logger.error('Error logging to blockchain', {
              error: blockchainError instanceof Error ? blockchainError : new Error(String(blockchainError)),
            });
            // Don't fail the entire response if blockchain logging fails
          }
        }

        // Store FHIR resources in storage (Azurite/FHIR Service)
        if (resourcesToLog.length > 0) {
          try {
            const storageResults: StorageResult[] = [];
            for (const resource of resourcesToLog) {
              const storageResult = await fhirStorageService.storeResource(resource);
              if (storageResult.success) {
                storageResults.push(storageResult);
              }
              // Add small delay between storage operations to avoid Azurite conflicts
              await new Promise(resolve => setTimeout(resolve, 100));
            }

            if (storageResults.length > 0) {
              response.fhirStorage = {
                success: true,
                mode: storageResults[0].storageMode,
                results: storageResults,
              };
              this.logger.info('FHIR resources stored successfully', {
                count: storageResults.length,
                mode: storageResults[0].storageMode,
              });
            }
          } catch (storageError) {
            this.logger.error('Error storing FHIR resources', {
              error: storageError instanceof Error ? storageError : new Error(String(storageError)),
            });
            // Don't fail the entire response if storage fails
          }
        }
      }

      this.logger.info('Response prepared', {
        replyLength: response.reply.length,
        hasResources: !!response.resources,
        hasBlockchainLog: !!response.blockchain,
        hasFhirStorage: !!response.fhirStorage,
        threadId,
      });

      return {
        ...response,
        threadId,
      };
    } catch (error) {
      this.logger.error('Error processing message:', {
        error: error instanceof Error ? error : new Error(String(error)),
        threadId,
        patientId,
        openAIError: (error as any).response?.data || null,
      });
      throw error;
    }
  }

  /**
   * Extract the bot's reply from the messages
   */
  private _extractBotReply(messages: Message[]): string {
    // Get only assistant messages and sort by creation time (newest first)
    const assistantMessages = messages
      .filter((m) => m.role === 'assistant')
      .sort((a, b) => new Date(b.created_at * 1000).getTime() - new Date(a.created_at * 1000).getTime());

    this.logger.debug('Extracting bot reply', {
      totalMessages: messages.length,
      assistantMessages: assistantMessages.length,
      messageTimestamps: assistantMessages.map((m) => ({
        id: m.id,
        created_at: m.created_at,
        content_length: m.content?.[0]?.type === 'text' ? m.content[0].text.value.length : 0,
      })),
    });

    if (assistantMessages.length > 0) {
      // Get the most recent message from the assistant
      const latestMessage = assistantMessages[0];
      const reply = latestMessage.content[0]?.type === 'text' ? latestMessage.content[0].text.value : '';

      this.logger.debug('Using latest assistant message', {
        messageId: latestMessage.id,
        created_at: latestMessage.created_at,
        contentLength: reply.length,
      });

      return reply;
    }

    this.logger.warn('No assistant messages found');
    return '';
  }

  /**
   * Process any resource generation from tool calls
   */
  private _processResourceGeneration(): {
    RiskAssessment: FHIRResource | null;
    Observation: FHIRResource | null;
    ConversationStatus: ConversationStatusData | null;
  } {
    const resources = {
      RiskAssessment: null as FHIRResource | null,
      Observation: null as FHIRResource | null,
      ConversationStatus: null as ConversationStatusData | null,
    };

    // Get resources from tool calls stored during processing
    if (this.toolCalls.has('RiskAssessment')) {
      const data = this.toolCalls.get('RiskAssessment') as RiskAssessmentData;
      resources.RiskAssessment = this._formatRiskAssessment(data);
    }

    if (this.toolCalls.has('Observation')) {
      const data = this.toolCalls.get('Observation') as ObservationData;
      resources.Observation = this._formatObservation(data);
    }

    if (this.toolCalls.has('ConversationStatus')) {
      resources.ConversationStatus = this.toolCalls.get('ConversationStatus') as ConversationStatusData;
    }

    return resources;
  }

  /**
   * Format RiskAssessment resource to ensure FHIR compliance
   */
  private _formatRiskAssessment(data: RiskAssessmentData): FHIRResource {
    const resource: FHIRResource = {
      resourceType: 'RiskAssessment',
      id: data.id || this._generateId(),
      status: data.status || 'final',
      subject: { 
        reference: `Patient/${this.currentPatientId}`,
        display: this.currentUserContext?.name || this.currentUserContext?.email || this.currentPatientId
      },
      occurrenceDateTime: data.occurrenceDateTime || new Date().toISOString(),
      prediction: data.prediction || [],
      identifier: [
        {
          system: 'http://lelink.local/patient-id',
          value: this.currentPatientId
        }
      ],
      meta: {
        lastUpdated: new Date().toISOString(),
        source: 'LeLink-Triage-AI',
        profile: ['http://hl7.org/fhir/StructureDefinition/RiskAssessment']
      }
    };

    // Add optional fields if provided
    if (data.identifier) {
      // Merge with existing identifier
      resource.identifier = [...(resource.identifier || []), ...data.identifier];
    }
    if (data.code) resource.code = data.code;
    if (data.encounter) resource.encounter = data.encounter;
    if (data.performer) resource.performer = data.performer;
    if (data.reason) resource.reason = data.reason;
    if (data.mitigation) resource.mitigation = data.mitigation;
    if (data.note) resource.note = data.note;

    return resource;
  }

  /**
   * Format Observation resource to ensure FHIR compliance
   */
  private _formatObservation(data: ObservationData): FHIRResource {
    const resource: FHIRResource = {
      resourceType: 'Observation',
      id: data.id || this._generateId(),
      status: data.status || 'final',
      code: data.code || {
        coding: [
          {
            system: 'http://loinc.org',
            code: '89261-2',
            display: 'Chief complaint - Reported',
          },
        ],
      },
      subject: { 
        reference: `Patient/${this.currentPatientId}`,
        display: this.currentUserContext?.name || this.currentUserContext?.email || this.currentPatientId
      },
      identifier: [
        {
          system: 'http://lelink.local/patient-id',
          value: this.currentPatientId
        }
      ],
      meta: {
        lastUpdated: new Date().toISOString(),
        source: 'LeLink-Triage-AI',
        profile: ['http://hl7.org/fhir/StructureDefinition/Observation']
      }
    };

    // Add optional fields if provided
    if (data.identifier) {
      // Merge with existing identifier
      resource.identifier = [...(resource.identifier || []), ...data.identifier];
    }
    if (data.category) resource.category = data.category;
    if (data.encounter) resource.encounter = data.encounter;
    if (data.effectiveDateTime) resource.effectiveDateTime = data.effectiveDateTime;
    if (data.issued) resource.issued = data.issued;
    if (data.performer) resource.performer = data.performer;
    if (data.valueString) resource.valueString = data.valueString;
    if (data.valueCodeableConcept) resource.valueCodeableConcept = data.valueCodeableConcept;
    if (data.note) resource.note = data.note;
    if (data.component) resource.component = data.component;

    return resource;
  }

  /**
   * Generate a unique ID for resources
   */
  private _generateId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    const patientHash = this.currentPatientId.slice(-4); // Last 4 chars of patient ID
    const microseconds = process.hrtime.bigint() % 1000000n; // Add microsecond precision
    return `${timestamp}-${random}-${patientHash}-${microseconds}`;
  }

  /**
   * Get generated resources as a comma-separated array
   */
  private _getResourcesAsArray(): FHIRResource[] {
    const resourceData = this._processResourceGeneration();
    const resources: FHIRResource[] = [];
    
    if (resourceData.RiskAssessment) {
      resources.push(resourceData.RiskAssessment);
    }
    if (resourceData.Observation) {
      resources.push(resourceData.Observation);
    }
    
    return resources;
  }
}
