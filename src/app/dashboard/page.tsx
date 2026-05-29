import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DashboardClient from "@/components/DashboardClient";

function cardHue(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

export default async function SellerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const [orders, user, config] = await Promise.all([
    prisma.order.findMany({
      where: { sellerId: session.user.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { createdAt: true, image: true, name: true },
    }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  const productIds = Array.from(new Set(orders.map((o) => o.productId).filter((id): id is string => Boolean(id))));
  const marketPrices = config.externalApiPricing && productIds.length > 0
    ? await prisma.productMarketPrice.findMany({ where: { productId: { in: productIds } } })
    : [];
  const marketByProductId = new Map(marketPrices.map((m) => [m.productId, m]));

  const username = session.user.name ?? "seller";
  const joinedAt = user?.createdAt
    ? "joined " + new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  const mappedOrders = orders.map((o) => {
    const cardName = o.product?.name ?? o.customCardName ?? "Custom Card";
    const parts: string[] = [];
    if (o.setName) parts.push(o.setName);
    if (o.cardNumber) parts.push(o.cardNumber);
    const cardSet = parts.join(" · ") || "—";
    const market = o.productId ? marketByProductId.get(o.productId) : undefined;

    return {
      id: o.id,
      cardName,
      cardSet,
      condition: o.condition,
      quantity: o.quantity,
      hue: cardHue(cardName),
      offerCents: o.offerCents,
      status: o.status,
      createdAt: new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      declinedAt: o.declinedAt ? o.declinedAt.toISOString() : null,
      marketPriceCents: market?.priceCents ?? null,
      marketPriceScrapedAt: market?.scrapedAt.toISOString() ?? null,
    };
  });

  return (
    <DashboardClient
      username={username}
      joinedAt={joinedAt}
      avatarUrl={user?.image ?? session.user.image ?? null}
      orders={mappedOrders}
      orderCount={orders.length}
      marketPricingEnabled={config.externalApiPricing}
    />
  );
}
