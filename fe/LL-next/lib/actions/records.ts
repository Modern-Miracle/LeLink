'use server'

import { auth } from '@/lib/auth'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import type { MedicalRecord } from '@/lib/types/record'
import type { FHIRResource } from '@/lib/types/fhir'

// Input validation schemas
const createRecordSchema = z.object({
  patientId: z.string().min(1),
  type: z.enum(['observation', 'condition', 'procedure', 'medication', 'allergy', 'immunization']),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  date: z.string().datetime(),
  doctorId: z.string().optional(),
  attachments: z.array(z.object({
    name: z.string(),
    type: z.string(),
    url: z.string().url()
  })).optional(),
  fhirResource: z.any().optional() // FHIR resource if available
})

const updateRecordSchema = createRecordSchema.partial().extend({
  id: z.string()
})

const searchRecordsSchema = z.object({
  patientId: z.string().optional(),
  type: z.enum(['observation', 'condition', 'procedure', 'medication', 'allergy', 'immunization']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  query: z.string().optional(),
  page: z.number().optional().default(1),
  limit: z.number().optional().default(10)
})

// Response types
export interface RecordsListResponse {
  records: MedicalRecord[]
  total: number
  page: number
  totalPages: number
}

export interface BlockchainVerification {
  verified: boolean
  hash: string
  transactionHash?: string
  blockNumber?: number
  timestamp?: string
}

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Create a new medical record
 * @param recordData - Medical record information
 * @returns Created medical record
 */
export async function createMedicalRecord(
  recordData: z.infer<typeof createRecordSchema>
): Promise<ActionResult<MedicalRecord>> {
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
    const validatedData = createRecordSchema.parse(recordData)

    // Call API route
    const response = await fetch('/api/records', {
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
        error: errorData.error || 'Failed to create medical record'
      }
    }

    const record: MedicalRecord = await response.json()

    // Revalidate relevant pages
    revalidatePath('/dashboard/records')
    revalidatePath(`/dashboard/patients/${record.patientId}`)

    return {
      success: true,
      data: record
    }
  } catch (error) {
    console.error('Create medical record error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create medical record'
    }
  }
}

/**
 * Update an existing medical record
 * @param recordData - Updated medical record information with ID
 * @returns Updated medical record
 */
export async function updateMedicalRecord(
  recordData: z.infer<typeof updateRecordSchema>
): Promise<ActionResult<MedicalRecord>> {
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
    const validatedData = updateRecordSchema.parse(recordData)

    // Call API route
    const response = await fetch('/api/records', {
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
        error: errorData.error || 'Failed to update medical record'
      }
    }

    const record: MedicalRecord = await response.json()

    // Revalidate relevant pages
    revalidatePath('/dashboard/records')
    revalidatePath(`/dashboard/patients/${record.patientId}`)

    return {
      success: true,
      data: record
    }
  } catch (error) {
    console.error('Update medical record error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update medical record'
    }
  }
}

/**
 * Get medical records with filters and pagination
 * @param searchParams - Search parameters
 * @returns Paginated medical records list
 */
export async function searchMedicalRecords(
  searchParams?: z.infer<typeof searchRecordsSchema>
): Promise<ActionResult<RecordsListResponse>> {
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
    const validatedParams = searchRecordsSchema.parse(searchParams || {})

    // Build query string
    const queryParams = new URLSearchParams()
    if (validatedParams.patientId) queryParams.append('patientId', validatedParams.patientId)
    if (validatedParams.type) queryParams.append('type', validatedParams.type)
    if (validatedParams.startDate) queryParams.append('startDate', validatedParams.startDate)
    if (validatedParams.endDate) queryParams.append('endDate', validatedParams.endDate)
    if (validatedParams.query) queryParams.append('q', validatedParams.query)
    queryParams.append('page', validatedParams.page.toString())
    queryParams.append('limit', validatedParams.limit.toString())

    // Call API route
    const response = await fetch(`/api/records?${queryParams.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to search medical records'
      }
    }

    const data: RecordsListResponse = await response.json()

    return {
      success: true,
      data
    }
  } catch (error) {
    console.error('Search medical records error:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: `Validation error: ${error.errors.map(e => e.message).join(', ')}`
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to search medical records'
    }
  }
}

/**
 * Delete a medical record
 * @param recordId - Record ID to delete
 * @returns Success status
 */
export async function deleteMedicalRecord(
  recordId: string
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
    const response = await fetch(`/api/records/${recordId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error || 'Failed to delete medical record'
      }
    }

    // Revalidate relevant pages
    revalidatePath('/dashboard/records')

    return {
      success: true,
      data: { id: recordId }
    }
  } catch (error) {
    console.error('Delete medical record error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete medical record'
    }
  }
}

/**
 * Verify a medical record on the blockchain
 * @param recordId - Record ID to verify
 * @returns Blockchain verification status
 */
export async function verifyRecordOnBlockchain(
  recordId: string
): Promise<ActionResult<BlockchainVerification>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Implement blockchain verification
    // This would:
    // 1. Fetch the record
    // 2. Generate its hash
    // 3. Query the blockchain for matching hash
    // 4. Return verification status

    return {
      success: true,
      data: {
        verified: true,
        hash: '0x1234567890abcdef...',
        transactionHash: '0xabcdef1234567890...',
        blockNumber: 12345,
        timestamp: new Date().toISOString()
      }
    }
  } catch (error) {
    console.error('Verify record on blockchain error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify record'
    }
  }
}

/**
 * Export medical records
 * @param patientId - Patient ID
 * @param format - Export format
 * @returns Export data or URL
 */
export async function exportMedicalRecords(
  patientId: string,
  format: 'pdf' | 'json' | 'fhir' = 'json'
): Promise<ActionResult<{ url?: string; data?: any }>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Implement export functionality
    // This would:
    // 1. Gather all records for the patient
    // 2. Format according to requested type
    // 3. Generate file/URL

    return {
      success: true,
      data: {
        url: `/api/export/records/${patientId}.${format}`
      }
    }
  } catch (error) {
    console.error('Export medical records error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to export records'
    }
  }
}

/**
 * Share medical records with another healthcare provider
 * @param recordIds - Array of record IDs to share
 * @param recipientId - Healthcare provider ID
 * @param expiryDate - Optional expiry date for access
 * @returns Share confirmation
 */
export async function shareMedicalRecords(
  recordIds: string[],
  recipientId: string,
  expiryDate?: string
): Promise<ActionResult<{ shareId: string; expiryDate?: string }>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Implement sharing functionality
    // This would:
    // 1. Create access grant on blockchain
    // 2. Send notification to recipient
    // 3. Return share details

    return {
      success: true,
      data: {
        shareId: `share_${Date.now()}`,
        expiryDate: expiryDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  } catch (error) {
    console.error('Share medical records error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to share records'
    }
  }
}

/**
 * Import FHIR resources
 * @param fhirBundle - FHIR Bundle containing resources
 * @param patientId - Patient ID to associate resources with
 * @returns Import result
 */
export async function importFHIRResources(
  fhirBundle: any,
  patientId: string
): Promise<ActionResult<{ imported: number; failed: number }>> {
  try {
    // Authenticate user
    const session = await auth()
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required'
      }
    }

    // TODO: Implement FHIR import
    // This would:
    // 1. Validate FHIR bundle
    // 2. Process each resource
    // 3. Store in FHIR storage
    // 4. Log to blockchain

    return {
      success: true,
      data: {
        imported: 0,
        failed: 0
      }
    }
  } catch (error) {
    console.error('Import FHIR resources error:', error)
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to import resources'
    }
  }
}