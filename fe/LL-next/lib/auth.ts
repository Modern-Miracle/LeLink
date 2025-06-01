import { getServerSession, NextAuthOptions, type DefaultSession } from 'next-auth';
import AzureADB2CProvider, { AzureB2CProfile } from 'next-auth/providers/azure-ad-b2c';
import GoogleProvider from 'next-auth/providers/google';
import { getUserDetails } from '@/sevices/msGraph';
import { BackgroundFHIRCreationService } from '@/lib/services/background-fhir-creation';

// Extended user interface with all Azure AD fields
interface ExtendedUser {
  id: string;
  name?: string;
  email?: string;
  givenName?: string;
  surname?: string;
  displayName?: string;
  jobTitle?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  state?: string;
  streetAddress?: string;
  role?: 'Patient' | 'Practitioner' | 'Admin';
  provider?: string;
  needsOnboarding?: boolean;
}

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
    user: ExtendedUser;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    error?: string;
    user?: ExtendedUser;
  }
}

if (!process.env.AUTH_SECRET) {
  throw new Error('Missing AUTH_SECRET environment variable');
}

// Helper function to extract enhanced user info from access token
function extractUserInfoFromAccessToken(accessToken: string): Partial<ExtendedUser> | null {
  try {
    const tokenPayload = JSON.parse(Buffer.from(accessToken.split('.')[1], 'base64').toString());
    
    // Extract email from token (more reliable than profile)
    const email = tokenPayload.unique_name || 
                 tokenPayload.upn || 
                 tokenPayload.email || 
                 tokenPayload.preferred_username;
    
    // Extract role from WIDS (Windows Identity Foundation role IDs)
    let role: 'Patient' | 'Practitioner' | 'Admin' | undefined;
    if (tokenPayload.wids && Array.isArray(tokenPayload.wids)) {
      for (const wid of tokenPayload.wids) {
        if (wid === 'b79fbf4d-3ef9-4689-8143-76b194e85509') { // Global Administrator
          role = 'Admin';
          console.log('[AUTH_TOKEN_EXTRACT] Admin role detected from WIDS');
          break;
        }
        // Add other role mappings here if needed
      }
    }
    
    // Extract names
    const givenName = tokenPayload.given_name || '';
    const surname = tokenPayload.family_name || '';
    const name = tokenPayload.name || `${givenName} ${surname}`.trim();
    
    const extractedInfo = {
      email,
      role,
      givenName,
      surname,
      name,
      displayName: name,
    };
    
    console.log('[AUTH_TOKEN_EXTRACT] Extracted from token:', { email, role, name });
    return extractedInfo;
    
  } catch (error) {
    console.error('[AUTH_TOKEN_EXTRACT] Error extracting from token:', error);
    return null;
  }
}

// Helper function to get role from FHIR resources (fallback when Azure B2C fails)
async function getRoleFromFHIR(userId: string): Promise<'Patient' | 'Practitioner' | 'Admin' | null> {
  try {
    console.log('[AUTH_FHIR_FALLBACK] Checking FHIR role for user:', userId);
    const response = await fetch(`http://localhost:7071/api/fhir-storage/users/${userId}/role`);

    if (response.ok) {
      const data = await response.json();
      if (data.success && data.data?.role) {
        console.log('[AUTH_FHIR_FALLBACK] Role found in FHIR:', data.data.role);
        return data.data.role;
      }
    } else if (response.status === 404) {
      console.log('[AUTH_FHIR_FALLBACK] No FHIR resources found for user');
    }
  } catch (error) {
    console.error('[AUTH_FHIR_FALLBACK] Error fetching role from FHIR:', error);
  }

  return null;
}

