"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import { useDropzone, type FileRejection } from "react-dropzone";
import { Loader2, Star, UploadCloud, X } from "lucide-react";

import { createPresignedUploadUrl } from "@/lib/actions/upload";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_UPLOAD_BYTES,
  type PropertyImageInput,
} from "@/lib/validations/property";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ACCEPT = Object.fromEntries(
  ALLOWED_IMAGE_TYPES.map((type) => [type, [] as string[]]),
);

export function ImageUploader({
  value,
  onChange,
}: {
  value: PropertyImageInput[];
  onChange: (images: PropertyImageInput[]) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (accepted: File[], rejected: FileRejection[]) => {
      setError(null);

      if (rejected.length > 0) {
        setError(
          "Some files were skipped — only JPEG, PNG, WebP, or GIF up to 5MB are allowed.",
        );
      }
      if (accepted.length === 0) return;

      setUploading(true);
      const uploaded: PropertyImageInput[] = [];

      for (const file of accepted) {
        const presign = await createPresignedUploadUrl({
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
        if (!presign.ok) {
          setError(presign.error);
          continue;
        }

        try {
          const res = await fetch(presign.uploadUrl, {
            method: "PUT",
            body: file,
            headers: { "Content-Type": file.type },
          });
          if (!res.ok) {
            setError(`Upload failed for ${file.name}.`);
            continue;
          }
          uploaded.push({ url: presign.publicUrl, caption: "" });
        } catch {
          setError(`Upload failed for ${file.name}.`);
        }
      }

      if (uploaded.length > 0) onChange([...value, ...uploaded]);
      setUploading(false);
    },
    [value, onChange],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPT,
    maxSize: MAX_UPLOAD_BYTES,
    disabled: uploading,
  });

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  function makePrimary(index: number) {
    if (index === 0) return;
    const next = [...value];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center transition-colors",
          isDragActive
            ? "border-primary bg-primary/5"
            : "border-input hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <UploadCloud className="size-6 text-muted-foreground" />
        )}
        <p className="text-sm font-medium">
          {isDragActive
            ? "Drop the images here…"
            : "Drag & drop images, or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP or GIF · up to 5MB each
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {value.map((image, index) => (
            <div
              key={`${image.url}-${index}`}
              className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
            >
              <Image
                src={image.url}
                alt={image.caption || `Property image ${index + 1}`}
                fill
                sizes="(max-width: 640px) 50vw, 200px"
                className="object-cover"
              />

              {index === 0 && (
                <Badge className="absolute left-1.5 top-1.5 gap-1">
                  <Star className="size-3" /> Primary
                </Badge>
              )}

              <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-gradient-to-t from-black/60 to-transparent p-1.5 opacity-0 transition-opacity group-hover:opacity-100">
                {index !== 0 && (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="h-7 px-2 text-xs"
                    onClick={() => makePrimary(index)}
                  >
                    <Star className="size-3" /> Set primary
                  </Button>
                )}
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="ml-auto size-7"
                  onClick={() => removeAt(index)}
                  aria-label="Remove image"
                >
                  <X className="size-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
