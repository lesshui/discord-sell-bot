import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SellForm } from "@/components/SellForm";

export default async function SellPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const [products, config] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } })
  ]);

  return (
    <section>
      <div className="row"><Link href="/" className="button secondary">Back</Link><span className="badge">Signed in with Discord</span></div>
      <h1>Sell Pokemon cards</h1>
      <p className="muted">Submit front/back photos before acceptance. Your private Discord order channel is created after the offer is generated.</p>
      <SellForm products={products} config={config} />
    </section>
  );
}
