"use client";

import { useEffect } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { captureError } from "@/lib/observability";

export function ErrorState({
  error,
  reset,
  title = "Something went wrong",
}: {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
}) {
  useEffect(() => {
    void captureError(error);
  }, [error]);

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 p-6 text-center">
      <TriangleAlert className="size-10 text-destructive" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred. Please try again.
        </p>
      </div>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
