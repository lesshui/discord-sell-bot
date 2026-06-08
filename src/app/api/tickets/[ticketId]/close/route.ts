import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { closeTicket } from "@/lib/discord";
import { canManageOrder } from "@/lib/order-auth";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ ticketId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { ticketId } = await params;
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId },
    include: { order: { select: { serverId: true } } },
  });
  if (!ticket) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Only admins / server owners may close. Sellers ask in-channel and an admin closes.
  if (!(await canManageOrder(session.user, ticket.order))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await closeTicket({ ticketId: ticket.id, closedById: session.user.id });
  return NextResponse.json({ ticket: updated });
}
