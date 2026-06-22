import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { verify } from "@node-rs/argon2";

import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { loginSchema } from "@/lib/validations/auth";
import { Role } from "@/generated/prisma/enums";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  // Force the `__Secure-` cookie prefix + Secure flag in production. Auth.js
  // already sets httpOnly and SameSite=Lax on the session cookie by default.
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Re-validate on the server — never trust the posted shape.
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) return null;

        const valid = await verify(user.passwordHash, password);
        if (!valid) return null;

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.avatarUrl,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    // For Google sign-in, make sure a local user row exists (default role TENANT).
    async signIn({ user, account, profile }) {
      if (account?.provider !== "google") return true;
      const email = user.email;
      if (!email) return false;

      const existing = await db.user.findUnique({ where: { email } });
      if (!existing) {
        await db.user.create({
          data: {
            email,
            name: user.name ?? profile?.name ?? email.split("@")[0],
            avatarUrl: user.image ?? null,
            role: Role.TENANT,
          },
        });
      }
      return true;
    },
    async jwt({ token, user, account }) {
      // Credentials sign-in: the authorized user already carries our id + role.
      const incomingRole = (user as { role?: Role } | undefined)?.role;
      if (user?.id && incomingRole) {
        token.id = user.id;
        token.role = incomingRole;
        return token;
      }

      // Google sign-in (or any token still missing a role): resolve from the DB.
      if ((account?.provider === "google" || !token.role) && token.email) {
        const dbUser = await db.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
        }
      }
      return token;
    },
  },
});
