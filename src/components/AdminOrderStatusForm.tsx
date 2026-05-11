"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Order } from "@prisma/client";

export function AdminOrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();

  async function submit(formData: FormData) {
    const response = await fetch(`/api/admin/orders/${order.id}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: formData.get("status"),
        manualLabelUrl: formData.get("manualLabelUrl"),
        trackingNumber: formData.get("trackingNumber"),
        inspectionNotes: formData.get("inspectionNotes")
      })
    });

    setMessage(response.ok ? "Order updated and Discord notified." : "Unable to update order.");
    router.refresh();
  }

  return (
    <form action={submit} className="card">
      <h3>Update {order.id.slice(0, 8)}</h3>
      <label>
        Status
        <select name="status" defaultValue={order.status}>
          <option>LABEL_READY</option><option>SHIPPED</option><option>DELIVERED</option><option>INSPECTION_PENDING</option>
          <option>APPROVED</option><option>CONDITION_MISMATCH</option><option>FAKE_COUNTERFEIT</option><option>MISSING_ITEM</option>
          <option>NEEDS_SELLER_CONTACT</option><option>PAYOUT_PROMPTED</option><option>PAID</option><option>REJECTED</option>
        </select>
      </label>
      <label>Manual label URL<input name="manualLabelUrl" defaultValue={order.manualLabelUrl ?? ""} /></label>
      <label>Tracking number<input name="trackingNumber" defaultValue={order.trackingNumber ?? ""} /></label>
      <label>Inspection notes<textarea name="inspectionNotes" defaultValue={order.inspectionNotes ?? ""} /></label>
      {message ? <p className="notice">{message}</p> : null}
      <button type="submit">Update order</button>
    </form>
  );
}
