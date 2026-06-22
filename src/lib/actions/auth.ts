"use server";

import { z } from "zod";
import { hash } from "@node-rs/argon2";
import { redirect } from "next/navigation";
import { AuthError } from "next-auth";

import { auth, signIn, signOut } from "@/auth";
import { db } from "@/lib/db";
import {
  forgotPasswordSchema,
  loginSchema,
  resetPasswordSchema,
  signupSchema,
  type ForgotPasswordInput,
  type LoginInput,
  type ResetPasswordInput,
  type SignupInput,
} from "@/lib/validations/auth";
import {
  createPasswordResetToken,
  verifyPasswordResetToken,
} from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { authLimiter, getClientIp, rateLimit } from "@/lib/rate-limit";

export type ActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
};

function homePathForRole(role: "OWNER" | "TENANT"): string {
  return role === "OWNER" ? "/dashboard" : "/home";
}

const TOO_MANY = {
  error: "Too many attempts. Please wait a few minutes and try again.",
} as const;

/** Per-IP throttle for an auth flow. No-op until Upstash is configured. */
async function throttle(scope: string): Promise<boolean> {
  const ip = await getClientIp();
  const { ok } = await rateLimit(authLimiter, `${scope}:${ip}`);
  return ok;
}

// ---------------------------------------------------------------------------
// Sign up
// ---------------------------------------------------------------------------
export async function signupAction(input: SignupInput): Promise<ActionState> {
  if (!(await throttle("signup"))) return TOO_MANY;
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { name, email, role, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await hash(password);
  await db.user.create({ data: { name, email, role, passwordHash } });

  // Sign the new user in, then route them to their role's home.
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but automatic sign-in failed. Please log in." };
    }
    throw error;
  }

  redirect(homePathForRole(role));
}

// ---------------------------------------------------------------------------
// Log in
// ---------------------------------------------------------------------------
export async function loginAction(input: LoginInput): Promise<ActionState> {
  if (!(await throttle("login"))) return TOO_MANY;
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const { email, password } = parsed.data;

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  const user = await db.user.findUnique({
    where: { email },
    select: { role: true },
  });
  redirect(homePathForRole(user?.role ?? "TENANT"));
}

// ---------------------------------------------------------------------------
// Google OAuth
// ---------------------------------------------------------------------------
export async function googleLoginAction(): Promise<void> {
  // After the callback, "/" routes the user to their role's home.
  await signIn("google", { redirectTo: "/" });
}

// ---------------------------------------------------------------------------
// Log out
// ---------------------------------------------------------------------------
export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: "/login" });
}

// ---------------------------------------------------------------------------
// Forgot password — emails a signed reset link
// ---------------------------------------------------------------------------
export async function forgotPasswordAction(
  input: ForgotPasswordInput,
): Promise<ActionState> {
  if (!(await throttle("forgot"))) return TOO_MANY;
  const parsed = forgotPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const user = await db.user.findUnique({ where: { email: parsed.data.email } });

  // Only send when the account exists, but always report success to avoid
  // leaking which emails are registered (account enumeration).
  if (user) {
    const token = await createPasswordResetToken(user.id);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
    await sendPasswordResetEmail(user.email, resetUrl);
  }

  return { success: true };
}

// ---------------------------------------------------------------------------
// Reset password — verifies the signed token, sets a new password
// ---------------------------------------------------------------------------
export async function resetPasswordAction(
  input: ResetPasswordInput,
): Promise<ActionState> {
  if (!(await throttle("reset"))) return TOO_MANY;
  const parsed = resetPasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const userId = await verifyPasswordResetToken(parsed.data.token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired." };
  }

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    return { error: "This reset link is invalid or has expired." };
  }

  const passwordHash = await hash(parsed.data.password);
  await db.user.update({ where: { id: userId }, data: { passwordHash } });

  return { success: true };
}

// ---------------------------------------------------------------------------
// Helper for server components that need the current session.
// ---------------------------------------------------------------------------
export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
