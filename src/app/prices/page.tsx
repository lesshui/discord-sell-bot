import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatMoney } from "@/lib/money";
import {
  PRODUCT_CATEGORIES,
  getConditionsForCategory,
  conditionMultipliers,
} from "@/lib/pricing";

function offerForCondition(baseOfferCents: number, condition: string): number {
  return Math.round(baseOfferCents * (conditionMultipliers[condition] ?? 0.5));
}

// Graded conditions grouped by company for a cleaner display
const GRADE_GROUPS = [
  { label: "PSA", conditions: ["PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6"] },
  { label: "BGS", conditions: ["BGS 10 (Pristine)", "BGS 9.5", "BGS 9", "BGS 8.5"] },
  { label: "CGC", conditions: ["CGC 10", "CGC 9.5", "CGC 9", "CGC 8.5"] },
];

function PriceGrid({
  baseOfferCents,
  category,
}: {
  baseOfferCents: number;
  category: string;
}) {
  if (category === "Graded Card") {
    return (
      <div className="mt-4 space-y-3">
        {GRADE_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              {group.conditions.map((c) => (
                <div key={c} className="flex items-center justify-between">
                  <span className="text-xs text-zinc-400">{c}</span>
                  <span className="text-xs font-semibold text-white">
                    {formatMoney(offerForCondition(baseOfferCents, c))}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  const conditions = getConditionsForCategory(category);
  return (
    <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-3">
      {conditions.map((c) => (
        <div key={c} className="flex items-center justify-between">
          <span className="text-xs text-zinc-400">{c}</span>
          <span className="text-xs font-semibold text-white">
            {formatMoney(offerForCondition(baseOfferCents, c))}
          </span>
        </div>
      ))}
    </div>
  );
}

export default async function PricesPage() {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  const grouped = Object.fromEntries(
    PRODUCT_CATEGORIES.map((cat) => [cat, products.filter((p) => p.category === cat)])
  );

  const hasAny = products.length > 0;

  return (
    <div className="min-h-screen bg-[#10131a]">
      <div className="mx-auto max-w-4xl px-4 py-16">

        {/* Header */}
        <div className="mb-12">
          <Link href="/" className="text-sm text-zinc-500 hover:text-white transition-colors">
            ← Back
          </Link>
          <h1 className="mt-6 text-3xl font-bold text-white">What we buy</h1>
          <p className="mt-3 max-w-xl text-zinc-400">
            Instant offers on Pokemon TCG products. Select a product below to see your
            offer and submit. Don&apos;t see what you have?{" "}
            <Link href="/sell" className="text-violet-400 hover:text-violet-300 transition-colors">
              Submit for manual review →
            </Link>
          </p>
        </div>

        {!hasAny && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-10 text-center">
            <p className="text-zinc-400">No catalog products yet — check back soon.</p>
          </div>
        )}

        {/* Products by category */}
        <div className="space-y-12">
          {PRODUCT_CATEGORIES.map((category) => {
            const items = grouped[category];
            if (!items?.length) return null;
            return (
              <section key={category}>
                <h2 className="mb-4 text-lg font-semibold text-white">{category}</h2>
                <div className="space-y-4">
                  {items.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-white">{product.name}</h3>
                            {product.grade && (
                              <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-300">
                                {product.grade}
                              </span>
                            )}
                          </div>
                          {(product.setName || product.cardNumber) && (
                            <p className="mt-0.5 text-sm text-zinc-500">
                              {[product.setName, product.cardNumber].filter(Boolean).join(" · ")}
                            </p>
                          )}
                          <PriceGrid
                            baseOfferCents={product.baseOfferCents}
                            category={product.category}
                          />
                        </div>
                        <Link
                          href={`/sell?productId=${product.id}`}
                          className="shrink-0 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500 transition-colors"
                        >
                          Sell this →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Non-catalog CTA */}
        <div className="mt-16 rounded-2xl border border-dashed border-zinc-700 bg-zinc-900/40 p-10 text-center">
          <h2 className="text-lg font-semibold text-white">Don&apos;t see your product?</h2>
          <p className="mt-2 text-sm text-zinc-400">
            We buy all Pokemon TCG products — singles, sealed, graded, bundles.
            Submit anything for manual review and our team will respond with an offer within 24 hours.
          </p>
          <Link
            href="/sell"
            className="mt-6 inline-block rounded-xl bg-zinc-700 px-6 py-2.5 text-sm font-semibold text-white hover:bg-zinc-600 transition-colors"
          >
            Submit for review →
          </Link>
        </div>

      </div>
    </div>
  );
}
