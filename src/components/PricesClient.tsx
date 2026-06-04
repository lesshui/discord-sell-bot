"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "@/lib/money";
import { PRODUCT_CATEGORIES, conditionMultipliers, getConditionsForCategory } from "@/lib/pricing";
import { ServerSwitcher } from "@/components/ServerSwitcher";

export interface PriceProduct {
  id: string;
  name: string;
  category: string;
  setName: string;
  cardNumber: string;
  grade: string;
  baseOfferCents: number;
}

export interface PriceServer {
  id: string;
  name: string;
  iconUrl: string | null;
}

// Headline condition we lead the offer with, per category.
const TOP_CONDITION: Record<string, string> = {
  Products: "Near Mint",
  Other: "Near Mint",
  "Graded Card": "PSA 10",
  "Sealed Booster Pack": "Factory Sealed",
  "Sealed Booster Box": "Factory Sealed",
  "Elite Trainer Box": "Factory Sealed",
  "Collection / Tin": "Factory Sealed",
};

// Short, human filter labels for the category chips.
const CATEGORY_SHORT: Record<string, string> = {
  Products: "Singles",
  "Graded Card": "Graded",
  "Sealed Booster Box": "Booster Box",
  "Elite Trainer Box": "ETB",
  "Sealed Booster Pack": "Packs",
  "Collection / Tin": "Tins",
  Other: "Other",
};

// Offer math — ported from src/lib/pricing.ts so prices stay consistent with /sell.
function offerForCondition(baseCents: number, condition: string): number {
  return Math.round(baseCents * (conditionMultipliers[condition] ?? 0.5));
}
function topOfferCents(p: PriceProduct): number {
  return offerForCondition(p.baseOfferCents, TOP_CONDITION[p.category] ?? "Near Mint");
}
function offerRange(p: PriceProduct): { min: number; max: number } {
  const vals = getConditionsForCategory(p.category).map((c) => offerForCondition(p.baseOfferCents, c));
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

type Sort = "featured" | "high" | "low";

function MiniCornLogo({ size = 30 }: { size?: number }) {
  const stroke = "#1f3a3a";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 8 C 28 14 20 22 10 32 C 14 44 24 54 32 58 C 30 50 28 38 28 28 C 28 20 30 13 32 8 Z" fill="#82C975" stroke={stroke} strokeWidth="1.6" />
      <path d="M32 8 C 36 14 44 22 54 32 C 50 44 40 54 32 58 C 34 50 36 38 36 28 C 36 20 34 13 32 8 Z" fill="#82C975" stroke={stroke} strokeWidth="1.6" />
      <path d="M32 10 C 24 14 21 24 22 38 C 23 48 28 54 32 54 C 36 54 41 48 42 38 C 43 24 40 14 32 10 Z" fill="#FFE15A" stroke={stroke} strokeWidth="1.6" />
      <g stroke={stroke} strokeWidth="0.55">
        <ellipse cx="29" cy="20" rx="2" ry="2.2" fill="#FFEE7A" /><ellipse cx="35" cy="20" rx="2" ry="2.2" fill="#FFE15A" />
        <ellipse cx="26" cy="26" rx="2" ry="2.2" fill="#FFE15A" /><ellipse cx="32" cy="26" rx="2" ry="2.2" fill="#FFF6B0" /><ellipse cx="38" cy="26" rx="2" ry="2.2" fill="#FFE15A" />
        <ellipse cx="25" cy="40" rx="2" ry="2.2" fill="#FFE15A" /><ellipse cx="39" cy="40" rx="2" ry="2.2" fill="#FFEE7A" />
        <ellipse cx="29" cy="46" rx="2" ry="2.2" fill="#FFE15A" /><ellipse cx="32" cy="46" rx="2" ry="2.2" fill="#FFEE7A" /><ellipse cx="36" cy="46" rx="2" ry="2.2" fill="#FFE15A" />
      </g>
      <ellipse cx="28" cy="31" rx="2.4" ry="3" fill={stroke} />
      <ellipse cx="36" cy="31" rx="2.4" ry="3" fill={stroke} />
      <ellipse cx="28.8" cy="30" rx="0.8" ry="1" fill="#fff" />
      <ellipse cx="36.8" cy="30" rx="0.8" ry="1" fill="#fff" />
      <path d="M28 36 C 29 41 35 41 36 36 Z" fill="#fff" stroke={stroke} strokeWidth="1.3" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
      <circle cx="7" cy="7" r="5" /><path d="M11 11l3.5 3.5" />
    </svg>
  );
}

