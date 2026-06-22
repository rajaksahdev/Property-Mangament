"use client";

import { ErrorState } from "@/components/error-state";

export default function AuthError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <ErrorState {...props} />
    </div>
  );
}
