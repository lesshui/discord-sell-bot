import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendOrderUpdate } from "@/lib/discord";
import { canManageOrder } from "@/lib/order-auth";
import { prisma } from "@/lib/prisma";

// Prices a manual-review submission (DRAFT) and moves it to OFFERED. Custom /
// "not listed" cards land as DRAFT with offerCents 0; this is the only path that
// gives them a real offer the seller can then accept. Authorized for an app
// admin or the buyer (owner of the order's Discord server). Automatic
// scraper-driven pricing is intentionally out of MVP scope — offers are set by
// hand here.
const schema = z.object({
  offerDollars: z.coerce.number().positive().max(1_000_000),
});

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = schema.parse(await request.json());

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId } });

  // Only an app admin or the owner of this order's server may price it.
  if (!(await canManageOrder(session.user, order))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (order.status !== "DRAFT") {
    return NextResponse.json(
      { error: "Manual offers can only be set on submissions under review (DRAFT)." },
      { status: 400 },
    );
  }

  const offerCents = Math.round(body.offerDollars * 100);
  const payoutCents = Math.max(0, offerCents - order.shippingDeductionCents);

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      offerCents,
      payoutCents,
      selectedOfferMode: "MANUAL_ADMIN",
      status: "OFFERED",
    },
  });

  await sendOrderUpdate(
    updatedOrder.discordChannelId,
    `Your submission has been reviewed. Offer: $${(offerCents / 100).toFixed(2)} (payout $${(payoutCents / 100).toFixed(2)} after shipping). Open your order to accept.`,
  );

  return NextResponse.json({ order: updatedOrder });
}
