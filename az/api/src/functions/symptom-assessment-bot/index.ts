/**
 * @fileoverview Symptom Assessment Bot Azure Function
 * @module functions/symptom-assessment-bot
 *
 * Azure Functions v4 HTTP trigger for processing symptom assessment messages
 * through the LeLink Triage Assistant with FHIR resource generation and blockchain logging.
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { LekinkTriageAssistant } from '../../assistants/lekainkTriageAssistant.js';
import { openaiService } from '../../services/openai.js';
import { ValidationError, SafetyError, FHIRError } from '../../utils/errors.js';
import { Logger } from '../../utils/logger.js';
import {
  CONVERSATION_STAGES,
  MAX_MESSAGE_LENGTH,
  MAX_CONVERSATION_TURNS,
  SAFETY_FLAGS,
} from '../../utils/constants.js';

// Request/Response Types
interface UserContext {
  email?: string;
  name?: string;
  isAuthenticated: boolean;
}

interface SymptomAssessmentRequest {
  message: string;
  patientId: string;
  threadId?: string;
  userContext?: UserContext;
}

interface SymptomAssessmentResponse {
  reply: string;
  threadId: string;
  patientId: string;
  sessionId: string;
  completionStatus: string;
  resources?: {
    RiskAssessment?: any;
    Observation?: any;
  };
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
}

interface ErrorResponse {
  error: string;
  code: string;
  correlationId: string;
  details?: string;
}

/**
 * Symptom Assessment Bot HTTP trigger function
 */
