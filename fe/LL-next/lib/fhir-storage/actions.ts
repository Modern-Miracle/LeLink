/**
 * @fileoverview FHIR Storage Server Actions
 * @module lib/fhir-storage/actions
 * 
 * Next.js server actions for FHIR Storage API
 */

'use server'

import { getSession } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { fhirStorageClient } from './client'
import {
  ActionResult,
  HealthCheckData,
  PatientsData,
  PatientResourcesData,
  PatientResourcesByTypeData,
  FHIRStorageResource,
  FHIRStorageAPIError,
  ResourceType,
} from './types'

// ===== INPUT VALIDATION SCHEMAS =====

const patientIdSchema = z.string().min(1, 'Patient ID is required')
const resourceTypeSchema = z.enum(['Patient', 'Observation', 'RiskAssessment', 'Encounter'])
const resourceIdSchema = z.string().min(1, 'Resource ID is required')

// ===== UTILITY FUNCTIONS =====

/**
 * Handle errors and convert to ActionResult
 */
function handleError(error: unknown, defaultMessage: string = 'An error occurred'): ActionResult {
  console.error('FHIR Storage Action Error:', error)

  if (error instanceof FHIRStorageAPIError) {
    return {
      success: false,
      error: error.message,
      message: error.message,
    }
  }

  if (error instanceof z.ZodError) {
    return {
      success: false,
      error: error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
      message: 'Validation error',
    }
  }

  const errorMessage = error instanceof Error ? error.message : defaultMessage
  return {
    success: false,
    error: errorMessage,
    message: errorMessage,
  }
}

/**
 * Check authentication
 */
async function checkAuth(): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    console.log('🔐 [FHIR Storage Auth] Checking authentication...')
    
    // Handle build-time calls gracefully (only during actual build, not runtime)
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development' && process.env.CI === 'true') {
      console.log('🏗️ [FHIR Storage Auth] Build time - skipping auth check')
      return {
        success: false,
        error: 'Build time - no session available',
      }
    }
    
    const session = await getSession()
    
    console.log('🔐 [FHIR Storage Auth] Session details:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasUserId: !!session?.user?.id,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      userName: session?.user?.name,
      sessionKeys: session ? Object.keys(session) : [],
      userKeys: session?.user ? Object.keys(session.user) : []
    })
    
    if (!session?.user?.id) {
      console.log('❌ [FHIR Storage Auth] No valid session or user ID found')
      return {
        success: false,
        error: 'Authentication required',
      }
    }
    
    console.log('✅ [FHIR Storage Auth] Authentication successful for user:', session.user.id)
    return {
      success: true,
      userId: session.user.id,
    }
  } catch (error) {
    console.error('💥 [FHIR Storage Auth] Authentication error:', error)
    
    // If this is a build-time error, return graceful failure
    if (typeof window === 'undefined' && process.env.NODE_ENV !== 'development' && process.env.CI === 'true') {
      return {
        success: false,
        error: 'Build time - authentication not available',
      }
    }
    
    return {
      success: false,
      error: 'Authentication failed',
    }
  }
}

// ===== SERVER ACTIONS =====

/**
 * Check FHIR Storage service health
 */
export async function checkFHIRStorageHealth(): Promise<ActionResult<HealthCheckData>> {
  try {
    console.log('🏥 [FHIR Storage] checkFHIRStorageHealth called')
    
    const response = await fhirStorageClient.get<HealthCheckData>('/health')
    
    console.log('🏥 [FHIR Storage] Health check response:', {
      success: !!response.data,
      service: response.data?.service,
      status: response.data?.status,
      storageMode: response.data?.storage?.storageMode,
      environment: response.data?.storage?.environment,
      initialized: response.data?.storage?.initialized
    })
    
    return {
      success: true,
      data: response.data,
      message: 'Health check completed',
    }
  } catch (error) {
    console.error('💥 [FHIR Storage] Health check failed:', error)
    return handleError(error, 'Failed to check service health')
  }
}

/**
 * Get all patients with stored FHIR resources
 */
export async function getAllPatients(): Promise<ActionResult<PatientsData>> {
  try {
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    const response = await fhirStorageClient.get<PatientsData>('/patients')
    
    return {
      success: true,
      data: response.data,
      message: `Found ${response.data?.count || 0} patients`,
    }
  } catch (error) {
    return handleError(error, 'Failed to get patients')
  }
}

/**
 * Get all resources for a specific patient
 */
