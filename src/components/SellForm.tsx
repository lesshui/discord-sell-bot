"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppConfig, Product } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { PRODUCT_CATEGORIES, getConditionsForCategory, conditionMultipliers } from "@/lib/pricing";

function liveOffer(product: Product, condition: string, quantity: number): number {
  const multiplier = conditionMultipliers[condition] ?? 0.5;
  return Math.round(product.baseOfferCents * multiplier * Math.max(1, quantity));
}

export function SellForm({
  products,
  config,
  defaultProductId = "",
}: {
  products: Product[];
  config: AppConfig;
  defaultProductId?: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  const [selectedProductId, setSelectedProductId] = useState(defaultProductId);
  const [customCategory, setCustomCategory] = useState("Single Card");
  const [condition, setCondition] = useState("");
  const [quantity, setQuantity] = useState(1);

  const selectedProduct = products.find((p) => p.id === selectedProductId) ?? null;
  const isCatalog = !!selectedProduct;
  const activeCategory = selectedProduct?.category ?? customCategory;
  const conditions = getConditionsForCategory(activeCategory);

  // Reset condition when category changes
  function handleProductChange(id: string) {
    setSelectedProductId(id);
    setCondition("");
  }
  function handleCategoryChange(cat: string) {
    setCustomCategory(cat);
    setCondition("");
  }

  const offerPreview =
    isCatalog && condition
      ? liveOffer(selectedProduct, condition, quantity)
      : null;

  const payoutPreview =
    offerPreview !== null ? Math.max(0, offerPreview - config.labelFeeCents) : null;

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(undefined);
    setSubmitting(true);

    const fd = new FormData(e.currentTarget);
    const photoUrls = String(fd.get("photoUrls") ?? "")
      .split("\n")
      .map((u) => u.trim())
      .filter(Boolean);

    const response = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: fd.get("productId") || undefined,
        customCardName: fd.get("customProductName") || undefined,
        setName: fd.get("setName") || undefined,
        cardNumber: fd.get("productCode") || undefined,
        condition: fd.get("condition"),
        quantity: Number(fd.get("quantity")),
        description: fd.get("description"),
        photoUrls,
      }),
    });

    setSubmitting(false);

    if (!response.ok) {
      setError("Could not submit. Check that you added valid image URLs and a description.");
      return;
    }

    const data = await response.json();
    router.push(`/orders/${data.order.id}`);
  }

  return (
    <form onSubmit={submit} className="space-y-6">

      {/* Product selector */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Product</h2>

        <label className="block">
          <span className="mb-1 block text-sm text-zinc-400">Select from catalog</span>
          <select
            name="productId"
            value={selectedProductId}
            onChange={(e) => handleProductChange(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
          >
            <option value="">— Not listed / submit for review —</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}{p.setName ? ` (${p.setName})` : ""}{p.category !== "Single Card" ? ` · ${p.category}` : ""}
              </option>
            ))}
          </select>
        </label>

        {!isCatalog && (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-amber-800/50 bg-amber-900/20 px-4 py-3 text-sm text-amber-300">
              This product will be submitted for manual review. Our team will respond with an offer within 24 hours.
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Product type</span>
              <select
                value={customCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
              >
                {PRODUCT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-400">Product name</span>
                <input
                  name="customProductName"
                  placeholder="e.g. Charizard ex"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-sm text-zinc-400">Set / Series</span>
                <input
                  name="setName"
                  placeholder="e.g. Obsidian Flames"
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </label>
            </div>
            <label className="block">
              <span className="mb-1 block text-sm text-zinc-400">Card # / Product code</span>
              <input
                name="productCode"
                placeholder="e.g. 223/197"
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </label>
          </div>
        )}
      </div>

      {/* Condition + quantity */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Condition &amp; quantity</h2>
        <div className="grid grid-cols-2 gap-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Condition</span>
            <select
              name="condition"
              required
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            >
              <option value="">Select condition</option>
              {conditions.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Quantity</span>
            <input
              name="quantity"
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
              required
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none"
            />
          </label>
        </div>

        {/* Live offer preview — catalog only */}
        {offerPreview !== null && (
          <div className="mt-4 rounded-xl border border-violet-800/50 bg-violet-900/20 px-5 py-4">
            <p className="text-xs text-violet-400">Instant offer</p>
            <p className="mt-1 text-2xl font-bold text-white">{formatMoney(offerPreview)}</p>
            {config.labelFeeCents > 0 && (
              <p className="mt-1 text-xs text-zinc-400">
                Payout after shipping deduction: <span className="font-medium text-zinc-200">{formatMoney(payoutPreview ?? 0)}</span>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Photos + description */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
        <h2 className="mb-4 text-base font-semibold text-white">Photos &amp; details</h2>
        <div className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Photo URLs — one per line</span>
            <textarea
              name="photoUrls"
              rows={3}
              required
              placeholder={"https://... front\nhttps://... back\nhttps://... any damage"}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-zinc-400">Description / notes</span>
            <textarea
              name="description"
              rows={3}
              required
              placeholder={
                activeCategory === "Graded Card"
                  ? "Slab condition, cert #, any cracks or issues..."
                  : activeCategory.includes("Sealed") || activeCategory === "Elite Trainer Box" || activeCategory === "Collection / Tin"
                  ? "Packaging condition, shrink wrap intact, dents..."
                  : "Whitening, holo scratches, bends, authenticity notes..."
              }
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </label>
        </div>
      </div>

      {error && <p className="rounded-xl bg-red-900/30 px-4 py-3 text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-violet-600 py-3 text-sm font-semibold text-white hover:bg-violet-500 disabled:opacity-50 transition-colors"
      >
        {submitting
          ? "Submitting…"
          : isCatalog
          ? "Get instant offer"
          : "Submit for review"}
      </button>
    </form>
  );
}
