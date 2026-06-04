"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@prisma/client";

const STATUS_OPTIONS = [
  "LABEL_READY",
  "SHIPPED",
  "DELIVERED",
  "INSPECTION_PENDING",
  "APPROVED",
  "CONDITION_MISMATCH",
  "FAKE_COUNTERFEIT",
  "MISSING_ITEM",
  "NEEDS_SELLER_CONTACT",
  "PAYOUT_PROMPTED",
  "PAID",
  "REJECTED",
] as const;

type Variant = "light" | "dark";

// Light = COB buyer dashboard; dark = legacy /admin panel.
const THEME: Record<Variant, { label: string; field: string; caption: string; ok: string; err: string }> = {
  light: {
    label: "flex flex-col gap-1.5 text-[12px] font-medium text-[#4a5260]",
    field:
      "rounded-xl border border-[rgba(15,20,25,0.16)] bg-white px-3 py-2 text-sm text-[#0f1419] outline-none transition-colors focus:border-[#5457d9]",
    caption: "text-[#9aa1ad]",
    ok: "text-[#17834f]",
    err: "text-[#c0392b]",
  },
  dark: {
    label: "flex flex-col gap-1.5 text-[12px] font-medium text-[#aab2c5]",
    field:
      "rounded-xl border border-[rgba(245,247,251,0.16)] bg-[#0f1320] px-3 py-2 text-sm text-[#f5f7fb] outline-none transition-colors focus:border-[#5457d9]",
    caption: "text-[#6b7689]",
    ok: "text-[#34d399]",
    err: "text-[#f87171]",
  },
};

export function AdminOrderStatusForm({ order, variant = "light" }: { order: Order; variant?: Variant }) {
  const router = useRouter();
  const t = THEME[variant];
  const [message, setMessage] = useState<{ text: string; ok: boolean }>();
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fd = new FormData(event.currentTarget);
    setSubmitting(true);
    const response = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: fd.get("status"),
        manualLabelUrl: fd.get("manualLabelUrl"),
        trackingNumber: fd.get("trackingNumber"),
        inspectionNotes: fd.get("inspectionNotes"),
      }),
    });
    setSubmitting(false);
    setMessage(
      response.ok
        ? { text: "Order updated — seller notified.", ok: true }
        : { text: "Unable to update order.", ok: false },
    );
    if (response.ok) router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <p className={`font-mono text-[10px] font-semibold uppercase tracking-[1.2px] ${t.caption}`}>
        Manage order · {order.id.slice(0, 8)}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className={t.label}>
          Status
          <select name="status" defaultValue={order.status} className={t.field}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
            ))}
          </select>
        </label>
        <label className={t.label}>
          Tracking number
          <input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} className={t.field} />
        </label>
      </div>

      <label className={t.label}>
        Manual label URL
        <input name="manualLabelUrl" defaultValue={order.manualLabelUrl ?? ""} placeholder="https://…" className={t.field} />
      </label>

      <label className={t.label}>
        Inspection notes
        <textarea name="inspectionNotes" defaultValue={order.inspectionNotes ?? ""} rows={2} className={`${t.field} resize-y`} />
      </label>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-[#5457d9] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#4548c4] disabled:opacity-50"
        >
          {submitting ? "Updating…" : "Update order"}
        </button>
        {message ? (
          <span className={`text-sm ${message.ok ? t.ok : t.err}`}>{message.text}</span>
        ) : null}
      </div>
    </form>
  );
}
