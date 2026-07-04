"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { cancelBooking } from "@/lib/actions/booking";
import { Button } from "@/components/ui/button";
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

export function BookingCancelButton({
  bookingId,
  propertyTitle,
}: {
  bookingId: string;
  propertyTitle: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function withdraw() {
    startTransition(async () => {
      const result = await cancelBooking(bookingId);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Request withdrawn");
        router.refresh();
      }
    });
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" disabled={pending}>
          {pending ? <Loader2 className="animate-spin" /> : <X />} Withdraw
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Withdraw this request?</AlertDialogTitle>
          <AlertDialogDescription>
            Your pending request for {propertyTitle} will be removed and the
            owner notified. You can request again later.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Keep request</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              withdraw();
            }}
            disabled={pending}
          >
            {pending && <Loader2 className="animate-spin" />}
            Withdraw
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
