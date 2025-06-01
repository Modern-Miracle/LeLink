/**
 * @fileoverview FHIR Storage API Types
 * @module lib/fhir-storage/types
 *
 * TypeScript definitions for FHIR Storage API server actions
 */

// Use base FHIR resource interface
interface BaseFhirResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

// ===== API RESPONSE TYPES =====

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message: string;
  timestamp: string;
}

// ===== FHIR STORAGE SPECIFIC TYPES =====

export interface FHIRStorageResource extends BaseFhirResource {
  status?: string;
  subject?: {
    reference: string;
    display?: string;
  };
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  meta?: {
    lastUpdated?: string;
    source?: string;
    profile?: string[];
    environment?: string;
  };
}

export interface HealthCheckData {
  service: string;
  status: string;
  storage: {
    initialized: boolean;
    storageMode: string;
    containerName: string;
    environment: string;
  };
  timestamp: string;
}

export interface PatientsData {
  patients: string[];
  count: number;
}

export interface PatientResourcesData {
  patientId: string;
  resources: FHIRStorageResource[];
  resourcesByType: Record<string, FHIRStorageResource[]>;
  totalCount: number;
  resourceTypes: string[];
}

export interface PatientResourcesByTypeData {
  patientId: string;
  resourceType: string;
  resources: FHIRStorageResource[];
  totalCount: number;
  availableResourceTypes: string[];
}

// ===== ACTION RESULT TYPES =====

export interface ActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// ===== FHIR RESOURCE TYPES (Extended) =====

export interface ObservationResource extends FHIRStorageResource {
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  category?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  effectiveDateTime?: string;
  performer?: Array<{
    reference: string;
    display: string;
  }>;
  valueString?: string;
  valueQuantity?: {
    value: number;
    unit: string;
    system: string;
    code: string;
  };
}

export interface RiskAssessmentResource extends FHIRStorageResource {
  resourceType: 'RiskAssessment';
  status: 'registered' | 'preliminary' | 'final' | 'amended' | 'corrected' | 'cancelled';
  code?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  occurrenceDateTime?: string;
  prediction?: Array<{
    outcome: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text: string;
    };
    qualitativeRisk?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text: string;
    };
    rationale?: string;
  }>;
  performer?: {
    reference: string;
    display: string;
  };
}

export interface PatientResource extends FHIRStorageResource {
  resourceType: 'Patient';
  name?: Array<{
    use?: string;
    family?: string;
    given?: string[];
    text?: string;
  }>;
  gender?: 'male' | 'female' | 'other' | 'unknown';
  birthDate?: string;
  address?: Array<{
    use?: string;
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
  telecom?: Array<{
    system: string;
    value: string;
    use?: string;
  }>;
}

export interface EncounterResource extends FHIRStorageResource {
  resourceType: 'Encounter';
  status: 'planned' | 'arrived' | 'triaged' | 'in-progress' | 'onleave' | 'finished' | 'cancelled';
  class: {
    system: string;
    code: string;
    display: string;
  };
  type?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
  period?: {
    start?: string;
    end?: string;
  };
  reasonCode?: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  }>;
}

// ===== UNION TYPES =====

export type AnyFHIRResource =
  | ObservationResource
  | RiskAssessmentResource
  | PatientResource
  | EncounterResource
  | FHIRStorageResource;

// ===== UTILITY TYPES =====

export type ResourceType = 'Patient' | 'Observation' | 'RiskAssessment' | 'Encounter';

export interface ResourceSummary {
  resourceType: ResourceType;
  count: number;
  lastUpdated?: string;
}

export interface PatientSummary {
  patientId: string;
  totalResources: number;
  resourceSummary: ResourceSummary[];
  lastActivity?: string;
}

// ===== ERROR TYPES =====

export interface FHIRStorageError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export class FHIRStorageAPIError extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string = 'UNKNOWN_ERROR', details?: Record<string, any>) {
    super(message);
    this.name = 'FHIRStorageAPIError';
    this.code = code;
    this.details = details;
  }
}

// ===== CONFIGURATION =====

export interface FHIRStorageConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

export const DEFAULT_CONFIG: FHIRStorageConfig = {
  baseURL: process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071/api/fhir-storage',
  timeout: 30000, // Increase timeout to 30 seconds
  retries: 3, // Increase retries
  retryDelay: 2000, // Increase retry delay
};
