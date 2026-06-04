import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getSellableServers } from "@/lib/discord-guilds";
import { prisma } from "@/lib/prisma";
import { PricesClient } from "@/components/PricesClient";

export default async function PricesPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    setName: p.setName ?? "",
    cardNumber: p.cardNumber ?? "",
    grade: p.grade ?? "",
    baseOfferCents: p.baseOfferCents,
  }));

  // Same server switcher as the dashboard: list of sellable servers + the
  // seller's current destination, so changing it here persists everywhere.
  const session = await getServerSession(authOptions);
  const [sellableServers, me] = session?.user?.id
    ? await Promise.all([
        getSellableServers(session.user.id),
        prisma.user.findUnique({
          where: { id: session.user.id },
          select: { defaultSellServerId: true },
        }),
      ])
    : [[], null];

  return (
    <PricesClient
      products={items}
      sellableServers={sellableServers}
      defaultSellServerId={me?.defaultSellServerId ?? null}
    />
  );
}
