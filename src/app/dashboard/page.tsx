import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import type { OrderStatus } from "@/types";

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

export default async function SellerDashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const orders = await prisma.order.findMany({
    where: { sellerId: session.user.id },
    include: { product: true, server: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen bg-[#10131a]">
      <div className="mx-auto max-w-5xl px-4 py-10">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Signed in as</p>
            <h1 className="text-2xl font-bold text-white">{session.user.name ?? "Seller"}</h1>
          </div>
          <div className="flex gap-3">
            <Link
              href="/sell"
              className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              + Submit Card
            </Link>
            <Link
              href="/buyer"
              className="rounded-xl bg-zinc-700 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-600 transition-colors"
            >
              Buyer Dashboard →
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Total Orders", value: orders.length },
            { label: "Active", value: orders.filter((o) => !["PAID", "REJECTED"].includes(o.status)).length },
            { label: "Paid Out", value: orders.filter((o) => o.status === "PAID").length },
            {
              label: "Total Earned",
              value: formatMoney(
                orders.filter((o) => o.status === "PAID").reduce((sum, o) => sum + o.payoutCents, 0)
              ),
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4">
              <p className="text-xs text-zinc-400">{stat.label}</p>
              <p className="mt-1 text-xl font-bold text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Orders */}
        <h2 className="mb-4 text-lg font-semibold text-white">Your Orders</h2>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
            <p className="text-zinc-400">No orders yet.</p>
            <Link
              href="/sell"
              className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
            >
              Submit your first card
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="group rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 hover:border-violet-700 transition-colors"
              >
                <div className="mb-3 flex items-start justify-between">
                  <p className="font-semibold text-white group-hover:text-violet-300 transition-colors">
                    {order.product?.name ?? order.customCardName ?? "Custom Card"}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColor[order.status] ?? "bg-zinc-700 text-zinc-300"}`}
                  >
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-zinc-400">
                  <p>Offer: <span className="text-white font-medium">{formatMoney(order.offerCents)}</span></p>
                  <p>Payout: <span className="text-white font-medium">{formatMoney(order.payoutCents)}</span></p>
                  {order.server && (
                    <p className="text-xs text-zinc-500">Server: {order.server.name}</p>
                  )}
                  <p className="text-xs text-zinc-600">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
