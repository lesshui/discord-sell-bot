import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccessibleBotServers } from "@/lib/discord-guilds";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { AdminOrderStatusForm } from "@/components/AdminOrderStatusForm";
import { BuyerOfferForm } from "@/components/BuyerOfferForm";
import { BuyerServerSwitcher } from "@/components/BuyerServerSwitcher";
import { BuyerAccessError } from "@/components/BuyerAccessError";

// Buyer-facing labels. OFFERED reads as "Offer sent" here (the seller's view
// shows "Offer received" for the same status).
const statusLabel: Record<string, string> = {
  DRAFT: "Awaiting offer",
  OFFERED: "Offer sent",
};

// Light COB status pills.
const statusColor: Record<string, string> = {
  DRAFT: "bg-[rgba(214,158,46,0.14)] text-[#a87718]",
  OFFERED: "bg-[rgba(84,87,217,0.10)] text-[#5457d9]",
  ACCEPTED: "bg-[rgba(84,87,217,0.10)] text-[#5457d9]",
  AWAITING_LABEL: "bg-[rgba(245,200,66,0.14)] text-[#a37300]",
  LABEL_READY: "bg-[rgba(245,200,66,0.14)] text-[#a37300]",
  SHIPPED: "bg-[rgba(245,200,66,0.14)] text-[#a37300]",
  DELIVERED: "bg-[rgba(245,200,66,0.14)] text-[#a37300]",
  INSPECTION_PENDING: "bg-[rgba(245,200,66,0.14)] text-[#a37300]",
  APPROVED: "bg-[rgba(34,192,122,0.12)] text-[#17834f]",
  PAYOUT_PROMPTED: "bg-[rgba(34,192,122,0.12)] text-[#17834f]",
  PAID: "bg-[rgba(34,192,122,0.12)] text-[#17834f]",
  REJECTED: "bg-[rgba(224,74,59,0.10)] text-[#c0392b]",
  CONDITION_MISMATCH: "bg-[rgba(224,74,59,0.10)] text-[#c0392b]",
  FAKE_COUNTERFEIT: "bg-[rgba(224,74,59,0.10)] text-[#c0392b]",
};

// Compact reference showing which server/community an order came in from.
function OriginRef({ name, iconUrl }: { name: string; iconUrl: string | null }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(84,87,217,0.18)] bg-[rgba(84,87,217,0.06)] px-2.5 py-1 text-[11px] font-medium text-[#5457d9]">
      {iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={iconUrl} alt="" className="h-[14px] w-[14px] rounded-[4px] object-cover" />
      ) : (
        <span className="flex h-[14px] w-[14px] items-center justify-center rounded-[4px] bg-[#5457d9] text-[8px] font-bold text-white">
          {(name || "?").charAt(0).toUpperCase()}
        </span>
      )}
      from {name}
    </span>
  );
}

