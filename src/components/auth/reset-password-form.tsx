"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { resetPasswordAction } from "@/lib/actions/auth";
import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

export function ResetPasswordForm({ token }: { token: string }) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: "", confirmPassword: "" },
  });

  async function onSubmit(values: ResetPasswordInput) {
    setServerError(null);
    const res = await resetPasswordAction(values);
    if (res?.error) {
      setServerError(res.error);
      return;
    }
    if (res?.fieldErrors) {
      for (const [field, messages] of Object.entries(res.fieldErrors)) {
        if (messages?.[0]) {
          form.setError(field as keyof ResetPasswordInput, {
            message: messages[0],
          });
        }
      }
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Password updated</AlertTitle>
          <AlertDescription>
            Your password has been reset. You can now log in with your new
            password.
          </AlertDescription>
        </Alert>
        <Button asChild className="w-full">
          <Link href="/login">Continue to login</Link>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Invalid link</AlertTitle>
        <AlertDescription>
          This password reset link is missing its token. Please request a new
          one from the{" "}
          <Link href="/forgot-password" className="font-medium underline">
            forgot password
          </Link>{" "}
          page.
        </AlertDescription>
      </Alert>
    );
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Confirm new password</FormLabel>
              <FormControl>
                <Input type="password" autoComplete="new-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Reset password
        </Button>
      </form>
    </Form>
  );
}
