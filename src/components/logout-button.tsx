"use client";

import { useFormStatus } from "react-dom";
import { Loader2, LogOut } from "lucide-react";

import { logoutAction } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";

function LogoutSubmit() {
  const { pending } = useFormStatus();
  return (
    <Button
      type="submit"
      variant="ghost"
      size="sm"
      className="w-full justify-start"
      disabled={pending}
    >
      {pending ? <Loader2 className="animate-spin" /> : <LogOut />}
      Sign out
    </Button>
  );
}

export function LogoutButton() {
  return (
    <form action={logoutAction} className="w-full">
      <LogoutSubmit />
    </form>
  );
}