export async function getPatientResources(patientId: string): Promise<ActionResult<PatientResourcesData>> {
  try {
    console.log('📊 [FHIR Storage] getPatientResources called with patientId:', patientId)
    
    const authResult = await checkAuth()
    if (!authResult.success) {
      console.log('❌ [FHIR Storage] getPatientResources auth failed:', authResult.error)
      return {
        success: false,
        error: authResult.error,
      }
    }

    // Validate input
    const validatedPatientId = patientIdSchema.parse(patientId)
    console.log('✅ [FHIR Storage] getPatientResources validated patientId:', validatedPatientId)

    const apiUrl = `/patients/${encodeURIComponent(validatedPatientId)}/resources`
    console.log('🌐 [FHIR Storage] Making API call to:', apiUrl)

    const response = await fhirStorageClient.get<PatientResourcesData>(apiUrl)
    
    console.log('📈 [FHIR Storage] getPatientResources API response:', {
      success: !!response.data,
      totalCount: response.data?.totalCount,
      resourceCount: response.data?.resources?.length,
      resourceTypes: response.data?.resourceTypes,
      hasResourcesByType: !!response.data?.resourcesByType,
      responseKeys: response.data ? Object.keys(response.data) : []
    })
    
    // Revalidate relevant paths
    revalidatePath('/dashboard/patients')
    revalidatePath(`/dashboard/patients/${validatedPatientId}`)
    
    const result = {
      success: true,
      data: response.data,
      message: `Found ${response.data?.totalCount || 0} resources for patient`,
    }
    
    console.log('✅ [FHIR Storage] getPatientResources returning:', {
      success: result.success,
      message: result.message,
      dataExists: !!result.data
    })
    
    return result
  } catch (error) {
    console.error('💥 [FHIR Storage] getPatientResources error:', error)
    return handleError(error, 'Failed to get patient resources')
  }
}

/**
 * Get a specific FHIR resource
 */
export async function getSpecificResource(
  patientId: string,
  resourceType: ResourceType,
  resourceId: string
): Promise<ActionResult<FHIRStorageResource>> {
  try {
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    // Validate input
    const validatedPatientId = patientIdSchema.parse(patientId)
    const validatedResourceType = resourceTypeSchema.parse(resourceType)
    const validatedResourceId = resourceIdSchema.parse(resourceId)

    const response = await fhirStorageClient.get<FHIRStorageResource>(
      `/resource/${encodeURIComponent(validatedPatientId)}/${encodeURIComponent(validatedResourceType)}/${encodeURIComponent(validatedResourceId)}`
    )
    
    return {
      success: true,
      data: response.data,
      message: 'Resource retrieved successfully',
    }
  } catch (error) {
    return handleError(error, 'Failed to get specific resource')
  }
}

/**
 * Get all resources of a specific type for a patient
 */
export async function getPatientResourcesByType(
  patientId: string,
  resourceType: ResourceType
): Promise<ActionResult<PatientResourcesByTypeData>> {
  try {
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    // Validate input
    const validatedPatientId = patientIdSchema.parse(patientId)
    const validatedResourceType = resourceTypeSchema.parse(resourceType)

    const response = await fhirStorageClient.get<PatientResourcesByTypeData>(
      `/${encodeURIComponent(validatedPatientId)}/${encodeURIComponent(validatedResourceType)}`
    )
    
    // Revalidate relevant paths
    revalidatePath('/dashboard/records')
    revalidatePath(`/dashboard/patients/${validatedPatientId}`)
    
    return {
      success: true,
      data: response.data,
      message: `Found ${response.data?.totalCount || 0} ${resourceType} resources`,
    }
  } catch (error) {
    return handleError(error, 'Failed to get patient resources by type')
  }
}

/**
 * Get current user's FHIR resources (convenience function)
 */
export async function getCurrentUserResources(): Promise<ActionResult<PatientResourcesData>> {
  try {
    console.log('🏠 [FHIR Storage] getCurrentUserResources called')
    
    const authResult = await checkAuth()
    if (!authResult.success) {
      console.log('❌ [FHIR Storage] getCurrentUserResources auth failed:', authResult.error)
      return {
        success: false,
        error: authResult.error,
      }
    }

    console.log('🎯 [FHIR Storage] getCurrentUserResources calling getPatientResources with userId:', authResult.userId)
    const result = await getPatientResources(authResult.userId!)
    
    console.log('📋 [FHIR Storage] getCurrentUserResources result:', {
      success: result.success,
      hasData: !!result.data,
      resourceCount: result.data?.resources?.length || 0,
      error: result.error
    })
    
    return result
  } catch (error) {
    console.error('💥 [FHIR Storage] getCurrentUserResources error:', error)
    return handleError(error, 'Failed to get current user resources')
  }
}

/**
 * Get current user's resources by type (convenience function)
 */
export async function getCurrentUserResourcesByType(
  resourceType: ResourceType
): Promise<ActionResult<PatientResourcesByTypeData>> {
  try {
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    return getPatientResourcesByType(authResult.userId!, resourceType)
  } catch (error) {
    return handleError(error, 'Failed to get current user resources by type')
  }
}

/**
 * Get observations for current user (convenience function)
 */
export async function getCurrentUserObservations(): Promise<ActionResult<PatientResourcesByTypeData>> {
  return getCurrentUserResourcesByType('Observation')
}

/**
 * Get risk assessments for current user (convenience function)
 */
export async function getCurrentUserRiskAssessments(): Promise<ActionResult<PatientResourcesByTypeData>> {
  return getCurrentUserResourcesByType('RiskAssessment')
}

/**
 * Get encounters for current user (convenience function)
 */
export async function getCurrentUserEncounters(): Promise<ActionResult<PatientResourcesByTypeData>> {
  return getCurrentUserResourcesByType('Encounter')
}

