"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@prisma/client";

// Buyer-side inline pricing for a DRAFT submission routed to this server.
// Sends the offer (DRAFT -> OFFERED) and notifies the seller. Styled for the
// dark buyer dashboard.
export function BuyerOfferForm({ order }: { order: Order }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const dollars = parseFloat(value);
    if (!(dollars > 0)) {
      setError("Enter a price above $0.");
      return;
    }
    setSubmitting(true);
    setError(undefined);
    const res = await fetch(`/api/admin/orders/${order.id}/offer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ offerDollars: dollars }),
    });
    setSubmitting(false);
    if (res.ok) {
      router.refresh();
    } else {
      setError("Couldn't send offer. Try again.");
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-[#4a5260]">Make an offer:</span>
      <div className="flex items-center rounded-xl border border-[rgba(15,20,25,0.16)] bg-white px-3 py-2 focus-within:border-[#5457d9]">
        <span className="text-sm text-[#8a93a1]">$</span>
        <input
          type="text"
          inputMode="decimal"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="0.00"
          aria-label="Offer total in dollars"
          className="w-24 bg-transparent pl-1 text-sm font-medium text-[#0f1419] outline-none placeholder:text-[#9aa1ad]"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-xl bg-[#5457d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4548c4] disabled:opacity-50"
      >
        {submitting ? "Sending…" : "Send offer"}
      </button>
      {error ? <span className="text-sm text-[#c0392b]">{error}</span> : null}
    </form>
  );
}
