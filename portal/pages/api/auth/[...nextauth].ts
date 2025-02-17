import NextAuth, { AuthOptions } from "next-auth";
import KeycloakProvider from "next-auth/providers/keycloak";

export const keycloak = KeycloakProvider({
  clientId: process.env.KEYCLOAK_ID ?? "",
  clientSecret: process.env.KEYCLOAK_SECRET ?? "",
  issuer: process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER,
});

export const authOptions: AuthOptions = {
  providers: [keycloak],
  session: {
    maxAge: 15 * 60, // Expire after 15 minutes
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      // Redirect to relative URL
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // Redirect to non-relative URL on this host
      else if (new URL(url).origin === baseUrl) return url;
      // Redirect to keycloak
      else if (
        process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER &&
        new URL(url).origin ===
          new URL(process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER).origin
      )
        return url;
      // Return to base page
      return baseUrl;
    },
    async jwt({ token, account }) {
      // saves the refresh token to keycloak in the JWT so that we can do API calls later
      if (account) {
        token.refreshToken = account.refresh_token;
      }
      return token;
    },
  },
  theme: {
    logo: `${process.env.NEXTAUTH_URL}/assets/logos/logo-nhs.svg`,
  },
};
export default NextAuth(authOptions);
