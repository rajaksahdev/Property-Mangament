"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FileText, Loader2, Upload, X } from "lucide-react";

import { assignTenant } from "@/lib/actions/lease";
import { createPresignedDocumentUrl } from "@/lib/actions/upload";
import {
  assignTenantSchema,
  ALLOWED_DOCUMENT_TYPES,
  MAX_DOCUMENT_BYTES,
  type AssignTenantValues,
} from "@/lib/validations/lease";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type NumericField = "monthlyRent" | "dueDay" | "deposit";

export function AssignTenantForm({
  propertyId,
  defaultRent,
  defaultDeposit,
  defaultTenantEmail,
}: {
  propertyId: string;
  defaultRent: number;
  defaultDeposit: number;
  defaultTenantEmail?: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [agreementName, setAgreementName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const form = useForm<AssignTenantValues>({
    resolver: zodResolver(assignTenantSchema),
    defaultValues: {
      tenantEmail: defaultTenantEmail ?? "",
      tenantName: "",
      startDate: "",
      endDate: "",
      monthlyRent: defaultRent,
      dueDay: 1,
      deposit: defaultDeposit,
      agreementUrl: "",
    },
  });

  function numberHandler(field: NumericField) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      const el = event.target;
      form.setValue(field, el.value === "" ? (undefined as never) : el.valueAsNumber, {
        shouldValidate: form.formState.isSubmitted,
      });
    };
  }

  async function handleAgreement(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setUploadError(null);
    if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      setUploadError("Agreement must be a PDF or image.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      setUploadError("Agreement must be 10MB or smaller.");
      return;
    }

    setUploading(true);
    const presign = await createPresignedDocumentUrl({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });
    if (!presign.ok) {
      setUploadError(presign.error);
      setUploading(false);
      return;
    }
    try {
      const res = await fetch(presign.uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!res.ok) throw new Error("upload failed");
      form.setValue("agreementUrl", presign.publicUrl);
      setAgreementName(file.name);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function removeAgreement() {
    form.setValue("agreementUrl", "");
    setAgreementName(null);
  }

  async function onSubmit(values: AssignTenantValues) {
    setServerError(null);
    const result = await assignTenant(propertyId, values);
    if (result?.error) setServerError(result.error);
    if (result?.fieldErrors) {
      for (const [field, messages] of Object.entries(result.fieldErrors)) {
        if (messages?.[0]) {
          form.setError(field as keyof AssignTenantValues, {
            message: messages[0],
          });
        }
      }
    }
  }

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {serverError && (
          <Alert variant="destructive">
            <AlertDescription>{serverError}</AlertDescription>
          </Alert>
        )}

        {/* Tenant */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="tenantEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tenant email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="tenant@example.com" {...field} />
                </FormControl>
                <FormDescription>
                  Existing tenants are matched; new ones are invited.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="tenantName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name (for new tenants)</FormLabel>
                <FormControl>
                  <Input placeholder="Jane Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Lease terms */}
        <div className="grid gap-6 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Start date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>End date (optional)</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="monthlyRent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Monthly rent (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("monthlyRent")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDay"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rent due day</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("dueDay")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="deposit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Deposit (₹)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value ?? ""}
                    onChange={numberHandler("deposit")}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Agreement upload */}
        <FormItem>
          <FormLabel>Lease agreement (PDF)</FormLabel>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/*"
            className="hidden"
            onChange={handleAgreement}
          />
          {agreementName ? (
            <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-3 py-2">
              <span className="flex items-center gap-2 text-sm">
                <FileText className="size-4 text-muted-foreground" />
                {agreementName}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7"
                onClick={removeAgreement}
              >
                <X className="size-4" />
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
              Upload agreement
            </Button>
          )}
          {uploadError && (
            <p className="text-sm text-destructive">{uploadError}</p>
          )}
          <FormDescription>PDF or image, up to 10MB.</FormDescription>
        </FormItem>

        <div className="flex items-center justify-end gap-3 border-t pt-6">
          <Button type="submit" disabled={isSubmitting || uploading}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Assign tenant
          </Button>
        </div>
      </form>
    </Form>
  );
}
