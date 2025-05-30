const { CONVERSATION_STAGES } = require('../utils/constants');
const blockchainService = require('../services/blockchain');
const fhirStorageService = require('../services/fhirStorage');

class LekinkTriageAssistant {
  constructor(openAIService, logger) {
    this.openAI = openAIService;
    this.logger = logger;
    this.toolCalls = new Map(); // Track tool calls for resource generation
  }

  /**
   * Process a message from the patient
   * @param {string} message The patient's message
   * @param {string} threadId The conversation thread ID
   * @param {string} patientId The patient ID
   * @returns {Object} Response containing reply and any resources generated
   */
  async processMessage(message, threadId, patientId) {
    try {
      this.logger.info('Starting message processing', { 
        messagePreview: message.substring(0, 100) + '...', 
        threadId, 
        patientId 
      });
      
      // Add the message to the thread
      const createdMessage = await this.openAI.createMessage(threadId, { role: 'user', content: message });
      this.logger.info('Message added to thread', { 
        messageId: createdMessage.id,
        threadId
      });

      // Create a run to process the message
      const assistantId = process.env.OPENAI_CONVERSATION_ASSISTANT_ID;
      this.logger.info('Running assistant', { assistantId, threadId });
      
      const run = await this.openAI.runAssistant(threadId, assistantId);
      this.logger.info('Assistant run created', { 
        runId: run.id,
        threadId,
        status: run.status
      });

      // Wait for the run to complete with tool handlers
      const runResult = await this.openAI.waitForRunCompletion(threadId, run.id, {
        toolHandlers: {
          createRiskAssessment: async (args) => {
            this.logger.info('Creating RiskAssessment', { args });
            // Store the risk assessment data
            this.toolCalls.set('RiskAssessment', args);
            return { success: true };
          },
          createObservation: async (args) => {
            this.logger.info('Creating Observation', { args });
            // Store the observation data
            this.toolCalls.set('Observation', args);
            return { success: true };
          },
          conversationStatusCheck: async (args) => {
            this.logger.info('Processing conversation status check', { 
              isComplete: args.isComplete,
              riskLevel: args.risk?.level,
              condition: args.risk?.condition
            });
            
            // Store the completion status
            this.toolCalls.set('ConversationStatus', {
              isComplete: args.isComplete,
              risk: args.risk
            });
            
            return { 
              success: true,
              status: "acknowledged",
              timestamp: new Date().toISOString()
            };
          }
        }
      });
      
      this.logger.info('Run completed', {
        runId: run.id,
        status: runResult.status,
        toolCallsCount: runResult.toolResults?.length || 0
      });

      // Get messages from the thread after run completion
      // Make sure to get the most recent messages first
      const messages = await this.openAI.getMessages(threadId, {
        limit: 20, // Increase limit to get more messages
        order: 'desc' // Newest first
      });
      
      this.logger.info('Retrieved thread messages', {
        messageCount: messages.data?.length || 0,
        threadId,
        firstMessageId: messages.data?.[0]?.id,
        messagesAfterLastUserMessage: messages.data
          ?.filter(m => m.role === 'assistant') 
          ?.filter(m => new Date(m.created_at) > new Date(createdMessage.created_at))
          ?.length || 0
      });

      // Process the results
      const conversationStatus = this.toolCalls.get('ConversationStatus');
      const response = {
        reply: this._extractBotReply(messages.data || []),
        completionStatus: {
          isComplete: conversationStatus?.isComplete || false,
          status: runResult.status,
          risk: conversationStatus?.risk || null
        },
        resources: this._processResourceGeneration(runResult),
        toolCalls: runResult.toolResults || []
      };
      
      // Log FHIR resources to blockchain if available
      if (response.resources) {
        try {
          const resourcesToLog = [];
          if (response.resources.RiskAssessment) {
            resourcesToLog.push(response.resources.RiskAssessment);
          }
          if (response.resources.Observation) {
            resourcesToLog.push(response.resources.Observation);
          }
          
          if (resourcesToLog.length > 0) {
            this.logger.info('Logging FHIR resources to blockchain', {
              resourceCount: resourcesToLog.length,
              patientId
            });
            
            const blockchainResult = await blockchainService.logResources(resourcesToLog, patientId);
            
            if (blockchainResult && blockchainResult.success) {
              response.blockchain = blockchainResult;
              this.logger.info('FHIR resources logged to blockchain successfully', {
                transactionCount: blockchainResult.results.length,
                contractAddress: blockchainResult.contractAddress
              });
            } else {
              this.logger.warn('Failed to log resources to blockchain', blockchainResult);
            }
          }
        } catch (blockchainError) {
          this.logger.error('Error logging to blockchain', {
            error: blockchainError.message,
            stack: blockchainError.stack
          });
          // Don't fail the entire response if blockchain logging fails
        }
        
        // Store FHIR resources in storage (Azurite/FHIR Service)
        try {
          const storageResults = [];
          for (const resource of resourcesToLog) {
            const storageResult = await fhirStorageService.storeResource(resource);
            if (storageResult.success) {
              storageResults.push(storageResult);
            }
          }
          
          if (storageResults.length > 0) {
            response.fhirStorage = {
              success: true,
              mode: storageResults[0].storageMode,
              results: storageResults
            };
            this.logger.info('FHIR resources stored successfully', {
              count: storageResults.length,
              mode: storageResults[0].storageMode
            });
          }
        } catch (storageError) {
          this.logger.error('Error storing FHIR resources', {
            error: storageError.message,
            stack: storageError.stack
          });
          // Don't fail the entire response if storage fails
        }
      }
      
      this.logger.info('Response prepared', {
        replyLength: response.reply.length,
        hasResources: !!response.resources,
        hasBlockchainLog: !!response.blockchain,
        hasFhirStorage: !!response.fhirStorage,
        threadId
      });

      return response;
    } catch (error) {
      this.logger.error('Error processing message:', {
        error: error.message,
        stack: error.stack,
        threadId,
        patientId,
        openAIError: error.response?.data || null
      });
      throw error;
    }
  }