export async function symptomAssessmentBot(
  request: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  const correlationId = context.invocationId;
  const logger = new Logger({ correlationId });

  // Declare variables with initial undefined values for error logging access
  let message: string | undefined;
  let patientId: string | undefined;
  let threadId: string | undefined;
  let userContext: UserContext | undefined;

  logger.info('Received symptom assessment request', {
    correlationId,
    headers: Object.fromEntries(request.headers.entries()),
    method: request.method,
    url: request.url,
  });

  try {
    // Parse and validate request body
    const requestBody = (await request.json()) as SymptomAssessmentRequest;

    if (!requestBody || typeof requestBody !== 'object') {
      throw new ValidationError('Invalid request body');
    }

    // Extract values from request body
    ({ message, patientId, threadId, userContext } = requestBody);

    logger.info('Extracted request parameters', {
      hasMessage: !!message,
      hasPatientId: !!patientId,
      hasThreadId: !!threadId,
      messageLength: message?.length || 0,
      hasUserContext: !!userContext,
      isAuthenticated: userContext?.isAuthenticated || false,
      correlationId,
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

    // Enhanced patient ID validation
    if (patientId.length < 3 || patientId.length > 100) {
      throw new ValidationError('Patient ID must be between 3 and 100 characters');
    }

    // Validate patient ID format (allow UUIDs, alphanumeric, and common patterns)
    const validPatientIdPattern = /^[a-zA-Z0-9\-_@.]+$/;
    if (!validPatientIdPattern.test(patientId)) {
      throw new ValidationError('Patient ID contains invalid characters');
    }

    logger.info('Request validated', {
      patientId,
      hasThreadId: !!threadId,
      messagePreview: message.substring(0, 50) + '...',
      correlationId,
    });

    // Initialize LeLink Triage Assistant
    logger.info('Initializing triage assistant', { correlationId });
    const triageAssistant = new LekinkTriageAssistant(openaiService, logger);

    // Get or create thread
    let currentThreadId = threadId;
    if (!currentThreadId) {
      logger.info('Creating new thread', { correlationId });
      const thread = await openaiService.createThread();
      currentThreadId = thread.id;
      logger.info('Created new thread', { threadId: currentThreadId, correlationId });
    } else {
      logger.info('Using existing thread', { threadId: currentThreadId, correlationId });
    }

    // Process the message
    logger.info('Processing message with triage assistant', {
      patientId,
      threadId: currentThreadId,
      correlationId,
    });

    const result = await triageAssistant.processMessage(message, currentThreadId, patientId, userContext);
    
    // Update thread ID in case it was changed due to active run conflict
    currentThreadId = result.threadId;

    // Log triage interaction details
    context.log('\n🏥 === TRIAGE INTERACTION ===');
    context.log(`📥 Patient Message: "${message}"`);
    context.log(`🤖 Bot Reply: "${result.reply.substring(0, 150)}${result.reply.length > 150 ? '...' : ''}"`);

    logger.info('Triage assistant response received', {
      hasReply: !!result.reply,
      hasResources: !!result.resources,
      resourceCount: Object.values(result.resources || {}).filter((r) => r !== null).length,
      hasBlockchain: !!result.blockchain,
      finalThreadId: currentThreadId,
      correlationId,
    });

    // Log blockchain details if available
    if (result.blockchain && result.blockchain.success) {
      context.log('\n🔗 === BLOCKCHAIN LOGGING ===');
      context.log(`📍 Network: ${result.blockchain.network}`);
      context.log(`📄 Contract: ${result.blockchain.contractAddress}`);
      result.blockchain.results.forEach((tx, index) => {
        context.log(`\n   Transaction ${index + 1}:`);
        context.log(`   - Resource: ${tx.resourceId}`);
        context.log(`   - Hash: ${tx.dataHash.substring(0, 16)}...`);
        context.log(`   - TX Hash: ${tx.transactionHash}`);
        context.log(`   - Block: ${tx.blockNumber}`);
      });
      context.log('✅ Resources logged to blockchain successfully!\n');
    }

    // Log FHIR storage details if available
    if (result.fhirStorage && result.fhirStorage.success) {
      context.log('\n💾 === FHIR STORAGE ===');
      context.log(`📦 Mode: ${result.fhirStorage.mode}`);
      result.fhirStorage.results.forEach((storage, index) => {
        context.log(`\n   Resource ${index + 1}:`);
        context.log(`   - Type: ${storage.resourceType}`);
        context.log(`   - ID: ${storage.resourceId}`);
        if (storage.storageMode === 'azurite') {
          context.log(`   - Blob: ${storage.blobName}`);
        } else {
          context.log(`   - Location: ${storage.location}`);
        }
      });
      context.log('✅ FHIR resources stored successfully!\n');
    }

    // Prepare the response
    const response: SymptomAssessmentResponse = {
      reply: result.reply,
      threadId: currentThreadId,
      patientId,
      sessionId: request.headers.get('x-session-id') || correlationId,
      completionStatus: result.completionStatus.status,
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
      correlationId,
    });

    return {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
      },
      jsonBody: response,
    };
  } catch (error) {
    const err = error as Error;

    logger.error('Error in symptom assessment function', {
      error: err,
      stack: err.stack,
      correlationId,
      type: err.constructor.name,
      threadId: threadId || 'undefined',
      patientId: patientId || 'undefined',
      // Add more detailed OpenAI error info
      openAIError: (error as any).response?.data || (error as any).data || null,
    });

    let status = 500;
    let body: ErrorResponse = {
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      correlationId,
      details: err.message,
    };

    if (error instanceof ValidationError) {
      status = 400;
      body = {
        error: err.message,
        code: 'VALIDATION_ERROR',
        correlationId,
      };
    } else if (error instanceof SafetyError) {
      status = 400;
      body = {
        error: err.message,
        code: 'SAFETY_ERROR',
        correlationId,
      };
    } else if (error instanceof FHIRError) {
      status = 400;
      body = {
        error: err.message,
        code: 'FHIR_ERROR',
        correlationId,
      };
    } else if (err.message?.includes('timeout') || (error as any).code === 'ETIMEDOUT') {
      status = 504;
      body = {
        error: 'Request timeout',
        code: 'TIMEOUT_ERROR',
        correlationId,
        details: 'The AI assistant took too long to respond',
      };
    }

    return {
      status,
      headers: {
        'Content-Type': 'application/json',
        'X-Correlation-Id': correlationId,
      },
      jsonBody: body,
    };
  }
}

// Register the HTTP function using Azure Functions v4 programming model
app.http('symptomAssessmentBot', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'symptom-assessment',
  handler: symptomAssessmentBot,
});
