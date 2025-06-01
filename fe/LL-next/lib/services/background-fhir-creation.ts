/**
 * Background FHIR Resource Creation Service
 *
 * Automatically creates FHIR resources for Azure B2C users who have complete profiles
 * but haven't had FHIR resources created yet.
 */

interface UserProfile {
  id: string;
  email?: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
  jobTitle?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  streetAddress?: string;
  role: 'Patient' | 'Practitioner' | 'Admin';
  provider: string;
}

export class BackgroundFHIRCreationService {
  /**
   * Automatically creates FHIR resources for Azure B2C users
   */
  static async createFHIRResourcesForB2CUser(userProfile: UserProfile): Promise<boolean> {
    try {
      console.log('[BACKGROUND_FHIR] Creating FHIR resources for B2C user:', userProfile.id);
      console.log('[BACKGROUND_FHIR] User profile data:', JSON.stringify(userProfile, null, 2));

      // Only proceed if user has sufficient profile data
      if (!userProfile.givenName || !userProfile.surname) {
        console.log('[BACKGROUND_FHIR] Insufficient profile data (missing name), skipping auto-creation');
        console.log('[BACKGROUND_FHIR] Required: givenName, surname. Have:', {
          givenName: userProfile.givenName,
          surname: userProfile.surname,
        });
        return false;
      }

      // Email is preferred but not required for FHIR resource creation
      if (!userProfile.email) {
        console.log('[BACKGROUND_FHIR] Warning: No email provided, proceeding without email field');
      }

      // Check if user already has FHIR resources
      const hasResources = await this.checkExistingFHIRResources(userProfile.id);
      if (hasResources) {
        console.log('[BACKGROUND_FHIR] User already has FHIR resources, skipping');
        return true;
      }

      // Create FHIR resource based on role
      const resourceData = this.buildFHIRResourceFromProfile(userProfile);

      if (userProfile.role === 'Patient') {
        await this.createPatientResource(userProfile.id, resourceData);
      } else if (userProfile.role === 'Practitioner') {
        await this.createPractitionerResource(userProfile.id, resourceData);
      }

      console.log('[BACKGROUND_FHIR] Successfully created FHIR resources for user:', userProfile.id);
      return true;
    } catch (error) {
      console.error('[BACKGROUND_FHIR] Failed to create FHIR resources:', error);
      return false;
    }
  }

  /**
   * Check if user already has FHIR resources
   */
  private static async checkExistingFHIRResources(userId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${
          process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'
        }/api/fhir-storage/patients/${userId}/resources`
      );
      if (response.ok) {
        const data = await response.json();
        const hasPatientOrPractitioner = data.data?.resources?.some(
          (r: any) => r.resourceType === 'Patient' || r.resourceType === 'Practitioner'
        );
        return hasPatientOrPractitioner || false;
      }
      return false;
    } catch (error) {
      console.error('[BACKGROUND_FHIR] Error checking existing resources:', error);
      return false;
    }
  }

  /**
   * Build FHIR resource data from user profile
   */
  private static buildFHIRResourceFromProfile(userProfile: UserProfile) {
    return {
      givenName: userProfile.givenName || '',
      surname: userProfile.surname || '',
      displayName: userProfile.displayName || `${userProfile.givenName} ${userProfile.surname}`,
      jobTitle: userProfile.jobTitle || '',
      role: userProfile.role,
      email: userProfile.email || '',
      streetAddress: userProfile.streetAddress || '',
      city: userProfile.city || '',
      state: userProfile.state || '',
      postalCode: userProfile.postalCode || '',
      country: userProfile.country || '',
    };
  }

  /**
   * Create Patient FHIR resource
   */
  private static async createPatientResource(userId: string, resourceData: any) {
    const patientResource = {
      resourceType: 'Patient',
      id: userId,
      identifier: [
        {
          system: 'http://lelink.healthcare/user-id',
          value: userId,
        },
      ],
      name: [
        {
          use: 'official',
          family: resourceData.surname,
          given: [resourceData.givenName],
          text: resourceData.displayName,
        },
      ],
      ...(resourceData.email && {
        telecom: [
          {
            system: 'email',
            value: resourceData.email,
            use: 'home',
          },
        ],
      }),
      address: [
        {
          use: 'home',
          line: [resourceData.streetAddress],
          city: resourceData.city,
          state: resourceData.state,
          postalCode: resourceData.postalCode,
          country: resourceData.country,
        },
      ],
      meta: {
        source: 'LeLink-AutoCreation-B2C',
        profile: ['http://hl7.org/fhir/StructureDefinition/Patient'],
      },
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/patients`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': userId,
        },
        body: JSON.stringify(patientResource),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Patient resource: ${response.status}`);
    }

    return await response.json();
  }

  /**
   * Create Practitioner FHIR resource
   */
  private static async createPractitionerResource(userId: string, resourceData: any) {
    const practitionerResource = {
      resourceType: 'Practitioner',
      id: userId,
      identifier: [
        {
          system: 'http://lelink.healthcare/user-id',
          value: userId,
        },
      ],
      name: [
        {
          use: 'official',
          family: resourceData.surname,
          given: [resourceData.givenName],
          text: resourceData.displayName,
        },
      ],
      ...(resourceData.email && {
        telecom: [
          {
            system: 'email',
            value: resourceData.email,
            use: 'work',
          },
        ],
      }),
      address: [
        {
          use: 'work',
          line: [resourceData.streetAddress],
          city: resourceData.city,
          state: resourceData.state,
          postalCode: resourceData.postalCode,
          country: resourceData.country,
        },
      ],
      qualification: [
        {
          code: {
            text: resourceData.jobTitle,
          },
        },
      ],
      meta: {
        source: 'LeLink-AutoCreation-B2C',
        profile: ['http://hl7.org/fhir/StructureDefinition/Practitioner'],
      },
    };

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071'}/api/fhir-storage/practitioners`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Idempotency-Key': userId,
        },
        body: JSON.stringify(practitionerResource),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create Practitioner resource: ${response.status}`);
    }

    return await response.json();
  }
}
