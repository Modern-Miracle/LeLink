/**
 * @fileoverview FHIR Storage React Hooks
 * @module lib/fhir-storage/hooks
 * 
 * React hooks for FHIR Storage data management
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ActionResult,
  FHIRStorageResource,
  PatientResourcesData,
  PatientResourcesByTypeData,
  ResourceType,
  HealthCheckData,
  PatientsData,
} from './types'
import {
  checkFHIRStorageHealth,
  getAllPatients,
  getCurrentUserResources,
  getCurrentUserResourcesByType,
  getPatientResources,
  getPatientResourcesByType,
} from './actions'

// ===== HOOK STATE TYPES =====

interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

interface AsyncActions {
  refresh: () => Promise<void>
  reset: () => void
}

// ===== GENERIC ASYNC HOOK =====

function useAsyncAction<T>(
  action: () => Promise<ActionResult<T>>,
  deps: any[] = []
): AsyncState<T> & AsyncActions {
  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  })

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const result = await action()
      
      if (result.success) {
        setState({
          data: result.data || null,
          loading: false,
          error: null,
          lastUpdated: new Date(),
        })
      } else {
        setState({
          data: null,
          loading: false,
          error: result.error || 'Unknown error',
          lastUpdated: null,
        })
      }
    } catch (error) {
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        lastUpdated: null,
      })
    }
  }, deps)

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
      lastUpdated: null,
    })
  }, [])

  useEffect(() => {
    refresh()
  }, deps)

  return {
    ...state,
    refresh,
    reset,
  }
}

// ===== SPECIFIC HOOKS =====

/**
 * Hook for FHIR Storage service health
 */
export function useFHIRStorageHealth() {
  return useAsyncAction(checkFHIRStorageHealth)
}

/**
 * Hook for all patients
 */
export function useAllPatients() {
  return useAsyncAction(getAllPatients)
}

/**
 * Hook for current user's FHIR resources
 */
export function useCurrentUserResources() {
  return useAsyncAction(getCurrentUserResources)
}

/**
 * Hook for current user's resources by type
 */
export function useCurrentUserResourcesByType(resourceType: ResourceType) {
  return useAsyncAction(
    () => getCurrentUserResourcesByType(resourceType),
    [resourceType]
  )
}

/**
 * Hook for specific patient resources
 */
export function usePatientResources(patientId: string) {
  return useAsyncAction(
    () => getPatientResources(patientId),
    [patientId]
  )
}

/**
 * Hook for specific patient resources by type
 */
export function usePatientResourcesByType(patientId: string, resourceType: ResourceType) {
  return useAsyncAction(
    () => getPatientResourcesByType(patientId, resourceType),
    [patientId, resourceType]
  )
}

/**
 * Hook for current user's observations
 */
export function useCurrentUserObservations() {
  return useCurrentUserResourcesByType('Observation')
}

/**
 * Hook for current user's risk assessments
 */
export function useCurrentUserRiskAssessments() {
  return useCurrentUserResourcesByType('RiskAssessment')
}

/**
 * Hook for current user's encounters
 */
export function useCurrentUserEncounters() {
  return useCurrentUserResourcesByType('Encounter')
}

// ===== DERIVED STATE HOOKS =====

/**
 * Hook for filtered and sorted resources
 */
export function useFilteredResources(
  resources: FHIRStorageResource[] | null,
  options: {
    search?: string
    resourceTypes?: ResourceType[]
    statuses?: string[]
    startDate?: Date
    endDate?: Date
    sortBy?: 'date' | 'type' | 'name'
    sortOrder?: 'asc' | 'desc'
  } = {}
) {
  const [filteredData, setFilteredData] = useState<{
    resources: FHIRStorageResource[]
    totalCount: number
    filteredCount: number
  }>({
    resources: [],
    totalCount: 0,
    filteredCount: 0,
  })

  useEffect(() => {
    if (!resources) {
      setFilteredData({
        resources: [],
        totalCount: 0,
        filteredCount: 0,
      })
      return
    }

    let filtered = [...resources]
    const totalCount = resources.length

    // Apply filters
    if (options.resourceTypes && options.resourceTypes.length > 0) {
      filtered = filtered.filter(resource =>
        options.resourceTypes!.includes(resource.resourceType as ResourceType)
      )
    }

    if (options.statuses && options.statuses.length > 0) {
      filtered = filtered.filter(resource =>
        resource.status && options.statuses!.includes(resource.status)
      )
    }

    if (options.search) {
      const searchTerm = options.search.toLowerCase()
      filtered = filtered.filter(resource => {
        const searchableText = [
          resource.resourceType,
          resource.id,
          // Add more searchable fields as needed
        ].join(' ').toLowerCase()
        
        return searchableText.includes(searchTerm)
      })
    }

    if (options.startDate || options.endDate) {
      filtered = filtered.filter(resource => {
        const resourceDate = resource.meta?.lastUpdated
        if (!resourceDate) return false
        
        const date = new Date(resourceDate)
        if (options.startDate && date < options.startDate) return false
        if (options.endDate && date > options.endDate) return false
        
        return true
      })
    }

    // Apply sorting
    if (options.sortBy) {
      filtered.sort((a, b) => {
        let comparison = 0
        
        switch (options.sortBy) {
          case 'date':
            const dateA = a.meta?.lastUpdated || ''
            const dateB = b.meta?.lastUpdated || ''
            comparison = dateB.localeCompare(dateA)
            break
          case 'type':
            comparison = a.resourceType.localeCompare(b.resourceType)
            break
          case 'name':
            comparison = (a.id || '').localeCompare(b.id || '')
            break
        }
        
        return options.sortOrder === 'asc' ? comparison : -comparison
      })
    }

    setFilteredData({
      resources: filtered,
      totalCount,
      filteredCount: filtered.length,
    })
  }, [resources, options])

  return filteredData
}

// ===== UTILITY HOOKS =====

/**
 * Hook for managing multiple async operations
 */
export function useBatchFHIROperations() {
  const [operations, setOperations] = useState<Record<string, AsyncState<any>>>({})

  const addOperation = useCallback(<T>(
    key: string,
    action: () => Promise<ActionResult<T>>
  ) => {
    setOperations(prev => ({
      ...prev,
      [key]: { data: null, loading: true, error: null, lastUpdated: null },
    }))

    action().then(result => {
      setOperations(prev => ({
        ...prev,
        [key]: {
          data: result.success ? result.data : null,
          loading: false,
          error: result.success ? null : (result.error || 'Unknown error'),
          lastUpdated: result.success ? new Date() : null,
        },
      }))
    }).catch(error => {
      setOperations(prev => ({
        ...prev,
        [key]: {
          data: null,
          loading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          lastUpdated: null,
        },
      }))
    })
  }, [])

  const removeOperation = useCallback((key: string) => {
    setOperations(prev => {
      const { [key]: removed, ...rest } = prev
      return rest
    })
  }, [])

  const clearOperations = useCallback(() => {
    setOperations({})
  }, [])

  return {
    operations,
    addOperation,
    removeOperation,
    clearOperations,
    isLoading: Object.values(operations).some(op => op.loading),
    hasErrors: Object.values(operations).some(op => op.error),
    allCompleted: Object.keys(operations).length > 0 && 
                   !Object.values(operations).some(op => op.loading),
  }
}