// Common types for the application

export interface TriageResponse {
  content: string;
  threadId?: string;
  resources?: FHIRResource[];
}

export interface FHIRResource {
  id: string;
  resourceType: string;
  [key: string]: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  resources?: FHIRResource[];
}
