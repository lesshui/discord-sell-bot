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
  requestedMode: z.enum(["MANUAL_ADMIN", "RULE_BASED", "AI_ASSISTED", "EXTERNAL_API"]).optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());
  const [config, product, seller] = await Promise.all([
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    body.productId ? prisma.product.findUnique({ where: { id: body.productId } }) : Promise.resolve(null),
    prisma.user.findUniqueOrThrow({ where: { id: session.user.id } })
  ]);

  const offerCents = calculateOfferCents(config, {
    product,
    customCardName: body.customCardName,
    condition: body.condition,
    quantity: body.quantity,
    requestedMode: body.requestedMode
  });
  const payoutCents = Math.max(0, offerCents - config.labelFeeCents);

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
      selectedOfferMode: body.requestedMode ?? "RULE_BASED",
      offerCents,
      shippingDeductionCents: config.labelFeeCents,
      payoutCents,
      status: "OFFERED"
    }
  });

  const channelId = await createOrderChannel({ orderId: order.id, sellerDiscordId: seller.discordId, sellerName: seller.name });

  const updatedOrder = channelId
    ? await prisma.order.update({ where: { id: order.id }, data: { discordChannelId: channelId } })
    : order;

  await sendOrderUpdate(channelId, `New Pokemon card offer created for ${product?.name ?? body.customCardName ?? "custom card"}. Offer: $${(offerCents / 100).toFixed(2)}. Awaiting seller acceptance.`);

  return NextResponse.json({ order: updatedOrder });
}
