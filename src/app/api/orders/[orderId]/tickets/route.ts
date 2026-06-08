import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { openTicket, TICKET_REASONS, type TicketReason } from "@/lib/discord";
import { canManageOrder } from "@/lib/order-auth";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  reason: z.enum(TICKET_REASONS),
  notes: z.string().max(2000).optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = schema.parse(await request.json());

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { id: true, sellerId: true, serverId: true },
  });

  const canManage = await canManageOrder(session.user, order);
  if (order.sellerId !== session.user.id && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const ticket = await openTicket({
    orderId: order.id,
    reason: body.reason as TicketReason,
    notes: body.notes,
    openedById: session.user.id,
  });

  return NextResponse.json({ ticket });
}
