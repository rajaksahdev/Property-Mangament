"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DoorOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { endLease } from "@/lib/actions/lease";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

export function EndLeaseDialog({
  leaseId,
  propertyTitle,
}: {
  leaseId: string;
  propertyTitle: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleEnd() {
    startTransition(async () => {
      const result = await endLease(leaseId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Lease ended — property set to vacant");
        setOpen(false);
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline" size="sm">
          <DoorOpen className="size-4" /> End lease
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>End this lease?</AlertDialogTitle>
          <AlertDialogDescription>
            The lease will be deactivated and “{propertyTitle}” will be set back
            to vacant. Past payments and documents are kept.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              handleEnd();
            }}
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            End lease
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
