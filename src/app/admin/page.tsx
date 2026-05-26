import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AdminConfigForm } from "@/components/AdminConfigForm";
import { AdminOrderStatusForm } from "@/components/AdminOrderStatusForm";
import { AdminProductCrud } from "@/components/AdminProductCrud";
import { authOptions } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");
  if (!session.user.isAdmin) redirect("/");

  const [config, orders, products] = await Promise.all([
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
    prisma.order.findMany({ include: { seller: true, product: true }, orderBy: { createdAt: "desc" }, take: 25 }),
    prisma.product.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <section>
      <div className="row">
        <Link href="/" className="button secondary">Home</Link>
        <span className="badge">Admin dashboard</span>
      </div>
      <h1>Pokemon card admin dashboard</h1>
      <div className="grid">
        <AdminConfigForm config={config} />
        <AdminProductCrud initialProducts={products} />
      </div>
      <h2>Recent orders</h2>
      <div className="grid">
        {orders.map((order: (typeof orders)[number]) => (
          <div key={order.id}>
            <div className="card">
              <p className="badge">{order.status}</p>
              <h3>{order.product?.name ?? order.customCardName}</h3>
              <p>Seller: {order.seller.name ?? order.seller.discordId}</p>
              <p>Offer: {formatMoney(order.offerCents)} / Payout: {formatMoney(order.payoutCents)}</p>
              <p>Private Discord channel: {order.discordChannelId ?? "not configured"}</p>
              <Link href={`/orders/${order.id}`}>View seller order page</Link>
            </div>
            <AdminOrderStatusForm order={order} />
          </div>
        ))}
      </div>
    </section>
  );
}