export function PricesClient({
  products,
  sellableServers,
  defaultSellServerId,
}: {
  products: PriceProduct[];
  sellableServers: PriceServer[];
  defaultSellServerId: string | null;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState<Sort>("featured");
  const [savingServer, setSavingServer] = useState(false);

  // Same destination-server mechanism as the dashboard switcher.
  async function selectSellServer(serverId: string) {
    setSavingServer(true);
    const res = await fetch("/api/me/sell-server", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ serverId }),
    });
    setSavingServer(false);
    if (res.ok) router.refresh();
  }

  const chipCats = useMemo(
    () => PRODUCT_CATEGORIES.filter((c) => products.some((p) => p.category === c)),
    [products],
  );

  const filtered = useMemo(() => {
    let list = products.slice();
    if (cat !== "All") list = list.filter((p) => p.category === cat);
    const term = q.trim().toLowerCase();
    if (term) list = list.filter((p) => `${p.name} ${p.setName} ${p.cardNumber}`.toLowerCase().includes(term));
    if (sort === "high") list.sort((a, b) => topOfferCents(b) - topOfferCents(a));
    else if (sort === "low") list.sort((a, b) => topOfferCents(a) - topOfferCents(b));
    return list;
  }, [products, q, cat, sort]);

  const grouped = useMemo(
    () =>
      PRODUCT_CATEGORIES.map((c) => ({ category: c, items: filtered.filter((p) => p.category === c) })).filter(
        (g) => g.items.length,
      ),
    [filtered],
  );

  return (
    <div className="px-root">
      <style>{CSS}</style>
      <div className="px-atm" aria-hidden="true"><div className="px-glow" /></div>

      <Link className="px-brand" href="/">
        <MiniCornLogo size={30} />
        <span className="px-wordmark">COB</span>
        <span className="px-brand-divider" aria-hidden="true" />
        <span className="px-brand-tag">Price book</span>
      </Link>
      <Link className="px-back" href="/dashboard">Dashboard <span aria-hidden="true">→</span></Link>

      <main className="px-main">
        {/* Hero */}
        <section>
          <div className="px-eyebrow"><span className="px-eyebrow-dot" />INSTANT OFFERS · POKÉMON TCG</div>
          <h1 className="px-title">What we <em>buy</em>.</h1>
          <p className="px-sub">
            Live offers on Pokémon TCG products. Pick a product to see your offer by condition and submit in seconds.
            Don&apos;t see it? <Link href="/sell">Submit for manual review →</Link>
          </p>

          <div className="px-server-row">
            <span className="px-server-label">Selling into</span>
            <ServerSwitcher
              eyebrow="Selling into"
              menuHeading="Your servers"
              servers={sellableServers}
              selectedId={defaultSellServerId}
              onSelect={selectSellServer}
              busy={savingServer}
              addBotUrl="https://discord.com/oauth2/authorize"
            />
          </div>
        </section>

        {/* Controls */}
        <div className="px-controls">
          <label className="px-search">
            <SearchIcon />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by card, set, or number…"
              aria-label="Search catalog"
            />
          </label>
          <div className="px-chips">
            <button className={`px-chip ${cat === "All" ? "is-active" : ""}`} onClick={() => setCat("All")}>All</button>
            {chipCats.map((c) => (
              <button key={c} className={`px-chip ${cat === c ? "is-active" : ""}`} onClick={() => setCat(c)}>
                {CATEGORY_SHORT[c] ?? c}
              </button>
            ))}
          </div>
          <div className="px-sort">
            <span className="px-sort-label">Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort products">
              <option value="featured">Featured</option>
              <option value="high">Offer: high to low</option>
              <option value="low">Offer: low to high</option>
            </select>
          </div>
        </div>

        {/* Catalog */}
        {grouped.length === 0 ? (
          <div className="px-empty">
            <div className="px-empty-mark">∅</div>
            <p className="px-empty-title">No products match “{q}”.</p>
            <p className="px-empty-sub">Try a different term, or submit it for manual review.</p>
          </div>
        ) : (
          grouped.map((g) => {
            const isGraded = g.category === "Graded Card";
            return (
              <section key={g.category}>
                <div className="px-cat-head">
                  <h2 className="px-cat-title">{g.category}</h2>
                  <span className="px-cat-count">{g.items.length}</span>
                  <span className="px-cat-rule" />
                </div>
                <div className="pxt-wrap">
                  <table className="pxt-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>{isGraded ? "Slab" : "Set · No."}</th>
                        <th className="num">Offer range</th>
                        <th className="num">Top offer</th>
                        <th className="act" />
                      </tr>
                    </thead>
                    <tbody>
                      {g.items.map((p) => {
                        const r = offerRange(p);
                        return (
                          <tr key={p.id}>
                            <td>
                              <span className="pxt-name">{p.name}</span>
                              {p.grade && p.grade !== "Slab" ? (
                                <span className="px-pill px-pill-amber" style={{ marginLeft: 8 }}>{p.grade}</span>
                              ) : null}
                            </td>
                            <td><span className="pxt-set">{[p.setName, p.cardNumber].filter(Boolean).join(" · ") || "—"}</span></td>
                            <td className="num"><span className="pxt-range">{formatMoney(r.min)} – {formatMoney(r.max)}</span></td>
                            <td className="num">
                              <div className="pxt-top">{formatMoney(topOfferCents(p))}</div>
                              <div className="pxt-top-cond">{TOP_CONDITION[p.category] ?? "Near Mint"}</div>
                            </td>
                            <td className="act"><Link className="pxt-link" href={`/sell?productId=${p.id}`}>Sell →</Link></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            );
          })
        )}

        {/* Non-catalog CTA */}
        <div className="px-cta">
          <div>
            <h2 className="px-cta-h">Don&apos;t see your product?</h2>
            <p className="px-cta-p">We buy all Pokémon TCG — singles, sealed, graded, and bundles. Submit anything for manual review and we&apos;ll respond with an offer within 24 hours.</p>
          </div>
          <Link className="px-sell" href="/sell">Submit for review <span aria-hidden="true">→</span></Link>
        </div>

        <footer className="px-foot">
          <span>Offers refreshed daily · subject to inspection on arrival.</span>
          <span>cob.bot/prices · <b>{filtered.length}</b> products</span>
        </footer>
      </main>
    </div>
  );
}

const CSS = `
  .px-root {
    position: relative;
    background: #fbfbfa; color: #0f1419;
    font-family: 'Geist', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    width: 100vw; margin-left: calc(50% - 50vw); margin-top: -40px;
    min-height: 100vh; overflow-x: hidden;
  }
  .px-atm { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .px-glow {
    position: absolute; top: -18%; left: 50%;
    width: 1000px; height: 1000px; transform: translateX(-50%);
    background: radial-gradient(circle, rgba(84,87,217,0.06) 0%, rgba(224,74,59,0.025) 40%, transparent 70%);
    filter: blur(20px);
  }
  .px-brand {
    position: fixed; top: 20px; left: 24px; z-index: 50;
    display: flex; align-items: center; gap: 11px;
    padding: 6px 14px 6px 7px; border-radius: 999px;
    background: rgba(255,255,255,0.85); backdrop-filter: blur(10px);
    border: 1px solid rgba(15,20,25,0.06);
    text-decoration: none; color: inherit;
  }
  .px-wordmark { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 14px; letter-spacing: 0.5px; }
  .px-brand-divider { width: 1px; height: 20px; background: rgba(15,20,25,0.10); }
  .px-brand-tag { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a93a1; letter-spacing: 0.3px; }

  .px-back {
    position: fixed; top: 22px; right: 24px; z-index: 50;
    display: inline-flex; align-items: center; gap: 7px;
    padding: 9px 15px; border-radius: 999px;
    border: 1px solid rgba(15,20,25,0.12); background: rgba(255,255,255,0.9);
    font-size: 13px; font-weight: 500; color: #0f1419; text-decoration: none; line-height: 1;
    transition: border-color .15s, box-shadow .15s;
  }
  .px-back:hover { border-color: rgba(84,87,217,0.4); box-shadow: 0 2px 10px rgba(15,20,25,0.06); }

  .px-main {
    position: relative; z-index: 4;
    max-width: 1100px; margin: 0 auto;
    padding: 86px 40px 48px;
    display: flex; flex-direction: column; gap: 26px;
  }

  /* Hero */
  .px-eyebrow {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 5px 12px; align-self: flex-start;
    background: rgba(224,74,59,0.06); border: 1px solid rgba(224,74,59,0.18);
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
    letter-spacing: 1.2px; color: #c0392b;
  }
  .px-eyebrow-dot { width: 6px; height: 6px; border-radius: 50%; background: #E04A3B; box-shadow: 0 0 8px rgba(224,74,59,0.5); }
  .px-title { margin: 16px 0 0; font-weight: 700; font-size: 52px; line-height: 1; letter-spacing: -0.025em; color: #0f1419; }
  .px-title em { font-weight: 300; font-style: italic; color: #E04A3B; }
  .px-sub { margin: 13px 0 0; font-size: 15.5px; color: #4a5260; line-height: 1.55; max-width: 560px; }
  .px-sub a { color: #5457d9; text-decoration: none; font-weight: 500; }
  .px-sub a:hover { text-decoration: underline; }

  /* Server switcher row (destination server for the seller's submissions) */
  .px-server-row { display: flex; align-items: center; gap: 14px; margin: 18px 0 0; flex-wrap: wrap; }
  .px-server-label {
    font-family: 'JetBrains Mono', monospace; font-size: 10.5px;
    letter-spacing: 1.4px; font-weight: 600; color: #8a93a1; text-transform: uppercase;
  }

  /* Controls bar */
  .px-controls { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
  .px-search {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 10px 14px; border-radius: 11px;
    background: white; border: 1px solid rgba(15,20,25,0.12);
    min-width: 248px; flex: 0 1 320px;
    transition: border-color .15s, box-shadow .15s;
  }
  .px-search:focus-within { border-color: #5457d9; box-shadow: 0 0 0 3px rgba(84,87,217,0.12); }
  .px-search svg { flex: 0 0 auto; color: #8a93a1; }
  .px-search input {
    border: 0; outline: 0; background: transparent; width: 100%;
    font-family: 'Geist', sans-serif; font-size: 14px; color: #0f1419;
  }
  .px-search input::placeholder { color: #a3acb8; }

  .px-chips { display: inline-flex; align-items: center; gap: 6px; flex-wrap: wrap; }
  .px-chip {
    padding: 8px 13px; border-radius: 999px;
    border: 1px solid rgba(15,20,25,0.10); background: white;
    font-size: 12.5px; font-weight: 500; color: #4a5260; cursor: pointer;
    font-family: 'Geist', sans-serif; line-height: 1; transition: all .14s;
  }
  .px-chip:hover { border-color: rgba(84,87,217,0.4); color: #0f1419; }
  .px-chip.is-active { background: #0f1419; border-color: #0f1419; color: white; }

  .px-sort { margin-left: auto; display: inline-flex; align-items: center; gap: 8px; }
  .px-sort-label { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 1.2px; color: #8a93a1; text-transform: uppercase; }
  .px-sort select {
    appearance: none; -webkit-appearance: none;
    padding: 8px 30px 8px 12px; border-radius: 9px;
    border: 1px solid rgba(15,20,25,0.12); background: white;
    font-family: 'Geist', sans-serif; font-size: 12.5px; font-weight: 500; color: #0f1419; cursor: pointer;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' fill='none' stroke='%238a93a1' stroke-width='1.8' stroke-linecap='round'%3E%3Cpath d='M2 3.5L5 6.5L8 3.5'/%3E%3C/svg%3E");
    background-repeat: no-repeat; background-position: right 11px center;
  }

  /* Category section heading */
  .px-cat-head { display: flex; align-items: baseline; gap: 11px; margin: 6px 0 2px; }
  .px-cat-title { margin: 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; color: #0f1419; }
  .px-cat-count { font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a93a1; }
  .px-cat-rule { flex: 1 1 auto; height: 1px; background: rgba(15,20,25,0.08); }

  .px-pill {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 2px 8px; border-radius: 999px;
    font-family: 'JetBrains Mono', monospace; font-size: 10px; font-weight: 600;
    letter-spacing: 0.4px; flex-shrink: 0; white-space: nowrap;
  }
  .px-pill-amber { background: rgba(245,200,66,0.16); color: #a37300; }

  /* Dense table */
  .pxt-wrap { background: rgba(255,255,255,0.94); border: 1px solid rgba(15,20,25,0.08); border-radius: 14px; overflow: hidden; }
  .pxt-table { width: 100%; border-collapse: collapse; }
  .pxt-table th { text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 1.2px; text-transform: uppercase; color: #8a93a1; font-weight: 600; padding: 11px 18px; border-bottom: 1px solid rgba(15,20,25,0.08); background: rgba(15,20,25,0.015); }
  .pxt-table th.num, .pxt-table td.num { text-align: right; }
  .pxt-table th.act, .pxt-table td.act { text-align: right; width: 84px; }
  .pxt-table td { padding: 13px 18px; border-bottom: 1px solid rgba(15,20,25,0.06); vertical-align: middle; }
  .pxt-table tbody tr:last-child td { border-bottom: 0; }
  .pxt-table tbody tr { transition: background .12s; }
  .pxt-table tbody tr:hover { background: rgba(84,87,217,0.035); }
  .pxt-name { font-size: 14.5px; font-weight: 600; color: #0f1419; }
  .pxt-set { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #8a93a1; }
  .pxt-range { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: #6b7280; }
  .pxt-top { font-family: 'JetBrains Mono', monospace; font-size: 15.5px; font-weight: 700; color: #0f1419; letter-spacing: -0.015em; line-height: 1.1; }
  .pxt-top-cond { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.8px; color: #17834f; text-transform: uppercase; font-weight: 600; }
  .pxt-link { font-family: 'Geist', sans-serif; font-size: 12.5px; font-weight: 600; color: #5457d9; text-decoration: none; white-space: nowrap; }
  .pxt-link:hover { text-decoration: underline; }

  /* Empty + CTA + footer */
  .px-empty {
    background: rgba(255,255,255,0.92); border: 1px dashed rgba(15,20,25,0.14);
    border-radius: 14px; padding: 40px 24px; text-align: center;
  }
  .px-empty-mark { font-family: 'JetBrains Mono', monospace; font-size: 30px; color: rgba(15,20,25,0.18); }
  .px-empty-title { margin: 6px 0 0; font-size: 14.5px; font-weight: 600; }
  .px-empty-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

  .px-cta {
    margin-top: 4px;
    background: rgba(255,255,255,0.7); border: 1px dashed rgba(15,20,25,0.16);
    border-radius: 16px; padding: 26px 30px;
    display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap;
  }
  .px-cta-h { margin: 0; font-size: 16px; font-weight: 600; color: #0f1419; }
  .px-cta-p { margin: 5px 0 0; font-size: 13.5px; color: #6b7280; max-width: 540px; line-height: 1.5; }

  .px-sell {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border-radius: 999px;
    background: #0f1419; color: white;
    font-family: 'Geist', sans-serif; font-size: 13px; font-weight: 500;
    text-decoration: none; white-space: nowrap; line-height: 1; border: 0; cursor: pointer;
    box-shadow: 0 1px 2px rgba(15,20,25,0.06);
    transition: background .15s, transform .12s;
  }
  .px-sell:hover { background: #1f2733; transform: translateY(-1px); }

  .px-foot {
    display: flex; justify-content: space-between; align-items: center; gap: 12px; flex-wrap: wrap;
    padding-top: 16px; border-top: 1px dashed rgba(15,20,25,0.10);
    font-family: 'JetBrains Mono', monospace; font-size: 11px; color: #8a93a1;
  }
  .px-foot b { color: #0f1419; font-weight: 600; }

  @media (max-width: 760px) {
    .px-main { padding: 92px 18px 44px; gap: 22px; }
    .px-title { font-size: 38px; }
    .px-sub { font-size: 14.5px; }
    .px-controls { gap: 10px; }
    .px-search { flex: 1 1 100%; min-width: 0; }
    .px-sort { margin-left: 0; }
    .px-back { display: none; }
    .pxt-wrap { overflow-x: auto; -webkit-overflow-scrolling: touch; }
    .pxt-table { min-width: 580px; }
  }
`;
