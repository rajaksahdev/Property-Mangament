"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { addTenantNote, deleteTenantNote } from "@/lib/actions/tenant";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export type NoteItem = {
  id: string;
  body: string;
  createdAt: string;
};

export function TenantNotes({
  tenantId,
  notes,
}: {
  tenantId: string;
  notes: NoteItem[];
}) {
  const router = useRouter();
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();

  function add(event: React.FormEvent) {
    event.preventDefault();
    if (!body.trim()) return;
    startTransition(async () => {
      const result = await addTenantNote(tenantId, { body });
      if (result?.error) {
        toast.error(result.error);
      } else {
        setBody("");
        router.refresh();
      }
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      const result = await deleteTenantNote(id);
      if (result?.error) toast.error(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={add} className="space-y-2">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Add a private note about this tenant…"
          rows={3}
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={pending || !body.trim()}>
            {pending && <Loader2 className="animate-spin" />}
            Add note
          </Button>
        </div>
      </form>

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">No notes yet.</p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="group flex items-start justify-between gap-3 rounded-lg border bg-muted/30 p-3"
            >
              <div className="min-w-0 space-y-1">
                <p className="whitespace-pre-wrap text-sm">{note.body}</p>
                <p className="text-xs text-muted-foreground">{note.createdAt}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive"
                onClick={() => remove(note.id)}
                disabled={pending}
                aria-label="Delete note"
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
