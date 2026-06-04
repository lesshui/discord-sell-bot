import { prisma } from "@/lib/prisma";

type SessionUserLike = { id?: string | null; isAdmin?: boolean | null } | undefined | null;

// Whether a user may ACT on an order (price it, update its status). True for an
// app-wide admin, or the owner of the Discord server the order is routed to.
// A server "admin" (manage-guild but not owner) is view-only and gets false, so
// orders stay scoped to (server, owner): owning server A does not grant any
// power over server B's orders.
export async function canManageOrder(
  user: SessionUserLike,
  order: { serverId: string | null },
): Promise<boolean> {
  if (!user?.id) return false;
  if (user.isAdmin) return true;
  if (!order.serverId) return false;

  const server = await prisma.discordServer.findUnique({
    where: { id: order.serverId },
    select: { ownerId: true },
  });
  return server?.ownerId === user.id;
}
