"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { approveBooking, rejectBooking } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";

export function RequestActions({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function approve() {
    startTransition(async () => {
      // On success this redirects to the prefilled lease-creation flow.
      const result = await approveBooking(bookingId);
      if (result?.error) toast.error(result.error);
    });
  }

  function reject() {
    startTransition(async () => {
      const result = await rejectBooking(bookingId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Request declined");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-2">
      <Button size="sm" onClick={approve} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <Check />}
        Approve
      </Button>
      <Button size="sm" variant="outline" onClick={reject} disabled={pending}>
        <X /> Reject
      </Button>
    </div>
  );
}
