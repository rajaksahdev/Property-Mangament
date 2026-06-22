"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { renewLease } from "@/lib/actions/lease";
import { Button } from "@/components/ui/button";

export function RenewLeaseButton({ leaseId }: { leaseId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function renew() {
    startTransition(async () => {
      const result = await renewLease(leaseId);
      if (result?.error) toast.error(result.error);
      else {
        toast.success("Lease renewed for 12 months");
        router.refresh();
      }
    });
  }

  return (
    <Button size="sm" variant="outline" onClick={renew} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : <RefreshCw />}
      Renew lease
    </Button>
  );
}
