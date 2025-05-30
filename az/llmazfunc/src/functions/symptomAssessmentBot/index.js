const LekinkTriageAssistant = require('../../assistants/lekainkTriageAssistant');
const openAIService = require('../../services/openai');
const { 
  ValidationError, 
  SafetyError,
  FHIRError
} = require('../../utils/errors');
const { Logger } = require('../../utils/logger');
const { 
  CONVERSATION_STAGES,
  MAX_MESSAGE_LENGTH,
  MAX_CONVERSATION_TURNS,
  SAFETY_FLAGS
} = require('../../utils/constants');
const config = require('../../utils/config');

module.exports = async function (context, req) {
  const correlationId = context.executionContext.invocationId;
  const logger = new Logger({ correlationId });
  
  // Declare variables outside try block for error logging access
  let message, patientId, threadId;
  
  logger.info('Received symptom assessment request', { 
    correlationId,
    headers: req.headers,
    method: req.method,
    body: req.body
  });

  try {
    // Simple inline validation
    if (!req.body || typeof req.body !== 'object') {
      throw new ValidationError('Invalid request body');
    }
    
    // Extract values from request body
    ({ message, patientId, threadId } = req.body);
    
    logger.info('Extracted request parameters', { 
      hasMessage: !!message,
      hasPatientId: !!patientId,
      hasThreadId: !!threadId,
      messageLength: message?.length || 0,
      correlationId
    });
    
    if (!message || typeof message !== 'string') {
      throw new ValidationError('Message is required and must be a string');
    }
    
    message = message.trim();
    
    if (message.length > MAX_MESSAGE_LENGTH) {
      throw new ValidationError(`Message exceeds maximum length of ${MAX_MESSAGE_LENGTH} characters`);
    }
    
    if (!patientId || typeof patientId !== 'string') {
      throw new ValidationError('Patient ID is required and must be a string');
    }
    
    logger.info('Request validated', { 
      patientId, 
      hasThreadId: !!threadId, 
      messagePreview: message.substring(0, 50) + '...',
      correlationId 
    });

    // Initialize LeLink Triage Assistant
    logger.info('Initializing triage assistant', { correlationId });
    const triageAssistant = new LekinkTriageAssistant(
      openAIService,
      logger
    );

    // Get or create thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      logger.info('Creating new thread', { correlationId });
      const thread = await openAIService.createThread();
      currentThreadId = thread.id;
      logger.info('Created new thread', { threadId: currentThreadId, correlationId });
    } else {
      logger.info('Using existing thread', { threadId: currentThreadId, correlationId });
    }

    // Process the message
    logger.info('Processing message with triage assistant', { 
      patientId, 
      threadId: currentThreadId,
      correlationId 
    });
    
    const result = await triageAssistant.processMessage(
      message,
      currentThreadId,
      patientId
    );

    // Log triage interaction details
    console.log('\n🏥 === TRIAGE INTERACTION ===');
    console.log(`📥 Patient Message: "${message}"`);
    console.log(`🤖 Bot Reply: "${result.reply.substring(0, 150)}${result.reply.length > 150 ? '...' : ''}"`);
    
    logger.info('Triage assistant response received', {
      hasReply: !!result.reply,
      hasResources: !!result.resources,
      resourceCount: Object.values(result.resources || {}).filter(r => r !== null).length,
      hasBlockchain: !!result.blockchain,
      correlationId
    });
    
    // Log blockchain details if available
    if (result.blockchain && result.blockchain.success) {
      console.log('\n🔗 === BLOCKCHAIN LOGGING ===');
      console.log(`📍 Network: ${result.blockchain.network}`);
      console.log(`📄 Contract: ${result.blockchain.contractAddress}`);
      result.blockchain.results.forEach((tx, index) => {
        console.log(`\n   Transaction ${index + 1}:`);
        console.log(`   - Resource: ${tx.resourceId}`);
        console.log(`   - Hash: ${tx.dataHash.substring(0, 16)}...`);
        console.log(`   - TX Hash: ${tx.transactionHash}`);
        console.log(`   - Block: ${tx.blockNumber}`);
      });
      console.log('✅ Resources logged to blockchain successfully!\n');
    }
    
    // Log FHIR storage details if available
    if (result.fhirStorage && result.fhirStorage.success) {
      console.log('\n💾 === FHIR STORAGE ===');
      console.log(`📦 Mode: ${result.fhirStorage.mode}`);
      result.fhirStorage.results.forEach((storage, index) => {
        console.log(`\n   Resource ${index + 1}:`);
        console.log(`   - Type: ${storage.resourceType}`);
        console.log(`   - ID: ${storage.resourceId}`);
        if (storage.storageMode === 'azurite') {
          console.log(`   - Blob: ${storage.blobName}`);
        } else {
          console.log(`   - Location: ${storage.location}`);
        }
      });
      console.log('✅ FHIR resources stored successfully!\n');
    }

    // Prepare the response
    const response = {
      reply: result.reply,
      threadId: currentThreadId,
      patientId,
      sessionId: req.headers['x-session-id'] || correlationId,
      completionStatus: result.completionStatus
    };

    // Add resources if they were generated
    if (result.resources && (result.resources.RiskAssessment || result.resources.Observation)) {
      response.resources = {};
      
      if (result.resources.RiskAssessment) {
        response.resources.RiskAssessment = result.resources.RiskAssessment;
      }
      
      if (result.resources.Observation) {
        response.resources.Observation = result.resources.Observation;
      }
    }
    
    // Add blockchain details if available
    if (result.blockchain) {
      response.blockchain = result.blockchain;
    }

    logger.info('Sending response', { 
      hasResources: !!response.resources,
      resourceTypes: response.resources ? Object.keys(response.resources) : [],
      correlationId 
    });

    context.res = {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body: response
    };

  } catch (error) {
    logger.error('Error in symptom assessment function', { 
      error: error.message, 
      stack: error.stack,
      correlationId,
      type: error.constructor.name,
      threadId,
      patientId,
      // Add more detailed OpenAI error info
      openAIError: error.response?.data || error.data || null
    });

    let status = 500;
    let body = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      correlationId,
      details: error.message
    };

    if (error instanceof ValidationError) {
      status = 400;
      body = {
        error: error.message,
        code: 'VALIDATION_ERROR',
        correlationId
      };
    } else if (error instanceof SafetyError) {
      status = 400;
      body = {
        error: error.message,
        code: 'SAFETY_ERROR',
        correlationId
      };
    } else if (error instanceof FHIRError) {
      status = 400;
      body = {
        error: error.message,
        code: 'FHIR_ERROR',
        correlationId
      };
    } else if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') {
      status = 504;
      body = {
        error: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        correlationId,
        details: 'The AI assistant took too long to respond'
      };
    }

    context.res = {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId
      },
      body
    };
  }
};