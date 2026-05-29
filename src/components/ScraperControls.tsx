"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, ProductMarketPrice } from "@prisma/client";
import { formatMoney } from "@/lib/money";

type Row = {
  product: Pick<Product, "id" | "name" | "sku" | "baseOfferCents">;
  market: Pick<ProductMarketPrice, "priceCents" | "source" | "scrapedAt"> | null;
};

export function ScraperControls({ rows }: { rows: Row[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [message, setMessage] = useState<string>();

  async function refresh() {
    setBusy(true);
    setMessage(undefined);
    const res = await fetch("/api/scraper/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ onlyMissingManualPrice: onlyMissing }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMessage(data.error ?? "Refresh failed.");
    } else {
      const s = data.summary;
      setMessage(`Refreshed ${s.updated}/${s.total} (failed: ${s.failed}).`);
      router.refresh();
    }
    setBusy(false);
  }

  return (
    <div className="card">
      <div className="row">
        <h2>Market price scraper</h2>
        <span className="badge">Testing</span>
      </div>
      <p className="muted" style={{ marginTop: 0 }}>
        Caches market prices in <code>ProductMarketPrice</code>. Requires <code>EBAY_APP_ID</code> or
        TCGPlayer keys to hit upstream; otherwise returns deterministic mock prices. Visible to sellers/buyers
        only when <code>External API pricing</code> is enabled in admin config.
      </p>

      <label className="row" style={{ gap: ".5rem", margin: ".5rem 0" }}>
        <input
          type="checkbox"
          style={{ width: "auto" }}
          checked={onlyMissing}
          onChange={(e) => setOnlyMissing(e.target.checked)}
        />
        Only refresh products with no manual bid (<code>baseOfferCents = 0</code>)
      </label>

      <div className="row" style={{ gap: ".5rem" }}>
        <button onClick={refresh} disabled={busy}>
          {busy ? "Refreshing…" : "Refresh market prices"}
        </button>
        {message && <span className="notice">{message}</span>}
      </div>

      <table className="table" style={{ marginTop: "1rem" }}>
        <thead>
          <tr>
            <th>Product</th>
            <th>Manual</th>
            <th>Market</th>
            <th>Source</th>
            <th>Last scraped</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr><td colSpan={5} className="muted">No products in catalog yet.</td></tr>
          )}
          {rows.map(({ product, market }) => (
            <tr key={product.id}>
              <td>
                <strong>{product.name}</strong>
                <br />
                <small className="muted">{product.sku}</small>
              </td>
              <td>{formatMoney(product.baseOfferCents)}</td>
              <td>{market ? formatMoney(market.priceCents) : <span className="muted">—</span>}</td>
              <td>{market ? <small className="muted">{market.source}</small> : <span className="muted">—</span>}</td>
              <td>
                {market ? (
                  <small className="muted">{new Date(market.scrapedAt).toLocaleString()}</small>
                ) : (
                  <span className="muted">never</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
