import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

// Validation schema for credentials
const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Strapi Admin login response type
interface StrapiAdminAuthResponse {
  data: {
    token: string;
    user: {
      id: number;
      firstname: string;
      lastname: string;
      username: string | null;
      email: string;
      isActive: boolean;
      blocked: boolean;
    };
  };
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Strapi Admin",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@example.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          // Validate credentials format
          const parsed = credentialsSchema.safeParse(credentials);
          if (!parsed.success) {
            console.error("Invalid credentials format");
            return null;
          }

          const { email, password } = parsed.data;

          // Authenticate against Strapi Admin API
          const strapiUrl = process.env.STRAPI_URL || "http://localhost:1337";
          const response = await fetch(`${strapiUrl}/admin/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: email,
              password: password,
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("Strapi admin auth failed:", response.status, errorData);
            return null;
          }

          const data: StrapiAdminAuthResponse = await response.json();

          if (data.data.user.blocked || !data.data.user.isActive) {
            console.error("User is blocked or inactive");
            return null;
          }

          // Return user data - DB sync will happen in API routes
          const displayName = data.data.user.firstname 
            ? `${data.data.user.firstname} ${data.data.user.lastname || ''}`.trim()
            : data.data.user.username || data.data.user.email;

          return {
            id: data.data.user.id.toString(),
            email: data.data.user.email,
            name: displayName,
            strapiUserId: data.data.user.id,
            strapiToken: data.data.token,
          };
        } catch (error) {
          console.error("Authorization error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.strapiUserId = user.strapiUserId;
        token.strapiToken = user.strapiToken;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.strapiUserId = token.strapiUserId as number;
        session.user.strapiToken = token.strapiToken as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 hours
  },
  trustHost: true,
});
