"use client";

import { useEffect } from "react";

import { captureError } from "@/lib/observability";

// Replaces the root layout when an error is thrown in it, so it must render
// its own <html>/<body>.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void captureError(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          minHeight: "100vh",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: "12px",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>
          Something went wrong
        </h2>
        <p style={{ color: "#6b7280", fontSize: "14px" }}>
          An unexpected error occurred.
        </p>
        <button
          onClick={reset}
          style={{
            background: "#171717",
            color: "#fff",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
