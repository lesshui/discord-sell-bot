"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppConfig } from "@prisma/client";

export function AdminConfigForm({ config }: { config: AppConfig }) {
  const router = useRouter();
  const [message, setMessage] = useState<string>();

  async function submit(formData: FormData) {
    const response = await fetch("/api/admin/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        manualAdminPricing: formData.get("manualAdminPricing") === "on",
        ruleBasedPricing: formData.get("ruleBasedPricing") === "on",
        aiAssistedPricing: formData.get("aiAssistedPricing") === "on",
        externalApiPricing: formData.get("externalApiPricing") === "on",
        labelFeeCents: Math.round(Number(formData.get("labelFeeDollars")) * 100),
        termsOfService: formData.get("termsOfService"),
        shippingInstructions: formData.get("shippingInstructions")
      })
    });

    setMessage(response.ok ? "Configuration saved." : "Unable to save configuration.");
    router.refresh();
  }

  return (
    <form action={submit} className="card">
      <h2>Offer and acceptance controls</h2>
      <div className="grid">
        <label className="row"><input style={{ width: "auto" }} type="checkbox" name="manualAdminPricing" defaultChecked={config.manualAdminPricing} /> Manual admin pricing</label>
        <label className="row"><input style={{ width: "auto" }} type="checkbox" name="ruleBasedPricing" defaultChecked={config.ruleBasedPricing} /> Rule-based pricing</label>
        <label className="row"><input style={{ width: "auto" }} type="checkbox" name="aiAssistedPricing" defaultChecked={config.aiAssistedPricing} /> AI-assisted pricing</label>
        <label className="row"><input style={{ width: "auto" }} type="checkbox" name="externalApiPricing" defaultChecked={config.externalApiPricing} /> External API pricing</label>
      </div>
      <label>Manual label fee deducted from payout ($)<input name="labelFeeDollars" type="number" step="0.01" min="0" defaultValue={(config.labelFeeCents / 100).toFixed(2)} /></label>
      <label>Terms of service<textarea name="termsOfService" defaultValue={config.termsOfService} /></label>
      <label>Shipping instructions<textarea name="shippingInstructions" defaultValue={config.shippingInstructions} /></label>
      {message ? <p className="notice">{message}</p> : null}
      <button type="submit">Save admin config</button>
    </form>
  );
}
