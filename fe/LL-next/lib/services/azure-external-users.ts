/**
 * Azure AD B2C External Users Management Service
 * 
 * This service handles creating and managing external users in Azure AD B2C
 * for users who authenticate via Google or other external providers.
 */

import { DefaultAzureCredential, ClientSecretCredential } from '@azure/identity';
import { Client } from '@microsoft/microsoft-graph-client';
import { TokenCredentialAuthenticationProvider } from '@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials';

interface ExternalUserData {
  givenName: string;
  surname: string;
  displayName: string;
  email: string;
  jobTitle: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  streetAddress: string;
  role: 'Patient' | 'Practitioner' | 'Admin';
}

export class AzureExternalUsersService {
  private graphClient: Client;
  private tenantId: string;

  constructor() {
    // Extract tenant ID from the B2C issuer URL or use direct tenant ID if available
    const issuerUrl = process.env.AUTH_AZURE_AD_B2C_ISSUER;
    if (issuerUrl) {
      // Extract tenant ID from URL like: https://0132142e-80d1-4c4d-9197-e42820fa624c.ciamlogin.com/...
      const match = issuerUrl.match(/https:\/\/([a-f0-9-]+)\.ciamlogin\.com/);
      this.tenantId = match ? match[1] : process.env.AUTH_AZURE_AD_B2C_TENANT_ID || '';
    } else {
      this.tenantId = process.env.AUTH_AZURE_AD_B2C_TENANT_ID || '';
    }
    
    if (!this.tenantId) {
      throw new Error('Missing Azure B2C tenant ID configuration');
    }

    console.log('[AZURE_EXTERNAL_USERS] Using B2C tenant ID:', this.tenantId);

    // Create credentials using B2C service principal
    const credential = new ClientSecretCredential(
      this.tenantId,
      process.env.AUTH_AZURE_AD_B2C_ID!,
      process.env.AUTH_AZURE_AD_B2C_SECRET!
    );

    // Create authentication provider with required Graph API permissions
    // Required permissions for this service:
    // - User.ReadWrite.All (to create/update users)
    // - Directory.ReadWrite.All (to manage directory objects)
    // - Application.ReadWrite.All (for external identities)
    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ['https://graph.microsoft.com/.default'],
    });

    // Create Graph client
    this.graphClient = Client.initWithMiddleware({
      authProvider: authProvider,
    });
  }

  /**
   * Creates an external user in Azure AD B2C
   */
  async createExternalUser(googleUserId: string, userData: ExternalUserData): Promise<any> {
    try {
      console.log('[AZURE_EXTERNAL_USERS] Creating external user for Google ID:', googleUserId);
      
      // First test our permissions by trying to read users
      try {
        console.log('[AZURE_EXTERNAL_USERS] Testing permissions by listing users...');
        await this.graphClient.api('/users').top(1).get();
        console.log('[AZURE_EXTERNAL_USERS] Permissions test successful');
      } catch (permError: any) {
        console.error('[AZURE_EXTERNAL_USERS] Permission test failed:', permError.message);
        console.warn('[AZURE_EXTERNAL_USERS] Falling back to simulation mode');
        return await this.simulateUserCreation(googleUserId, userData);
      }

      // Check if user already exists
      const existingUser = await this.findUserByEmail(userData.email);
      if (existingUser) {
        console.log('[AZURE_EXTERNAL_USERS] User already exists, updating:', existingUser.id);
        return await this.updateExternalUser(existingUser.id, userData);
      }

      // Create new user object for Azure AD B2C
      // Start with a minimal user object to avoid complexity issues
      const newUser = {
        accountEnabled: true,
        displayName: userData.displayName,
        givenName: userData.givenName,
        surname: userData.surname,
        
        // Email as username for external users
        mailNickname: userData.email.split('@')[0].replace(/[^a-zA-Z0-9]/g, ''),
        userPrincipalName: `${userData.email.replace('@', '_').replace(/[^a-zA-Z0-9_]/g, '')}#EXT#@${this.tenantId}.onmicrosoft.com`,
        
        // Simplified identity - just email-based for now
        identities: [
          {
            signInType: 'emailAddress',
            issuer: `${this.tenantId}.onmicrosoft.com`,
            issuerAssignedId: userData.email,
          }
        ],

        // Password profile (required even for external users)
        passwordProfile: {
          forceChangePasswordNextSignIn: false,
          password: this.generateRandomPassword(),
        },

        // User type for external users
        userType: 'Guest',
        
        // Optional: Add job title if provided
        ...(userData.jobTitle && { jobTitle: userData.jobTitle }),
        
        // Add B2C custom extension attributes (if configured)
        // These need to be registered in your B2C tenant first
        // Format: extension_{appId_without_dashes}_{attributeName}
        ...(process.env.AUTH_AZURE_AD_B2C_ID && {
          [`extension_${process.env.AUTH_AZURE_AD_B2C_ID.replace(/-/g, '')}_role`]: userData.role,
          [`extension_${process.env.AUTH_AZURE_AD_B2C_ID.replace(/-/g, '')}_source`]: 'google',
          [`extension_${process.env.AUTH_AZURE_AD_B2C_ID.replace(/-/g, '')}_originalId`]: googleUserId,
        }),
      };

      console.log('[AZURE_EXTERNAL_USERS] Creating user with payload:', JSON.stringify(newUser, null, 2));

      // Create the user
      const createdUser = await this.graphClient.api('/users').post(newUser);

      console.log('[AZURE_EXTERNAL_USERS] Successfully created external user:', createdUser.id);
      return createdUser;

    } catch (error: any) {
      console.error('[AZURE_EXTERNAL_USERS] Error creating external user:', error);
      
      // Log detailed error information
      if (error.response) {
        console.error('[AZURE_EXTERNAL_USERS] Response status:', error.response.status);
        console.error('[AZURE_EXTERNAL_USERS] Response data:', error.response.data);
      }
      
      throw new Error(`Failed to create external user: ${error.message}`);
    }
  }

  /**
   * Updates an existing external user
   */
  async updateExternalUser(userId: string, userData: ExternalUserData): Promise<any> {
    try {
      console.log('[AZURE_EXTERNAL_USERS] Updating external user:', userId);

      const updatePayload = {
        displayName: userData.displayName,
        givenName: userData.givenName,
        surname: userData.surname,
        jobTitle: userData.jobTitle,
        streetAddress: userData.streetAddress,
        city: userData.city,
        state: userData.state,
        postalCode: userData.postalCode,
        country: userData.country,
        
        // Update custom extension attributes using B2C app ID
        ...(process.env.AUTH_AZURE_AD_B2C_ID && {
          [`extension_${process.env.AUTH_AZURE_AD_B2C_ID.replace(/-/g, '')}_role`]: userData.role,
        }),
      };

      const updatedUser = await this.graphClient.api(`/users/${userId}`).patch(updatePayload);

      console.log('[AZURE_EXTERNAL_USERS] Successfully updated external user:', userId);
      return updatedUser;

    } catch (error: any) {
      console.error('[AZURE_EXTERNAL_USERS] Error updating external user:', error);
      throw new Error(`Failed to update external user: ${error.message}`);
    }
  }

  /**
   * Finds a user by email address
   */
  async findUserByEmail(email: string): Promise<any> {
    try {
      console.log('[AZURE_EXTERNAL_USERS] Searching for user by email:', email);

      const users = await this.graphClient
        .api('/users')
        .filter(`identities/any(id:id/issuerAssignedId eq '${email}')`)
        .get();

      if (users.value && users.value.length > 0) {
        console.log('[AZURE_EXTERNAL_USERS] Found existing user:', users.value[0].id);
        return users.value[0];
      }

      console.log('[AZURE_EXTERNAL_USERS] No existing user found for email:', email);
      return null;

    } catch (error: any) {
      console.error('[AZURE_EXTERNAL_USERS] Error searching for user:', error);
      return null;
    }
  }

  /**
   * Checks if the app has required permissions (simplified check)
   */
  private hasRequiredPermissions(): boolean {
    // For now, always try the real API call and fall back if it fails
    // In production, you could implement a more sophisticated permission check
    return true;
  }

  /**
   * Simulates user creation when permissions are missing
   */
  private async simulateUserCreation(googleUserId: string, userData: ExternalUserData): Promise<any> {
    console.log('[AZURE_EXTERNAL_USERS] Simulating user creation - permissions not configured');
    
    return {
      id: `simulated-${googleUserId}`,
      displayName: userData.displayName,
      userPrincipalName: `${userData.email.replace('@', '_')}#EXT#@${this.tenantId}.onmicrosoft.com`,
      givenName: userData.givenName,
      surname: userData.surname,
      mail: userData.email,
      userType: 'Guest',
      createdDateTime: new Date().toISOString(),
      simulated: true,
    };
  }

  /**
   * Generates a random password (required for user creation, but not used for federated users)
   */
  private generateRandomPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    
    // Ensure complexity requirements: uppercase, lowercase, number, special char
    password += 'A'; // uppercase
    password += 'a'; // lowercase  
    password += '1'; // number
    password += '!'; // special char
    
    // Add random characters to reach minimum length of 12
    for (let i = 4; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Lists all external users (for debugging/admin purposes)
   */
  async listExternalUsers(): Promise<any[]> {
    try {
      console.log('[AZURE_EXTERNAL_USERS] Listing all external users');

      const users = await this.graphClient
        .api('/users')
        .filter("userType eq 'Guest'")
        .select('id,displayName,userPrincipalName,givenName,surname,mail,userType,identities')
        .get();

      console.log('[AZURE_EXTERNAL_USERS] Found', users.value?.length || 0, 'external users');
      return users.value || [];

    } catch (error: any) {
      console.error('[AZURE_EXTERNAL_USERS] Error listing external users:', error);
      throw new Error(`Failed to list external users: ${error.message}`);
    }
  }
}

// Export singleton instance
export const azureExternalUsersService = new AzureExternalUsersService();