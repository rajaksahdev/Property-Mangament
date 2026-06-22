import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { db } from "@/lib/db";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AssignTenantForm } from "@/components/tenant/assign-tenant-form";

export const metadata: Metadata = { title: "Assign tenant · Property Manager" };

export default async function AssignTenantPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tenant?: string }>;
}) {
  const { id } = await params;
  const { tenant } = await searchParams;
  const session = await auth();

  // Authorization: property must belong to this owner.
  const property = await db.property.findFirst({
    where: { id, ownerId: session!.user.id },
  });
  if (!property) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back to properties
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Assign tenant</h1>
        <p className="text-muted-foreground">{property.title}</p>
      </div>

      {property.status === "OCCUPIED" ? (
        <Alert variant="destructive">
          <AlertTitle>This property is already occupied</AlertTitle>
          <AlertDescription>
            End the current lease from the tenant&apos;s profile before
            assigning a new tenant.
          </AlertDescription>
        </Alert>
      ) : (
        <AssignTenantForm
          propertyId={property.id}
          defaultRent={Number(property.rent)}
          defaultDeposit={Number(property.deposit)}
          defaultTenantEmail={tenant}
        />
      )}

      <div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/tenants">View all tenants</Link>
        </Button>
      </div>
    </div>
  );
}
