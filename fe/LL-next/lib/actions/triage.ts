'use server';

import { auth } from '@/lib/auth';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import type { Observation, RiskAssessment } from '@/lib/types/fhir';

const AZURE_FUNCTIONS_URL = process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071';
const API_KEY = process.env.AZURE_FUNCTIONS_API_KEY;

// Input validation schemas
const submitSymptomSchema = z.object({
  message: z.string().min(1).max(1000),
  threadId: z.string().optional(),
  patientId: z.string().min(1),
});

const getTriageHistorySchema = z.object({
  patientId: z.string().min(1),
  limit: z.number().optional().default(10),
});

// Response types
export interface TriageResponse {
  reply: string;
  threadId: string;
  patientId: string;
  sessionId: string;
  completionStatus: {
    isComplete: boolean;
    status: string;
    risk?: {
      level: 'low' | 'medium' | 'high';
      condition: string;
    };
  };
  resources?: {
    RiskAssessment?: RiskAssessment;
    Observation?: Observation;
  };
  blockchain?: {
    success: boolean;
    results: Array<{
      transactionHash: string;
      blockNumber: number;
      resourceId: string;
    }>;
    contractAddress: string;
    network: string;
  };
  error?: string;
}

export interface TriageHistoryItem {
  id: string;
  timestamp: string;
  patientId: string;
  riskLevel?: 'low' | 'medium' | 'high';
  condition?: string;
  resources?: {
    RiskAssessment?: RiskAssessment;
    Observation?: Observation;
  };
}

export interface ActionResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Submit symptoms for AI-powered medical triage assessment
 * @param message - Patient's symptom description
 * @param threadId - Optional thread ID for continuing a conversation
 * @param patientId - Patient identifier
 * @returns Triage assessment response with optional FHIR resources
 */
export async function submitSymptoms(
  message: string,
  threadId?: string,
  patientId?: string
): Promise<ActionResult<TriageResponse>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Use session user ID as patient ID if not provided
    const effectivePatientId = patientId || session.user.id || 'unknown';

    // Validate input
    const validatedInput = submitSymptomSchema.parse({
      message,
      threadId,
      patientId: effectivePatientId,
    });

    // Call Azure Functions backend
    const response = await fetch(`${AZURE_FUNCTIONS_URL}/api/symptomAssessmentBot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(API_KEY && { 'x-api-key': API_KEY }),
      },
      body: JSON.stringify(validatedInput),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `Triage service error: ${response.status} - ${errorText}`,
      };
    }

    const data: TriageResponse = await response.json();

    // Revalidate triage page to show new data
    revalidatePath('/dashboard/triage');

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Submit symptoms error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit symptoms',
    };
  }
}

/**
 * Get triage history for a patient
 * @param patientId - Patient identifier
 * @param limit - Maximum number of records to return
 * @returns Array of triage history items
 */
export async function getTriageHistory(patientId?: string, limit?: number): Promise<ActionResult<TriageHistoryItem[]>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // Use session user ID as patient ID if not provided
    const effectivePatientId = patientId || session.user.id || 'unknown';

    // Validate input
    const validatedInput = getTriageHistorySchema.parse({
      patientId: effectivePatientId,
      limit,
    });

    // For now, return empty array as we need to implement FHIR storage queries
    // In a real implementation, this would query the FHIR storage service
    return {
      success: true,
      data: [],
    };
  } catch (error) {
    console.error('Get triage history error:', error);

    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map((e) => e.message).join(', ')}`,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get triage history',
    };
  }
}

/**
 * Continue an existing triage conversation
 * @param threadId - Existing conversation thread ID
 * @param message - Follow-up message
 * @returns Updated triage assessment
 */
export async function continueTriageConversation(
  threadId: string,
  message: string
): Promise<ActionResult<TriageResponse>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    const patientId = session.user.id || 'unknown';

    return submitSymptoms(message, threadId, patientId);
  } catch (error) {
    console.error('Continue conversation error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to continue conversation',
    };
  }
}

/**
 * Export triage assessment as PDF or other format
 * @param sessionId - Triage session ID
 * @param format - Export format (pdf, json, etc.)
 * @returns Export data or URL
 */
export async function exportTriageAssessment(
  sessionId: string,
  format: 'pdf' | 'json' = 'json'
): Promise<ActionResult<{ url?: string; data?: any }>> {
  try {
    // Authenticate user
    const session = await auth();
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
      };
    }

    // TODO: Implement export functionality
    // This would generate a PDF or return JSON data

    return {
      success: true,
      data: {
        url: `/api/export/triage/${sessionId}.${format}`,
      },
    };
  } catch (error) {
    console.error('Export assessment error:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export assessment',
    };
  }
}
