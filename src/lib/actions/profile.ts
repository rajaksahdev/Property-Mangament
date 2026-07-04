"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";
import { db } from "@/lib/db";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name is too long"),
  // Absolute R2 URL when set; null clears the avatar.
  avatarUrl: z.string().url().nullable(),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export type ProfileActionState = {
  error?: string;
  fieldErrors?: Record<string, string[] | undefined>;
  success?: boolean;
};

export async function updateProfileAction(
  input: ProfileInput,
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) return { error: "Not authorized." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return { fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  await db.user.update({
    where: { id: session.user.id },
    data: { name: parsed.data.name, avatarUrl: parsed.data.avatarUrl },
  });

  // Refresh anywhere the name/avatar is shown.
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  revalidatePath("/home");
  return { success: true };
}
