import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { createOrderChannel, sendOrderUpdate } from "@/lib/discord";
import { calculateOfferCents } from "@/lib/pricing";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  productId: z.string().optional(),
  customCardName: z.string().optional(),
  setName: z.string().optional(),
  cardNumber: z.string().optional(),
  condition: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(100),
  description: z.string().min(10),
  photoUrls: z.array(z.string().url()).min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());

  const [config, product, seller] = await Promise.all([
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    body.productId ? prisma.product.findUnique({ where: { id: body.productId } }) : Promise.resolve(null),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } }),
  ]);

  let offerCents: number;
  let selectedOfferMode: string;
  let status: string;

  if (product) {
    // Catalog match → instant rule-based offer
    offerCents = calculateOfferCents(config, { product, condition: body.condition, quantity: body.quantity });
    selectedOfferMode = "RULE_BASED";
    status = "OFFERED";
  } else {
    // No catalog match → submit for manual review (eBay % pricing applied once API is ready)
    offerCents = 0;
    selectedOfferMode = "MANUAL_ADMIN";
    status = "DRAFT";
  }

  const payoutCents = offerCents > 0 ? Math.max(0, offerCents - config.labelFeeCents) : 0;

  const order = await prisma.order.create({
    data: {
      sellerId: session.user.id,
      productId: product?.id,
      customCardName: body.customCardName,
      setName: body.setName ?? product?.setName,
      cardNumber: body.cardNumber ?? product?.cardNumber,
      condition: body.condition,
      quantity: body.quantity,
      description: body.description,
      photoUrlsJson: JSON.stringify(body.photoUrls),
      selectedOfferMode,
      offerCents,
      shippingDeductionCents: config.labelFeeCents,
      payoutCents,
      status,
      // Route to the seller's chosen destination server so its owner/admin sees it.
      serverId: seller.defaultSellServerId,
    },
  });

  const channelId = await createOrderChannel({
    orderId: order.id,
    guildId: seller.defaultSellServerId,
    sellerDiscordId: seller.discordId,
    sellerName: seller.name,
  });

  const updatedOrder = channelId
    ? await prisma.order.update({ where: { id: order.id }, data: { discordChannelId: channelId } })
    : order;

  await sendOrderUpdate(
    channelId,
    `New offer: ${product?.name ?? body.customCardName ?? "custom card"} — $${(offerCents / 100).toFixed(2)}. Awaiting seller acceptance.`,
  );

  return NextResponse.json({ order: updatedOrder });
}
