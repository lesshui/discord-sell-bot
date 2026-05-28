"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppConfig, Order } from "@prisma/client";
import { formatMoney } from "@/lib/money";

export function AcceptOfferForm({ order, config }: { order: Order; config: AppConfig }) {
  const router = useRouter();
  const [error, setError] = useState<string>();

  async function submit(formData: FormData) {
    setError(undefined);
    const response = await fetch(`/api/orders/${order.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        payoutMethod: formData.get("payoutMethod"),
        payoutDetails: formData.get("payoutDetails"),
        acceptedTerms: formData.get("acceptedTerms") === "on"
      })
    });

    if (!response.ok) {
      setError("Could not accept offer. Confirm payout details and terms acceptance.");
      return;
    }

    router.refresh();
  }

  if (order.status !== "OFFERED") {
    return <p className="notice">Offer accepted or no longer open. Watch your private Discord order channel for updates.</p>;
  }

  return (
    <form action={submit} className="card">
      <h2>Accept offer</h2>
      <p>Offer: <strong>{formatMoney(order.offerCents)}</strong></p>
      <p>Manual label deduction: <strong>{formatMoney(order.shippingDeductionCents)}</strong></p>
      <p>Estimated payout after shipping deduction: <strong>{formatMoney(order.payoutCents)}</strong></p>
      <div className="notice"><strong>Terms of service</strong><p>{config.termsOfService}</p></div>
      <div className="notice"><strong>Shipping instructions</strong><p>{config.shippingInstructions}</p></div>
      <div className="grid">
        <label>
          Payout method
          <select name="payoutMethod" required>
            <option value="ZELLE">Zelle</option>
            <option value="CRYPTO">Crypto</option>
            <option value="PAYPAL">PayPal</option>
            <option value="WIRE_ACH">Wire / ACH</option>
          </select>
        </label>
        <label>Payout details<textarea name="payoutDetails" placeholder="Email, wallet address, bank note, or other payout identifier" required /></label>
      </div>
      <label className="row"><input style={{ width: "auto" }} type="checkbox" name="acceptedTerms" required /> I agree to the terms and inspection-gated payout.</label>
      {error ? <p className="notice">{error}</p> : null}
      <button type="submit">Accept offer and await label</button>
    </form>
  );
}
