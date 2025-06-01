/**
 * @fileoverview FHIR Storage API Functions
 * @module functions/fhir-storage
 *
 * Provides REST API endpoints for accessing FHIR resources from blob storage:
 * - GET /api/fhir-storage/resource/{patientId}/{resourceType}/{resourceId}
 * - GET /api/fhir-storage/patients
 * - GET /api/fhir-storage/patients/{patientId}/resources
 * - GET /api/fhir-storage/resources/{resourceType}
 */

import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { fhirStorageService, FHIRResource } from '../../services/fhirStorage.js';
import { Logger } from '../../utils/logger.js';

const logger = new Logger();

/**
 * Helper function to check for email uniqueness across Patient and Practitioner resources
 */
async function checkEmailUniqueness(email: string, excludeUserId?: string): Promise<string | null> {
  if (!email) return null;
  
  try {
    console.log('[EMAIL_UNIQUENESS_CHECK] Checking email uniqueness for:', email);
    
    // Get all patients
    const allPatients = await fhirStorageService.getAllPatients();
    
    for (const patientId of allPatients) {
      try {
        // Check Patient resources
        const patientResources = await fhirStorageService.listPatientResources(patientId);
        
        for (const resource of patientResources) {
          if ((resource.resourceType === 'Patient' || resource.resourceType === 'Practitioner') && 
              resource.id !== excludeUserId) {
            
            // Check if this resource has the same email in telecom or contact info
            const resourceEmail = extractEmailFromResource(resource);
            if (resourceEmail && resourceEmail.toLowerCase() === email.toLowerCase()) {
              console.log('[EMAIL_UNIQUENESS_CHECK] Found duplicate email in resource:', resource.id);
              return resource.id;
            }
          }
        }
      } catch (error) {
        // Continue checking other patients even if one fails
        console.log('[EMAIL_UNIQUENESS_CHECK] Error checking patient:', patientId, error);
      }
    }
    
    console.log('[EMAIL_UNIQUENESS_CHECK] Email is unique:', email);
    return null;
    
  } catch (error) {
    console.error('[EMAIL_UNIQUENESS_CHECK] Error during email uniqueness check:', error);
    return null; // If check fails, allow creation (don't block user)
  }
}

/**
 * Helper function to extract email from FHIR resource
 */
function extractEmailFromResource(resource: any): string | null {
  // Check telecom field for email
  if (resource.telecom) {
    for (const contact of resource.telecom) {
      if (contact.system === 'email' && contact.value) {
        return contact.value;
      }
    }
  }
  
  // Check identifier for email-based identifiers
  if (resource.identifier) {
    for (const identifier of resource.identifier) {
      if (identifier.system?.includes('email') && identifier.value) {
        return identifier.value;
      }
    }
  }
  
  return null;
}

/**
 * Helper function to extract role from FHIR resource extensions
 */
function extractRoleFromResource(resource: any): string | null {
  // Check for role extension
  if (resource.extension) {
    for (const extension of resource.extension) {
      if (extension.url === 'http://lelink.health/fhir/StructureDefinition/user-role' && extension.valueString) {
        return extension.valueString;
      }
    }
  }
  
  // Fallback to resource type
  if (resource.resourceType === 'Patient' || resource.resourceType === 'Practitioner') {
    return resource.resourceType;
  }
  
  return null;
}

/**
 * Response helper for consistent API responses
 */
function createResponse(statusCode: number, data: any, message?: string): HttpResponseInit {
  const response: any = {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  };

  if (statusCode >= 200 && statusCode < 300) {
    response.body = JSON.stringify({
      success: true,
      data,
      message: message || 'Success',
      timestamp: new Date().toISOString(),
    });
  } else {
    response.body = JSON.stringify({
      success: false,
      error: data || 'An error occurred',
      message: message || 'Error',
      timestamp: new Date().toISOString(),
    });
  }

  return response;
}

/**
 * GET /api/fhir-storage/resource/{patientId}/{resourceType}/{resourceId}
 * Retrieve a specific FHIR resource
 */
