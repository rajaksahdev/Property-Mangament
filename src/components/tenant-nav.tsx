import { NotificationsBell } from "@/components/notifications-bell";
import { TenantNavClient } from "@/components/tenant-nav-client";

export function TenantNav({ name }: { name?: string | null }) {
  // NotificationsBell is an async server component; render it here and pass it
  // to the client nav shell as a slot.
  return <TenantNavClient name={name} bell={<NotificationsBell />} />;
}