  /**
   * Extract the bot's reply from the messages
   * @private
   */
  _extractBotReply(messages) {
    // Get only assistant messages and sort by creation time (newest first)
    const assistantMessages = messages
      .filter(m => m.role === 'assistant')
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    this.logger.debug('Extracting bot reply', {
      totalMessages: messages.length,
      assistantMessages: assistantMessages.length,
      messageTimestamps: assistantMessages.map(m => ({
        id: m.id,
        created_at: m.created_at,
        content_length: m.content?.[0]?.text?.value?.length || 0
      }))
    });
    
    if (assistantMessages.length > 0) {
      // Get the most recent message from the assistant
      const latestMessage = assistantMessages[0]; 
      const reply = latestMessage.content[0]?.text?.value || '';
      
      this.logger.debug('Using latest assistant message', {
        messageId: latestMessage.id,
        created_at: latestMessage.created_at,
        contentLength: reply.length
      });
      
      return reply;
    }
    
    this.logger.warn('No assistant messages found');
    return '';
  }

  /**
   * Process any resource generation from tool calls
   * @private
   */
  _processResourceGeneration(runResult) {
    const resources = {
      RiskAssessment: null,
      Observation: null,
      ConversationStatus: null
    };
    
    // Get resources from tool calls
    if (this.toolCalls.has('RiskAssessment')) {
      resources.RiskAssessment = this.toolCalls.get('RiskAssessment');
    }
    
    if (this.toolCalls.has('Observation')) {
      resources.Observation = this.toolCalls.get('Observation');
    }
    
    if (this.toolCalls.has('ConversationStatus')) {
      resources.ConversationStatus = this.toolCalls.get('ConversationStatus');
    }

    if (!runResult.toolResults || runResult.toolResults.length === 0) {
      return resources;
    }

    for (const toolCall of runResult.toolResults) {
      try {
        if (!toolCall.name || !toolCall.arguments) continue;
        
        switch (toolCall.name) {
          case 'createRiskAssessment':
            resources.RiskAssessment = this._formatRiskAssessment(toolCall.arguments);
            break;
          case 'createObservation':
            resources.Observation = this._formatObservation(toolCall.arguments);
            break;
          case 'conversationStatusCheck':
            resources.ConversationStatus = toolCall.arguments;
            break;
        }
      } catch (error) {
        this.logger.error(`Error processing tool call ${toolCall.name}:`, error);
      }
    }

    return resources;
  }

  /**
   * Format RiskAssessment resource to ensure FHIR compliance
   * @private
   */
  _formatRiskAssessment(data) {
    const resource = {
      resourceType: 'RiskAssessment',
      id: data.id || this._generateId(),
      status: data.status || 'final',
      subject: data.subject || { reference: 'Patient/unknown' },
      occurrenceDateTime: data.occurrenceDateTime || new Date().toISOString(),
      prediction: data.prediction || []
    };

    // Add optional fields if provided
    if (data.identifier) resource.identifier = data.identifier;
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
   * @private
   */
  _formatObservation(data) {
    const resource = {
      resourceType: 'Observation',
      id: data.id || this._generateId(),
      status: data.status || 'final',
      code: data.code || {
        coding: [{
          system: 'http://loinc.org',
          code: '89261-2',
          display: 'Chief complaint - Reported'
        }]
      },
      subject: data.subject || { reference: 'Patient/unknown' }
    };

    // Add optional fields if provided
    if (data.identifier) resource.identifier = data.identifier;
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
   * @private
   */
  _generateId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = LekinkTriageAssistant;