"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const css = `
  .dsh-root {
    position: relative; min-height: 100vh;
    background: #fbfbfa; color: #0f1419;
    font-family: 'Geist', system-ui, -apple-system, sans-serif;
    -webkit-font-smoothing: antialiased;
    overflow-x: hidden;
    width: 100vw;
    margin-left: calc(50% - 50vw);
    margin-top: -40px;
  }
  .dsh-atm { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
  .dsh-glow {
    position: absolute; top: -15%; left: 50%;
    width: 1100px; height: 1100px;
    transform: translateX(-50%);
    background: radial-gradient(circle, rgba(84,87,217,0.06) 0%, rgba(224,74,59,0.025) 40%, transparent 70%);
    filter: blur(20px);
  }

  /* Fixed identity cluster top-left */
  .dsh-brand-fixed {
    position: fixed; top: 18px; left: 20px;
    z-index: 50;
    display: flex; align-items: center; gap: 12px;
    padding: 6px 12px 6px 6px;
    border-radius: 999px;
    background: rgba(255,255,255,0.85);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(15,20,25,0.06);
    text-decoration: none; color: inherit;
    transition: border-color .15s, box-shadow .15s;
  }
  .dsh-brand-fixed:hover { border-color: rgba(15,20,25,0.12); box-shadow: 0 2px 8px rgba(15,20,25,0.04); }
  .dsh-wordmark {
    font-family: 'JetBrains Mono', monospace;
    font-weight: 700; font-size: 14px; letter-spacing: 0.5px;
  }
  .dsh-brand-divider {
    width: 1px; height: 22px;
    background: rgba(15,20,25,0.10);
  }
  .dsh-profile { display: flex; align-items: center; gap: 9px; }
  .dsh-avatar {
    display: inline-flex; align-items: center; justify-content: center;
    border-radius: 50%;
    color: white; font-weight: 700;
    font-family: 'Geist', sans-serif;
    box-shadow: inset 0 0 0 1px rgba(15,20,25,0.08);
    flex-shrink: 0;
    overflow: hidden;
  }
  .dsh-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .dsh-profile-text { display: flex; flex-direction: column; line-height: 1.1; }
  .dsh-profile-name {
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px; font-weight: 600; color: #0f1419;
  }
  .dsh-profile-sub {
    font-size: 9.5px; color: #8a93a1;
    letter-spacing: 0.3px;
    margin-top: 2px;
  }

  /* New offer button — pinned top-right */
  .dsh-new-offer {
    position: fixed;
    top: 18px; right: 20px;
    z-index: 50;
    display: inline-flex; align-items: center; gap: 10px;
    padding: 10px 18px;
    background: #0f1419; color: white;
    border-radius: 999px;
    font-size: 13px; font-weight: 500;
    text-decoration: none;
    white-space: nowrap; line-height: 1;
    box-shadow: 0 1px 2px rgba(15,20,25,0.06);
    transition: background .15s, transform .12s;
  }
  .dsh-new-offer:hover { background: #1f2733; transform: translateY(-1px); }
  .dsh-new-offer-plus {
    font-family: 'JetBrains Mono', monospace;
    font-size: 16px; line-height: 1;
    display: inline-flex; align-items: center; justify-content: center;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: rgba(255,255,255,0.12);
  }

  /* Main */
  .dsh-main {
    position: relative; z-index: 4;
    max-width: 1280px; margin: 0 auto;
    padding: 0px 24px 80px;
    display: flex; flex-direction: column; gap: 32px;
  }

  /* Hero */
  .dsh-hero { padding: 28px 0 0; }
  .dsh-eyebrow {
    display: inline-flex; align-items: center; gap: 9px;
    padding: 5px 12px;
    background: rgba(224,74,59,0.06);
    border: 1px solid rgba(224,74,59,0.18);
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; letter-spacing: 1.2px;
    color: #c0392b;
  }
  .dsh-eyebrow-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: #E04A3B;
    box-shadow: 0 0 8px rgba(224,74,59,0.5);
  }
  .dsh-hero-title {
    margin: 18px 0 0;
    font-weight: 700; font-size: 64px;
    line-height: 1; letter-spacing: -0.02em;
    color: #0f1419;
  }
  .dsh-hero-title em {
    font-weight: 300; font-style: italic;
    color: #E04A3B;
  }
  .dsh-hero-sub {
    margin: 14px 0 0;
    font-size: 16px; color: #4a5260; line-height: 1.5;
  }

  /* Stats */
  .dsh-stats {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .dsh-stat {
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(15,20,25,0.08);
    border-radius: 14px;
    padding: 18px 20px;
    display: flex; flex-direction: column; gap: 6px;
  }
  .dsh-stat-key {
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 600;
    letter-spacing: 1.4px; color: #8a93a1;
  }
  .dsh-stat-val {
    font-size: 32px; font-weight: 700;
    letter-spacing: -0.02em; color: #0f1419;
    line-height: 1.05;
    font-feature-settings: 'tnum' 1;
  }
  .dsh-stat-foot { font-size: 11.5px; color: #8a93a1; }
  .dsh-stat-draft .dsh-stat-key { color: #a87718; }
  .dsh-stat-draft {
    background: rgba(245,200,66,0.05);
    border-color: rgba(214,158,46,0.25);
  }
  .dsh-stat-earned {
    background: linear-gradient(135deg, rgba(34,192,122,0.04), rgba(255,255,255,0.92));
    border-color: rgba(34,192,122,0.18);
  }
  .dsh-stat-earned .dsh-stat-key { color: #17834f; }

  /* Orders section */
  .dsh-orders-head {
    display: flex; align-items: flex-end; justify-content: space-between;
    gap: 24px; flex-wrap: wrap;
    margin-bottom: 16px;
  }
  .dsh-orders-head h2 {
    margin: 0; font-size: 18px; font-weight: 600;
    letter-spacing: -0.005em;
  }
  .dsh-tabs {
    display: inline-flex; gap: 2px;
    background: rgba(15,20,25,0.04);
    padding: 4px; border-radius: 12px;
  }
  .dsh-tab {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 7px 14px;
    background: transparent; border: 0;
    border-radius: 8px;
    font-family: inherit;
    font-size: 12.5px; font-weight: 500;
    color: #6b7280; cursor: pointer;
    transition: all .15s;
  }
  .dsh-tab:hover { color: #0f1419; }
  .dsh-tab.is-active { background: white; color: #0f1419; box-shadow: 0 1px 2px rgba(15,20,25,0.06); }
  .dsh-tab-count {
    display: inline-flex; align-items: center; justify-content: center;
    min-width: 18px; height: 18px; padding: 0 5px;
    background: rgba(15,20,25,0.06); color: #6b7280;
    border-radius: 999px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10px; font-weight: 600;
  }
  .dsh-tab.is-active .dsh-tab-count {
    background: rgba(84,87,217,0.12); color: #5457d9;
  }

  .dsh-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }

  /* Empty state */
  .dsh-empty {
    background: rgba(255,255,255,0.92);
    border: 1px dashed rgba(15,20,25,0.12);
    border-radius: 16px;
    padding: 56px 28px; text-align: center;
  }
  .dsh-empty-mark {
    font-family: 'JetBrains Mono', monospace;
    font-size: 36px; color: rgba(15,20,25,0.18); margin-bottom: 8px;
  }
  .dsh-empty-title { margin: 0; font-size: 15px; font-weight: 600; color: #0f1419; }
  .dsh-empty-sub { margin: 4px 0 0; font-size: 13px; color: #6b7280; }

  /* Order card */
  .dsh-card {
    display: grid; grid-template-columns: 62px 1fr;
    gap: 16px; align-items: center;
    padding: 16px 18px;
    background: rgba(255,255,255,0.92);
    border: 1px solid rgba(15,20,25,0.08);
    border-radius: 14px;
    text-decoration: none; color: inherit;
    transition: border-color .15s, transform .12s, box-shadow .15s;
  }
  .dsh-card:hover {
    border-color: rgba(84,87,217,0.35);
    box-shadow: 0 2px 12px rgba(15,20,25,0.04);
    transform: translateY(-1px);
  }
  .dsh-card.is-draft {
    background: rgba(245,200,66,0.04);
    border-color: rgba(214,158,46,0.25);
  }
  .dsh-card.is-draft:hover { border-color: rgba(168,119,24,0.55); }

  .dsh-card-art {
    width: 54px; height: 74px;
    position: relative;
    border-radius: 5px; overflow: hidden;
    flex-shrink: 0;
    box-shadow: 0 1px 2px rgba(15,20,25,0.10);
  }
  .dsh-card-band {
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
  }
  .dsh-card-portrait {
    position: absolute; inset: 8px 6px 22px;
    border-radius: 3px;
  }

  .dsh-card-body { min-width: 0; display: flex; flex-direction: column; gap: 5px; }
  .dsh-card-row1 {
    display: flex; align-items: center; justify-content: space-between; gap: 12px; min-width: 0;
  }
  .dsh-card-name {
    font-size: 15.5px; font-weight: 600; color: #0f1419;
    letter-spacing: -0.005em;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    min-width: 0; flex: 1 1 auto;
  }
  .dsh-card-row2 {
    display: flex; align-items: center; gap: 8px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11.5px; color: #8a93a1;
  }
  .dsh-card-set { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
  .dsh-card-qty {
    color: #4a5260; padding: 1px 6px;
    background: rgba(15,20,25,0.05);
    border-radius: 4px; font-weight: 600;
  }
  .dsh-card-row3 { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
  .dsh-card-amount {
    font-family: 'JetBrains Mono', monospace;
    font-size: 14px; font-weight: 600; color: #0f1419; letter-spacing: -0.01em;
  }
  .dsh-card-meta-dot { color: #c8cdd4; }
  .dsh-card-date {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #8a93a1;
  }
  .dsh-card-expires {
    margin-left: auto;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; color: #a87718;
    padding: 2px 8px;
    background: rgba(214,158,46,0.10);
    border: 1px solid rgba(214,158,46,0.30);
    border-radius: 999px; font-weight: 600; letter-spacing: 0.3px;
  }
  .dsh-card-expires.is-urgent {
    color: #c0392b;
    background: rgba(224,74,59,0.08);
    border-color: rgba(224,74,59,0.30);
  }

  /* Pills */
  .dsh-pill {
    display: inline-flex; align-items: center; gap: 6px;
    padding: 3px 9px; border-radius: 999px;
    font-size: 10.5px; font-weight: 600;
    letter-spacing: 0.4px; text-transform: uppercase;
    font-family: 'JetBrains Mono', monospace;
    flex-shrink: 0;
  }
  .dsh-pill-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; box-shadow: 0 0 5px currentColor; }
  .dsh-pill-purple { background: rgba(84,87,217,0.10); color: #5457d9; }
  .dsh-pill-amber  { background: rgba(245,200,66,0.14); color: #a37300; }
  .dsh-pill-green  { background: rgba(34,192,122,0.12); color: #17834f; }
  .dsh-pill-red    { background: rgba(224,74,59,0.10); color: #c0392b; }
  .dsh-pill-draft  { background: rgba(214,158,46,0.14); color: #a87718; border: 1px solid rgba(214,158,46,0.35); }
  .dsh-pill-neutral { background: rgba(15,20,25,0.06); color: #6b7280; }

  /* Footer */
  .dsh-foot {
    display: flex; justify-content: space-between; align-items: center;
    padding-top: 14px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px; color: #8a93a1;
    border-top: 1px dashed rgba(15,20,25,0.10);
  }
  .dsh-foot b { color: #0f1419; font-weight: 600; }
  .dsh-foot-id { letter-spacing: 0.3px; }

  /* Responsive */
  @media (max-width: 860px) { .dsh-grid { grid-template-columns: 1fr; } }
  @media (max-width: 720px) {
    .dsh-main { padding-left: 24px; padding-right: 24px; padding-top: 80px; }
    .dsh-profile-text { display: none; }
    .dsh-brand-divider { display: none; }
    .dsh-stats { grid-template-columns: repeat(2, 1fr); }
    .dsh-hero-title { font-size: 44px; }
    .dsh-hero-sub { font-size: 14.5px; }
  }
  @media (max-width: 540px) {
    .dsh-foot { flex-direction: column; gap: 6px; align-items: flex-start; }
    .dsh-tabs { flex-wrap: wrap; }
  }
`;

interface Order {
  id: string;
  cardName: string;
  cardSet: string;
  condition: string;
  quantity: number;
  hue: number;
  offerCents: number;
  status: string;
  createdAt: string;
  declinedAt: string | null;
}

interface Props {
  username: string;
  joinedAt: string;
  avatarUrl: string | null;
  orders: Order[];
  orderCount: number;
}

const STATUS_META: Record<string, { label: string; tone: string }> = {
  OFFERED:             { label: "Offer ready",  tone: "purple" },
  ACCEPTED:            { label: "Accepted",     tone: "amber" },
  LABEL_SENT:          { label: "Label sent",   tone: "amber" },
  IN_TRANSIT:          { label: "In transit",   tone: "amber" },
  INSPECTED:           { label: "Inspected",    tone: "amber" },
  AWAITING_LABEL:      { label: "Awaiting label", tone: "amber" },
  LABEL_READY:         { label: "Label ready",  tone: "amber" },
  SHIPPED:             { label: "Shipped",      tone: "amber" },
  DELIVERED:           { label: "Delivered",    tone: "amber" },
  INSPECTION_PENDING:  { label: "Inspecting",   tone: "amber" },
  APPROVED:            { label: "Approved",     tone: "green" },
  PAYOUT_PROMPTED:     { label: "Payout sent",  tone: "green" },
  PAID:                { label: "Expected payout", tone: "green" },
  DRAFT:               { label: "Drafted",      tone: "draft" },
  REJECTED:            { label: "Rejected",     tone: "red" },
  CONDITION_MISMATCH:  { label: "Mismatch",     tone: "red" },
  FAKE_COUNTERFEIT:    { label: "Fake",         tone: "red" },
};

const ACTIVE_STATUSES = ["OFFERED", "ACCEPTED", "LABEL_SENT", "IN_TRANSIT", "INSPECTED", "AWAITING_LABEL", "LABEL_READY", "SHIPPED", "DELIVERED", "INSPECTION_PENDING", "APPROVED", "PAYOUT_PROMPTED"];
const COMPLETED_STATUSES = ["PAID", "REJECTED", "CONDITION_MISMATCH", "FAKE_COUNTERFEIT"];

const TABS = [
  { key: "all",       label: "All",       filter: (_: Order) => true },
  { key: "active",    label: "Active",    filter: (o: Order) => ACTIVE_STATUSES.includes(o.status) },
  { key: "drafts",    label: "Drafts",    filter: (o: Order) => o.status === "DRAFT" },
  { key: "completed", label: "Completed", filter: (o: Order) => COMPLETED_STATUSES.includes(o.status) },
];

function fmtUSD(cents: number) {
  return "$" + (cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function daysLeft(declinedAt: string | null): number | null {
  if (!declinedAt) return null;
  const expires = new Date(declinedAt).getTime() + 3 * 24 * 60 * 60 * 1000;
  const diff = Math.ceil((expires - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, diff);
}

function hashHue(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
}

function DiscordAvatar({ name, size, avatarUrl }: { name: string; size: number; avatarUrl: string | null }) {
  if (avatarUrl) {
    return (
      <span className="dsh-avatar" style={{ width: size, height: size }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatarUrl} alt={name} />
      </span>
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  const bg = `linear-gradient(135deg, hsl(${h}, 55%, 62%) 0%, hsl(${(h + 40) % 360}, 60%, 48%) 100%)`;
  return (
    <span className="dsh-avatar" style={{ width: size, height: size, background: bg, fontSize: size * 0.42 }} aria-hidden="true">
      {initial}
    </span>
  );
}

function MiniCornLogo({ size = 32 }: { size?: number }) {
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

function OrderCard({ order }: { order: Order }) {
  const meta = STATUS_META[order.status] ?? { label: order.status.replace(/_/g, " "), tone: "neutral" };
  const isDraft = order.status === "DRAFT";
  const days = isDraft ? daysLeft(order.declinedAt) : null;
  const hue = order.hue;

  return (
    <Link href={`/orders/${order.id}`} className={`dsh-card ${isDraft ? "is-draft" : ""}`}>
      <div
        className="dsh-card-art"
        style={{ background: `linear-gradient(135deg, hsl(${hue}, 70%, 55%) 0%, hsl(${hue}, 60%, 35%) 100%)` }}
      >
        <div className="dsh-card-band" style={{ background: `hsl(${hue}, 90%, 30%)` }} />
        <div
          className="dsh-card-portrait"
          style={{ background: `linear-gradient(135deg, hsla(${hue}, 50%, 75%, 0.95), hsla(${hue}, 50%, 50%, 0.95))` }}
        />
      </div>
      <div className="dsh-card-body">
        <div className="dsh-card-row1">
          <span className="dsh-card-name">{order.cardName}</span>
          <span className={`dsh-pill dsh-pill-${meta.tone}`}>
            <span className="dsh-pill-dot" />
            {meta.label}
          </span>
        </div>
        <div className="dsh-card-row2">
          <span className="dsh-card-set">{order.cardSet}</span>
          {order.quantity > 1 ? <span className="dsh-card-qty">×{order.quantity}</span> : null}
        </div>
        <div className="dsh-card-row3">
          <span className="dsh-card-amount">{fmtUSD(order.offerCents)}</span>
          <span className="dsh-card-meta-dot">·</span>
          <span className="dsh-card-date">{order.createdAt}</span>
          {isDraft && days !== null ? (
            <span className={`dsh-card-expires ${days <= 1 ? "is-urgent" : ""}`}>
              {days === 0 ? "expires today" : days === 1 ? "expires tomorrow" : `${days} days left`}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

export default function DashboardClient({ username, joinedAt, avatarUrl, orders, orderCount }: Props) {
  const [tab, setTab] = useState("all");

  const counts = useMemo(() => ({
    all: orders.length,
    active: orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length,
    drafts: orders.filter((o) => o.status === "DRAFT").length,
    completed: orders.filter((o) => COMPLETED_STATUSES.includes(o.status)).length,
  }), [orders]);

  const stats = useMemo(() => {
    const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const paidOrders = orders.filter((o) => o.status === "PAID");
    const draftCount = orders.filter((o) => o.status === "DRAFT").length;
    const earnedCents = paidOrders.reduce((s, o) => s + o.offerCents, 0);
    return { active: activeOrders.length, drafts: draftCount, paidCount: paidOrders.length, earnedCents };
  }, [orders]);

  const filtered = orders.filter(TABS.find((t) => t.key === tab)!.filter);

  return (
    <div className="dsh-root">
      <style>{css}</style>
      <div className="dsh-atm" aria-hidden="true">
        <div className="dsh-glow" />
      </div>

      {/* Fixed identity cluster top-left */}
      <Link href="/" className="dsh-brand-fixed">
        <MiniCornLogo size={32} />
        <span className="dsh-wordmark">COB</span>
        <span className="dsh-brand-divider" aria-hidden="true" />
        <span className="dsh-profile">
          <DiscordAvatar name={username} size={28} avatarUrl={avatarUrl} />
          <span className="dsh-profile-text">
            <span className="dsh-profile-name">@{username}</span>
            <span className="dsh-profile-sub">{joinedAt}</span>
          </span>
        </span>
      </Link>

      <Link href="/sell" className="dsh-new-offer">
        <span aria-hidden="true" className="dsh-new-offer-plus">+</span>
        <span>New offer</span>
      </Link>

      <main className="dsh-main">
        {/* Hero */}
        <section className="dsh-hero">
          <div className="dsh-eyebrow">
            <span className="dsh-eyebrow-dot" />
            DASHBOARD · @{username.toUpperCase()}
          </div>
          <h1 className="dsh-hero-title">
            Welcome back, <em>{username}</em>.
          </h1>
          <p className="dsh-hero-sub">
            {stats.active} active order{stats.active === 1 ? "" : "s"} · {stats.drafts} draft{stats.drafts === 1 ? "" : "s"} pending action.
          </p>
        </section>

        {/* Stats strip */}
        <section className="dsh-stats">
          <div className="dsh-stat">
            <div className="dsh-stat-key">ACTIVE</div>
            <div className="dsh-stat-val">{stats.active}</div>
            <div className="dsh-stat-foot">in flight</div>
          </div>
          <div className="dsh-stat dsh-stat-draft">
            <div className="dsh-stat-key">DRAFTS</div>
            <div className="dsh-stat-val">{stats.drafts}</div>
            <div className="dsh-stat-foot">awaiting resubmit</div>
          </div>
          <div className="dsh-stat">
            <div className="dsh-stat-key">EXPECTED PAYOUT</div>
            <div className="dsh-stat-val">{stats.paidCount}</div>
            <div className="dsh-stat-foot">orders</div>
          </div>
          <div className="dsh-stat dsh-stat-earned">
            <div className="dsh-stat-key">EARNED</div>
            <div className="dsh-stat-val">{fmtUSD(stats.earnedCents)}</div>
            <div className="dsh-stat-foot">all-time</div>
          </div>
        </section>

        {/* Orders */}
        <section className="dsh-orders">
          <div className="dsh-orders-head">
            <h2>Your orders</h2>
            <div className="dsh-tabs" role="tablist">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.key}
                  onClick={() => setTab(t.key)}
                  className={`dsh-tab ${tab === t.key ? "is-active" : ""}`}
                >
                  {t.label}
                  <span className="dsh-tab-count">{counts[t.key as keyof typeof counts]}</span>
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="dsh-empty">
              <div className="dsh-empty-mark">∅</div>
              <p className="dsh-empty-title">Nothing here yet.</p>
              <p className="dsh-empty-sub">
                {tab === "drafts"
                  ? "No drafted orders. Declined offers will appear here for 3 days."
                  : tab === "active"
                  ? "No active orders. Submit a card to get an instant offer."
                  : "Your submissions will appear here."}
              </p>
            </div>
          ) : (
            <div className="dsh-grid">
              {filtered.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </section>

        <footer className="dsh-foot">
          <span>Need help? DM <b>support@cashout.bot</b> or open a ticket in the Discord server.</span>
          <span className="dsh-foot-id">cob.bot/dashboard · {orderCount} orders</span>
        </footer>
      </main>
    </div>
  );
}
