'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { Patient } from '@/lib/types/patient'

// Input validation schemas
const createPatientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female', 'other']),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    country: z.string().optional()
  }).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string()
  }).optional()
})

const updatePatientSchema = createPatientSchema.partial().extend({
  id: z.string()
})

const searchPatientsSchema = z.object({
  query: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10),
  sortBy: z.enum(['name', 'dateOfBirth', 'lastVisit']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
})

// Response types
export interface PatientsListResponse {
  patients: Patient[]
  total: number
  page: number
  totalPages: number
}

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new patient record
 * @param patientData - Patient information
 * @returns Created patient record
 */
export async function createPatient(
  patientData: z.infer<typeof createPatientSchema>
): Promise<ActionResult<Patient>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Validate input
    const validatedData = createPatientSchema.parse(patientData)

    // Call API route
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to create patient'
      }
    }

    const patient: Patient = await response.json()

    // Revalidate patients page
    revalidatePath('/dashboard/patients')

    return {
      success: true,
      data: patient
    }
  } catch (error) {
    console.error('Create patient error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create patient'
    }
  }
}

/**
 * Update an existing patient record
 * @param patientData - Updated patient information with ID
 * @returns Updated patient record
 */
export async function updatePatient(
  patientData: z.infer<typeof updatePatientSchema>
): Promise<ActionResult<Patient>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Validate input
    const validatedData = updatePatientSchema.parse(patientData)

    // Call API route
    const response = await fetch(`/api/patients/${validatedData.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(validatedData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to update patient'
      }
    }

    const patient: Patient = await response.json()

    // Revalidate patients page
    revalidatePath('/dashboard/patients')
    revalidatePath(`/dashboard/patients/${patient.id}`)

    return {
      success: true,
      data: patient
    }
  } catch (error) {
    console.error('Update patient error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update patient'
    }
  }
}

/**
 * Get a single patient by ID
 * @param patientId - Patient ID
 * @returns Patient record
 */
export async function getPatient(
  patientId: string
): Promise<ActionResult<Patient>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Call API route
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to get patient'
      }
    }

    const patient: Patient = await response.json()

    return {
      success: true,
      data: patient
    }
  } catch (error) {
    console.error('Get patient error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get patient'
    }
  }
}

/**
 * Search patients with filters and pagination
 * @param searchParams - Search parameters
 * @returns Paginated patient list
 */
export async function searchPatients(
  searchParams?: z.infer<typeof searchPatientsSchema>
): Promise<ActionResult<PatientsListResponse>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // Validate input
    const validatedParams = searchPatientsSchema.parse(searchParams || {})

    // Build query string
    const queryParams = new URLSearchParams()
    if (validatedParams.query) queryParams.append('q', validatedParams.query)
    queryParams.append('page', validatedParams.page.toString())
    queryParams.append('limit', validatedParams.limit.toString())
    queryParams.append('sortBy', validatedParams.sortBy)
    queryParams.append('sortOrder', validatedParams.sortOrder)

    // Call API route
    const response = await fetch(`/api/patients?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to search patients'
      }
    }

    const data: PatientsListResponse = await response.json()

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Search patients error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search patients'
    }
  }
}

/**
 * Delete a patient record
 * @param patientId - Patient ID to delete
 * @returns Success status
 */
export async function deletePatient(
  patientId: string
): Promise<ActionResult<{ id: string }>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Check user permissions for deletion

    // Call API route
    const response = await fetch(`/api/patients/${patientId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to delete patient'
      }
    }

    // Revalidate patients page
    revalidatePath('/dashboard/patients')

    return {
      success: true,
      data: { id: patientId }
    }
  } catch (error) {
    console.error('Delete patient error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete patient'
    }
  }
}

/**
 * Get patient's medical history
 * @param patientId - Patient ID
 * @returns Medical history records
 */
export async function getPatientMedicalHistory(
  patientId: string
): Promise<ActionResult<any[]>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Implement medical history retrieval from FHIR storage
    // This would query FHIR resources associated with the patient

    return {
      success: true,
      data: []
    }
  } catch (error) {
    console.error('Get medical history error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get medical history'
    }
  }
}