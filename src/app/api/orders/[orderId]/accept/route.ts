import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendOrderUpdate } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  payoutMethod: z.enum(["ZELLE", "CRYPTO", "PAYPAL", "WIRE_ACH"]),
  payoutDetails: z.string().min(3),
  acceptedTerms: z.literal(true)
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

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "AWAITING_LABEL",
      payoutMethod: body.payoutMethod,
      payoutDetails: body.payoutDetails,
      termsAcceptedAt: new Date()
    }
  });

  await sendOrderUpdate(updatedOrder.discordChannelId, `Offer accepted. Admin must upload a manual shipping label. Payout will be prompted after delivery and inspection approval.`);

  return NextResponse.json({ order: updatedOrder });
}
