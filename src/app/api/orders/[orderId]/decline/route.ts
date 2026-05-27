import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { sendOrderUpdate } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  if (order.sellerId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "OFFERED") {
    return NextResponse.json({ error: "Only OFFERED orders can be declined" }, { status: 400 });
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "DRAFT", declinedAt: new Date() },
  });

  await sendOrderUpdate(updated.discordChannelId, `The seller has declined this offer. The order has been moved to drafts.`);

  return NextResponse.json({ ok: true });
}
