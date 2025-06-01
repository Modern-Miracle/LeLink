import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const AZURE_API_BASE_URL = process.env.NEXT_PUBLIC_AZURE_FUNCTIONS_URL || 'http://localhost:7071';

export default withAuth(
  async function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    console.log('[MIDDLEWARE_DEBUG] Path:', pathname, 'Has token:', !!token);
    console.log(
      '[MIDDLEWARE_DEBUG] User:',
      token?.user
        ? {
            id: token.user.id,
            provider: token.user.provider,
            needsOnboarding: token.user.needsOnboarding,
            email: token.user.email,
          }
        : 'No user'
    );

    // Handle authentication and onboarding redirect logic
    if (token?.user) {
      const user = token.user as any;

      // Special handling for different providers
      const isGoogleUser = user.provider === 'google';
      const isAzureB2CUser = user.provider === 'azure-ad-b2c';

      console.log('[MIDDLEWARE_DEBUG] Provider check - Google:', isGoogleUser, 'Azure B2C:', isAzureB2CUser);

      // Determine if user needs onboarding
      let needsOnboarding = user.needsOnboarding;

      // Check for existing user by email across all providers (federated identity management)
      if (user.email && needsOnboarding) {
        console.log('[MIDDLEWARE_DEBUG] User needs onboarding, checking for existing account by email:', user.email);
        try {
          const emailCheckResponse = await fetch(
            `${AZURE_API_BASE_URL}/api/fhir-storage/users/by-email/${encodeURIComponent(user.email)}`
          );

          if (emailCheckResponse.ok) {
            const emailData = await emailCheckResponse.json();
            if (emailData.success && emailData.data?.resource) {
              console.log('[MIDDLEWARE_DEBUG] Found existing FHIR resource for email across providers');
              console.log(
                '[MIDDLEWARE_DEBUG] Existing user ID:',
                emailData.data.userId,
                'Current session ID:',
                user.id
              );
              console.log('[MIDDLEWARE_DEBUG] Resource type:', emailData.data.resource.resourceType);

              // Check if current session ID is already in identifiers
              const existingIdentifiers = emailData.data.resource.identifier || [];
              const hasCurrentId = existingIdentifiers.some(
                (id: any) => id.system === 'http://lelink.healthcare/user-id' && id.value === user.id
              );

              if (!hasCurrentId) {
                console.log('[MIDDLEWARE_DEBUG] Current session ID not in identifiers, adding via API');

                // Add current session ID to identifiers via API call
                try {
                  const updateResponse = await fetch(
                    `${AZURE_API_BASE_URL}/api/fhir-storage/users/${encodeURIComponent(user.email)}/add-identifier`,
                    {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        system: 'http://lelink.healthcare/user-id',
                        value: user.id,
                        use: 'secondary',
                        provider: user.provider,
                      }),
                    }
                  );

                  if (updateResponse.ok) {
                    console.log('[MIDDLEWARE_DEBUG] Successfully linked new provider to existing resource');
                  } else {
                    console.log('[MIDDLEWARE_DEBUG] Failed to link provider, but allowing access to existing resource');
                  }
                } catch (updateError) {
                  console.error('[MIDDLEWARE_DEBUG] Error linking provider:', updateError);
                }
              } else {
                console.log('[MIDDLEWARE_DEBUG] Current session ID already linked to existing resource');
              }

              // User has existing resource, no onboarding needed
              needsOnboarding = false;
            } else {
              console.log('[MIDDLEWARE_DEBUG] Email check API success but no user data - needs onboarding');
              needsOnboarding = true;
            }
          } else if (emailCheckResponse.status === 404) {
            console.log('[MIDDLEWARE_DEBUG] No existing user found with this email - can proceed with onboarding');
            needsOnboarding = true;
          } else {
            console.log('[MIDDLEWARE_DEBUG] Email check failed with status:', emailCheckResponse.status);
          }
        } catch (error) {
          console.error('[MIDDLEWARE_DEBUG] Error checking for existing user by email:', error);
          // Keep existing status on error to avoid blocking user flow
        }
      }

      // For Google users, always check if they need onboarding (fallback)
      if (isGoogleUser && needsOnboarding === undefined) {
        console.log('[MIDDLEWARE_DEBUG] Google user with undefined onboarding status, assuming needs onboarding');
        needsOnboarding = true;
      }

      // For Azure B2C users, check if they have role and other required info
      if (isAzureB2CUser && needsOnboarding === undefined) {
        console.log('[MIDDLEWARE_DEBUG] Azure B2C user with undefined onboarding status, checking role');
        needsOnboarding = !user.role || !user.email;
      }

      console.log('[MIDDLEWARE_DEBUG] Final needsOnboarding determination:', needsOnboarding);

      // Skip onboarding redirect for API routes
      if (pathname.startsWith('/api/')) {
        return NextResponse.next();
      }

      // If user needs onboarding and is not already on onboarding page
      if (needsOnboarding && pathname !== '/onboarding') {
        console.log('[MIDDLEWARE_DEBUG] Redirecting to onboarding - Provider:', user.provider);
        const onboardingUrl = new URL('/onboarding', req.url);
        return NextResponse.redirect(onboardingUrl);
      }

      // If user doesn't need onboarding but is on onboarding page, redirect to dashboard
      if (!needsOnboarding && pathname === '/onboarding') {
        console.log('[MIDDLEWARE_DEBUG] User complete, redirecting to dashboard - Provider:', user.provider);
        const dashboardUrl = new URL('/dashboard', req.url);
        return NextResponse.redirect(dashboardUrl);
      }

      // If user needs onboarding but tries to access protected routes (except onboarding), redirect
      if (
        needsOnboarding &&
        pathname !== '/onboarding' &&
        !pathname.startsWith('/api/') &&
        pathname !== '/login' &&
        pathname !== '/' &&
        pathname !== '/privacy' &&
        pathname !== '/terms'
      ) {
        console.log('[MIDDLEWARE_DEBUG] User needs onboarding, blocking access to:', pathname);
        const onboardingUrl = new URL('/onboarding', req.url);
        return NextResponse.redirect(onboardingUrl);
      }
    }

    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;

        console.log('[MIDDLEWARE_AUTH] Checking authorization for:', pathname, 'Has token:', !!token);

        // Public routes that don't require authentication
        const publicRoutes = [
          '/login',
          '/register',
          '/',
          '/privacy',
          '/terms',
          '/compliance',
          '/debug-auth',
          '/test-auth',
        ];
        if (publicRoutes.includes(pathname)) {
          console.log('[MIDDLEWARE_AUTH] Public route, allowing access');
          return true;
        }

        // API routes - allow all for now (handle auth within API)
        if (pathname.startsWith('/api/')) {
          console.log('[MIDDLEWARE_AUTH] API route, allowing access');
          return true;
        }

        // Onboarding route requires authentication but doesn't need completed profile
        if (pathname === '/onboarding') {
          console.log('[MIDDLEWARE_AUTH] Onboarding route, checking token:', !!token);
          return !!token;
        }

        // All other routes require authentication
        const isAuthorized = !!token;
        console.log('[MIDDLEWARE_AUTH] Protected route authorization result:', isAuthorized);
        return isAuthorized;
      },
    },
  }
);

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
