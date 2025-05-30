import { getServerSession, NextAuthOptions, type DefaultSession } from 'next-auth';
import AzureADB2CProvider, { AzureB2CProfile } from 'next-auth/providers/azure-ad-b2c';
import GoogleProvider from 'next-auth/providers/google';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    accessToken?: string;
    error?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    accessToken?: string;
    error?: string;
  }
}

if (!process.env.AUTH_SECRET) {
  throw new Error('Missing AUTH_SECRET environment variable');
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
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.emails?.[0],
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, user }: { token: any; account: any; user: any }) {
      // Initial sign in
      if (account && user) {
        return {
          ...token,
          accessToken: account.access_token,
          // Don't store refresh_token in JWT to reduce size
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
          },
        };
      }
      return token;
    },
    async session({ session, token }: { session: any; token: any }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (token.user) {
        session.user = token.user;
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      // Handle logout redirect
      if (url === '/') {
        return url;
      }
      // Handle login redirects
      if (url.includes('/login')) {
        return url;
      }
      // Default to dashboard after login
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
