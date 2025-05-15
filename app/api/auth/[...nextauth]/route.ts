import NextAuth from "next-auth";
import AzureADB2CProvider from "next-auth/providers/azure-ad-b2c";

const handler = NextAuth({
  providers: [
    AzureADB2CProvider({
      clientId: process.env.AZURE_B2C_CLIENT_ID!,
      clientSecret: process.env.AZURE_B2C_CLIENT_SECRET!,
      tenantId: process.env.AZURE_B2C_TENANT_NAME!,
      primaryUserFlow: process.env.AZURE_B2C_USER_FLOW!,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, account, profile }) {
      if (profile) {
        token.name = profile.name;
        token.email = profile.email;
      }
      return token;
    },
    async session({ session, token }) {
      //   session.user.name = token.name;
      //   session.user.email = token.email;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
