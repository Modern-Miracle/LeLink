/**
 * @fileoverview FHIR Storage Utilities
 * @module lib/fhir-storage/utils
 * 
 * Utility functions for working with FHIR Storage resources
 */

import {
  FHIRStorageResource,
  ObservationResource,
  RiskAssessmentResource,
  PatientResource,
  EncounterResource,
  ResourceType,
  PatientSummary,
  ResourceSummary,
} from './types'

// ===== TYPE GUARDS =====

export function isObservation(resource: FHIRStorageResource): resource is ObservationResource {
  return resource.resourceType === 'Observation'
}

export function isRiskAssessment(resource: FHIRStorageResource): resource is RiskAssessmentResource {
  return resource.resourceType === 'RiskAssessment'
}

export function isPatient(resource: FHIRStorageResource): resource is PatientResource {
  return resource.resourceType === 'Patient'
}

export function isEncounter(resource: FHIRStorageResource): resource is EncounterResource {
  return resource.resourceType === 'Encounter'
}

// ===== RESOURCE EXTRACTION UTILITIES =====

/**
 * Extract patient ID from resource reference
 */
export function extractPatientId(resource: FHIRStorageResource): string | null {
  if (isPatient(resource)) {
    return resource.id || null
  }

  if (resource.subject?.reference) {
    const match = resource.subject.reference.match(/Patient\/(.+)/)
    return match ? match[1] : null
  }

  // Check identifiers
  if (resource.identifier) {
    const patientIdentifier = resource.identifier.find(
      id => id.system === 'http://lelink.local/patient-id'
    )
    return patientIdentifier?.value || null
  }

  return null
}

/**
 * Get display name for a resource
 */
export function getResourceDisplayName(resource: FHIRStorageResource): string {
  if (isObservation(resource)) {
    return resource.code?.text || resource.code?.coding?.[0]?.display || 'Observation'
  }

  if (isRiskAssessment(resource)) {
    return resource.code?.text || 'Risk Assessment'
  }

  if (isPatient(resource)) {
    const name = resource.name?.[0]
    if (name) {
      const given = name.given?.join(' ') || ''
      const family = name.family || ''
      return `${given} ${family}`.trim() || 'Patient'
    }
    return 'Patient'
  }

  if (isEncounter(resource)) {
    return resource.type?.[0]?.text || 'Encounter'
  }

  return resource.resourceType
}

/**
 * Get resource status with human-readable label
 */
export function getResourceStatus(resource: FHIRStorageResource): {
  status: string
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  const status = resource.status || 'unknown'

  const statusMap: Record<string, { label: string; variant: any }> = {
    registered: { label: 'Registered', variant: 'secondary' },
    preliminary: { label: 'Preliminary', variant: 'outline' },
    final: { label: 'Final', variant: 'default' },
    amended: { label: 'Amended', variant: 'secondary' },
    corrected: { label: 'Corrected', variant: 'secondary' },
    cancelled: { label: 'Cancelled', variant: 'destructive' },
    planned: { label: 'Planned', variant: 'outline' },
    arrived: { label: 'Arrived', variant: 'secondary' },
    triaged: { label: 'Triaged', variant: 'secondary' },
    'in-progress': { label: 'In Progress', variant: 'default' },
    onleave: { label: 'On Leave', variant: 'outline' },
    finished: { label: 'Finished', variant: 'default' },
    unknown: { label: 'Unknown', variant: 'outline' },
  }

  return {
    status,
    ...(statusMap[status] || statusMap.unknown),
  }
}

/**
 * Get formatted date from resource
 */
export function getResourceDate(resource: FHIRStorageResource): string | null {
  // Try different date fields based on resource type
  if (isObservation(resource) && resource.effectiveDateTime) {
    return resource.effectiveDateTime
  }

  if (isRiskAssessment(resource) && resource.occurrenceDateTime) {
    return resource.occurrenceDateTime
  }

  if (isEncounter(resource) && resource.period?.start) {
    return resource.period.start
  }

  // Fallback to meta.lastUpdated
  return resource.meta?.lastUpdated || null
}

/**
 * Format date for display
 */
export function formatResourceDate(
  resource: FHIRStorageResource,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }
): string | null {
  const date = getResourceDate(resource)
  if (!date) return null

  try {
    return new Date(date).toLocaleDateString('en-US', options)
  } catch {
    return date
  }
}

/**
 * Get risk level from RiskAssessment
 */
