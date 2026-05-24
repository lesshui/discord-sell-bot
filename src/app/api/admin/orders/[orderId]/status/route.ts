import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { sendOrderUpdate } from "@/lib/discord";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  status: z.enum([
    "LABEL_READY",
    "SHIPPED",
    "DELIVERED",
    "INSPECTION_PENDING",
    "APPROVED",
    "CONDITION_MISMATCH",
    "FAKE_COUNTERFEIT",
    "MISSING_ITEM",
    "NEEDS_SELLER_CONTACT",
    "PAYOUT_PROMPTED",
    "PAID",
    "REJECTED"
  ]),
  manualLabelUrl: z.string().url().optional().or(z.literal("")),
  trackingNumber: z.string().optional(),
  inspectionNotes: z.string().optional()
});

export async function POST(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { orderId } = await params;
  const body = schema.parse(await request.json());
  const order = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: body.status,
      manualLabelUrl: body.manualLabelUrl || undefined,
      trackingNumber: body.trackingNumber,
      inspectionNotes: body.inspectionNotes
    }
  });

  await sendOrderUpdate(
    order.discordChannelId,
    `Order status updated to ${body.status}.${body.manualLabelUrl ? ` Shipping label: ${body.manualLabelUrl}` : ""}${body.inspectionNotes ? ` Notes: ${body.inspectionNotes}` : ""}`
  );

  return NextResponse.json({ order });
}
