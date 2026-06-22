import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import type { Role } from "@/generated/prisma/enums";

/**
 * Edge/proxy-safe Auth.js config.
 *
 * This file deliberately imports NO Node-only modules (Prisma, argon2). It is
 * consumed by `proxy.ts` to read the session JWT, and spread into the full
 * config in `auth.ts`. The Credentials provider and DB-backed callbacks live in
 * `auth.ts` only.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // Link Google to an existing local account with the same verified email.
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  callbacks: {
    // Expose the role + id (baked into the JWT in auth.ts) on the session so
    // both the server (`auth()`) and the proxy can read `session.user.role`.
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
