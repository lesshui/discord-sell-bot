import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { OrderPageClient } from "@/components/OrderPageClient";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function OrderPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const [order, config] = await Promise.all([
    prisma.order.findUnique({ where: { id: orderId }, include: { product: true } }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  if (!order) notFound();
  if (order.sellerId !== session.user.id && !session.user.isAdmin) redirect("/");

  return <OrderPageClient order={order} config={config} />;
}
