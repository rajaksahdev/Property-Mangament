"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import {
  addTenantDocument,
  deleteTenantDocument,
} from "@/lib/actions/tenant";
import { createPresignedDocumentUrl } from "@/lib/actions/upload";
import {
  ALLOWED_DOCUMENT_TYPES,
  DOCUMENT_KINDS,
  MAX_DOCUMENT_BYTES,
} from "@/lib/validations/lease";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const KIND_LABELS: Record<(typeof DOCUMENT_KINDS)[number], string> = {
  AGREEMENT: "Agreement",
  ID_PROOF: "ID proof",
  OTHER: "Other",
};

export type DocumentItem = {
  id: string;
  name: string;
  url: string;
  kind: (typeof DOCUMENT_KINDS)[number];
  createdAt: string;
};

export function TenantDocuments({
  tenantId,
  documents,
}: {
  tenantId: string;
  documents: DocumentItem[];
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [kind, setKind] = useState<(typeof DOCUMENT_KINDS)[number]>("OTHER");
  const [uploading, setUploading] = useState(false);
  const [pending, startTransition] = useTransition();

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!(ALLOWED_DOCUMENT_TYPES as readonly string[]).includes(file.type)) {
      toast.error("Only PDF or image files are allowed.");
      return;
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      toast.error("Files must be 10MB or smaller.");
      return;
    }

    setUploading(true);
    const presign = await createPresignedDocumentUrl({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    });
    if (!presign.ok) {
      toast.error(presign.error);
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

      const result = await addTenantDocument(tenantId, {
        name: file.name,
        url: presign.publicUrl,
        kind,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Document uploaded");
        router.refresh();
      }
    } catch {
      toast.error("Upload failed. Try again.");
    } finally {
      setUploading(false);
    }
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTenantDocument(id);
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={kind}
          onValueChange={(v) =>
            setKind(v as (typeof DOCUMENT_KINDS)[number])
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_LABELS[k]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input
          ref={fileRef}
          type="file"
          accept=".pdf,image/*"
          className="hidden"
          onChange={onFile}
        />
        <Button
          type="button"
          variant="outline"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? <Loader2 className="animate-spin" /> : <Upload />}
          Upload document
        </Button>
      </div>

      {documents.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No documents uploaded yet.
        </p>
      ) : (
        <ul className="divide-y rounded-lg border">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 p-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {doc.createdAt}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Badge variant="secondary">{KIND_LABELS[doc.kind]}</Badge>
                <Button asChild variant="ghost" size="icon" className="size-8">
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Open document"
                  >
                    <Download className="size-4" />
                  </a>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive"
                  onClick={() => remove(doc.id)}
                  disabled={pending}
                  aria-label="Delete document"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