/**
 * Search for resources across multiple criteria (advanced function)
 */
export async function searchPatientResources(
  patientId: string,
  options: {
    resourceTypes?: ResourceType[]
    limit?: number
    lastUpdatedAfter?: string
  } = {}
): Promise<ActionResult<{
  patientId: string
  resources: FHIRStorageResource[]
  totalCount: number
  filteredCount: number
  appliedFilters: Record<string, any>
}>> {
  try {
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    // Validate input
    const validatedPatientId = patientIdSchema.parse(patientId)

    // Get all resources for the patient
    const allResourcesResult = await getPatientResources(validatedPatientId)
    if (!allResourcesResult.success || !allResourcesResult.data) {
      return {
        success: false,
        error: allResourcesResult.error || 'Failed to get patient resources',
      }
    }

    let filteredResources = allResourcesResult.data.resources

    // Apply resource type filter
    if (options.resourceTypes && options.resourceTypes.length > 0) {
      filteredResources = filteredResources.filter(resource =>
        options.resourceTypes!.includes((resource.resourceType || '') as ResourceType)
      )
    }

    // Apply last updated filter
    if (options.lastUpdatedAfter) {
      const afterDate = new Date(options.lastUpdatedAfter)
      filteredResources = filteredResources.filter(resource => {
        if (!resource.meta?.lastUpdated) return false
        return new Date(resource.meta.lastUpdated) > afterDate
      })
    }

    // Apply limit
    if (options.limit && options.limit > 0) {
      filteredResources = filteredResources.slice(0, options.limit)
    }

    return {
      success: true,
      data: {
        patientId: validatedPatientId,
        resources: filteredResources,
        totalCount: allResourcesResult.data.totalCount,
        filteredCount: filteredResources.length,
        appliedFilters: options,
      },
      message: `Found ${filteredResources.length} resources matching criteria`,
    }
  } catch (error) {
    return handleError(error, 'Failed to search patient resources')
  }
}

/**
 * Get all users in the system (for practitioners)
 */
export async function getAllUsers(
  page: number = 1,
  limit: number = 10,
  search?: string
): Promise<ActionResult<{
  users: Array<{
    id: string
    resourceType: string
    name: string
    email: string
    lastUpdated: string
    resourceCount: number
  }>
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}>> {
  try {
    console.log('👥 [FHIR Storage] getAllUsers called', { page, limit, search })
    
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    // Build query parameters
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    })
    
    if (search) {
      params.append('search', search)
    }

    const response = await fhirStorageClient.get<{
      users: Array<{
        id: string
        resourceType: string
        name: string
        email: string
        lastUpdated: string
        resourceCount: number
      }>
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
        hasNext: boolean
        hasPrev: boolean
      }
    }>(`/users?${params.toString()}`)
    
    console.log('👥 [FHIR Storage] getAllUsers response:', {
      userCount: response.data?.users?.length,
      total: response.data?.pagination?.total,
      page: response.data?.pagination?.page
    })
    
    return {
      success: true,
      data: response.data,
      message: `Found ${response.data?.users?.length || 0} users`,
    }
  } catch (error) {
    console.error('💥 [FHIR Storage] getAllUsers error:', error)
    return handleError(error, 'Failed to get users')
  }
}

/**
 * Get user profile with all resources (for practitioners viewing patient details)
 */
export async function getUserProfile(userId: string): Promise<ActionResult<{
  profile: {
    id: string
    resourceType: string
    name: {
      full: string
      given: string[]
      family: string
    }
    email: string
    phone: string
    address: any
    jobTitle: string
    lastUpdated: string
    source: string
  }
  resources: FHIRStorageResource[]
  resourcesByType: Record<string, FHIRStorageResource[]>
  totalResources: number
  resourceTypes: string[]
}>> {
  try {
    console.log('👤 [FHIR Storage] getUserProfile called for:', userId)
    
    const authResult = await checkAuth()
    if (!authResult.success) {
      return {
        success: false,
        error: authResult.error,
      }
    }

    const validatedUserId = patientIdSchema.parse(userId)
    
    const response = await fhirStorageClient.get<{
      profile: {
        id: string
        resourceType: string
        name: {
          full: string
          given: string[]
          family: string
        }
        email: string
        phone: string
        address: any
        jobTitle: string
        lastUpdated: string
        source: string
      }
      resources: FHIRStorageResource[]
      resourcesByType: Record<string, FHIRStorageResource[]>
      totalResources: number
      resourceTypes: string[]
    }>(`/users/${encodeURIComponent(validatedUserId)}/profile`)
    
    console.log('👤 [FHIR Storage] getUserProfile response:', {
      hasProfile: !!response.data?.profile,
      resourceCount: response.data?.totalResources,
      resourceTypes: response.data?.resourceTypes
    })
    
    return {
      success: true,
      data: response.data,
      message: 'User profile retrieved successfully',
    }
  } catch (error) {
    console.error('💥 [FHIR Storage] getUserProfile error:', error)
    return handleError(error, 'Failed to get user profile')
  }
}