import { getUserDetails } from "@/sevices/msGraph";
import { NextAuthConfig } from "next-auth";
import microsoftEntraId from "next-auth/providers/microsoft-entra-id";

export const authConfig: NextAuthConfig = {
  // https://next-auth.js.org/configuration/options#providers
  providers: [
    // https://authjs.dev/getting-started/providers/microsoft-entra-id
    microsoftEntraId({
      clientId: process.env.AZURE_CLIENT_ID,
      clientSecret: process.env.AZURE_CLIENT_SECRET,
      issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      authorization: {
        // https://learn.microsoft.com/en-us/graph/permissions-overview
        params: {
          scope: "openid profile email User.Read offline_access",
        },
      },
    }),
  ],
  // https://next-auth.js.org/configuration/options#secret
  secret: process.env.AUTH_SECRET,
  // https://next-auth.js.org/configuration/options#session
  session: {
    strategy: "jwt",
    maxAge: 3600,
    updateAge: 900,
  },
  debug: true,
  // https://next-auth.js.org/configuration/options#pages
  pages: {
    // signIn: ROUTES.INTERNAL.SIGN_IN,q
    // signOut: ROUTES.INTERNAL.SIGN_IN,
    // error: ROUTES.INTERNAL.SIGN_IN,
  },
  // https://next-auth.js.org/configuration/options#callbacks
  callbacks: {
    // https://next-auth.js.org/configuration/callbacks#jwt-callback
    async jwt({ token, account }) {
      if (account?.access_token) {
        try {
          const userDetails = await getUserDetails(account.access_token);
          token.userDetails = userDetails;
          console.log(userDetails);
        } catch (error) {
          console.error(
            "Failed to fetch user details from Microsoft Graph API",
            error
          );
        }
      }
      return token;
    },
    // https://next-auth.js.org/configuration/callbacks#session-callback
    async session({ session, token }) {
      if (token.userDetails) {
        session.user = { ...session.user, ...token.userDetails };
      }
      return session;
    },
  },
  cookies: {
    pkceCodeVerifier: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-authjs.pkce.code_verifier"
          : "authjs.pkce.code_verifier",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/api/auth/callback",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
