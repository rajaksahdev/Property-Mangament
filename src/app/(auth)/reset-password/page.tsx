import type { Metadata } from "next";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export const metadata: Metadata = { title: "Reset password · Property Manager" };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl">Set a new password</CardTitle>
        <CardDescription>Choose a strong password you don&apos;t reuse</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm token={token ?? ""} />
      </CardContent>
    </Card>
  );
}
