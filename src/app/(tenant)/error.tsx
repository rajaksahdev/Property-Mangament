"use client";

import { ErrorState } from "@/components/error-state";

export default function TenantError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <ErrorState {...props} />
    </div>
  );
}
