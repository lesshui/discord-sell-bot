import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { openTicket, sendOrderUpdate, type TicketReason } from "@/lib/discord";
import { canManageOrder } from "@/lib/order-auth";
import { prisma } from "@/lib/prisma";

const ISSUE_STATUSES: ReadonlySet<TicketReason> = new Set<TicketReason>([
  "CONDITION_MISMATCH",
  "FAKE_COUNTERFEIT",
  "MISSING_ITEM",
  "NEEDS_SELLER_CONTACT",
]);

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
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await params;
  const body = schema.parse(await request.json());

  // Only an app admin or the owner of this order's server may update it.
  const existing = await prisma.order.findUniqueOrThrow({
    where: { id: orderId },
    select: { serverId: true, status: true },
  });
  if (!(await canManageOrder(session.user, existing))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  // Transitioning into an incomplete-issue status auto-opens a support ticket
  // (idempotent — openTicket reuses an existing OPEN ticket for the same order).
  if (
    ISSUE_STATUSES.has(body.status as TicketReason) &&
    existing.status !== body.status
  ) {
    try {
      await openTicket({
        orderId: order.id,
        reason: body.status as TicketReason,
        notes: body.inspectionNotes || null,
        openedById: session.user.id,
      });
    } catch (err) {
      // Don't fail the status update if the Discord side errors; the ticket
      // row still exists and can be retried via the manual open endpoint.
      console.error("openTicket failed for order", order.id, err);
    }
  }

  return NextResponse.json({ order });
}
