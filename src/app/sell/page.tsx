import { getServerSession } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SellForm } from "@/components/SellForm";

export default async function SellPage({
  searchParams,
}: {
  searchParams: Promise<{ productId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/api/auth/signin");

  const { productId: defaultProductId } = await searchParams;

  const [products, config] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { name: "asc" } }),
    prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } }),
  ]);

  return (
    <div className="min-h-screen bg-[#10131a]">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/prices" className="text-sm text-zinc-400 hover:text-white transition-colors">
            ← Buy list
          </Link>
          <span className="text-zinc-700">/</span>
          <span className="text-sm text-zinc-300">Submit product</span>
        </div>
        <SellForm products={products} config={config} defaultProductId={defaultProductId} />
      </div>
    </div>
  );
}
