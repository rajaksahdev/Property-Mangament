import type { Metadata } from "next";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

import { PropertyForm } from "@/components/property/property-form";

export const metadata: Metadata = { title: "Add property · Property Manager" };

export default function NewPropertyPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" /> Back to properties
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Add property</h1>
        <p className="text-muted-foreground">
          List a new property in your portfolio.
        </p>
      </div>

      <PropertyForm />
    </div>
  );
}
