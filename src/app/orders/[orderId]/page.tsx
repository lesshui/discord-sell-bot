import { getServerSession } from "next-auth";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AcceptOfferForm } from "@/components/AcceptOfferForm";
import { authOptions } from "@/lib/auth";
import { formatMoney } from "@/lib/money";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({ params }: { params: { orderId: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const [order, config] = await Promise.all([
    prisma.order.findUnique({ where: { id: params.orderId }, include: { product: true } }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } })
  ]);

  if (!order) notFound();
  if (order.sellerId !== session.user.id && !session.user.isAdmin) redirect("/");

  const photos = JSON.parse(order.photoUrlsJson) as string[];

  return (
    <section className="grid">
      <div className="card">
        <Link href="/sell" className="button secondary">Create another offer</Link>
        <h1>Order {order.id.slice(0, 8)}</h1>
        <p className="badge">{order.status}</p>
        <p><strong>Card:</strong> {order.product?.name ?? order.customCardName}</p>
        <p><strong>Condition:</strong> {order.condition}</p>
        <p><strong>Offer:</strong> {formatMoney(order.offerCents)}</p>
        <p><strong>Payout after shipping deduction:</strong> {formatMoney(order.payoutCents)}</p>
        <p><strong>Discord channel:</strong> {order.discordChannelId ?? "Not created/configured"}</p>
        {order.manualLabelUrl ? <p><a href={order.manualLabelUrl}>Download shipping label</a></p> : null}
        {order.trackingNumber ? <p><strong>Tracking:</strong> {order.trackingNumber}</p> : null}
      </div>
      <div className="card">
        <h2>Submitted photos</h2>
        {photos.map((photo) => <p key={photo}><a href={photo}>{photo}</a></p>)}
      </div>
      <AcceptOfferForm order={order} config={config} />
    </section>
  );
}
