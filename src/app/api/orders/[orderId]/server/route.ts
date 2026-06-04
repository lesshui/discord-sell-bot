import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Routes a submission to the Discord server the seller wants to sell into, so it
// surfaces on that server's buyer dashboard. Allowed for the order's seller (or
// an admin) while the order is still pre-acceptance (DRAFT or OFFERED).
const schema = z.object({
  serverId: z.string().min(1),
});

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = schema.parse(await request.json());

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });
  if (order.sellerId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (order.status !== "DRAFT" && order.status !== "OFFERED") {
    return NextResponse.json(
      { error: "The server can only be changed before the offer is accepted." },
      { status: 400 },
    );
  }

  const server = await prisma.discordServer.findFirst({
    where: { id: body.serverId, active: true },
    select: { id: true },
  });
  if (!server) {
    return NextResponse.json({ error: "Server not found or inactive." }, { status: 404 });
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { serverId: server.id },
  });

  return NextResponse.json({ order: updatedOrder });
}
