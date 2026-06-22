"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, Loader2 } from "lucide-react";

import { forgotPasswordAction } from "@/lib/actions/auth";
import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
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

export function ForgotPasswordForm() {
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setServerError(null);
    const res = await forgotPasswordAction(values);
    if (res?.error) {
      setServerError(res.error);
      return;
    }
    if (res?.fieldErrors) {
      for (const [field, messages] of Object.entries(res.fieldErrors)) {
        if (messages?.[0]) {
          form.setError(field as keyof ForgotPasswordInput, {
            message: messages[0],
          });
        }
      }
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <Alert>
          <CheckCircle2 />
          <AlertTitle>Check your inbox</AlertTitle>
          <AlertDescription>
            If an account exists for that email, we&apos;ve sent a link to reset
            your password. The link expires in 1 hour.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link href="/login">Back to login</Link>
        </Button>
      </div>
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
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Send reset link
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remembered it?{" "}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </Form>
  );
}
