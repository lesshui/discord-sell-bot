"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import {
  PRODUCT_CATEGORIES,
  getConditionsForCategory,
  conditionMultipliers,
} from "@/lib/pricing";
import { ServerSwitcher } from "@/components/ServerSwitcher";

/**
 * NewOfferClient — hybrid catalog + custom-submission page.
 *
 * Two modes share the same v3 layout (centered column, sticky bottom action bar):
 *
 * • CATALOG mode — entered when /sell receives ?productId=<id> from the Prices
 *   table "Sell →" button (or any other entry point that passes defaultProductId).
 *   Product name / set / card # / category are autofilled from the catalog row.
 *   The submit POSTs with productId → backend computes a rule-based INSTANT offer.
 *   Hero accent: indigo. Sticky bar: live $ estimate.
 *
 * • CUSTOM mode — entered when no productId matches. The form is empty; the
 *   submit POSTs without productId → backend creates a MANUAL_ADMIN / DRAFT
 *   order for human review. Hero accent: amber. Sticky bar: required progress.
 *
 * In CATALOG mode the user can still edit fields (corrections) without leaving
 * catalog mode. An explicit "Detach to custom" action drops the productId and
 * switches the screen to manual review without clearing what they typed.
 *
 * Quantity and the Timestamp photo are required in BOTH modes — they cannot
 * be autofilled (quantity defaults to 1; photo must be a real image URL the
 * seller provides). Product name is also required.
 */

export interface OfferProduct {
  id: string;
  name: string;
  category: string;
  setName: string;
  cardNumber: string;
  grade: string;
  baseOfferCents: number;
}

interface Props {
  products: OfferProduct[];
  labelFeeCents: number;
  defaultProductId: string;
  username: string;
  joinedAt: string;
  avatarUrl: string | null;
  sellableServers: { id: string; name: string; iconUrl?: string | null }[];
  defaultSellServerId: string | null;
}

const PRICES_HREF = "/prices";
const DASHBOARD_HREF = "/dashboard";

const fmt = (cents: number) => formatMoney(Math.round(cents));

const COND_META: Record<string, { dot: string; desc: string }> = {
  "Near Mint": { dot: "#22c07a", desc: "Pack-fresh, no visible wear" },
  "Lightly Played": { dot: "#84cc16", desc: "Minor whitening or edge wear" },
  "Moderately Played": { dot: "#f5c842", desc: "Visible scratches, whitening" },
  "Heavily Played": { dot: "#f59e42", desc: "Significant damage, creases" },
  Damaged: { dot: "#E04A3B", desc: "Torn, water damage, severe" },
  "Factory Sealed": { dot: "#22c07a", desc: "Sealed, untouched packaging" },
  "Near Mint Packaging": { dot: "#84cc16", desc: "Light shelf wear only" },
  "Damaged Packaging": { dot: "#f59e42", desc: "Dents, tears, or creases" },
};
function condMeta(c: string) {
  return COND_META[c] ?? { dot: "#8a93a1", desc: "" };
}

function hueOf(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function CornLogo({ size = 32 }: { size?: number }) {
  const stroke = "#1f3a3a";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 8 C 28 14 20 22 10 32 C 14 44 24 54 32 58 C 30 50 28 38 28 28 C 28 20 30 13 32 8 Z" fill="#82C975" stroke={stroke} strokeWidth="1.6" />
      <path d="M32 8 C 36 14 44 22 54 32 C 50 44 40 54 32 58 C 34 50 36 38 36 28 C 36 20 34 13 32 8 Z" fill="#82C975" stroke={stroke} strokeWidth="1.6" />
      <path d="M32 10 C 24 14 21 24 22 38 C 23 48 28 54 32 54 C 36 54 41 48 42 38 C 43 24 40 14 32 10 Z" fill="#FFE15A" stroke={stroke} strokeWidth="1.6" />
      <ellipse cx="28" cy="31" rx="2.4" ry="3" fill={stroke} />
      <ellipse cx="36" cy="31" rx="2.4" ry="3" fill={stroke} />
      <ellipse cx="28.8" cy="30" rx="0.8" ry="1" fill="#fff" />
      <ellipse cx="36.8" cy="30" rx="0.8" ry="1" fill="#fff" />
      <path d="M28 36 C 29 41 35 41 36 36 Z" fill="#fff" stroke={stroke} strokeWidth="1.3" />
    </svg>
  );
}

