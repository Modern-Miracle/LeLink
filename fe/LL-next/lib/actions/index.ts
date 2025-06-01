// Server Actions Index
// Central export for all server actions

export * from './triage'
export * from './patients'
export * from './appointments'
export * from './records'
export * from './blockchain'

// FHIR Storage actions
export * from '../fhir-storage/actions'

// Re-export common types
export type { ActionResult } from './triage'