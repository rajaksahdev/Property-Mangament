"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";
import { Building2, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * next/image with graceful degradation: shows a pulsing skeleton while loading
 * and a branded icon fallback if the source is missing or fails to load (e.g.
 * an offline/remote host that times out). Meant to fill a `relative` parent.
 */
export function SafeImage({
  alt,
  className,
  fallbackIcon: Icon = Building2,
  fallbackClassName,
  ...props
}: ImageProps & {
  fallbackIcon?: LucideIcon;
  fallbackClassName?: string;
}) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">(
    "loading",
  );

  if (status === "error" || !props.src) {
    return (
      <div
        className={cn(
          "flex size-full items-center justify-center bg-muted text-muted-foreground",
          fallbackClassName,
        )}
      >
        <Icon className="size-10" />
      </div>
    );
  }

  return (
    <>
      {status === "loading" && (
        <div className="absolute inset-0 animate-pulse bg-muted" />
      )}
      <Image
        alt={alt}
        className={className}
        onError={() => setStatus("error")}
        onLoad={() => setStatus("loaded")}
        {...props}
      />
    </>
  );
}
