"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CalendarCheck, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

import { createBooking } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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

export function PropertyActions({
  propertyId,
  disabledReason,
}: {
  propertyId: string;
  disabledReason?: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [inquiryOpen, setInquiryOpen] = useState(false);
  const [message, setMessage] = useState("");

  if (disabledReason) {
    return (
      <div className="space-y-2">
        <div className="flex gap-3">
          <Button className="flex-1" disabled>
            <CalendarCheck /> Book Now
          </Button>
          <Button variant="outline" className="flex-1" disabled>
            <MessageSquare /> Send Inquiry
          </Button>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          {disabledReason}
        </p>
      </div>
    );
  }

  function book() {
    startTransition(async () => {
      const result = await createBooking(propertyId, { intent: "BOOK" });
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Booking request sent to the owner");
        router.refresh();
      }
    });
  }

  function sendInquiry() {
    startTransition(async () => {
      const result = await createBooking(propertyId, {
        intent: "INQUIRY",
        message,
      });
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Inquiry sent to the owner");
        setInquiryOpen(false);
        setMessage("");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex gap-3">
      <Button className="flex-1" onClick={book} disabled={pending}>
        {pending ? <Loader2 className="animate-spin" /> : <CalendarCheck />}
        Book Now
      </Button>

      <AlertDialog open={inquiryOpen} onOpenChange={setInquiryOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline" className="flex-1" disabled={pending}>
            <MessageSquare /> Send Inquiry
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send an inquiry</AlertDialogTitle>
            <AlertDialogDescription>
              Ask the owner a question or share what you&apos;re looking for.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Is parking included? When can I move in?"
            rows={4}
          />
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                event.preventDefault();
                sendInquiry();
              }}
              disabled={pending}
            >
              {pending && <Loader2 className="animate-spin" />}
              Send inquiry
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
