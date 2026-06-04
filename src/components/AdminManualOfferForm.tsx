"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@prisma/client";

// Shown only for DRAFT orders (custom / manual-review submissions). Lets an admin
// set the offer price, which moves the order to OFFERED and notifies the seller.
export function AdminManualOfferForm({ order }: { order: Order }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();
  const [submitting, setSubmitting] = useState(false);

  async function submit(formData: FormData) {
    setSubmitting(true);
    const response = await fetch(`/api/admin/orders/${order.id}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerDollars: formData.get("offerDollars") }),
    });

    setMessage(response.ok ? "Offer sent — seller notified." : "Unable to set offer.");
    setSubmitting(false);
    router.refresh();
  }

  return (
    <form action={submit} className="card">
      <h3>Make offer · {order.id.slice(0, 8)}</h3>
      <p>Submission under manual review. Set the offer to send it to the seller.</p>
      <label>
        Offer total ($)
        <input name="offerDollars" type="number" step="0.01" min="0.01" placeholder="e.g. 45.00" required />
      </label>
      {message ? <p className="notice">{message}</p> : null}
      <button type="submit" disabled={submitting}>{submitting ? "Sending…" : "Send offer"}</button>
    </form>
  );
}