function Avatar({ name, size, url }: { name: string; size: number; url: string | null }) {
  if (url) {
    return (
      <span className="nof-avatar" style={{ width: size, height: size, overflow: "hidden" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </span>
    );
  }
  const h = hueOf(name);
  const bg = `linear-gradient(135deg, hsl(${h}, 55%, 62%) 0%, hsl(${(h + 40) % 360}, 60%, 48%) 100%)`;
  return (
    <span className="nof-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }}>
      {(name || "?").trim().charAt(0).toUpperCase()}
    </span>
  );
}

function PhotoTile({ label, required, url, onChange }: { label: string; required?: boolean; url: string; onChange: (v: string) => void }) {
  return (
    <div className={`nof-photo ${url ? "has-file" : ""}`}>
      <div className="nof-photo-preview">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt={label || "photo"} />
        ) : (
          <span className="nof-photo-empty">
            <span className="nof-photo-glyph">+</span>
            {label ? <span className="nof-photo-label">{label}</span> : null}
            {required ? <span className="nof-photo-req">REQUIRED</span> : <span className="nof-photo-opt">optional</span>}
          </span>
        )}
      </div>
      <input
        className="nof-photo-url"
        type="url"
        inputMode="url"
        placeholder="Paste image URL"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${label || "Extra"} photo URL`}
      />
    </div>
  );
}

function SectionCard({ step, title, sub, children }: { step: string; title: React.ReactNode; sub: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="nof-section">
      <div className="nof-section-head">
        <span className="nof-step">{step}</span>
        <div>
          <h2>{title}</h2>
          <p>{sub}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

export function NewOfferClient({ products, labelFeeCents, defaultProductId, username, joinedAt, avatarUrl, sellableServers, defaultSellServerId }: Props) {
  const router = useRouter();

  const initialProduct = useMemo(
    () => products.find((p) => p.id === defaultProductId) ?? null,
    [products, defaultProductId],
  );

  const [productId, setProductId] = useState<string | null>(initialProduct?.id ?? null);
  const product = useMemo(() => products.find((p) => p.id === productId) ?? null, [products, productId]);
  const isCatalog = !!product;
  const accent = isCatalog ? "#5457d9" : "#e08a2a";

  const [category, setCategory] = useState<string>(initialProduct?.category ?? PRODUCT_CATEGORIES[0]);
  const [name, setName] = useState(initialProduct?.name ?? "");
  const [series, setSeries] = useState(initialProduct?.setName ?? "");
  const [cardNumber, setCardNumber] = useState(initialProduct?.cardNumber ?? "");
  const [year, setYear] = useState("");
  const [rarity, setRarity] = useState(initialProduct?.grade ?? "");
  const [language, setLanguage] = useState("English");

  const conditions = useMemo(() => getConditionsForCategory(category), [category]);
  const [condition, setCondition] = useState<string>(conditions[0] ?? "Near Mint");
  const [quantity, setQuantity] = useState(1);
  const [asking, setAsking] = useState("");
  const [photos, setPhotos] = useState<string[]>(["", "", "", ""]);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>();

  function changeCategory(next: string) {
    setCategory(next);
    setCondition(getConditionsForCategory(next)[0] ?? "Near Mint");
  }

  function detachFromCatalog() {
    setProductId(null);
  }

  // Destination server — local state so the picker updates instantly without a
  // full router refresh. We POST to /api/me/sell-server to persist the choice
  // and back-fill the seller's pending orders server-side.
  const [destinationId, setDestinationId] = useState<string | null>(defaultSellServerId);
  const [savingServer, setSavingServer] = useState(false);
  const destinationServer = useMemo(
    () => sellableServers.find((s) => s.id === destinationId) ?? null,
    [sellableServers, destinationId],
  );

  async function selectDestination(id: string) {
    if (id === destinationId) return;
    setDestinationId(id);
    setSavingServer(true);
    const res = await fetch("/api/me/sell-server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId: id }),
    });
    setSavingServer(false);
    if (!res.ok) {
      // Revert if the API rejected (e.g. server became inactive between page load and click).
      setDestinationId(defaultSellServerId);
      setError("Couldn't switch destination server. Try again.");
    } else {
      router.refresh();
    }
  }

  const nameOk = name.trim().length > 1;
  const quantityOk = quantity >= 1;
  const timestampOk = photos[0].trim().length > 0;
  const destinationOk = !!destinationServer;
  const formValid = nameOk && quantityOk && timestampOk && destinationOk;

  const done = [nameOk, quantityOk, timestampOk].filter(Boolean).length;
  const total = 3;

  const baseCents = product?.baseOfferCents ?? 0;
  const mult = conditionMultipliers[condition] ?? 0.5;
  const offerCents = isCatalog && nameOk ? Math.round(baseCents * mult * quantity) : 0;
  const payoutCents = Math.max(0, offerCents - labelFeeCents);

  let barMeta: string;
  if (error) barMeta = error;
  else if (!destinationOk) barMeta = "pick a destination server on the dashboard";
  else if (!nameOk) barMeta = isCatalog ? "confirm the product name to continue" : "name your product to begin";
  else if (!timestampOk) barMeta = "add the timestamp photo";
  else if (isCatalog) barMeta = quantity > 1 ? `${quantity} × ${fmt(offerCents / quantity)} each` : `${product!.name} · ${condition}`;
  else barMeta = asking.trim() ? `your ask · $${asking.trim()}` : "no asking price — we'll quote it";

  async function submit() {
    if (!formValid || submitting) return;
    setSubmitting(true);
    setError(undefined);

    const validPhotos = photos.map((p) => p.trim()).filter(Boolean);

    const metaBits = [
      `Category: ${category}`,
      series.trim() && `Set/series: ${series.trim()}`,
      cardNumber.trim() && `Card #: ${cardNumber.trim()}`,
      year.trim() && `Year: ${year.trim()}`,
      rarity.trim() && `Rarity: ${rarity.trim()}`,
      language.trim() && `Language: ${language.trim()}`,
      !isCatalog && asking.trim() && `Asking: $${asking.trim()}`,
    ].filter(Boolean).join(" · ");
    const lead = isCatalog ? `Catalog offer — ${name.trim()}` : `Custom submission — ${name.trim()}`;
    const description = [lead, metaBits, notes.trim()].filter(Boolean).join("\n");

    const res = await fetch("/api/offers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productId: isCatalog ? product!.id : undefined,
        customCardName: !isCatalog ? name.trim() : undefined,
        setName: series.trim() || undefined,
        cardNumber: cardNumber.trim() || undefined,
        condition,
        quantity,
        description,
        photoUrls: validPhotos,
      }),
    });

    setSubmitting(false);
    if (!res.ok) {
      setError("Couldn't submit. Make sure the timestamp photo is a valid image URL and try again.");
      return;
    }
    const data = await res.json();
    router.push(`/orders/${data.order.id}`);
  }

  const ctaLabel = submitting
    ? "Submitting…"
    : isCatalog
    ? formValid ? `Lock in ${fmt(offerCents)} offer` : "Lock in offer"
    : "Submit for review";

  return (
    <div className={`nof-root nc-root ${isCatalog ? "is-catalog" : "is-custom"}`} style={{ "--nc-accent": accent } as React.CSSProperties}>
      <style>{CSS}</style>
      <div className="nof-atm" aria-hidden="true"><div className="nof-glow" /></div>

      <Link href={DASHBOARD_HREF} className="nof-brand-fixed">
        <CornLogo size={32} />
        <span className="nof-wordmark">COB</span>
        <span className="nof-brand-divider" />
        <span className="nof-profile">
          <Avatar name={username} size={28} url={avatarUrl} />
          <span className="nof-profile-text">
            <span className="nof-profile-name">@{username}</span>
            <span className="nof-profile-sub">{joinedAt}</span>
          </span>
        </span>
      </Link>

      <Link href={DASHBOARD_HREF} className="nof-back-fixed nc-back-dash">
        <span aria-hidden="true">←</span>
        <span>Dashboard</span>
      </Link>

      <main className="nof-main nc-main">
        <div className="nc-ctx">
          <span className="nc-ctx-label">Selling into</span>
          <ServerSwitcher
            eyebrow="Selling into"
            menuHeading="Your servers"
            servers={sellableServers}
            selectedId={destinationId}
            onSelect={selectDestination}
            busy={savingServer}
            addBotUrl="https://discord.com/oauth2/authorize"
          />
          {!destinationOk ? (
            <span className="nc-ctx-warn">⚠ Pick a destination server before submitting.</span>
          ) : null}
        </div>

        <section className="nof-hero nc-hero">
          <div className="nof-eyebrow nc-eyebrow">
            <span className="nof-eyebrow-dot" />
            {isCatalog ? "CATALOG · INSTANT OFFER" : "CUSTOM SUBMISSION · MANUAL REVIEW"}
          </div>
          <h1 className="nof-hero-title">
            {isCatalog ? (<>Sell <em>{product!.name}</em>.</>) : (<>Submit a <em>custom</em> product.</>)}
          </h1>
          <p className="nof-hero-sub">
            {isCatalog
              ? <>Pre-filled from the price list. Confirm the details, add the required photo, and lock in your offer in seconds. Ship in a flat-rate box, get paid on inspection.</>
              : <>Got something that isn&apos;t in the catalog? Tell us exactly what it is and we&apos;ll hand-review it, then quote you a price within 24hr. Ship in a flat-rate box, get paid on inspection.</>}
          </p>

          {!isCatalog && (
            <div className="nc-hero-cta">
              <Link href={PRICES_HREF} className="nc-prices-btn">
                <span className="nc-prices-btn-glyph" aria-hidden="true">↗</span>
                <span className="nc-prices-btn-text">
                  <span className="nc-prices-btn-title">See what has a bid first. Check the price list.</span>
                  <span className="nc-prices-btn-sub">See what servers are paying before you submit an order →</span>
                </span>
              </Link>
            </div>
          )}

          {!isCatalog && (
            <div className="nc-review-banner">
              <span className="nc-review-ico" aria-hidden="true">⚑</span>
              <span><b>This page is for custom products only.</b> Everything here goes to a human for manual review — there&apos;s no instant quote. The more detail and photos you give, the faster we can price it.</span>
            </div>
          )}
        </section>

        <div className="nc-flow">
          <SectionCard
            step="01"
            title={isCatalog ? "Confirm what you're selling" : "What is it?"}
            sub={isCatalog
              ? "We've prefilled the details from the catalog. Edit if anything's wrong — or detach to send it for manual review instead."
              : "The essentials. The more accurate this is, the faster we can verify and quote."}
          >
            {isCatalog && (
              <div className="nc-catpill" role="status">
                <span className="nc-catpill-ico" aria-hidden="true">✓</span>
                <span className="nc-catpill-text">
                  <b>From price list:</b> {product!.name}
                  {product!.setName ? <> · <span className="nc-catpill-meta">{product!.setName}</span></> : null}
                  {product!.cardNumber ? <> · <span className="nc-catpill-meta">#{product!.cardNumber}</span></> : null}
                  <> · <span className="nc-catpill-meta">~{fmt(product!.baseOfferCents)} base</span></>
                </span>
                <button type="button" className="nc-catpill-detach" onClick={detachFromCatalog}>
                  Detach to custom →
                </button>
              </div>
            )}

            <div className="nc-cat-row">
              <span className="nc-cat-label">Category</span>
              <div className="nc-chips">
                {PRODUCT_CATEGORIES.map((c) => (
                  <button key={c} type="button" onClick={() => changeCategory(c)} className={`nc-chip ${category === c ? "is-on" : ""}`}>{c}</button>
                ))}
              </div>
            </div>

            <div className="nof-field nc-field-name">
              <label>Product name <span className="nof-req">*</span></label>
              <input type="text" placeholder="e.g. Rayquaza Gold Star — EX Deoxys" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="nc-grid-2">
              <div className="nof-field">
                <label>Set / series</label>
                <input type="text" placeholder="EX Deoxys" value={series} onChange={(e) => setSeries(e.target.value)} />
              </div>
              <div className="nof-field">
                <label>Card #</label>
                <input type="text" placeholder="107/107" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} />
              </div>
            </div>

            <div className="nc-grid-3">
              <div className="nof-field">
                <label>Year</label>
                <input type="text" placeholder="2005" value={year} onChange={(e) => setYear(e.target.value)} />
              </div>
              <div className="nof-field">
                <label>Rarity</label>
                <input type="text" placeholder="Gold Star" value={rarity} onChange={(e) => setRarity(e.target.value)} />
              </div>
              <div className="nof-field">
                <label>Language</label>
                <input type="text" placeholder="English" value={language} onChange={(e) => setLanguage(e.target.value)} />
              </div>
            </div>
          </SectionCard>

          <SectionCard
            step="02"
            title={<>Condition & quantity <span className="nof-req">*</span></>}
            sub="Be honest — we inspect every submission on arrival."
          >
            <div className="nof-cond-grid">
              {conditions.map((c) => {
                const m = condMeta(c);
                return (
                  <button key={c} type="button" onClick={() => setCondition(c)} className={`nof-cond ${condition === c ? "is-selected" : ""}`}>
                    <span className="nof-cond-row1">
                      <span className="nof-cond-dot" style={{ background: m.dot }} />
                      <span className="nof-cond-key">{c}</span>
                      {isCatalog ? <span className="nof-cond-mult">×{(conditionMultipliers[c] ?? 0.5).toFixed(2)}</span> : null}
                    </span>
                    {m.desc ? <span className="nof-cond-desc">{m.desc}</span> : null}
                  </button>
                );
              })}
            </div>

            <div className="nof-qty-row">
              <span className="nof-qty-label">Quantity <span className="nof-req">*</span></span>
              <div className="nof-qty">
                <button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease">−</button>
                <input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Math.max(1, Number(e.target.value || 1)))} />
                <button type="button" onClick={() => setQuantity(quantity + 1)} aria-label="Increase">+</button>
              </div>
              <span className="nof-qty-hint">Same product, identical condition.</span>
            </div>
          </SectionCard>

          <SectionCard step="03" title={<>Photos <span className="nof-req">*</span></>} sub="Timestamp photo required. Sharp, well-lit shots get priced fastest.">
            <div className="nof-photo-grid">
              <PhotoTile label="Timestamp" required url={photos[0]} onChange={(v) => setPhotos((p) => [v, p[1], p[2], p[3]])} />
              <PhotoTile label="" url={photos[1]} onChange={(v) => setPhotos((p) => [p[0], v, p[2], p[3]])} />
              <PhotoTile label="" url={photos[2]} onChange={(v) => setPhotos((p) => [p[0], p[1], v, p[3]])} />
              <PhotoTile label="" url={photos[3]} onChange={(v) => setPhotos((p) => [p[0], p[1], p[2], v])} />
            </div>
          </SectionCard>

          <SectionCard
            step="04"
            title={isCatalog
              ? <>Notes <span className="nof-optional">optional</span></>
              : <>Asking price <span className="nof-optional">optional</span></>}
            sub={isCatalog
              ? "Anything our inspector should know before they verify the card."
              : "Have a number in mind? Suggest it. Otherwise our reviewer sets the quote."}
          >
            {!isCatalog && (
              <div className="nc-ask">
                <div className="nc-ask-input">
                  <span className="nc-ask-prefix">$</span>
                  <input type="text" inputMode="decimal" placeholder="0.00" value={asking} onChange={(e) => setAsking(e.target.value.replace(/[^0-9.]/g, ""))} />
                </div>
                <span className="nc-ask-hint">We&apos;ll counter or accept during review. No obligation.</span>
              </div>
            )}
            <textarea className="nof-notes nc-notes" placeholder={isCatalog
              ? "e.g. Slight whitening on back-right corner, but otherwise pack-fresh."
              : "Anything our reviewer should know — misprints, holo bleed, prior grading attempts, provenance…"} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </SectionCard>

          <div className="nc-trust">
            <div className="nof-trust-row"><span className="nof-trust-key">{isCatalog ? "INSPECTION" : "REVIEW"}</span><span className="nof-trust-val">{isCatalog ? "24h on arrival" : "By hand · within 24hr"}</span></div>
            <div className="nof-trust-row"><span className="nof-trust-key">SHIPPING</span><span className="nof-trust-val">Seller pays shipping</span></div>
            <div className="nof-trust-row"><span className="nof-trust-key">PAYOUT</span><span className="nof-trust-val">PayPal · Zelle · ACH</span></div>
          </div>

          <footer className="nof-foot nc-foot">
            <span>Need help? Open a ticket in the Discord server.</span>
            <Link href={PRICES_HREF} className="nof-inline-link">View full price list →</Link>
          </footer>
        </div>
      </main>

      <div className={`nc-bar ${formValid ? "is-live" : ""}`}>
        <div className="nc-bar-inner">
          <div className="nc-bar-left">
            <span className="nc-bar-status">
              <span className="nc-bar-dot" />
              {isCatalog ? "Live estimate" : "Manual review"}
            </span>
            <div className="nc-bar-amount-row">
              {isCatalog ? (
                <span className={`nc-bar-amount ${formValid ? "" : "is-muted"}`}>
                  {formValid ? fmt(offerCents) : (offerCents > 0 ? fmt(offerCents) : "$0.00")}
                </span>
              ) : (
                <span className="nc-bar-progress">{done}/{total} required</span>
              )}
              <span className="nc-bar-meta">{barMeta}</span>
            </div>
            <span className={`nc-bar-dest ${destinationOk ? "" : "is-missing"}`}>
              {destinationOk ? (
                <>Routing to <b>{destinationServer!.name}</b></>
              ) : (
                <>⚠ Pick a destination server above to enable submit</>
              )}
            </span>
            {isCatalog && formValid && labelFeeCents > 0 ? (
              <span className="nc-bar-fine">Payout after shipping: <b>{fmt(payoutCents)}</b></span>
            ) : null}
          </div>
          <div className="nc-bar-right">
            <Link href={PRICES_HREF} className="nc-bar-prices">Price list →</Link>
            <button type="button" disabled={!formValid || submitting} onClick={submit} className={`nc-bar-cta ${formValid && !submitting ? "is-active" : ""}`}>
              <span>{ctaLabel}</span>
              <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
  .nof-root {
    position: relative; min-height: 100vh;
    background: #fbfbfa; color: #0f1419;
    font-family: 'Geist', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    width: 100vw; margin-left: calc(50% - 50vw); margin-top: -40px;
    overflow-x: hidden;
  }
  .nc-root { --nc-accent: #e08a2a; padding-bottom: 0; }
  .nc-root.is-catalog { --nc-accent: #5457d9; }
  .nof-atm { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .nof-glow {
    position: absolute; top: -15%; left: 50%; width: 1100px; height: 1100px;
    transform: translateX(-50%);
    background: radial-gradient(circle, color-mix(in oklab, var(--nc-accent) 6%, transparent) 0%, color-mix(in oklab, var(--nc-accent) 3%, transparent) 40%, transparent 70%);
    filter: blur(20px);
  }

  .nof-brand-fixed {
    position: fixed; top: 18px; left: 20px; z-index: 50;
    display: flex; align-items: center; gap: 12px;
    padding: 6px 12px 6px 6px; border-radius: 999px;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
    border: 1px solid rgba(15,20,25,0.06); text-decoration: none; color: inherit;
    transition: border-color .15s, box-shadow .15s;
  }
  .nof-brand-fixed:hover { border-color: rgba(15,20,25,0.12); box-shadow: 0 2px 8px rgba(15,20,25,0.04); }
  .nof-wordmark { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }
  .nof-brand-divider { width: 1px; height: 22px; background: rgba(15,20,25,0.10); }
  .nof-profile { display: flex; align-items: center; gap: 9px; }
  .nof-avatar { display: inline-flex; align-items: center; justify-content: center; border-radius: 50%; color: #fff; font-weight: 700; box-shadow: inset 0 0 0 1px rgba(15,20,25,0.08); flex-shrink: 0; }
  .nof-profile-text { display: flex; flex-direction: column; line-height: 1.1; }
  .nof-profile-name { font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #0f1419; }
  .nof-profile-sub { font-size: 9.5px; color: #8a93a1; letter-spacing: 0.3px; margin-top: 2px; }

  .nof-back-fixed {
    position: fixed; top: 18px; right: 20px; z-index: 50;
    display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
    border: 1px solid rgba(15,20,25,0.06); border-radius: 999px;
    font-size: 13px; font-weight: 500; color: #4a5260; text-decoration: none; transition: all .15s;
  }
  .nof-back-fixed:hover { color: #0f1419; border-color: rgba(15,20,25,0.12); }
  .nc-back-dash span:first-child { font-family: 'Geist', system-ui, sans-serif; font-size: 16px; line-height: 1; color: #5457d9; }
  .nc-back-dash:hover span:first-child { color: #3f42b8; }

  .nc-main { position: relative; z-index: 4; max-width: 760px; margin: 0 auto; padding: 92px 28px 168px; display: flex; flex-direction: column; gap: 30px; }
  @media (max-width: 720px) { .nc-main { padding: 80px 20px 176px; } .nof-profile-text, .nof-brand-divider { display: none; } .nof-back-fixed span:last-child { display: none; } }

  .nc-ctx { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; }
  .nc-ctx-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #8a93a1; }
  .nc-ctx-warn { font-size: 12px; color: #b06a17; font-weight: 600; }

  .nc-hero { text-align: center; padding-top: 8px; }
  .nof-eyebrow { display: inline-flex; align-items: center; gap: 9px; padding: 5px 12px; border-radius: 999px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; letter-spacing: 1.2px; }
  .nc-eyebrow { margin: 0 auto; background: color-mix(in oklab, var(--nc-accent) 7%, transparent); border: 1px solid color-mix(in oklab, var(--nc-accent) 20%, transparent); color: color-mix(in oklab, var(--nc-accent) 78%, #1a1205); }
  .nof-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--nc-accent); box-shadow: 0 0 8px color-mix(in oklab, var(--nc-accent) 50%, transparent); }
  .nof-hero-title { margin: 18px 0 0; font-weight: 700; font-size: 64px; line-height: 1; letter-spacing: -0.02em; color: #0f1419; word-break: break-word; }
  .nof-hero-title em { font-weight: 300; font-style: italic; color: var(--nc-accent); }
  .nc-root.is-catalog .nof-hero-title { font-size: 48px; }
  .nof-hero-sub { margin: 14px auto 0; font-size: 16px; color: #4a5260; line-height: 1.5; max-width: 540px; }
  @media (max-width: 720px) { .nof-hero-title, .nc-root.is-catalog .nof-hero-title { font-size: 38px; } .nof-hero-sub { font-size: 14.5px; } }

  .nc-hero-cta { margin-top: 24px; display: flex; justify-content: center; }
  .nc-prices-btn { display: inline-flex; align-items: center; gap: 14px; padding: 13px 20px 13px 16px; background: rgba(84,87,217,0.05); border: 1.5px solid rgba(84,87,217,0.22); border-radius: 14px; text-decoration: none; color: inherit; text-align: left; transition: border-color .15s, background .15s, transform .15s, box-shadow .15s; }
  .nc-prices-btn:hover { border-color: #5457d9; background: rgba(84,87,217,0.08); transform: translateY(-1px); box-shadow: 0 4px 16px rgba(84,87,217,0.14); }
  .nc-prices-btn-glyph { display: inline-flex; align-items: center; justify-content: center; width: 38px; height: 38px; flex-shrink: 0; background: #5457d9; color: white; border-radius: 10px; font-family: 'JetBrains Mono', monospace; font-size: 19px; line-height: 1; box-shadow: 0 2px 8px rgba(84,87,217,0.3); }
  .nc-prices-btn-text { display: flex; flex-direction: column; gap: 2px; }
  .nc-prices-btn-title { font-size: 13.5px; font-weight: 600; color: #0f1419; letter-spacing: -0.005em; }
  .nc-prices-btn-sub { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #6b7280; }

  .nc-review-banner { display: flex; gap: 11px; align-items: flex-start; margin: 22px auto 0; max-width: 560px; text-align: left; background: color-mix(in oklab, var(--nc-accent) 8%, transparent); border: 1px solid color-mix(in oklab, var(--nc-accent) 24%, transparent); border-radius: 13px; padding: 13px 16px; font-size: 12.5px; line-height: 1.5; color: color-mix(in oklab, var(--nc-accent) 58%, #221604); }
  .nc-review-ico { font-family: 'JetBrains Mono', monospace; font-size: 15px; line-height: 1.3; color: var(--nc-accent); flex-shrink: 0; }
  .nc-review-banner b { color: color-mix(in oklab, var(--nc-accent) 40%, #1a1003); }

  .nc-flow { display: flex; flex-direction: column; gap: 18px; }

  .nof-section { background: rgba(255,255,255,0.92); border: 1px solid rgba(15,20,25,0.08); border-radius: 16px; padding: 24px 26px 26px; }
  .nof-section-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 18px; }
  .nof-section-head h2 { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; }
  .nof-section-head p { margin: 4px 0 0; font-size: 13px; color: #6b7280; line-height: 1.5; }
  .nof-step { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; letter-spacing: 0.8px; color: #8a93a1; padding: 5px 9px; background: rgba(15,20,25,0.04); border-radius: 6px; line-height: 1; flex-shrink: 0; }
  .nof-inline-link { background: none; border: 0; padding: 0; font: inherit; color: #5457d9; cursor: pointer; text-decoration: none; }
  .nof-inline-link:hover { color: #3f42b8; text-decoration: underline; text-underline-offset: 3px; }
  .nof-req { color: var(--nc-accent); }
  .nof-optional { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 0.6px; color: #8a93a1; text-transform: uppercase; margin-left: 6px; }

  .nc-catpill {
    display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
    margin: 0 0 16px; padding: 11px 14px;
    background: rgba(84,87,217,0.05);
    border: 1px solid rgba(84,87,217,0.22);
    border-radius: 11px;
    font-size: 12.5px; line-height: 1.4; color: #2c3346;
  }
  .nc-catpill-ico { color: #5457d9; font-size: 12px; line-height: 1; }
  .nc-catpill-text { flex: 1 1 240px; min-width: 0; }
  .nc-catpill-text b { color: #0f1419; font-weight: 600; }
  .nc-catpill-meta { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #5d6573; }
  .nc-catpill-detach {
    background: none; border: 1px solid rgba(15,20,25,0.12); border-radius: 999px;
    padding: 6px 12px; font: inherit; font-size: 11.5px; font-weight: 600; color: #4a5260;
    cursor: pointer; transition: all .12s;
  }
  .nc-catpill-detach:hover { border-color: #e08a2a; color: #b06a17; background: rgba(224,138,42,0.06); }

  .nc-cat-row { display: flex; flex-direction: column; gap: 9px; margin-bottom: 18px; }
  .nc-cat-label { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: #8a93a1; }
  .nc-chips { display: flex; flex-wrap: wrap; gap: 8px; }
  .nc-chip { padding: 8px 15px; background: rgba(255,255,255,0.7); border: 1.5px solid rgba(15,20,25,0.10); border-radius: 999px; font-family: inherit; font-size: 13px; font-weight: 500; color: #3a4250; cursor: pointer; transition: all .14s; }
  .nc-chip:hover { border-color: rgba(84,87,217,0.4); color: #0f1419; }
  .nc-chip.is-on { background: #5457d9; border-color: #5457d9; color: white; box-shadow: 0 2px 8px rgba(84,87,217,0.22); }

  .nof-field { display: flex; flex-direction: column; gap: 6px; }
  .nof-field label { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; letter-spacing: 0.6px; color: #6b7280; text-transform: uppercase; }
  .nof-field input { padding: 10px 12px; background: white; border: 1.5px solid rgba(15,20,25,0.10); border-radius: 8px; font: inherit; font-size: 13.5px; color: #0f1419; outline: none; transition: border-color .15s; }
  .nof-field input:focus { border-color: #5457d9; }
  .nc-field-name { margin-bottom: 14px; }
  .nc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .nc-grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
  @media (max-width: 540px) { .nc-grid-2, .nc-grid-3 { grid-template-columns: 1fr 1fr; } }

  .nof-cond-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
  .nof-cond { text-align: left; background: white; border: 1.5px solid rgba(15,20,25,0.08); border-radius: 10px; padding: 11px 13px; cursor: pointer; font-family: inherit; transition: border-color .12s; display: flex; flex-direction: column; gap: 4px; }
  .nof-cond:hover { border-color: rgba(84,87,217,0.40); }
  .nof-cond.is-selected { border-color: #5457d9; background: rgba(84,87,217,0.03); box-shadow: 0 0 0 3px rgba(84,87,217,0.12); }
  .nof-cond-row1 { display: flex; align-items: center; gap: 8px; }
  .nof-cond-dot { width: 8px; height: 8px; border-radius: 50%; }
  .nof-cond-key { font-size: 13px; font-weight: 600; color: #0f1419; flex: 1; }
  .nof-cond-mult { font-family: 'JetBrains Mono', monospace; font-size: 11px; font-weight: 600; color: #8a93a1; }
  .nof-cond.is-selected .nof-cond-mult { color: #5457d9; }
  .nof-cond-desc { font-size: 11.5px; color: #8a93a1; line-height: 1.4; }

  .nof-qty-row { margin-top: 18px; padding-top: 18px; border-top: 1px dashed rgba(15,20,25,0.08); display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .nof-qty-label { font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 600; letter-spacing: 0.6px; color: #6b7280; text-transform: uppercase; }
  .nof-qty { display: flex; align-items: stretch; background: color-mix(in oklab, var(--nc-accent) 7%, white); border: 1.5px solid color-mix(in oklab, var(--nc-accent) 22%, transparent); border-radius: 8px; overflow: hidden; }
  .nof-qty button { background: transparent; border: 0; width: 32px; font-family: 'JetBrains Mono', monospace; font-size: 14px; color: color-mix(in oklab, var(--nc-accent) 70%, #1a1205); cursor: pointer; transition: background .12s; }
  .nof-qty button:hover { background: color-mix(in oklab, var(--nc-accent) 14%, transparent); color: color-mix(in oklab, var(--nc-accent) 85%, #1a1205); }
  .nof-qty input { width: 48px; text-align: center; border: 0; outline: 0; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: #0f1419; font-family: 'JetBrains Mono', monospace; }
  .nof-qty input::-webkit-outer-spin-button, .nof-qty input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .nof-qty-hint { font-size: 12px; color: #8a93a1; }

  .nof-photo-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
  @media (max-width: 540px) { .nof-photo-grid { grid-template-columns: repeat(2, 1fr); } }
  .nof-photo { display: flex; flex-direction: column; gap: 6px; }
  .nof-photo-preview { position: relative; aspect-ratio: 3/4; background: rgba(15,20,25,0.02); border: 1.5px dashed rgba(15,20,25,0.18); border-radius: 10px; overflow: hidden; }
  .nof-photo.has-file .nof-photo-preview { border-style: solid; border-color: rgba(15,20,25,0.10); background: white; }
  .nof-photo-preview img { width: 100%; height: 100%; object-fit: cover; display: block; }
  .nof-photo-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; height: 100%; padding: 12px; text-align: center; }
  .nof-photo-glyph { font-family: 'JetBrains Mono', monospace; font-size: 26px; line-height: 1; color: rgba(15,20,25,0.25); }
  .nof-photo-label { font-size: 12px; font-weight: 600; color: #0f1419; }
  .nof-photo-req { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.5px; color: var(--nc-accent); text-transform: uppercase; }
  .nof-photo-opt { font-family: 'JetBrains Mono', monospace; font-size: 9.5px; letter-spacing: 0.5px; color: #8a93a1; text-transform: uppercase; }
  .nof-photo-url { padding: 7px 9px; background: white; border: 1.5px solid rgba(15,20,25,0.10); border-radius: 7px; font: inherit; font-size: 11.5px; color: #0f1419; outline: none; transition: border-color .15s; }
  .nof-photo-url:focus { border-color: #5457d9; }
  .nof-photo-url::placeholder { color: #a8adb5; }

  .nc-ask { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; margin-bottom: 14px; }
  .nc-ask-input { display: inline-flex; align-items: center; background: rgba(255,255,255,0.75); border: 1.5px solid rgba(15,20,25,0.12); border-radius: 11px; padding: 0 14px; transition: border-color .14s, box-shadow .14s; }
  .nc-ask-input:focus-within { border-color: #5457d9; box-shadow: 0 0 0 3px rgba(84,87,217,0.12); }
  .nc-ask-prefix { font-size: 19px; font-weight: 600; color: #8a93a1; font-feature-settings: 'tnum' 1; }
  .nc-ask-input input { border: 0; background: transparent; outline: none; width: 110px; padding: 12px 6px; font-family: inherit; font-size: 19px; font-weight: 600; color: #0f1419; font-feature-settings: 'tnum' 1; }
  .nc-ask-hint { font-size: 12.5px; color: #8a93a1; }

  .nof-notes { width: 100%; padding: 12px 14px; background: white; border: 1.5px solid rgba(15,20,25,0.10); border-radius: 10px; font: inherit; font-size: 13.5px; color: #0f1419; line-height: 1.5; outline: none; resize: vertical; min-height: 80px; transition: border-color .15s; }
  .nof-notes:focus { border-color: #5457d9; }
  .nof-notes::placeholder { color: #a8adb5; }

  .nc-trust { background: rgba(255,255,255,0.6); border: 1px solid rgba(15,20,25,0.06); border-radius: 14px; padding: 8px 18px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px 24px; }
  @media (max-width: 540px) { .nc-trust { grid-template-columns: 1fr; } }
  .nof-trust-row { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; font-size: 12px; }
  .nof-trust-key { font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600; letter-spacing: 1px; color: #8a93a1; }
  .nof-trust-val { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #0f1419; }

  .nof-foot { display: flex; justify-content: space-between; align-items: center; gap: 12px; padding-top: 2px; font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a93a1; }
  .nof-foot b { color: #0f1419; font-weight: 600; }
  @media (max-width: 540px) { .nof-foot { flex-direction: column; gap: 6px; align-items: flex-start; } }

  .nc-bar { position: fixed; left: 0; right: 0; bottom: 0; z-index: 60; background: rgba(251,251,250,0.82); backdrop-filter: blur(16px); border-top: 1px solid rgba(15,20,25,0.10); box-shadow: 0 -4px 24px rgba(15,20,25,0.05); }
  .nc-bar-inner { max-width: 760px; margin: 0 auto; padding: 14px 28px; display: flex; align-items: center; justify-content: space-between; gap: 18px; }
  @media (max-width: 720px) { .nc-bar-inner { padding: 12px 18px; gap: 12px; } }
  .nc-bar-left { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .nc-bar-status { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono', monospace; font-size: 9.5px; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; color: color-mix(in oklab, var(--nc-accent) 78%, #1a1205); }
  .nc-bar-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--nc-accent); box-shadow: 0 0 6px color-mix(in oklab, var(--nc-accent) 50%, transparent); }
  .nc-bar-amount-row { display: flex; align-items: baseline; gap: 12px; min-width: 0; }
  .nc-bar-amount { font-size: 26px; font-weight: 700; letter-spacing: -0.025em; color: #0f1419; line-height: 1; font-feature-settings: 'tnum' 1; white-space: nowrap; }
  .nc-bar-amount.is-muted { color: rgba(15,20,25,0.30); }
  .nc-bar-progress { font-size: 20px; font-weight: 700; letter-spacing: -0.01em; color: #0f1419; line-height: 1; font-feature-settings: 'tnum' 1; white-space: nowrap; }
  .nc-bar.is-live .nc-bar-progress { color: #17834f; }
  .nc-bar-meta { font-size: 12px; color: #8a93a1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .nc-bar-fine { font-size: 11px; color: #6b7280; }
  .nc-bar-fine b { color: #0f1419; font-family: 'JetBrains Mono', monospace; font-weight: 600; }
  .nc-bar-dest { font-size: 11px; color: #6b7280; text-decoration: none; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; transition: color .12s; }
  .nc-bar-dest b { color: #0f1419; font-weight: 600; }
  .nc-bar-dest:hover { color: #0f1419; }
  .nc-bar-dest.is-missing { color: #b06a17; font-weight: 600; }
  .nc-bar-dest.is-missing:hover { color: #8c5212; text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 540px) { .nc-bar-meta { display: none; } .nc-bar-progress, .nc-bar-amount { font-size: 22px; } .nc-bar-fine { display: none; } }
  .nc-bar-right { display: flex; align-items: center; gap: 12px; flex-shrink: 0; }
  .nc-bar-prices { display: inline-flex; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: #5457d9; text-decoration: none; padding: 8px 4px; white-space: nowrap; }
  .nc-bar-prices:hover { color: #3f42b8; text-decoration: underline; text-underline-offset: 3px; }
  @media (max-width: 420px) { .nc-bar-prices { display: none; } }
  .nc-bar-cta { display: inline-flex; align-items: center; justify-content: center; gap: 9px; padding: 13px 22px; background: rgba(15,20,25,0.08); color: #8a93a1; border: 0; border-radius: 12px; font-family: inherit; font-size: 14px; font-weight: 600; cursor: not-allowed; white-space: nowrap; transition: all .15s; }
  .nc-bar-cta.is-active { background: var(--nc-accent); color: white; cursor: pointer; box-shadow: 0 2px 12px color-mix(in oklab, var(--nc-accent) 35%, transparent); }
  .nc-bar-cta.is-active:hover { background: color-mix(in oklab, var(--nc-accent) 82%, black); transform: translateY(-1px); }
  .nc-bar-cta span:last-child { font-family: 'JetBrains Mono', monospace; font-size: 16px; line-height: 1; }
`;