export function getRiskLevel(resource: RiskAssessmentResource): {
  level: string
  label: string
  variant: 'default' | 'secondary' | 'destructive' | 'outline'
} {
  const prediction = resource.prediction?.[0]
  const riskCode = prediction?.qualitativeRisk?.coding?.[0]?.code || 'unknown'

  const riskMap: Record<string, { label: string; variant: any }> = {
    high: { label: 'High Risk', variant: 'destructive' },
    medium: { label: 'Medium Risk', variant: 'secondary' },
    low: { label: 'Low Risk', variant: 'default' },
    unknown: { label: 'Unknown Risk', variant: 'outline' },
  }

  return {
    level: riskCode,
    ...(riskMap[riskCode] || riskMap.unknown),
  }
}

/**
 * Get observation value as string
 */
export function getObservationValue(resource: ObservationResource): string | null {
  if (resource.valueString) {
    return resource.valueString
  }

  if (resource.valueQuantity) {
    const { value, unit } = resource.valueQuantity
    return `${value} ${unit || ''}`
  }

  return null
}

// ===== SUMMARY UTILITIES =====

/**
 * Create summary for a list of resources
 */
export function createResourcesSummary(resources: FHIRStorageResource[]): ResourceSummary[] {
  const summary = new Map<ResourceType, ResourceSummary>()

  for (const resource of resources) {
    const type = resource.resourceType as ResourceType
    const existing = summary.get(type)
    const lastUpdated = resource.meta?.lastUpdated

    if (existing) {
      existing.count++
      if (lastUpdated && (!existing.lastUpdated || lastUpdated > existing.lastUpdated)) {
        existing.lastUpdated = lastUpdated
      }
    } else {
      summary.set(type, {
        resourceType: type,
        count: 1,
        lastUpdated,
      })
    }
  }

  return Array.from(summary.values()).sort((a, b) => b.count - a.count)
}

/**
 * Create patient summary
 */
export function createPatientSummary(
  patientId: string,
  resources: FHIRStorageResource[]
): PatientSummary {
  const resourceSummary = createResourcesSummary(resources)
  const lastActivity = resources
    .map(r => r.meta?.lastUpdated)
    .filter(Boolean)
    .sort()
    .reverse()[0]

  return {
    patientId,
    totalResources: resources.length,
    resourceSummary,
    lastActivity,
  }
}

// ===== FILTERING UTILITIES =====

/**
 * Filter resources by date range
 */
export function filterResourcesByDateRange(
  resources: FHIRStorageResource[],
  startDate?: Date,
  endDate?: Date
): FHIRStorageResource[] {
  return resources.filter(resource => {
    const resourceDate = getResourceDate(resource)
    if (!resourceDate) return false

    const date = new Date(resourceDate)
    
    if (startDate && date < startDate) return false
    if (endDate && date > endDate) return false
    
    return true
  })
}

/**
 * Filter resources by status
 */
export function filterResourcesByStatus(
  resources: FHIRStorageResource[],
  statuses: string[]
): FHIRStorageResource[] {
  return resources.filter(resource => 
    resource.status && statuses.includes(resource.status)
  )
}

/**
 * Filter resources by search term
 */
export function filterResourcesBySearch(
  resources: FHIRStorageResource[],
  searchTerm: string
): FHIRStorageResource[] {
  const term = searchTerm.toLowerCase()
  
  return resources.filter(resource => {
    const displayName = getResourceDisplayName(resource).toLowerCase()
    const resourceType = (resource.resourceType || '').toLowerCase()
    const id = (resource.id || '').toLowerCase()
    
    // Search in observation value
    if (isObservation(resource)) {
      const value = getObservationValue(resource)?.toLowerCase()
      if (value?.includes(term)) return true
    }
    
    // Search in risk assessment rationale
    if (isRiskAssessment(resource)) {
      const rationale = resource.prediction?.[0]?.rationale?.toLowerCase()
      if (rationale?.includes(term)) return true
    }
    
    return (
      displayName.includes(term) ||
      resourceType.includes(term) ||
      id.includes(term)
    )
  })
}

// ===== SORTING UTILITIES =====

/**
 * Sort resources by date (newest first)
 */
export function sortResourcesByDate(
  resources: FHIRStorageResource[],
  ascending: boolean = false
): FHIRStorageResource[] {
  return [...resources].sort((a, b) => {
    const dateA = getResourceDate(a)
    const dateB = getResourceDate(b)
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    const comparison = new Date(dateB).getTime() - new Date(dateA).getTime()
    return ascending ? -comparison : comparison
  })
}

/**
 * Sort resources by type and then by date
 */
export function sortResourcesByTypeAndDate(
  resources: FHIRStorageResource[]
): FHIRStorageResource[] {
  return [...resources].sort((a, b) => {
    // First sort by resource type
    const typeComparison = a.resourceType.localeCompare(b.resourceType)
    if (typeComparison !== 0) return typeComparison
    
    // Then sort by date (newest first)
    const dateA = getResourceDate(a)
    const dateB = getResourceDate(b)
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  })
}