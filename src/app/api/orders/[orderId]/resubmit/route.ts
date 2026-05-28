import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

export async function POST(_request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  if (order.sellerId !== session.user.id && !session.user.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "DRAFT") {
    return NextResponse.json({ error: "Only DRAFT orders can be resubmitted" }, { status: 400 });
  }

  if (order.declinedAt && Date.now() - order.declinedAt.getTime() > THREE_DAYS_MS) {
    return NextResponse.json({ error: "Draft has expired" }, { status: 410 });
  }

  await prisma.order.update({
    where: { id: orderId },
    data: { status: "OFFERED", declinedAt: null },
  });

  return NextResponse.json({ ok: true });
}