export default async function BuyerDashboard({ params }: { params: Promise<{ serverId: string }> }) {
  const { serverId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const result = await getAccessibleBotServers(session.user.id);
  if (!result.ok) {
    return <BuyerAccessError reason={result.reason} />;
  }
  const servers = result.servers;
  const server = servers.find((s) => s.id === serverId);

  if (!server) notFound();

  const isViewOnly = server.role === "admin";

  const [dbServer, orders, config] = await Promise.all([
    prisma.discordServer.findUnique({ where: { id: serverId } }),
    prisma.order.findMany({
      where: { serverId },
      include: { seller: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  if (!dbServer) notFound();

  const productIds = Array.from(new Set(orders.map((o) => o.productId).filter((id): id is string => Boolean(id))));
  const marketByProductId = new Map(
    config.externalApiPricing && productIds.length > 0
      ? (await prisma.productMarketPrice.findMany({ where: { productId: { in: productIds } } })).map((m) => [m.productId, m])
      : [],
  );

  const stats = {
    total: orders.length,
    active: orders.filter((o) => !["PAID", "REJECTED"].includes(o.status)).length,
    paid: orders.filter((o) => o.status === "PAID").length,
    totalPayout: orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.payoutCents, 0),
  };

  // Servers for the switcher (those this buyer manages).
  const switcherServers = servers.map((s) => ({
    id: s.id,
    name: s.name,
    iconUrl: s.icon ? `https://cdn.discordapp.com/icons/${s.id}/${s.icon}.png` : null,
    sub: s.role === "owner" ? "Owner · Full access" : "Admin access",
    badge: s.role === "admin" ? "View only" : null,
  }));

  return (
    <div className="min-h-screen bg-[#fbfbfa] text-[#0f1419]">
      <div className="mx-auto max-w-[960px] px-7 pt-8">
        {/* Header */}
        <div className="mb-1 flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-[14px]">
            <Link href="/buyer" className="whitespace-nowrap text-sm text-[#8a93a1] transition-colors hover:text-[#0f1419]">
              ← Servers
            </Link>
            <BuyerServerSwitcher servers={switcherServers} selectedId={serverId} />
          </div>
          <Link
            href="/dashboard"
            className="whitespace-nowrap rounded-xl bg-[#0f1419] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#1f2733]"
          >
            Seller Dashboard
          </Link>
        </div>

        <p className="mt-[22px] text-[13px] text-[#4a5260]">
          Incoming submissions routed to this server. Set an offer to send it to the seller.
        </p>

        {isViewOnly && (
          <div className="mt-6 rounded-xl border border-[rgba(214,158,46,0.3)] bg-[rgba(245,200,66,0.08)] px-4 py-3 text-sm text-[#a87718]">
            You have admin access to this server. Actions are disabled — contact the server owner to make changes.
          </div>
        )}

        {/* Stats */}
        <div className="mt-[26px] grid grid-cols-2 gap-[14px] sm:grid-cols-4">
          {[
            { label: "Total Orders", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Paid Out", value: stats.paid },
            { label: "Total Paid", value: formatMoney(stats.totalPayout) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-[rgba(15,20,25,0.08)] bg-[rgba(255,255,255,0.92)] p-4">
              <p className="text-[11.5px] text-[#8a93a1]">{stat.label}</p>
              <p className="mt-[6px] text-[22px] font-bold text-[#0f1419]">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <h2 className="mt-[30px] text-base font-semibold text-[#0f1419]">Orders</h2>
        {orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-dashed border-[rgba(15,20,25,0.12)] bg-[rgba(255,255,255,0.92)] p-10 text-center">
            <p className="text-[#8a93a1]">No orders for this server yet.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-16">
            {orders.map((order) => (
              <div
                key={order.id}
                className="mt-4 rounded-2xl border border-[rgba(15,20,25,0.08)] bg-[rgba(255,255,255,0.92)] p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="font-semibold text-[#0f1419]">
                        {order.product?.name ?? order.customCardName ?? "Custom Card"}
                      </p>
                      <span
                        className={`rounded-full px-[10px] py-[3px] text-[11px] font-semibold ${statusColor[order.status] ?? "bg-[rgba(15,20,25,0.06)] text-[#6b7280]"}`}
                      >
                        {statusLabel[order.status] ?? order.status.replace(/_/g, " ")}
                      </span>
                      <OriginRef name={dbServer.name} iconUrl={dbServer.iconUrl} />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-[#8a93a1]">
                      <span>Seller: <span className="text-[#0f1419]">{order.seller.name ?? order.seller.discordId}</span></span>
                      <span>Offer: <span className="font-medium text-[#0f1419]">{formatMoney(order.offerCents)}</span></span>
                      <span>Payout: <span className="font-medium text-[#0f1419]">{formatMoney(order.payoutCents)}</span></span>
                      <span>Condition: <span className="text-[#0f1419]">{order.condition}</span></span>
                      {(() => {
                        const m = order.productId ? marketByProductId.get(order.productId) : undefined;
                        return m ? (
                          <span title={`Market ref · ${m.source} · ${new Date(m.scrapedAt).toLocaleString()}`}>
                            Market: <span className="font-medium text-[#0f1419]">{formatMoney(m.priceCents)}</span>
                          </span>
                        ) : null;
                      })()}
                    </div>
                    {order.discordChannelId && (
                      <p className="mt-1 text-xs text-[#8a93a1]">Channel: {order.discordChannelId}</p>
                    )}
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="shrink-0 text-xs text-[#8a93a1] transition-colors hover:text-[#5457d9]"
                  >
                    View →
                  </Link>
                </div>

                {!isViewOnly && (
                  <div className="mt-4 border-t border-[rgba(15,20,25,0.08)] pt-4">
                    {order.status === "DRAFT" ? (
                      <BuyerOfferForm order={order} />
                    ) : (
                      <AdminOrderStatusForm order={order} />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