// Simple helper function to check and update onboarding status
async function checkAndUpdateOnboardingStatus(user: ExtendedUser) {
  try {
    console.log('[AUTH_CHECK] Checking for user:', user.id, 'email:', user.email);
    
    // Check by user ID first (most direct)
    const userResponse = await fetch(`http://localhost:7071/api/fhir-storage/patients/${user.id}/resources`);
    if (userResponse.ok) {
      const userData = await userResponse.json();
      if (userData.success && userData.data?.resources?.length > 0) {
        const userResource = userData.data.resources.find((r: any) => 
          r.resourceType === 'Patient' || r.resourceType === 'Practitioner'
        );
        
        if (userResource) {
          console.log('[AUTH_CHECK] Found resource by user ID:', userResource.resourceType);
          user.needsOnboarding = false;
          
          // Extract role from extension
          const roleExtension = userResource.extension?.find((ext: any) => 
            ext.url === 'http://lelink.health/fhir/StructureDefinition/user-role'
          );
          if (roleExtension?.valueString) {
            user.role = roleExtension.valueString;
            console.log('[AUTH_CHECK] Role from extension:', user.role);
          } else {
            user.role = userResource.resourceType; // fallback to resource type
          }
          return;
        }
      }
    }

    // If not found by user ID and has email, check by email
    if (user.email) {
      const emailResponse = await fetch(
        `http://localhost:7071/api/fhir-storage/users/by-email/${encodeURIComponent(user.email)}`
      );
      if (emailResponse.ok) {
        const emailData = await emailResponse.json();
        if (emailData.success && emailData.data?.resource) {
          console.log('[AUTH_CHECK] Found resource by email:', emailData.data.resource.resourceType);
          user.needsOnboarding = false;
          
          // Extract role from extension
          const roleExtension = emailData.data.resource.extension?.find((ext: any) => 
            ext.url === 'http://lelink.health/fhir/StructureDefinition/user-role'
          );
          if (roleExtension?.valueString) {
            user.role = roleExtension.valueString;
            console.log('[AUTH_CHECK] Role from email resource:', user.role);
          } else {
            user.role = emailData.data.resource.resourceType; // fallback
          }
          
          // Update user ID to match FHIR
          if (emailData.data.userId) {
            user.id = emailData.data.userId;
          }
          return;
        }
      }
    }

    // No resources found
    user.needsOnboarding = true;
    console.log('[AUTH_CHECK] No resources found, needs onboarding');
    
  } catch (error) {
    console.log('[AUTH_CHECK] Error:', error);
    // On error, don't change status to avoid loops
  }
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    AzureADB2CProvider({
      clientId: process.env.AUTH_AZURE_AD_B2C_ID!,
      clientSecret: process.env.AUTH_AZURE_AD_B2C_SECRET!,
      issuer: process.env.AUTH_AZURE_AD_B2C_ISSUER,

      authorization: {
        params: {
          scope: `offline_access profile email openid`,
          prompt: 'login', // Force login prompt every time
        },
      },

      checks: ['pkce', 'state'],

      profile(profile: AzureB2CProfile) {
        console.log('[AUTH_DEBUG] Processing Azure B2C profile for user:', profile.sub);

        // Try to get role from multiple possible sources in B2C
        const b2cId = process.env.AUTH_AZURE_AD_B2C_ID?.replace(/-/g, '');

        // Check all possible role field variations for B2C
        const possibleRoles = {
          role: (profile as any)['role'],
          Role: (profile as any)['Role'],
          userRole: (profile as any)['userRole'],
          user_role: (profile as any)['user_role'],
          extension_role: (profile as any)['extension_role'],
          extension_Role: (profile as any)['extension_Role'],
          [`extension_${b2cId}_role`]: (profile as any)[`extension_${b2cId}_role`],
          [`extension_${b2cId}_Role`]: (profile as any)[`extension_${b2cId}_Role`],
          [`extension_${b2cId}_UserRole`]: (profile as any)[`extension_${b2cId}_UserRole`],
          jobTitle: profile.jobTitle,
          wids: (profile as any)['wids'], // Windows Identity Foundation role IDs
        };

        // Try to extract role from any available source
        const extractedRole =
          possibleRoles.role ||
          possibleRoles.Role ||
          possibleRoles.userRole ||
          possibleRoles.user_role ||
          possibleRoles.extension_role ||
          possibleRoles.extension_Role ||
          possibleRoles[`extension_${b2cId}_role`] ||
          possibleRoles[`extension_${b2cId}_Role`] ||
          possibleRoles[`extension_${b2cId}_UserRole`];

        let role: 'Patient' | 'Practitioner' | 'Admin' | undefined;

        if (extractedRole && ['Patient', 'Practitioner', 'Admin'].includes(extractedRole)) {
          role = extractedRole;
          console.log('[AUTH_DEBUG] Role found from B2C:', role);
        } else {
          // Fall back to job title analysis
          const jobTitle = profile.jobTitle?.toLowerCase() || '';
          if (
            jobTitle.includes('doctor') ||
            jobTitle.includes('physician') ||
            jobTitle.includes('nurse') ||
            jobTitle.includes('practitioner') ||
            jobTitle.includes('medical') ||
            jobTitle.includes('clinician')
          ) {
            role = 'Practitioner';
          } else if (jobTitle.includes('admin') || jobTitle.includes('administrator')) {
            role = 'Admin';
          }

          // Check Windows Identity Foundation role IDs (wids) as fallback
          if (!role && possibleRoles.wids && Array.isArray(possibleRoles.wids)) {
            for (const wid of possibleRoles.wids) {
              if (wid === 'b79fbf4d-3ef9-4689-8143-76b194e85509') {
                // Global Administrator
                role = 'Admin';
                break;
              }
            }
          }

          if (role) {
            console.log('[AUTH_DEBUG] Role inferred from job title/wids:', role);
          } else {
            console.log('[AUTH_DEBUG] No role found in B2C profile, will check FHIR resources');
          }
        }

        // Extract email from multiple possible B2C locations with proper fallbacks
        const email =
          profile.emails?.[0] ||
          profile.email ||
          profile.unique_name ||
          profile.preferred_username ||
          profile.upn ||
          (profile as any).mail ||
          (profile as any).userPrincipalName ||
          (profile as any)['signInNames.emailAddress'] ||
          (profile as any).signInNames?.[0]?.value ||
          (profile as any).signInNames?.[0] ||
          (profile as any).identities?.find((id: any) => id.signInType === 'emailAddress')?.issuerAssignedId ||
          (profile as any).otherMails?.[0];

        console.log('[AUTH_DEBUG] B2C user email:', email || 'none found');
        console.log('[AUTH_DEBUG] B2C user role:', role || 'none - will check FHIR fallback');

        return {
          id: profile.sub,
          name: profile.name || profile.displayName,
          email: email,
          givenName: profile.givenName,
          surname: profile.surname || profile.family_name,
          displayName: profile.displayName,
          jobTitle: profile.jobTitle,
          city: profile.city,
          country: profile.country,
          postalCode: profile.postalCode,
          state: profile.state,
          streetAddress: profile.streetAddress,
          role,
          provider: 'azure-ad-b2c',
          needsOnboarding: !role, // Only skip onboarding if we have a valid role from B2C
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      profile(profile) {
        console.log('[AUTH_DEBUG] Processing Google profile for user:', profile.sub);

        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          givenName: profile.given_name,
          surname: profile.family_name,
          displayName: profile.name,
          provider: 'google',
          needsOnboarding: true, // Google users need onboarding
          // Don't assign a default role - will be determined during onboarding or from existing resources
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: { token: any; account: any; user: any }) {
      console.log('[AUTH_DEBUG] JWT callback - account:', !!account, 'user:', !!user);
      
      // Initial sign in
      if (account && user) {
        console.log('[AUTH_DEBUG] Initial sign in for provider:', account.provider);

        let enhancedUser = user as ExtendedUser;

        // For Azure B2C users, enhance user info from access token (more reliable than profile)
        if (account.provider === 'azure-ad-b2c' && account.access_token) {
          const tokenInfo = extractUserInfoFromAccessToken(account.access_token);
          
          if (tokenInfo) {
            // Override/enhance user info with token data (more reliable)
            if (tokenInfo.email && !enhancedUser.email) {
              enhancedUser.email = tokenInfo.email;
            }
            if (tokenInfo.role && !enhancedUser.role) {
              enhancedUser.role = tokenInfo.role;
            }
            if (tokenInfo.givenName && !enhancedUser.givenName) {
              enhancedUser.givenName = tokenInfo.givenName;
            }
            if (tokenInfo.surname && !enhancedUser.surname) {
              enhancedUser.surname = tokenInfo.surname;
            }
            if (tokenInfo.name && !enhancedUser.name) {
              enhancedUser.name = tokenInfo.name;
            }
            if (tokenInfo.displayName && !enhancedUser.displayName) {
              enhancedUser.displayName = tokenInfo.displayName;
            }
            console.log('[AUTH_DEBUG] Enhanced user from token data');
          }
        }

        // FEDERATED IDENTITY HANDLING - Universal approach for all providers
        console.log('[AUTH_DEBUG] Starting federated identity processing for:', enhancedUser.provider);
        
        if (enhancedUser.email) {
          try {
            // Check if user already exists by email (across all providers)
            const emailCheckResponse = await fetch(
              `http://localhost:7071/api/fhir-storage/users/by-email/${encodeURIComponent(enhancedUser.email)}`
            );

            if (emailCheckResponse.ok) {
              const emailData = await emailCheckResponse.json();
              if (emailData.success && emailData.data?.resource) {
                console.log('[AUTH_DEBUG] Found existing FHIR resource for email');
                console.log('[AUTH_DEBUG] Existing user ID:', emailData.data.userId, 'Current session ID:', enhancedUser.id);
                
                // Extract role from existing resource
                const roleExtension = emailData.data.resource.extension?.find((ext: any) => 
                  ext.url === 'http://lelink.health/fhir/StructureDefinition/user-role'
                );
                if (roleExtension?.valueString) {
                  enhancedUser.role = roleExtension.valueString;
                } else {
                  enhancedUser.role = emailData.data.resource.resourceType; // fallback
                }
                
                console.log('[AUTH_DEBUG] User role from existing resource:', enhancedUser.role);
                
                // Check if current session ID is already in identifiers
                const existingIdentifiers = emailData.data.resource.identifier || [];
                const hasCurrentId = existingIdentifiers.some((id: any) => 
                  id.system === 'http://lelink.healthcare/user-id' && id.value === enhancedUser.id
                );
                
                if (!hasCurrentId) {
                  console.log('[AUTH_DEBUG] Adding new provider session ID to existing resource');
                  
                  // Add current session ID to identifiers via API call (using email for lookup)
                  try {
                    const updateResponse = await fetch(
                      `http://localhost:7071/api/fhir-storage/users/${encodeURIComponent(enhancedUser.email)}/add-identifier`,
                      {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          system: 'http://lelink.healthcare/user-id',
                          value: enhancedUser.id,
                          use: 'secondary',
                          provider: enhancedUser.provider,
                        }),
                      }
                    );
                    
                    if (updateResponse.ok) {
                      console.log('[AUTH_DEBUG] Successfully added new identifier to existing resource');
                    } else {
                      console.log('[AUTH_DEBUG] Failed to add identifier, but continuing with existing resource');
                    }
                  } catch (updateError) {
                    console.error('[AUTH_DEBUG] Error adding identifier:', updateError);
                    // Continue anyway - user can still access with existing resource
                  }
                } else {
                  console.log('[AUTH_DEBUG] Current session ID already exists in identifiers');
                }
                
                // Use existing resource's user ID for session consistency
                enhancedUser.id = emailData.data.userId;
                enhancedUser.needsOnboarding = false;
                
                console.log('[AUTH_DEBUG] Linked to existing resource - ID:', enhancedUser.id, 'Role:', enhancedUser.role);
                
              } else {
                console.log('[AUTH_DEBUG] Email check successful but no resource data - needs onboarding');
                enhancedUser.needsOnboarding = true;
              }
            } else if (emailCheckResponse.status === 404) {
              console.log('[AUTH_DEBUG] No existing user found with email - proceeding with onboarding');
              enhancedUser.needsOnboarding = true;
              
              // For Azure B2C users, auto-create if they have role
              if (enhancedUser.provider === 'azure-ad-b2c' && enhancedUser.role) {
                console.log('[AUTH_DEBUG] Azure B2C user with role - creating FHIR resources');
                try {
                  const created = await BackgroundFHIRCreationService.createFHIRResourcesForB2CUser({
                    id: enhancedUser.id,
                    email: enhancedUser.email || '',
                    givenName: enhancedUser.givenName,
                    surname: enhancedUser.surname,
                    displayName: enhancedUser.displayName,
                    jobTitle: enhancedUser.jobTitle,
                    city: enhancedUser.city,
                    state: enhancedUser.state,
                    postalCode: enhancedUser.postalCode,
                    country: enhancedUser.country,
                    streetAddress: enhancedUser.streetAddress,
                    role: enhancedUser.role,
                    provider: enhancedUser.provider,
                  });

                  if (created) {
                    console.log('[AUTH_DEBUG] FHIR resources created successfully for Azure B2C user');
                    enhancedUser.needsOnboarding = false;
                  }
                } catch (error) {
                  console.error('[AUTH_DEBUG] FHIR creation failed for Azure B2C user:', error);
                }
              }
              
            } else {
              console.log('[AUTH_DEBUG] Email check failed with status:', emailCheckResponse.status);
              enhancedUser.needsOnboarding = true;
            }
          } catch (error) {
            console.error('[AUTH_DEBUG] Error during federated identity check:', error);
            enhancedUser.needsOnboarding = true;
          }
        } else {
          console.log('[AUTH_DEBUG] User has no email - needs onboarding');
          enhancedUser.needsOnboarding = true;
        }
        
        console.log('[AUTH_DEBUG] Final federated identity result - Provider:', enhancedUser.provider, 
                   'ID:', enhancedUser.id, 'Role:', enhancedUser.role, 'Needs onboarding:', enhancedUser.needsOnboarding);

        return {
          ...token,
          accessToken: account.access_token,
          idToken: account.id_token,
          user: enhancedUser,
        };
      }

      // For subsequent requests, check onboarding status for users who need it
      if (token.user && token.user.needsOnboarding) {
        console.log('[AUTH_DEBUG] Checking onboarding for user:', token.user.id);
        const updatedUser = { ...token.user };
        
        await checkAndUpdateOnboardingStatus(updatedUser);
        
        // If status changed, return updated token
        if (updatedUser.needsOnboarding !== token.user.needsOnboarding || updatedUser.role !== token.user.role) {
          console.log('[AUTH_DEBUG] Status updated - needsOnboarding:', updatedUser.needsOnboarding, 'role:', updatedUser.role);
          return {
            ...token,
            user: updatedUser,
          };
        }
      }

      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken;
      session.idToken = token.idToken;
      session.error = token.error;
      if (token.user) {
        session.user = token.user;
        console.log('[AUTH_DEBUG] Session user role:', session.user?.role, 'provider:', session.user?.provider);
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      console.log('[AUTH_DEBUG] Redirect callback - url:', url, 'baseUrl:', baseUrl);

      // Handle logout redirect
      if (url === '/') {
        return url;
      }
      // Handle login redirects
      if (url.includes('/login')) {
        return url;
      }
      // Allow onboarding page
      if (url.includes('/onboarding')) {
        return url;
      }

      // Default to dashboard after login
      // Note: Onboarding redirect logic is handled in middleware
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signIn(message: any) {
      console.log('Sign-in event:', message);
    },
    async signOut(message: any) {
      console.log('Sign-out event:', message);
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  debug: process.env.NODE_ENV === 'development',
};

export const getSession = () => getServerSession(authOptions);
export const auth = () => getServerSession(authOptions);