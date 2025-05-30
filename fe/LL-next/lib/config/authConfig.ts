import { NextAuthConfig } from 'next-auth';
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id';

// Comprehensive debug logging
console.log('=== AUTH CONFIG DEBUG (Azure AD B2C) ===');
console.log('Environment variables:');
console.log('- AUTH_MICROSOFT_ENTRA_ID_ID:', process.env.AUTH_MICROSOFT_ENTRA_ID_ID ? 'SET' : 'UNDEFINED');
console.log('- AUTH_MICROSOFT_ENTRA_ID_SECRET:', process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ? 'SET' : 'UNDEFINED');
console.log(
  '- AUTH_MICROSOFT_ENTRA_ID_TENANT_ID:',
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID ? 'SET' : 'UNDEFINED'
);
console.log(
  '- AUTH_MICROSOFT_ENTRA_ID_TENANT_NAME:',
  process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_NAME ? 'SET' : 'UNDEFINED'
);
console.log(
  '- AUTH_MICROSOFT_ENTRA_ID_PRIMARY_USER_FLOW:',
  process.env.AUTH_MICROSOFT_ENTRA_ID_PRIMARY_USER_FLOW ? 'SET' : 'UNDEFINED'
);
console.log('- AUTH_SECRET:', process.env.AUTH_SECRET ? 'SET' : 'UNDEFINED');

console.log('\nActual values:');
console.log('- CLIENT_ID:', process.env.AUTH_MICROSOFT_ENTRA_ID_ID);
console.log('- CLIENT_SECRET:', process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET ? '[REDACTED]' : 'UNDEFINED');
console.log('- TENANT_ID:', process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_ID);
console.log('- TENANT_NAME:', process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_NAME);
console.log('- PRIMARY_USER_FLOW:', process.env.AUTH_MICROSOFT_ENTRA_ID_PRIMARY_USER_FLOW);
console.log('- AUTH_SECRET:', process.env.AUTH_SECRET ? '[REDACTED]' : 'UNDEFINED');

// Azure AD B2C configuration
const tenantName = process.env.AUTH_MICROSOFT_ENTRA_ID_TENANT_NAME; // e.g., "lelinkb2c"
const primaryUserFlow = process.env.AUTH_MICROSOFT_ENTRA_ID_PRIMARY_USER_FLOW || 'B2C_1_signupsignin1';
const issuerUrl = `https://${tenantName}.b2clogin.com/${tenantName}.onmicrosoft.com/${primaryUserFlow}/v2.0`;

console.log('- B2C_ISSUER_URL:', issuerUrl);

// Test the discovery endpoint
if (tenantName) {
  const discoveryUrl = `${issuerUrl}/.well-known/openid_configuration`;
  console.log('- DISCOVERY_URL:', discoveryUrl);

  // Test if we can fetch the discovery document
  fetch(discoveryUrl)
    .then((response) => {
      console.log('Discovery endpoint response status:', response.status);
      return response.json();
    })
    .then((data) => {
      console.log('Discovery endpoint issuer field:', data.issuer);
      console.log('Discovery endpoint token_endpoint:', data.token_endpoint);
      console.log('Discovery endpoint authorization_endpoint:', data.authorization_endpoint);
    })
    .catch((error) => {
      console.error('Discovery endpoint error:', error.message);
    });
}

console.log('========================');

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AUTH_MICROSOFT_ENTRA_ID_ID!,
      clientSecret: process.env.AUTH_MICROSOFT_ENTRA_ID_SECRET!,
      // Azure AD B2C configuration
      issuer: issuerUrl,
      authorization: {
        params: {
          scope: 'openid profile email User.Read offline_access',
        },
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: 'jwt',
    maxAge: 3600, // 1 hour
    updateAge: 900, // 15 minutes
  },
  debug: process.env.NODE_ENV === 'development',
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        token.accessToken = account.access_token;
        token.idToken = account.id_token;
        token.profile = profile;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.profile) {
        const profile = token.profile as any; // Type assertion for Microsoft profile
        session.user = {
          ...session.user,
          id: profile.sub,
          name: profile.name,
          email: profile.email,
        };
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after successful sign-in
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/dashboard`;
    },
  },
  events: {
    async signIn({ user, account, profile }) {
      console.log('Azure AD B2C user signed in:', user.email);
    },
  },
};
