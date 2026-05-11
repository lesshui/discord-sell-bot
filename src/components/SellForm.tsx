"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppConfig, Product } from "@prisma/client";
import { formatMoney } from "@/lib/money";
import { enabledOfferModes } from "@/lib/pricing";

export function SellForm({ products, config }: { products: Product[]; config: AppConfig }) {
  const router = useRouter();
  const [error, setError] = useState<string>();
  const modes = enabledOfferModes(config);

  async function submit(formData: FormData) {
    setError(undefined);
    const photoUrls = String(formData.get("photoUrls") ?? "")
      .split("\n")
      .map((url) => url.trim())
      .filter(Boolean);

    const response = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: formData.get("productId") || undefined,
        customCardName: formData.get("customCardName") || undefined,
        setName: formData.get("setName") || undefined,
        cardNumber: formData.get("cardNumber") || undefined,
        condition: formData.get("condition"),
        quantity: Number(formData.get("quantity")),
        description: formData.get("description"),
        requestedMode: formData.get("requestedMode"),
        photoUrls
      })
    });

    if (!response.ok) {
      setError("Could not create offer. Check that you added valid image URLs and enough description detail.");
      return;
    }

    const data = await response.json();
    router.push(`/orders/${data.order.id}`);
  }

  return (
    <form action={submit} className="card grid">
      <label>
        Catalog card
        <select name="productId">
          <option value="">Custom / not listed</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name} {product.setName ? `(${product.setName})` : ""} - base {formatMoney(product.baseOfferCents)}
            </option>
          ))}
        </select>
      </label>
      <label>Custom card name<input name="customCardName" placeholder="e.g. Charizard Base Set" /></label>
      <label>Set<input name="setName" placeholder="Pokemon set" /></label>
      <label>Card number<input name="cardNumber" placeholder="e.g. 4/102" /></label>
      <label>
        Condition
        <select name="condition" required>
          <option>Near Mint</option>
          <option>Lightly Played</option>
          <option>Moderately Played</option>
          <option>Heavily Played</option>
          <option>Damaged</option>
        </select>
      </label>
      <label>Quantity<input name="quantity" type="number" min="1" defaultValue="1" required /></label>
      <label>
        Offer mode
        <select name="requestedMode" required>
          {modes.map((mode) => <option key={mode}>{mode}</option>)}
        </select>
      </label>
      <label>
        Photo URLs, one per line
        <textarea name="photoUrls" placeholder="https://... front photo\nhttps://... back photo" required />
      </label>
      <label>
        Description
        <textarea name="description" placeholder="Describe whitening, holo scratching, bends, dents, grading slab, authenticity notes, etc." required />
      </label>
      {error ? <p className="notice">{error}</p> : null}
      <button type="submit">Get immediate offer</button>
    </form>
  );
}
