import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getSellableServers } from "@/lib/discord-guilds";
import { prisma } from "@/lib/prisma";
import { NewOfferClient } from "@/components/NewOfferClient";

/**
 * /sell — hybrid catalog + custom-submission page.
 *
 *   /sell                       → custom-submission UI (manual review)
 *   /sell?productId=<productId> → catalog autofill (instant offer)
 *
 * Both flows live in the same component; the productId query param drives
 * which one is shown.
 */
export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const { productId: defaultProductId } = await searchParams;

  const [products, config, user, sellableServers] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true, createdAt: true, defaultSellServerId: true },
    }),
    getSellableServers(session.user.id),
  ]);

  const items = products.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    setName: p.setName ?? "",
    cardNumber: p.cardNumber ?? "",
    grade: p.grade ?? "",
    baseOfferCents: p.baseOfferCents,
  }));

  const joinedAt = user?.createdAt
    ? "joined " + new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "";

  return (
    <NewOfferClient
      products={items}
      labelFeeCents={config.labelFeeCents}
      defaultProductId={defaultProductId ?? ""}
      username={session.user.name ?? user?.name ?? "seller"}
      joinedAt={joinedAt}
      avatarUrl={user?.image ?? session.user.image ?? null}
      sellableServers={sellableServers}
      defaultSellServerId={user?.defaultSellServerId ?? null}
    />
  );
}
