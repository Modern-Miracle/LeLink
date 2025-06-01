import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { azureExternalUsersService } from '@/lib/services/azure-external-users';
import { z } from 'zod';

// Full onboarding schema for Google users
const fullOnboardingSchema = z.object({
  givenName: z.string().min(1),
  surname: z.string().min(1),
  displayName: z.string().min(1),
  jobTitle: z.string().min(1),
  role: z.enum(['Patient', 'Practitioner', 'Admin']),
  streetAddress: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
});

// Flexible schema for Azure B2C users (allows empty strings for missing data)
const azureB2COnboardingSchema = z.object({
  givenName: z.string().default(''),
  surname: z.string().default(''),
  displayName: z.string().default(''),
  jobTitle: z.string().default(''),
  role: z.enum(['Patient', 'Practitioner', 'Admin']),
  streetAddress: z.string().default(''),
  city: z.string().default(''),
  state: z.string().default(''),
  postalCode: z.string().default(''),
  country: z.string().default(''),
});

export async function POST(request: NextRequest) {
  try {
    console.log('[ONBOARDING_API_DEBUG] Starting onboarding completion...');
    
    // Validate session
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('[ONBOARDING_API_DEBUG] No authenticated session');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('[ONBOARDING_API_DEBUG] Session user:', JSON.stringify(session.user, null, 2));

    // Parse and validate request body
    const body = await request.json();
    console.log('[ONBOARDING_API_DEBUG] Request body:', JSON.stringify(body, null, 2));
    
    // Use appropriate schema based on provider
    const schema = session.user.provider === 'azure-ad-b2c' ? azureB2COnboardingSchema : fullOnboardingSchema;
    console.log('[ONBOARDING_API_DEBUG] Using schema for provider:', session.user.provider);
    
    const validatedData = schema.parse(body);
    console.log('[ONBOARDING_API_DEBUG] Validated data:', JSON.stringify(validatedData, null, 2));

    // Skip Azure AD External user creation for now (Graph API integration disabled)
    if (session.user.provider === 'google') {
      console.log('[ONBOARDING_API_DEBUG] Google user detected, but Graph API integration disabled');
    } else {
      console.log('[ONBOARDING_API_DEBUG] Azure B2C user - will proceed with FHIR resource creation');
    }

    // Check if user already has FHIR resources to prevent duplicates
    const hasExistingResources = await checkUserHasResources(session.user.id, session.user.email);
    if (hasExistingResources) {
      console.log('[ONBOARDING_API_DEBUG] User already has FHIR resources, skipping creation');
      return NextResponse.json({
        success: true,
        message: 'User already has medical records',
        user: {
          ...session.user,
          ...validatedData,
          needsOnboarding: false,
        },
      });
    }

    // Create FHIR resources based on role
    try {
      console.log('[ONBOARDING_API_DEBUG] Creating FHIR resources with email:', session.user.email);
      await createFhirResources(session.user.id, validatedData, session.user.email);
      console.log('[ONBOARDING_API_DEBUG] FHIR resources created successfully');
    } catch (error) {
      console.error('[ONBOARDING_API_DEBUG] Failed to create FHIR resources:', error);
      return NextResponse.json(
        { error: 'Failed to create medical records' },
        { status: 500 }
      );
    }

    console.log('[ONBOARDING_API_DEBUG] Onboarding completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      user: {
        ...session.user,
        ...validatedData,
        needsOnboarding: false,
      },
    });
  } catch (error) {
    console.error('[ONBOARDING_API_DEBUG] Error in onboarding completion:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: 'Validation failed',
          details: error.errors.map(e => e.message).join(', ')
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function checkUserHasResources(userId: string, userEmail?: string): Promise<boolean> {
  try {
    // First check by user ID
    const userIdResponse = await fetch(`${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/patients/${userId}/resources`);
    if (userIdResponse.ok) {
      const data = await userIdResponse.json();
      if (data.success && data.data?.resources?.length > 0) {
        const hasPatientOrPractitioner = data.data.resources.some(
          (r: any) => r.resourceType === 'Patient' || r.resourceType === 'Practitioner'
        );
        if (hasPatientOrPractitioner) {
          console.log('[RESOURCE_CHECK] User has resources by ID:', userId);
          return true;
        }
      }
    }

    // Then check by email if provided
    if (userEmail) {
      const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/users/by-email/${encodeURIComponent(userEmail)}`);
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.success) {
          console.log('[RESOURCE_CHECK] User has resources by email:', userEmail);
          return true;
        }
      }
    }

    console.log('[RESOURCE_CHECK] No existing resources found for user');
    return false;
  } catch (error) {
    console.error('[RESOURCE_CHECK] Error checking user resources:', error);
    return false; // If check fails, allow creation
  }
}

async function updateAzureAdExternal(
  userId: string, 
  userData: z.infer<typeof fullOnboardingSchema> | z.infer<typeof azureB2COnboardingSchema>,
  userEmail: string
) {
  console.log('[AZURE_UPDATE_DEBUG] Creating/updating Azure AD External user for Google ID:', userId);
  
  try {
    // Prepare user data for Azure AD B2C
    const externalUserData = {
      givenName: userData.givenName,
      surname: userData.surname,
      displayName: userData.displayName,
      email: userEmail,
      jobTitle: userData.jobTitle,
      city: userData.city,
      state: userData.state,
      postalCode: userData.postalCode,
      country: userData.country,
      streetAddress: userData.streetAddress,
      role: userData.role,
    };
    
    console.log('[AZURE_UPDATE_DEBUG] Creating external user with data:', JSON.stringify(externalUserData, null, 2));
    
    // Create or update the external user in Azure AD B2C
    const result = await azureExternalUsersService.createExternalUser(userId, externalUserData);
    
    console.log('[AZURE_UPDATE_DEBUG] External user created/updated successfully:', result.id);
    return result;
    
  } catch (error) {
    console.error('[AZURE_UPDATE_DEBUG] Failed to create/update external user:', error);
    throw error;
  }
}

async function createFhirResources(
  userId: string,
  userData: z.infer<typeof fullOnboardingSchema> | z.infer<typeof azureB2COnboardingSchema>,
  userEmail?: string
) {
  console.log('[FHIR_CREATION_DEBUG] Creating FHIR resources for user:', userId, 'role:', userData.role);
  
  try {
    if (userData.role === 'Patient') {
      await createPatientResource(userId, userData, userEmail);
    } else if (userData.role === 'Practitioner') {
      await createPractitionerResource(userId, userData, userEmail);
    }
    
    console.log('[FHIR_CREATION_DEBUG] FHIR resources created successfully');
  } catch (error) {
    console.error('[FHIR_CREATION_DEBUG] Error creating FHIR resources:', error);
    throw error;
  }
}

async function createPatientResource(
  userId: string,
  userData: z.infer<typeof fullOnboardingSchema> | z.infer<typeof azureB2COnboardingSchema>,
  userEmail?: string
) {
  console.log('[FHIR_PATIENT_DEBUG] Creating Patient resource for userId:', userId);
  console.log('[FHIR_PATIENT_DEBUG] User email parameter:', userEmail);
  console.log('[FHIR_PATIENT_DEBUG] User data:', JSON.stringify(userData, null, 2));
  
  // Generate unique resource ID
  const resourceId = `patient-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const patientResource = {
    resourceType: 'Patient',
    id: resourceId, // Unique resource ID
    userRole: userData.role, // Store role for FHIR API to convert to extension
    identifier: [
      {
        system: 'http://lelink.healthcare/user-id',
        value: userId, // Session ID as identifier for linking resources
      },
      {
        system: 'http://lelink.healthcare/resource-id',
        value: resourceId, // Also store resource ID as identifier
      },
    ],
    name: [
      {
        use: 'official',
        family: userData.surname || 'Unknown',
        given: userData.givenName ? [userData.givenName] : ['Unknown'],
        text: userData.displayName || (userData.givenName + ' ' + userData.surname).trim() || 'Unknown User',
      },
    ],
    telecom: userEmail && userEmail.trim() ? [
      {
        system: 'email',
        value: userEmail.trim(),
        use: 'home',
      },
    ] : [],
    address: (userData.streetAddress && userData.streetAddress.trim()) || 
             (userData.city && userData.city.trim()) || 
             (userData.state && userData.state.trim()) ? [
      {
        use: 'home',
        line: (userData.streetAddress && userData.streetAddress.trim()) ? [userData.streetAddress.trim()] : [],
        city: (userData.city && userData.city.trim()) ? userData.city.trim() : undefined,
        state: (userData.state && userData.state.trim()) ? userData.state.trim() : undefined,
        postalCode: (userData.postalCode && userData.postalCode.trim()) ? userData.postalCode.trim() : undefined,
        country: (userData.country && userData.country.trim()) ? userData.country.trim() : undefined,
      },
    ] : [],
    meta: {
      source: 'LeLink-Onboarding',
      profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
    },
  };
  
  console.log('[FHIR_PATIENT_DEBUG] Patient resource:', JSON.stringify(patientResource, null, 2));
  
  // Call FHIR storage API with proper identifiers
  const response = await fetch(`${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/patients`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `patient-${userId}`, // Prevent duplicates by user ID + resource type
      'X-User-ID': userId, // Pass user ID for folder organization
    },
    body: JSON.stringify(patientResource),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FHIR_PATIENT_DEBUG] Failed to create Patient resource:', errorText);
    throw new Error(`Failed to create Patient resource: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('[FHIR_PATIENT_DEBUG] Patient resource created:', result);
}

async function createPractitionerResource(
  userId: string,
  userData: z.infer<typeof fullOnboardingSchema> | z.infer<typeof azureB2COnboardingSchema>,
  userEmail?: string
) {
  console.log('[FHIR_PRACTITIONER_DEBUG] Creating Practitioner resource for userId:', userId);
  console.log('[FHIR_PRACTITIONER_DEBUG] User email parameter:', userEmail);
  console.log('[FHIR_PRACTITIONER_DEBUG] User data:', JSON.stringify(userData, null, 2));
  
  // Generate unique resource ID
  const resourceId = `practitioner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const practitionerResource = {
    resourceType: 'Practitioner',
    id: resourceId, // Unique resource ID
    userRole: userData.role, // Store role for FHIR API to convert to extension
    identifier: [
      {
        system: 'http://lelink.healthcare/user-id',
        value: userId, // Session ID as identifier for linking resources
      },
      {
        system: 'http://lelink.healthcare/resource-id',
        value: resourceId, // Also store resource ID as identifier
      },
    ],
    name: [
      {
        use: 'official',
        family: userData.surname || 'Unknown',
        given: userData.givenName ? [userData.givenName] : ['Unknown'],
        text: userData.displayName || (userData.givenName + ' ' + userData.surname).trim() || 'Unknown User',
      },
    ],
    telecom: userEmail && userEmail.trim() ? [
      {
        system: 'email',
        value: userEmail.trim(),
        use: 'work',
      },
    ] : [],
    address: (userData.streetAddress && userData.streetAddress.trim()) || 
             (userData.city && userData.city.trim()) || 
             (userData.state && userData.state.trim()) ? [
      {
        use: 'work',
        line: (userData.streetAddress && userData.streetAddress.trim()) ? [userData.streetAddress.trim()] : [],
        city: (userData.city && userData.city.trim()) ? userData.city.trim() : undefined,
        state: (userData.state && userData.state.trim()) ? userData.state.trim() : undefined,
        postalCode: (userData.postalCode && userData.postalCode.trim()) ? userData.postalCode.trim() : undefined,
        country: (userData.country && userData.country.trim()) ? userData.country.trim() : undefined,
      },
    ] : [],
    qualification: userData.jobTitle ? [
      {
        code: {
          text: userData.jobTitle,
        },
      },
    ] : [],
    meta: {
      source: 'LeLink-Onboarding',
      profile: ['http://hl7.org/fhir/StructureDefinition/Practitioner'],
    },
  };
  
  console.log('[FHIR_PRACTITIONER_DEBUG] Practitioner resource:', JSON.stringify(practitionerResource, null, 2));
  
  // Call FHIR storage API with proper identifiers
  const response = await fetch(`${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/practitioners`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Idempotency-Key': `practitioner-${userId}`, // Prevent duplicates by user ID + resource type
      'X-User-ID': userId, // Pass user ID for folder organization
    },
    body: JSON.stringify(practitionerResource),
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('[FHIR_PRACTITIONER_DEBUG] Failed to create Practitioner resource:', errorText);
    throw new Error(`Failed to create Practitioner resource: ${response.status}`);
  }
  
  const result = await response.json();
  console.log('[FHIR_PRACTITIONER_DEBUG] Practitioner resource created:', result);
}