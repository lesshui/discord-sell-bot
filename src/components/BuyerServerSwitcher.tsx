"use client";

import { useRouter } from "next/navigation";
import { ServerSwitcher, type SwitcherServer } from "@/components/ServerSwitcher";

// Buyer-side switcher: selecting a server navigates to its dashboard.
export function BuyerServerSwitcher({
  servers,
  selectedId,
}: {
  servers: SwitcherServer[];
  selectedId: string;
}) {
  const router = useRouter();
  return (
    <ServerSwitcher
      eyebrow="Viewing"
      menuHeading="Servers you manage"
      servers={servers}
      selectedId={selectedId}
      onSelect={(id) => router.push(`/buyer/${id}`)}
      addBotUrl="https://discord.com/oauth2/authorize"
    />
  );
}
