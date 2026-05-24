import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getAccessibleBotServers } from "@/lib/discord-guilds";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import { AdminOrderStatusForm } from "@/components/AdminOrderStatusForm";

const statusColor: Record<string, string> = {
  OFFERED: "bg-blue-500/20 text-blue-300",
  ACCEPTED: "bg-indigo-500/20 text-indigo-300",
  AWAITING_LABEL: "bg-yellow-500/20 text-yellow-300",
  LABEL_READY: "bg-yellow-400/20 text-yellow-200",
  SHIPPED: "bg-purple-500/20 text-purple-300",
  DELIVERED: "bg-purple-400/20 text-purple-200",
  INSPECTION_PENDING: "bg-orange-500/20 text-orange-300",
  APPROVED: "bg-green-500/20 text-green-300",
  PAYOUT_PROMPTED: "bg-teal-500/20 text-teal-300",
  PAID: "bg-green-600/20 text-green-200",
  REJECTED: "bg-red-500/20 text-red-300",
  CONDITION_MISMATCH: "bg-red-400/20 text-red-200",
  FAKE_COUNTERFEIT: "bg-red-600/20 text-red-100",
};

export default async function BuyerDashboard({ params }: { params: { serverId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const servers = await getAccessibleBotServers(session.user.id);
  const server = servers.find((s) => s.id === params.serverId);

  if (!server) notFound();

  const isViewOnly = server.role === "admin";

  const [dbServer, orders] = await Promise.all([
    prisma.discordServer.findUnique({ where: { id: params.serverId } }),
    prisma.order.findMany({
      where: { serverId: params.serverId },
      include: { seller: true, product: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  if (!dbServer) notFound();

  const stats = {
    total: orders.length,
    active: orders.filter((o) => !["PAID", "REJECTED"].includes(o.status)).length,
    paid: orders.filter((o) => o.status === "PAID").length,
    totalPayout: orders.filter((o) => o.status === "PAID").reduce((s, o) => s + o.payoutCents, 0),
  };

  return (
    <div className="min-h-screen bg-[#10131a]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/buyer" className="text-sm text-zinc-400 hover:text-white transition-colors">
              ← Servers
            </Link>
            <span className="text-zinc-700">/</span>
            <h1 className="text-xl font-bold text-white">{dbServer.name}</h1>
            {isViewOnly && (
              <span className="rounded-full bg-zinc-700 px-2 py-0.5 text-xs text-zinc-300">
                View only
              </span>
            )}
          </div>
          <Link
            href="/dashboard"
            className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600 transition-colors"
          >
            Seller Dashboard
          </Link>
        </div>

        {isViewOnly && (
          <div className="mb-6 rounded-xl border border-yellow-800/50 bg-yellow-900/20 px-4 py-3 text-sm text-yellow-300">
            You have admin access to this server. Actions are disabled — contact the server owner to make changes.
          </div>
        )}

        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Orders", value: stats.total },
            { label: "Active", value: stats.active },
            { label: "Paid Out", value: stats.paid },
            { label: "Total Paid", value: formatMoney(stats.totalPayout) },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <h2 className="mb-4 text-lg font-semibold text-white">Orders</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
            <p className="text-zinc-400">No orders for this server yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <p className="font-semibold text-white">
                        {order.product?.name ?? order.customCardName ?? "Custom Card"}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status] ?? "bg-zinc-700 text-zinc-300"}`}
                      >
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-zinc-400">
                      <span>Seller: <span className="text-zinc-200">{order.seller.name ?? order.seller.discordId}</span></span>
                      <span>Offer: <span className="text-zinc-200 font-medium">{formatMoney(order.offerCents)}</span></span>
                      <span>Payout: <span className="text-zinc-200 font-medium">{formatMoney(order.payoutCents)}</span></span>
                      <span>Condition: <span className="text-zinc-200">{order.condition}</span></span>
                    </div>
                    {order.discordChannelId && (
                      <p className="mt-1 text-xs text-zinc-500">Channel: {order.discordChannelId}</p>
                    )}
                  </div>
                  <Link
                    href={`/orders/${order.id}`}
                    className="shrink-0 text-xs text-zinc-400 hover:text-violet-300 transition-colors"
                  >
                    View →
                  </Link>
                </div>

                {!isViewOnly && (
                  <div className="mt-4 border-t border-zinc-800 pt-4">
                    <AdminOrderStatusForm order={order} />
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