async function getResource(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const patientId = request.params.patientId;
    const resourceType = request.params.resourceType;
    const resourceId = request.params.resourceId;

    if (!patientId || !resourceType || !resourceId) {
      return createResponse(400, null, 'Missing required parameters: patientId, resourceType, resourceId');
    }

    logger.info('Getting FHIR resource', {
      patientId,
      resourceType,
      resourceId,
      requestId: context.invocationId,
    });

    const resource = await fhirStorageService.getResource(patientId, resourceType, resourceId);

    if (!resource) {
      return createResponse(404, null, 'Resource not found');
    }

    logger.info('FHIR resource retrieved successfully', {
      patientId,
      resourceType,
      resourceId,
      requestId: context.invocationId,
    });

    return createResponse(200, resource, 'Resource retrieved successfully');
  } catch (error) {
    logger.error('Failed to get FHIR resource', {
      error: error as Error,
      patientId: request.params.patientId,
      resourceType: request.params.resourceType,
      resourceId: request.params.resourceId,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve resource');
  }
}

/**
 * GET /api/fhir-storage/patients
 * Get all patient IDs that have stored resources
 */
async function getPatients(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    logger.info('Getting all patients', {
      requestId: context.invocationId,
    });

    const patientIds = await fhirStorageService.getAllPatients();

    logger.info('Patients retrieved successfully', {
      patientCount: patientIds.length,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      patients: patientIds,
      count: patientIds.length,
    }, 'Patients retrieved successfully');
  } catch (error) {
    logger.error('Failed to get patients', {
      error: error as Error,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve patients');
  }
}

/**
 * GET /api/fhir-storage/patients/{patientId}/resources
 * Get all resources for a specific patient
 */
async function getPatientResources(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const patientId = request.params.patientId;

    if (!patientId) {
      return createResponse(400, null, 'Missing required parameter: patientId');
    }

    logger.info('Getting patient resources', {
      patientId,
      requestId: context.invocationId,
    });

    const resources = await fhirStorageService.listPatientResources(patientId);

    logger.info('Patient resources retrieved successfully', {
      patientId,
      resourceCount: resources.length,
      requestId: context.invocationId,
    });

    // Group resources by type for easier consumption
    const resourcesByType: Record<string, FHIRResource[]> = {};
    resources.forEach(resource => {
      if (!resourcesByType[resource.resourceType]) {
        resourcesByType[resource.resourceType] = [];
      }
      resourcesByType[resource.resourceType].push(resource);
    });

    return createResponse(200, {
      patientId,
      resources,
      resourcesByType,
      totalCount: resources.length,
      resourceTypes: Object.keys(resourcesByType),
    }, 'Patient resources retrieved successfully');
  } catch (error) {
    logger.error('Failed to get patient resources', {
      error: error as Error,
      patientId: request.params.patientId,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve patient resources');
  }
}

/**
 * GET /api/fhir-storage/{patientId}/{resourceType}
 * Get all resources of a specific type for a specific patient
 */
async function getPatientResourcesByType(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const patientId = request.params.patientId;
    const resourceType = request.params.resourceType;

    if (!patientId) {
      return createResponse(400, null, 'Missing required parameter: patientId');
    }

    if (!resourceType) {
      return createResponse(400, null, 'Missing required parameter: resourceType');
    }

    logger.info('Getting patient resources by type', {
      patientId,
      resourceType,
      requestId: context.invocationId,
    });

    // Get all resources for the patient
    const allResources = await fhirStorageService.listPatientResources(patientId);
    
    // Filter by resource type
    const filteredResources = allResources.filter(resource => resource.resourceType === resourceType);

    logger.info('Patient resources by type retrieved successfully', {
      patientId,
      resourceType,
      totalPatientResources: allResources.length,
      filteredResourceCount: filteredResources.length,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      patientId,
      resourceType,
      resources: filteredResources,
      totalCount: filteredResources.length,
      availableResourceTypes: [...new Set(allResources.map(r => r.resourceType))],
    }, 'Patient resources by type retrieved successfully');
  } catch (error) {
    logger.error('Failed to get patient resources by type', {
      error: error as Error,
      patientId: request.params.patientId,
      resourceType: request.params.resourceType,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve patient resources by type');
  }
}

/**
 * POST /api/fhir-storage/patients
 * Create a new Patient resource
 */
async function createPatient(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    console.log('[FHIR_CREATE_PATIENT_DEBUG] Starting patient creation...');
    
    const body = await request.text();
    if (!body) {
      return createResponse(400, null, 'Request body is required');
    }

    const patientResource = JSON.parse(body);
    console.log('[FHIR_CREATE_PATIENT_DEBUG] Patient resource:', JSON.stringify(patientResource, null, 2));

    if (!patientResource.resourceType || patientResource.resourceType !== 'Patient') {
      return createResponse(400, null, 'Invalid resource type. Expected "Patient"');
    }

    // Extract user ID from X-User-ID header for resource organization
    const userIdHeader = request.headers.get('X-User-ID');
    const resourceId = patientResource.id; // Use the unique resource ID provided
    
    if (!resourceId) {
      return createResponse(400, null, 'Patient resource ID is required');
    }

    // Extract user ID from identifier array for duplicate checking
    const userIdFromIdentifier = patientResource.identifier?.find(
      (id: any) => id.system === 'http://lelink.healthcare/user-id'
    )?.value;
    
    const userId = userIdHeader || userIdFromIdentifier;
    if (!userId) {
      return createResponse(400, null, 'User ID is required (X-User-ID header or identifier)');
    }

    console.log('[FHIR_CREATE_PATIENT_DEBUG] Using resource ID:', resourceId, 'User ID:', userId);

    // Check for existing Patient resource by searching identifier
    try {
      const allResources = await fhirStorageService.listPatientResources(userId);
      const existingPatient = allResources.find(r => r.resourceType === 'Patient');
      if (existingPatient) {
        console.log('[FHIR_CREATE_PATIENT_DEBUG] Patient resource already exists for user:', userId);
        return createResponse(200, existingPatient, 'Patient resource already exists');
      }
    } catch (error) {
      // Resource doesn't exist, which is fine - we'll create it
      console.log('[FHIR_CREATE_PATIENT_DEBUG] No existing patient found, proceeding with creation');
    }

    // Check for email uniqueness if email is provided
    const patientEmail = extractEmailFromResource(patientResource);
    if (patientEmail) {
      const duplicateUserId = await checkEmailUniqueness(patientEmail, userId);
      if (duplicateUserId) {
        console.log('[FHIR_CREATE_PATIENT_DEBUG] Email already exists for user:', duplicateUserId);
        return createResponse(409, null, `Email ${patientEmail} is already registered to another user`);
      }
    }

    // Keep the unique resource ID as provided (don't override with session ID)
    console.log('[FHIR_CREATE_PATIENT_DEBUG] Using unique resource ID:', resourceId);

    // Add role information as FHIR extension - role can be provided in request or defaults to Patient
    if (!patientResource.extension) {
      patientResource.extension = [];
    }
    
    // Remove any existing role extension and add new one
    patientResource.extension = patientResource.extension.filter(
      (ext: any) => ext.url !== 'http://lelink.health/fhir/StructureDefinition/user-role'
    );
    
    // Use role from request body or default to Patient
    const userRole = patientResource.userRole || 'Patient';
    patientResource.extension.push({
      url: 'http://lelink.health/fhir/StructureDefinition/user-role',
      valueString: userRole
    });

    // Remove userRole from resource as it's now in extension
    delete patientResource.userRole;

    console.log('[FHIR_CREATE_PATIENT_DEBUG] Added role extension to Patient resource:', userRole);

    // Add metadata
    patientResource.meta = {
      ...patientResource.meta,
      lastUpdated: new Date().toISOString(),
      source: patientResource.meta?.source || 'LeLink-Onboarding',
    };

    logger.info('Creating Patient resource', {
      patientId: patientResource.id,
      requestId: context.invocationId,
    });
    
    const result = await fhirStorageService.storeResource(patientResource);
    console.log('[FHIR_CREATE_PATIENT_DEBUG] Storage result:', result);

    logger.info('Patient resource created successfully', {
      patientId: patientResource.id,
      storageUserId: userId,
      requestId: context.invocationId,
    });

    return createResponse(201, patientResource, 'Patient resource created successfully');
  } catch (error) {
    console.error('[FHIR_CREATE_PATIENT_DEBUG] Error creating patient:', error);
    logger.error('Failed to create Patient resource', {
      error: error as Error,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to create Patient resource');
  }
}

/**
 * POST /api/fhir-storage/practitioners
 * Create a new Practitioner resource
 */
async function createPractitioner(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Starting practitioner creation...');
    
    const body = await request.text();
    if (!body) {
      return createResponse(400, null, 'Request body is required');
    }

    const practitionerResource = JSON.parse(body);
    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Practitioner resource:', JSON.stringify(practitionerResource, null, 2));

    if (!practitionerResource.resourceType || practitionerResource.resourceType !== 'Practitioner') {
      return createResponse(400, null, 'Invalid resource type. Expected "Practitioner"');
    }

    // Extract user ID from X-User-ID header for resource organization
    const userIdHeader = request.headers.get('X-User-ID');
    const resourceId = practitionerResource.id; // Use the unique resource ID provided
    
    if (!resourceId) {
      return createResponse(400, null, 'Practitioner resource ID is required');
    }

    // Extract user ID from identifier array for duplicate checking
    const userIdFromIdentifier = practitionerResource.identifier?.find(
      (id: any) => id.system === 'http://lelink.healthcare/user-id'
    )?.value;
    
    const userId = userIdHeader || userIdFromIdentifier;
    if (!userId) {
      return createResponse(400, null, 'User ID is required (X-User-ID header or identifier)');
    }

    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Using resource ID:', resourceId, 'User ID:', userId);

    // Check for existing Practitioner resource by searching identifier
    try {
      const allResources = await fhirStorageService.listPatientResources(userId);
      const existingPractitioner = allResources.find(r => r.resourceType === 'Practitioner');
      if (existingPractitioner) {
        console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Practitioner resource already exists for user:', userId);
        return createResponse(200, existingPractitioner, 'Practitioner resource already exists');
      }
    } catch (error) {
      // Resource doesn't exist, which is fine - we'll create it
      console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] No existing practitioner found, proceeding with creation');
    }

    // Check for email uniqueness if email is provided
    const practitionerEmail = extractEmailFromResource(practitionerResource);
    if (practitionerEmail) {
      const duplicateUserId = await checkEmailUniqueness(practitionerEmail, userId);
      if (duplicateUserId) {
        console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Email already exists for user:', duplicateUserId);
        return createResponse(409, null, `Email ${practitionerEmail} is already registered to another user`);
      }
    }

    // Keep the unique resource ID as provided (don't override with session ID)
    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Using unique resource ID:', resourceId);

    // Add role information as FHIR extension - role can be provided in request or defaults to Practitioner
    if (!practitionerResource.extension) {
      practitionerResource.extension = [];
    }
    
    // Remove any existing role extension and add new one
    practitionerResource.extension = practitionerResource.extension.filter(
      (ext: any) => ext.url !== 'http://lelink.health/fhir/StructureDefinition/user-role'
    );
    
    // Use role from request body or default to Practitioner
    const userRole = practitionerResource.userRole || 'Practitioner';
    practitionerResource.extension.push({
      url: 'http://lelink.health/fhir/StructureDefinition/user-role',
      valueString: userRole
    });

    // Remove userRole from resource as it's now in extension
    delete practitionerResource.userRole;

    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Added role extension to Practitioner resource:', userRole);

    // Add metadata
    practitionerResource.meta = {
      ...practitionerResource.meta,
      lastUpdated: new Date().toISOString(),
      source: practitionerResource.meta?.source || 'LeLink-Onboarding',
    };

    logger.info('Creating Practitioner resource', {
      practitionerId: practitionerResource.id,
      requestId: context.invocationId,
    });
    
    const result = await fhirStorageService.storeResource(practitionerResource);
    console.log('[FHIR_CREATE_PRACTITIONER_DEBUG] Storage result:', result);

    logger.info('Practitioner resource created successfully', {
      practitionerId: practitionerResource.id,
      storageUserId: userId,
      requestId: context.invocationId,
    });

    return createResponse(201, practitionerResource, 'Practitioner resource created successfully');
  } catch (error) {
    console.error('[FHIR_CREATE_PRACTITIONER_DEBUG] Error creating practitioner:', error);
    logger.error('Failed to create Practitioner resource', {
      error: error as Error,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to create Practitioner resource');
  }
}

/**
 * OPTIONS handler for CORS preflight requests
 */
async function handleOptions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  return {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  };
}

/**
 * GET /api/fhir-storage/users/by-email/{email}
 * Find existing Patient or Practitioner resource by email address
 */
async function getUserByEmail(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const email = request.params.email;
    
    if (!email) {
      return createResponse(400, null, 'Missing required parameter: email');
    }

    console.log('[FHIR_GET_USER_BY_EMAIL] Searching for user by email:', email);

    // Search for existing user by email
    const existingUserId = await findUserIdByEmail(email);
    
    if (!existingUserId) {
      console.log('[FHIR_GET_USER_BY_EMAIL] No user found with email:', email);
      return createResponse(404, null, 'No user found with this email address');
    }

    console.log('[FHIR_GET_USER_BY_EMAIL] Found user:', existingUserId, 'for email:', email);

    // Get the user's resources
    const resources = await fhirStorageService.listPatientResources(existingUserId);
    const userResource = resources.find(r => r.resourceType === 'Patient' || r.resourceType === 'Practitioner');

    if (!userResource) {
      console.log('[FHIR_GET_USER_BY_EMAIL] User found but no Patient/Practitioner resource exists');
      return createResponse(404, null, 'User found but no medical profile exists');
    }

    logger.info('User found by email', {
      email,
      userId: existingUserId,
      resourceType: userResource.resourceType,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      userId: existingUserId,
      email,
      resource: userResource,
      resourceType: userResource.resourceType,
    }, 'User found by email');

  } catch (error) {
    logger.error('Failed to get user by email', {
      error: error as Error,
      email: request.params.email,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to search for user by email');
  }
}

/**
 * Helper function to find user ID by email address
 */
async function findUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;
  
  try {
    console.log('[FIND_USER_BY_EMAIL] Searching for email:', email);
    
    // Get all patients
    const allPatients = await fhirStorageService.getAllPatients();
    
    for (const patientId of allPatients) {
      try {
        // Check Patient resources
        const patientResources = await fhirStorageService.listPatientResources(patientId);
        
        for (const resource of patientResources) {
          if (resource.resourceType === 'Patient' || resource.resourceType === 'Practitioner') {
            
            // Check if this resource has the target email
            const resourceEmail = extractEmailFromResource(resource);
            if (resourceEmail && resourceEmail.toLowerCase() === email.toLowerCase()) {
              console.log('[FIND_USER_BY_EMAIL] Found user:', patientId, 'with email:', email);
              return patientId;
            }
          }
        }
      } catch (error) {
        // Continue checking other patients even if one fails
        console.log('[FIND_USER_BY_EMAIL] Error checking patient:', patientId, error);
      }
    }
    
    console.log('[FIND_USER_BY_EMAIL] No user found with email:', email);
    return null;
    
  } catch (error) {
    console.error('[FIND_USER_BY_EMAIL] Error during user search:', error);
    return null;
  }
}

/**
 * GET /api/fhir-storage/users
 * Get all users with basic information and pagination (for Practitioners)
 */
async function getUsers(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const search = url.searchParams.get('search') || '';

    logger.info('Getting users with pagination', {
      page,
      limit,
      search,
      requestId: context.invocationId,
    });

    const allPatients = await fhirStorageService.getAllPatients();
    let users = [];

    // Get basic user information for each patient
    for (const patientId of allPatients) {
      try {
        const resources = await fhirStorageService.listPatientResources(patientId);
        const userResource = resources.find(r => r.resourceType === 'Patient' || r.resourceType === 'Practitioner');
        
        if (userResource) {
          const userInfo = {
            id: patientId,
            resourceType: userResource.resourceType,
            name: userResource.name?.[0]?.text || userResource.name?.[0]?.given?.join(' ') + ' ' + userResource.name?.[0]?.family || 'Unknown',
            email: userResource.telecom?.find((t: any) => t.system === 'email')?.value || '',
            lastUpdated: userResource.meta?.lastUpdated || new Date().toISOString(),
            resourceCount: resources.length,
          };

          // Apply search filter if provided
          if (!search || 
              userInfo.name.toLowerCase().includes(search.toLowerCase()) ||
              userInfo.email.toLowerCase().includes(search.toLowerCase())) {
            users.push(userInfo);
          }
        }
      } catch (error) {
        console.log('[USERS_LIST] Error processing patient:', patientId, error);
      }
    }

    // Sort by last updated (most recent first)
    users.sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime());

    // Apply pagination
    const total = users.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedUsers = users.slice(startIndex, endIndex);

    logger.info('Users retrieved successfully', {
      total,
      page,
      limit,
      returned: paginatedUsers.length,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      users: paginatedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: endIndex < total,
        hasPrev: page > 1,
      },
    }, 'Users retrieved successfully');

  } catch (error) {
    logger.error('Failed to get users', {
      error: error as Error,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve users');
  }
}

/**
 * GET /api/fhir-storage/users/{userId}/profile
 * Get detailed user profile with all resources (for user detail page)
 */
async function getUserProfile(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;

    if (!userId) {
      return createResponse(400, null, 'Missing required parameter: userId');
    }

    logger.info('Getting user profile', {
      userId,
      requestId: context.invocationId,
    });

    // Get all resources for the user
    const resources = await fhirStorageService.listPatientResources(userId);
    
    if (resources.length === 0) {
      return createResponse(404, null, 'User not found');
    }

    // Find the main user resource (Patient or Practitioner)
    const userResource = resources.find(r => r.resourceType === 'Patient' || r.resourceType === 'Practitioner');
    
    if (!userResource) {
      return createResponse(404, null, 'User profile not found');
    }

    // Group resources by type for easier consumption
    const resourcesByType: Record<string, any[]> = {};
    resources.forEach(resource => {
      if (!resourcesByType[resource.resourceType]) {
        resourcesByType[resource.resourceType] = [];
      }
      resourcesByType[resource.resourceType].push(resource);
    });

    // Extract user profile information
    const profile = {
      id: userId,
      resourceType: userResource.resourceType,
      name: {
        full: userResource.name?.[0]?.text || '',
        given: userResource.name?.[0]?.given || [],
        family: userResource.name?.[0]?.family || '',
      },
      email: userResource.telecom?.find((t: any) => t.system === 'email')?.value || '',
      phone: userResource.telecom?.find((t: any) => t.system === 'phone')?.value || '',
      address: userResource.address?.[0] || null,
      jobTitle: userResource.qualification?.[0]?.code?.text || '',
      lastUpdated: userResource.meta?.lastUpdated,
      source: userResource.meta?.source,
    };

    logger.info('User profile retrieved successfully', {
      userId,
      resourceType: profile.resourceType,
      resourceCount: resources.length,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      profile,
      resources,
      resourcesByType,
      totalResources: resources.length,
      resourceTypes: Object.keys(resourcesByType),
    }, 'User profile retrieved successfully');

  } catch (error) {
    logger.error('Failed to get user profile', {
      error: error as Error,
      userId: request.params.userId,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve user profile');
  }
}

/**
 * GET /api/fhir-storage/users/{userId}/role
 * Get user role from FHIR resources (fallback for auth when Azure B2C fails)
 */
async function getUserRole(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userId = request.params.userId;

    if (!userId) {
      return createResponse(400, null, 'Missing required parameter: userId');
    }

    console.log('[FHIR_GET_USER_ROLE] Getting role for user:', userId);

    // Get all resources for the user
    const resources = await fhirStorageService.listPatientResources(userId);
    
    if (resources.length === 0) {
      console.log('[FHIR_GET_USER_ROLE] No resources found for user:', userId);
      return createResponse(404, null, 'User not found');
    }

    // Find the main user resource (Patient or Practitioner)
    const userResource = resources.find(r => r.resourceType === 'Patient' || r.resourceType === 'Practitioner');
    
    if (!userResource) {
      console.log('[FHIR_GET_USER_ROLE] No Patient/Practitioner resource found for user:', userId);
      return createResponse(404, null, 'User profile not found');
    }

    // Extract role from the resource
    const role = extractRoleFromResource(userResource);
    
    if (!role) {
      console.log('[FHIR_GET_USER_ROLE] No role found in FHIR resource for user:', userId);
      return createResponse(404, null, 'User role not found');
    }

    console.log('[FHIR_GET_USER_ROLE] Found role for user:', userId, 'role:', role);

    logger.info('User role retrieved from FHIR', {
      userId,
      role,
      resourceType: userResource.resourceType,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      userId,
      role,
      resourceType: userResource.resourceType,
      source: 'FHIR',
    }, 'User role retrieved successfully');

  } catch (error) {
    console.error('[FHIR_GET_USER_ROLE] Error getting user role:', error);
    logger.error('Failed to get user role', {
      error: error as Error,
      userId: request.params.userId,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to retrieve user role');
  }
}

/**
 * POST /api/fhir-storage/users/{userIdentifier}/add-identifier
 * Add a new identifier to an existing FHIR resource for federated identity management
 * userIdentifier can be userId OR email address
 */
async function addIdentifierToUser(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const userIdentifier = request.params.userId; // Can be userId or email

    if (!userIdentifier) {
      return createResponse(400, null, 'Missing required parameter: userId or email');
    }

    const body = await request.text();
    if (!body) {
      return createResponse(400, null, 'Request body is required');
    }

    const identifierData = JSON.parse(body);
    console.log('[FHIR_ADD_IDENTIFIER] Adding identifier to user:', userIdentifier, 'data:', identifierData);

    // Validate identifier data
    if (!identifierData.system || !identifierData.value) {
      return createResponse(400, null, 'Identifier system and value are required');
    }

    let resources: any[] = [];
    let userResource: any = null;
    let actualUserId: string = userIdentifier;

    // Check if userIdentifier is an email (contains @) or userId
    if (userIdentifier.includes('@')) {
      console.log('[FHIR_ADD_IDENTIFIER] Searching by email:', userIdentifier);
      
      // Find user by email first
      const emailUserId = await findUserIdByEmail(userIdentifier);
      if (!emailUserId) {
        console.log('[FHIR_ADD_IDENTIFIER] No user found with email:', userIdentifier);
        return createResponse(404, null, 'User not found with this email');
      }
      
      actualUserId = emailUserId;
      console.log('[FHIR_ADD_IDENTIFIER] Found user ID by email:', actualUserId);
    }

    // Get all resources for the user
    resources = await fhirStorageService.listPatientResources(actualUserId);
    
    if (resources.length === 0) {
      console.log('[FHIR_ADD_IDENTIFIER] No resources found for user:', actualUserId);
      return createResponse(404, null, 'User not found');
    }

    // Find the main user resource (Patient or Practitioner)
    userResource = resources.find(r => r.resourceType === 'Patient' || r.resourceType === 'Practitioner');
    
    if (!userResource) {
      console.log('[FHIR_ADD_IDENTIFIER] No Patient/Practitioner resource found for user:', actualUserId);
      return createResponse(404, null, 'User profile not found');
    }

    // Initialize identifiers array if it doesn't exist
    if (!userResource.identifier) {
      userResource.identifier = [];
    }

    // Check if identifier already exists
    const existingIdentifier = userResource.identifier.find((id: any) => 
      id.system === identifierData.system && id.value === identifierData.value
    );

    if (existingIdentifier) {
      console.log('[FHIR_ADD_IDENTIFIER] Identifier already exists for user:', actualUserId);
      return createResponse(200, userResource, 'Identifier already exists');
    }

    // Add new identifier
    const newIdentifier: any = {
      system: identifierData.system,
      value: identifierData.value,
      use: identifierData.use || 'secondary',
    };

    // Add provider information if provided
    if (identifierData.provider) {
      newIdentifier._provider = identifierData.provider;
    }

    userResource.identifier.push(newIdentifier);

    // Update metadata
    userResource.meta = {
      ...userResource.meta,
      lastUpdated: new Date().toISOString(),
    };

    console.log('[FHIR_ADD_IDENTIFIER] Adding identifier:', newIdentifier);

    // Store the updated resource
    const result = await fhirStorageService.storeResource(userResource);
    console.log('[FHIR_ADD_IDENTIFIER] Updated resource stored:', result);

    logger.info('Identifier added to user resource', {
      userId: actualUserId,
      inputIdentifier: userIdentifier,
      resourceType: userResource.resourceType,
      identifierSystem: identifierData.system,
      identifierValue: identifierData.value,
      provider: identifierData.provider,
      requestId: context.invocationId,
    });

    return createResponse(200, {
      userId: actualUserId,
      inputIdentifier: userIdentifier,
      resourceType: userResource.resourceType,
      identifierAdded: newIdentifier,
      totalIdentifiers: userResource.identifier.length,
    }, 'Identifier added successfully');

  } catch (error) {
    console.error('[FHIR_ADD_IDENTIFIER] Error adding identifier:', error);
    logger.error('Failed to add identifier to user', {
      error: error as Error,
      userIdentifier: request.params.userId,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Failed to add identifier');
  }
}

/**
 * Health check endpoint
 */
async function healthCheck(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  try {
    const status = fhirStorageService.getStatus();
    
    logger.info('Health check requested', {
      requestId: context.invocationId,
      status,
    });

    return createResponse(200, {
      service: 'FHIR Storage API',
      status: 'healthy',
      storage: status,
      timestamp: new Date().toISOString(),
    }, 'Service is healthy');
  } catch (error) {
    logger.error('Health check failed', {
      error: error as Error,
      requestId: context.invocationId,
    });

    return createResponse(500, (error as Error).message, 'Service is unhealthy');
  }
}

// Register HTTP endpoints
app.http('fhir-storage-resource', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/resource/{patientId}/{resourceType}/{resourceId}',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getResource(request, context);
  },
});

app.http('fhir-storage-patients', {
  methods: ['GET', 'POST', 'OPTIONS'],
  route: 'fhir-storage/patients',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    if (request.method === 'POST') {
      return createPatient(request, context);
    }
    return getPatients(request, context);
  },
});

app.http('fhir-storage-practitioners', {
  methods: ['POST', 'OPTIONS'],
  route: 'fhir-storage/practitioners',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return createPractitioner(request, context);
  },
});

app.http('fhir-storage-patient-resources', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/patients/{patientId}/resources',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getPatientResources(request, context);
  },
});

app.http('fhir-storage-patient-resources-by-type', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/{patientId}/{resourceType}',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getPatientResourcesByType(request, context);
  },
});

app.http('fhir-storage-user-by-email', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/users/by-email/{email}',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getUserByEmail(request, context);
  },
});

app.http('fhir-storage-users', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/users',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getUsers(request, context);
  },
});

app.http('fhir-storage-user-profile', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/users/{userId}/profile',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getUserProfile(request, context);
  },
});

app.http('fhir-storage-user-role', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/users/{userId}/role',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return getUserRole(request, context);
  },
});

app.http('fhir-storage-add-identifier', {
  methods: ['POST', 'OPTIONS'],
  route: 'fhir-storage/users/{userId}/add-identifier',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return addIdentifierToUser(request, context);
  },
});

app.http('fhir-storage-health', {
  methods: ['GET', 'OPTIONS'],
  route: 'fhir-storage/health',
  handler: async (request: HttpRequest, context: InvocationContext) => {
    if (request.method === 'OPTIONS') {
      return handleOptions(request, context);
    }
    return healthCheck(request, context);
  },
});