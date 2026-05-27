"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AppConfig, Order, Product } from "@prisma/client";

type OrderWithProduct = Order & { product: Product | null };

const STEPS = ["Offered", "Accepted", "Label", "Transit", "Inspected", "Paid"];

function statusToIndex(s: string): number {
  const m: Record<string, number> = {
    DRAFT: 0, OFFERED: 0,
    AWAITING_LABEL: 1,
    LABEL_READY: 2,
    SHIPPED: 3, DELIVERED: 3,
    INSPECTION_PENDING: 4, APPROVED: 4,
    CONDITION_MISMATCH: 4, FAKE_COUNTERFEIT: 4,
    MISSING_ITEM: 4, NEEDS_SELLER_CONTACT: 4,
    PAYOUT_PROMPTED: 5, PAID: 5, REJECTED: 5,
  };
  return m[s] ?? 0;
}

function statusLabel(s: string): string {
  const m: Record<string, string> = {
    DRAFT: "Under review", OFFERED: "Offer ready",
    AWAITING_LABEL: "Offer accepted", LABEL_READY: "Label ready",
    SHIPPED: "In transit", DELIVERED: "Delivered",
    INSPECTION_PENDING: "Inspecting", APPROVED: "Approved",
    CONDITION_MISMATCH: "Condition issue", FAKE_COUNTERFEIT: "Flagged",
    MISSING_ITEM: "Missing item", NEEDS_SELLER_CONTACT: "Needs contact",
    PAYOUT_PROMPTED: "Payout sent", PAID: "Paid out", REJECTED: "Rejected",
  };
  return m[s] ?? s;
}

const PAYOUT_METHODS = ["ZELLE", "PAYPAL", "CRYPTO", "WIRE_ACH"] as const;
type PayoutMethod = (typeof PAYOUT_METHODS)[number];
const METHOD_LABELS: Record<PayoutMethod, string> = { ZELLE: "Zelle", PAYPAL: "PayPal", CRYPTO: "Crypto", WIRE_ACH: "Wire / ACH" };
const METHOD_HINTS: Record<PayoutMethod, string> = { ZELLE: "Email or phone number", PAYPAL: "PayPal email", CRYPTO: "Wallet address + network", WIRE_ACH: "Routing + account #" };
const METHOD_PLACEHOLDERS: Record<PayoutMethod, string> = { ZELLE: "you@email.com", PAYPAL: "you@paypal.com", CRYPTO: "0x… (ERC-20)", WIRE_ACH: "012345678 / 0987654321" };

const fmtUSD = (c: number) => "$" + (c / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function conditionColor(c: string): string {
  if (c.includes("Near Mint") || c.includes("Factory Sealed") || c.includes("PSA 10") || c.includes("BGS 10")) return "#22c07a";
  if (c.includes("Lightly Played") || c.includes("PSA 9") || c.includes("BGS 9") || c.includes("CGC 10")) return "#84cc16";
  if (c.includes("Moderately") || c.includes("PSA 8") || c.includes("BGS 8")) return "#f59e0b";
  if (c.includes("Heavily") || c.includes("PSA 7")) return "#f97316";
  if (c.includes("Damaged")) return "#ef4444";
  return "#8a93a1";
}

function MiniCornLogo({ size = 40 }: { size?: number }) {
  const st = "#1f3a3a";
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" aria-hidden="true">
      <path d="M32 8 C 28 14 20 22 10 32 C 14 44 24 54 32 58 C 30 50 28 38 28 28 C 28 20 30 13 32 8 Z" fill="#82C975" stroke={st} strokeWidth="1.6"/>
      <path d="M32 8 C 36 14 44 22 54 32 C 50 44 40 54 32 58 C 34 50 36 38 36 28 C 36 20 34 13 32 8 Z" fill="#82C975" stroke={st} strokeWidth="1.6"/>
      <path d="M32 10 C 24 14 21 24 22 38 C 23 48 28 54 32 54 C 36 54 41 48 42 38 C 43 24 40 14 32 10 Z" fill="#FFE15A" stroke={st} strokeWidth="1.6"/>
      <g stroke={st} strokeWidth="0.55">
        <ellipse cx="29" cy="20" rx="2" ry="2.2" fill="#FFEE7A"/><ellipse cx="35" cy="20" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="26" cy="26" rx="2" ry="2.2" fill="#FFE15A"/><ellipse cx="32" cy="26" rx="2" ry="2.2" fill="#FFF6B0"/><ellipse cx="38" cy="26" rx="2" ry="2.2" fill="#FFE15A"/>
        <ellipse cx="25" cy="40" rx="2" ry="2.2" fill="#FFE15A"/><ellipse cx="39" cy="40" rx="2" ry="2.2" fill="#FFEE7A"/>
        <ellipse cx="29" cy="46" rx="2" ry="2.2" fill="#FFE15A"/><ellipse cx="32" cy="46" rx="2" ry="2.2" fill="#FFEE7A"/><ellipse cx="36" cy="46" rx="2" ry="2.2" fill="#FFE15A"/>
      </g>
      <ellipse cx="28" cy="31" rx="2.4" ry="3" fill={st}/><ellipse cx="36" cy="31" rx="2.4" ry="3" fill={st}/>
      <ellipse cx="28.8" cy="30" rx="0.8" ry="1" fill="#fff"/><ellipse cx="36.8" cy="30" rx="0.8" ry="1" fill="#fff"/>
      <path d="M28 36 C 29 41 35 41 36 36 Z" fill="#fff" stroke={st} strokeWidth="1.3"/>
    </svg>
  );
}

/* ─── All static styles in CSS so media queries can override inline would lose ─── */
const css = `
.ord-page {
  position: relative;
  width: 100vw;
  margin-left: calc(50% - 50vw);
  margin-top: -40px;
  min-height: calc(100vh + 40px);
  background: #fbfbfa;
  color: #0f1419;
  font-family: var(--font-sans, 'Geist', system-ui, sans-serif);
  -webkit-font-smoothing: antialiased;
  overflow-x: hidden;
}
.ord-atm { position: absolute; inset: 0; pointer-events: none; overflow: hidden; }
.ord-glow {
  position: absolute; top: -20%; left: 50%;
  width: 1100px; height: 1100px;
  transform: translateX(-50%);
  background: radial-gradient(circle, rgba(84,87,217,0.07) 0%, rgba(224,74,59,0.03) 40%, transparent 70%);
  filter: blur(20px);
}

/* ── Brand (fixed to viewport top-left) ── */
.ord-brand-fixed {
  position: fixed;
  top: 18px;
  left: 20px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
  color: inherit;
  padding: 4px 6px;
  border-radius: 10px;
}
.ord-brand-spacer {
  display: inline-block;
  height: 36px;
}

/* ── Header ── */
.ord-header {
  position: relative; z-index: 5;
  max-width: 1280px; margin: 0 auto;
  padding: 24px 48px;
  display: flex; align-items: center; justify-content: space-between;
}
.ord-wordmark {
  font-family: "Cinq","Cinq Display",Arial,sans-serif;
  font-weight: 900; letter-spacing: -1px; font-size: 24px;
}
.ord-back {
  padding: 8px 14px; border-radius: 10px;
  background: rgba(15,20,25,0.04); border: 1px solid rgba(15,20,25,0.08);
  color: #0f1419; font-size: 13px; font-weight: 500; text-decoration: none;
  transition: background .15s;
}
.ord-back:hover { background: rgba(15,20,25,0.08); }

/* ── Main ── */
.ord-main {
  position: relative; z-index: 4;
  max-width: 1280px; margin: 0 auto;
  padding: 8px 48px 80px;
  display: flex; flex-direction: column; gap: 28px;
}

/* ── Meta row ── */
.ord-meta-row {
  display: flex; align-items: center;
  gap: 16px; flex-wrap: wrap;
  padding: 14px 18px;
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(15,20,25,0.08);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}
.ord-id { display: flex; align-items: center; gap: 8px; min-width: 0; }
.ord-id-label {
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 10px; font-weight: 600; color: #8a93a1; letter-spacing: 1.5px; flex-shrink: 0;
}
.ord-id-val {
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 13px; font-weight: 600; color: #0f1419;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ord-date {
  margin-left: auto;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 11.5px; color: #8a93a1; flex-shrink: 0;
}

/* ── Hero ── */
.ord-hero {
  display: grid; grid-template-columns: 1fr 420px; gap: 40px; align-items: center;
}
.ord-eyebrow {
  display: inline-flex; align-items: center; gap: 9px;
  padding: 6px 12px; border-radius: 999px;
  background: rgba(224,74,59,0.07); border: 1px solid rgba(224,74,59,0.25);
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 10.5px; color: #c43e30; letter-spacing: 1.2px;
  margin-bottom: 14px; align-self: flex-start;
}
.ord-eyebrow-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: #E04A3B; box-shadow: 0 0 8px rgba(224,74,59,0.5); display: inline-block;
}
.ord-hero-title {
  margin: 0; font-weight: 700;
  font-size: clamp(40px,5.5vw,64px);
  line-height: 0.95; letter-spacing: -0.04em; color: #0f1419;
}
.ord-hero-title em { font-weight: 300; font-style: italic; color: #E04A3B; }
.ord-hero-sub { margin: 14px 0 0; font-size: 16px; color: #4a5260; max-width: 520px; line-height: 1.55; }
.ord-hero-sub b { color: #0f1419; font-weight: 600; }

/* ── Amount card ── */
.ord-amount-card {
  background: white; border: 1.5px solid rgba(15,20,25,0.08);
  border-radius: 18px; padding: 22px 26px;
  box-shadow: 0 1px 3px rgba(15,20,25,0.03), 0 16px 40px rgba(15,20,25,0.06);
  width: 100%;
}
.ord-amount-row {
  display: flex; justify-content: space-between; align-items: baseline; padding: 8px 0;
}
.ord-amount-label { font-size: 14px; color: #6b7280; }
.ord-amount-value {
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 16px; font-weight: 500; color: #0f1419; font-variant-numeric: tabular-nums;
}
.ord-amount-value.neg { color: #c43e30; }
.ord-amount-divider {
  height: 1px; margin: 6px 0;
  background-image: repeating-linear-gradient(90deg, rgba(15,20,25,0.16) 0 4px, transparent 4px 8px);
}
.ord-amount-row.total .ord-amount-label { font-size: 14px; font-weight: 600; color: #0f1419; }
.ord-amount-row.total .ord-amount-value.strong {
  font-size: 30px; font-weight: 700; letter-spacing: -0.01em;
}

/* ── Section cards ── */
.ord-summary, .ord-timeline, .ord-accept, .ord-next {
  background: rgba(255,255,255,0.92); border: 1px solid rgba(15,20,25,0.08);
  border-radius: 16px; padding: 28px 32px; backdrop-filter: blur(8px);
}
.ord-section-head { margin-bottom: 20px; }
.ord-section-head h2, .ord-timeline-head h2, .ord-accept-head h2 {
  margin: 0; font-size: 18px; font-weight: 600; letter-spacing: -0.005em;
}
.ord-section-head p, .ord-accept-head p { margin: 4px 0 0; font-size: 14px; color: #6b7280; }
.ord-accept-head { margin-bottom: 22px; }

/* ── Summary body ── */
.ord-summary-body { display: flex; gap: 24px; align-items: flex-start; }
.ord-card-info { display: flex; gap: 14px; align-items: center; flex-shrink: 0; }
.ord-card-name { font-size: 17px; font-weight: 600; }
.ord-card-sub {
  font-size: 12px; color: #8a93a1;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
}
.ord-card-cond { display: inline-flex; align-items: center; gap: 6px; font-size: 12.5px; color: #4a5260; margin-top: 4px; }
.ord-card-qty { color: #8a93a1; }

.ord-photos { flex: 1; min-width: 0; }
.ord-photos-label {
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 10px; color: #8a93a1; letter-spacing: 1.2px; margin-bottom: 10px;
}
.ord-photos-strip { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.ord-photo-thumb {
  display: block; border-radius: 8px; overflow: hidden;
  background: #e5e7eb; text-decoration: none; position: relative;
}
.ord-photo-thumb img { width: 100%; height: 110px; object-fit: cover; display: block; }
.ord-photo-thumb .ord-photo-grad {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 18px 6px 5px;
  background: linear-gradient(transparent,rgba(0,0,0,0.55));
}
.ord-photo-thumb span {
  display: block; text-align: center;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 8.5px; font-weight: 600; color: white;
  text-transform: uppercase; letter-spacing: 0.8px;
}

/* ── Timeline ── */
.ord-timeline-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 22px; }
.ord-step-count { font-family: var(--font-mono,'JetBrains Mono',monospace); font-size: 10.5px; color: #8a93a1; }
.ord-tl-track { position: relative; padding: 0 10px; }
.ord-tl-line {
  position: absolute; left: 22px; right: 22px; top: 10px;
  height: 2px; background: rgba(15,20,25,0.08); border-radius: 1px;
}
.ord-tl-steps { display: grid; grid-template-columns: repeat(6,1fr); gap: 4px; position: relative; }
.ord-tl-step { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.ord-tl-label {
  font-size: 11px; color: #8a93a1; font-weight: 500; letter-spacing: 0.2px; text-align: center;
}

/* ── Accept form ── */
.ord-accept-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
.ord-field { display: flex; flex-direction: column; gap: 8px; }
.ord-field label {
  font-size: 12px; font-weight: 600; color: #0f1419;
  display: flex; justify-content: space-between; align-items: baseline;
}
.ord-field-hint {
  font-weight: 400; color: #8a93a1; font-size: 11px;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
}
.ord-field input {
  padding: 11px 14px; background: white;
  border: 1.5px solid rgba(15,20,25,0.08); border-radius: 10px;
  font-size: 14px; font-family: inherit; color: #0f1419;
  outline: none; transition: border-color .15s; width: 100%; box-sizing: border-box;
}
.ord-field input:focus { border-color: #5457d9; }
.ord-method-row { display: flex; flex-wrap: wrap; gap: 6px; }
.ord-method {
  padding: 8px 12px; background: white;
  border: 1.5px solid rgba(15,20,25,0.08); border-radius: 10px;
  font-size: 12.5px; font-weight: 500; color: #4a5260;
  cursor: pointer; font-family: inherit; transition: all .15s;
}
.ord-method:hover { border-color: rgba(84,87,217,0.4); }
.ord-method.is-selected {
  background: rgba(84,87,217,0.06); border-color: #5457d9;
  color: #5457d9; box-shadow: 0 0 0 3px rgba(84,87,217,0.10);
}

/* ── Legal collapsibles ── */
.ord-legal { margin-top: 20px; border-top: 1px dashed rgba(15,20,25,0.10); padding-top: 14px; }
.ord-legal-row {
  width: 100%; display: flex; align-items: center; gap: 12px; padding: 10px 0;
  background: none; border: none; cursor: pointer; color: inherit; font-family: inherit; text-align: left;
}
.ord-legal-key {
  font-family: var(--font-mono,'JetBrains Mono',monospace); font-size: 9.5px; color: #4a5260;
  background: rgba(15,20,25,0.04); border: 1px solid rgba(15,20,25,0.08);
  padding: 2px 6px; border-radius: 3px; letter-spacing: 0.5px;
}
.ord-legal-title { flex: 1; font-size: 13.5px; font-weight: 500; }
.ord-legal-chev {
  font-family: var(--font-mono,'JetBrains Mono',monospace); font-size: 16px; color: #8a93a1; width: 18px; text-align: center;
}
.ord-legal-body { padding: 4px 0 14px 36px; font-size: 13px; color: #4a5260; line-height: 1.55; }

/* ── Terms ── */
.ord-terms {
  margin-top: 14px; display: flex; align-items: center; gap: 10px;
  padding: 12px 14px; background: rgba(15,20,25,0.02); border: 1px solid rgba(15,20,25,0.06);
  border-radius: 10px; cursor: pointer;
}
.ord-terms input {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  appearance: none;
  -webkit-appearance: none;
  background: #fff;
  border: 1.5px solid rgba(15, 20, 25, 0.25);
  border-radius: 4px;
  cursor: pointer;
  display: grid;
  place-content: center;
  transition: background-color .15s, border-color .15s;
}
.ord-terms input:hover {
  border-color: #5457d9;
}
.ord-terms input:checked {
  background: #5457d9;
  border-color: #5457d9;
}
.ord-terms input::before {
  content: "";
  width: 10px;
  height: 10px;
  transform: scale(0);
  transition: transform .12s ease-out;
  background-color: #fff;
  clip-path: polygon(14% 44%, 0% 60%, 40% 100%, 100% 18%, 84% 4%, 38% 68%);
}
.ord-terms input:checked::before {
  transform: scale(1);
}
.ord-terms input:focus-visible {
  outline: 2px solid #5457d9;
  outline-offset: 2px;
}
.ord-terms span {
  flex: 1 1 auto;
  min-width: 0;
  font-size: 14px;
  color: #4a5260;
  line-height: 1.5;
}

/* ── CTA ── */
.ord-cta-row { display: flex; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
.ord-cta-primary {
  flex: 1 1 240px; display: flex; align-items: center; justify-content: center; gap: 10px;
  padding: 14px 22px; background: rgba(15,20,25,0.10); color: rgba(15,20,25,0.4);
  border: none; border-radius: 12px; font-family: inherit; font-size: 15px; font-weight: 600;
  cursor: not-allowed; transition: all .2s;
}
.ord-cta-primary.is-active {
  background: #5457d9; color: white; cursor: pointer;
  box-shadow: 0 10px 28px rgba(84,87,217,0.28);
}
.ord-cta-primary.is-active:hover { background: #6366ec; }
.ord-cta-secondary {
  padding: 14px 20px; background: white; border: 1.5px solid rgba(15,20,25,0.10);
  border-radius: 12px; color: #4a5260; font-family: inherit; font-size: 14px; font-weight: 500; cursor: pointer; transition: all .15s;
  text-decoration: none; display: inline-flex; align-items: center; justify-content: center;
}
.ord-cta-secondary:hover { background: rgba(15,20,25,0.04); }

/* ── What's next ── */
.ord-discord {
  display: flex; align-items: center; gap: 14px; margin-top: 18px;
  padding: 14px 16px; background: rgba(84,87,217,0.04);
  border: 1px solid rgba(84,87,217,0.18); border-radius: 12px; flex-wrap: wrap;
}
.ord-discord-icon {
  width: 36px; height: 36px; border-radius: 8px; background: #5457d9; color: white;
  display: flex; align-items: center; justify-content: center;
  font-weight: 700; font-size: 18px; flex-shrink: 0;
}
.ord-discord-meta { flex: 1; min-width: 0; }
.ord-discord-label {
  font-family: var(--font-mono,'JetBrains Mono',monospace); font-size: 10px; color: #8a93a1; letter-spacing: 1px;
}
.ord-discord-name {
  font-size: 14px; font-weight: 600; color: #0f1419;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.ord-discord-link { font-size: 13px; font-weight: 500; color: #5457d9; text-decoration: none; flex-shrink: 0; }
.ord-discord-link:hover { text-decoration: underline; }

/* ── Footer ── */
.ord-foot {
  display: flex; justify-content: space-between; align-items: center; padding-top: 10px;
  font-family: var(--font-mono,'JetBrains Mono',monospace); font-size: 11px; color: #8a93a1;
  flex-wrap: wrap; gap: 12px;
}
.ord-foot b { color: #0f1419; }
.ord-foot a { color: #5457d9; text-decoration: none; }
.ord-foot-id { opacity: 0.6; }

/* ── Declined section ── */
.ord-declined {
  background: rgba(255,255,255,0.92);
  border: 1px solid rgba(15,20,25,0.08);
  border-radius: 16px;
  padding: 28px;
  backdrop-filter: blur(8px);
  display: flex; flex-direction: column; gap: 20px;
}
.ord-decline-banner {
  display: flex; align-items: flex-start; gap: 14px;
  padding: 18px 20px; border-radius: 12px;
  background: rgba(214,158,46,0.06); border: 1px solid rgba(214,158,46,0.28);
}
.ord-decline-banner-icon {
  flex-shrink: 0; line-height: 1;
  display: inline-flex; padding-top: 1px;
}
.ord-decline-banner-body { flex: 1; min-width: 0; }
.ord-decline-banner-title {
  font-size: 14.5px; font-weight: 600; color: #0f1419; margin-bottom: 4px;
  letter-spacing: -0.005em;
}
.ord-decline-banner-sub {
  font-size: 13px; color: #4a5260; line-height: 1.55;
}
.ord-decline-banner-sub b { color: #0f1419; font-weight: 600; }
.ord-declined-meta {
  display: flex; flex-direction: column; gap: 2px;
  border-top: 1px dashed rgba(15,20,25,0.10);
  border-bottom: 1px dashed rgba(15,20,25,0.10);
  padding: 14px 4px;
}
.ord-declined-meta-row {
  display: flex; align-items: center; gap: 14px;
  padding: 6px 0; font-size: 13px;
}
.ord-declined-meta-key {
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.6px;
  color: #8a93a1; width: 88px; flex-shrink: 0;
}
.ord-declined-meta-val {
  color: #0f1419;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
  font-size: 12.5px;
}
.ord-declined-pill {
  display: inline-flex; align-items: center;
  padding: 3px 9px;
  background: rgba(214,158,46,0.12); border: 1px solid rgba(214,158,46,0.35);
  color: #8a6510; border-radius: 999px;
  font-size: 10.5px; font-weight: 600; letter-spacing: 0.5px;
  text-transform: uppercase;
  font-family: var(--font-mono,'JetBrains Mono',monospace);
}

/* ── Drafted timeline pseudo-step ── */
.ord-tl-step-drafted { cursor: default; }
.ord-tl-dot-drafted {
  background: rgba(214,158,46,0.10) !important;
  border: 1.5px dashed rgba(168,119,24,0.55) !important;
  color: transparent !important;
  display: inline-flex; align-items: center; justify-content: center;
}
.ord-tl-step-drafted.is-current .ord-tl-label { color: #a87718; font-weight: 600; }

/* ── Tablet: hero collapses ── */
@media (max-width: 860px) {
  .ord-hero { grid-template-columns: 1fr; gap: 28px; }
  .ord-accept-grid { grid-template-columns: 1fr; }
}

/* ── ≤720px — DESIGN.md spec ── */
@media (max-width: 720px) {
  .ord-header { padding: 18px 20px; }
  .ord-main   { padding: 6px 20px 60px; gap: 20px; }
  .ord-summary, .ord-timeline, .ord-accept, .ord-next { padding: 22px 20px; border-radius: 14px; }
  .ord-amount-card { padding: 18px 20px; border-radius: 14px; }
  .ord-amount-row.total .ord-amount-value.strong { font-size: 26px; }
  .ord-meta-row { padding: 12px 14px; gap: 10px; }
  .ord-date { margin-left: 0; width: 100%; order: 3; font-size: 10.5px; }
  .ord-id-label { font-size: 9.5px; }
  .ord-id-val { font-size: 12px; }
  .ord-tl-steps { grid-template-columns: repeat(3, 1fr); gap: 14px; }
  .ord-tl-line { display: none; }
  .ord-tl-label { font-size: 10.5px; }
  .ord-back { padding: 7px 12px; font-size: 12.5px; }
  .ord-brand-fixed { top: 14px; left: 14px; }
  .ord-wordmark { font-size: 22px; }
  .ord-eyebrow { font-size: 9.5px; padding: 5px 10px; letter-spacing: 1px; }
  .ord-summary-body { flex-direction: column; gap: 18px; }
  .ord-hero-title { font-size: 44px; }
  .ord-hero-sub { font-size: 14.5px; }
  .ord-photos-strip { gap: 4px; }
  .ord-photo-thumb span { font-size: 8px; }
  .ord-discord-link { width: 100%; padding-top: 4px; }
  .ord-cta-secondary { flex: 1 1 auto; }
}

/* ── ≤420px — DESIGN.md spec ── */
@media (max-width: 420px) {
  .ord-photos-strip { grid-template-columns: repeat(2, 1fr); }
  .ord-meta-row { flex-direction: column; align-items: flex-start; }
  .ord-status { align-self: flex-start; }
  .ord-foot { font-size: 10.5px; }
  .ord-discord { padding: 12px; }
  .ord-discord-icon { width: 32px; height: 32px; font-size: 16px; }
}
`;

export function OrderPageClient({ order, config }: { order: OrderWithProduct; config: AppConfig }) {
  const router = useRouter();
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("ZELLE");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showShipping, setShowShipping] = useState(false);
  const [error, setError] = useState<string>();
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [declined, setDeclined] = useState(order.status === "DRAFT");
  const [resubmitting, setResubmitting] = useState(false);

  const photos = JSON.parse(order.photoUrlsJson) as string[];
  const cardName = order.product?.name ?? order.customCardName ?? "Custom card";
  const perItemCents = order.quantity > 1 ? Math.round(order.offerCents / order.quantity) : order.offerCents;
  const stepIdx = statusToIndex(order.status);
  const canAccept = order.status === "OFFERED";
  const formValid = payoutDetails.trim().length > 4 && acceptedTerms;
  const photoLabels = ["front", "back", "edge", "corner"];

  async function handleAccept() {
    if (!formValid) return;
    setSubmitting(true);
    setError(undefined);
    const res = await fetch(`/api/orders/${order.id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ payoutMethod, payoutDetails, acceptedTerms }),
    });
    setSubmitting(false);
    if (!res.ok) { setError("Could not accept. Check your payout details and accept the terms."); return; }
    router.refresh();
  }

  async function handleDecline() {
    setDeclining(true);
    const res = await fetch(`/api/orders/${order.id}/decline`, { method: "POST" });
    setDeclining(false);
    if (!res.ok) { setError("Could not decline the offer. Please try again."); return; }
    setDeclined(true);
  }

  async function handleResubmit() {
    setResubmitting(true);
    const res = await fetch(`/api/orders/${order.id}/resubmit`, { method: "POST" });
    setResubmitting(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "Could not resubmit." }));
      setError(error === "Draft has expired" ? "This draft has expired and can no longer be resubmitted." : "Could not resubmit. Please try again.");
      return;
    }
    setDeclined(false);
  }

  // Dynamic pill colors (status-dependent — must stay inline)
  const pillStyle = declined
    ? { background: "rgba(245,200,66,0.14)", color: "#a87718", border: "1px solid rgba(214,158,46,0.40)" }
    : ["PAID", "PAYOUT_PROMPTED"].includes(order.status)
    ? { background: "rgba(34,192,122,0.12)", color: "#17834f", border: "1px solid rgba(34,192,122,0.30)" }
    : order.status === "OFFERED"
    ? { background: "rgba(84,87,217,0.08)", color: "#5457d9", border: "1px solid rgba(84,87,217,0.20)" }
    : ["REJECTED", "CONDITION_MISMATCH", "FAKE_COUNTERFEIT"].includes(order.status)
    ? { background: "rgba(196,62,48,0.08)", color: "#c43e30", border: "1px solid rgba(196,62,48,0.20)" }
    : { background: "rgba(245,200,66,0.12)", color: "#a37300", border: "1px solid rgba(245,200,66,0.30)" };

  function formatExpiresDate(declinedAt: Date | string | null) {
    if (!declinedAt) return "—";
    const d = new Date(declinedAt);
    d.setDate(d.getDate() + 3);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  return (
    <>
      <style>{css}</style>
      <div className="ord-page">

        {/* Atmospheric glow */}
        <div className="ord-atm" aria-hidden="true">
          <div className="ord-glow" />
        </div>

        {/* Brand pinned to viewport top-left, independent of layout container */}
        <Link href="/" className="ord-brand-fixed">
          <MiniCornLogo size={36} />
          <span className="ord-wordmark">COB</span>
        </Link>

        {/* ── Header ── */}
        <header className="ord-header">
          <span className="ord-brand-spacer" aria-hidden="true" />
          <Link href="/sell" className="ord-back">+ New offer</Link>
        </header>

        <main className="ord-main">

          {/* ── Meta row ── */}
          <div className="ord-meta-row">
            <div className="ord-id">
              <span className="ord-id-label">ORDER</span>
              <span className="ord-id-val">{order.id}</span>
            </div>
            {/* Dynamic status pill — inline for color only, class for layout */}
            <div className="ord-status" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 999, fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 10.5, fontWeight: 600, letterSpacing: 0.6, flexShrink: 0, ...pillStyle }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "currentColor", boxShadow: "0 0 8px currentColor", display: "inline-block" }} />
              {declined ? "Draft ready" : statusLabel(order.status)}
            </div>
            <div className="ord-date">
              {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {" · "}
              {new Date(order.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
            </div>
          </div>

          {/* ── Hero ── */}
          <section className="ord-hero">
            <div>
              <div className="ord-eyebrow">
                <span className="ord-eyebrow-dot" />
                {declined
                  ? "MOVED TO DRAFTS · 3 DAYS TO RESUBMIT"
                  : canAccept ? "OFFER READY · AWAITING ACCEPTANCE" : "ORDER IN PROGRESS"}
              </div>
              <h1 className="ord-hero-title">
                {declined
                  ? <>Your <em>loss</em>.</>
                  : canAccept ? <>Your <em>offer</em>.</> : <>In <em>motion</em>.</>}
              </h1>
              <p className="ord-hero-sub">
                {declined ? (
                  <>We hate to see you go — but your offer will remain in <b>drafts</b> for <b>3 days</b>.<br />Feel free to resubmit the offer anytime.</>
                ) : canAccept ? (
                  <>Accept and await your confirmation before shipping.<br />Buyer is expected to pay for shipping.</>
                ) : (
                  <><b>{order.discordChannelId ?? "Your Discord channel"}</b> has live updates.</>
                )}
              </p>
            </div>

            {/* Payout breakdown card */}
            <div className="ord-amount-card">
              <div className="ord-amount-row">
                <span className="ord-amount-label">{cardName}</span>
                <span className="ord-amount-value">{fmtUSD(perItemCents)}{order.quantity > 1 ? " ea" : ""}</span>
              </div>
              <div className="ord-amount-row">
                <span className="ord-amount-label">Quantity</span>
                <span className="ord-amount-value">×{order.quantity}</span>
              </div>
              {order.quantity > 1 && (
                <div className="ord-amount-row">
                  <span className="ord-amount-label">Offer total</span>
                  <span className="ord-amount-value">{fmtUSD(order.offerCents)}</span>
                </div>
              )}
              {order.shippingDeductionCents > 0 && (
                <div className="ord-amount-row">
                  <span className="ord-amount-label">Shipping</span>
                  <span className="ord-amount-value neg">−{fmtUSD(order.shippingDeductionCents)}</span>
                </div>
              )}
              <div className="ord-amount-divider" />
              <div className="ord-amount-row total">
                <span className="ord-amount-label">Payout</span>
                <span className="ord-amount-value strong">{fmtUSD(order.payoutCents)}</span>
              </div>
            </div>
          </section>

          {/* ── Order summary ── */}
          <section className="ord-summary">
            <div className="ord-section-head"><h2>Order summary</h2></div>
            <div className="ord-summary-body">
              {/* Card art + meta */}
              <div className="ord-card-info">
                <div style={{ width: 64, height: 88, background: "linear-gradient(135deg,hsl(220,70%,55%),hsl(220,60%,35%))", borderRadius: 6, padding: 6, position: "relative", overflow: "hidden", flexShrink: 0 }}>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 4, background: "hsl(220,90%,30%)" }} />
                  <div style={{ width: "100%", height: "100%", background: "linear-gradient(135deg,hsla(220,50%,75%,0.95),hsla(220,50%,50%,0.95))", borderRadius: 3, marginTop: 4 }} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <div className="ord-card-name">{cardName}</div>
                  {(order.setName || order.cardNumber) && (
                    <div className="ord-card-sub">{[order.setName, order.cardNumber].filter(Boolean).join(" · ")}</div>
                  )}
                  <div className="ord-card-cond">
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: conditionColor(order.condition), display: "inline-block", flexShrink: 0 }} />
                    {order.condition === "Factory Sealed" || order.condition === "Near Mint" ? "Sealed" : order.condition}
                    {order.quantity > 1 && <span className="ord-card-qty">· ×{order.quantity}</span>}
                  </div>
                </div>
              </div>

              {/* Photos */}
              <div className="ord-photos">
                <div className="ord-photos-label">SUBMITTED PHOTOS</div>
                <div className="ord-photos-strip" style={{ gridTemplateColumns: `repeat(${Math.min(photos.length, 4)}, 1fr)` }}>
                  {photos.map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="ord-photo-thumb">
                      <img src={url} alt={photoLabels[i] ?? `photo ${i + 1}`}
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = "none";
                          if (img.parentElement) img.parentElement.style.height = "110px";
                        }}
                      />
                      <div className="ord-photo-grad" />
                      <span>{photoLabels[i] ?? `photo ${i + 1}`}</span>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* ── Timeline ── */}
          <section className="ord-timeline">
            <div className="ord-timeline-head">
              <h2>Progress</h2>
              <span className="ord-step-count">{declined ? "Drafted" : <>Step {stepIdx + 1} of {STEPS.length}</>}</span>
            </div>
            <div className="ord-tl-track">
              <div className="ord-tl-line">
                <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: declined ? "0%" : `${(stepIdx / (STEPS.length - 1)) * 100}%`, background: "linear-gradient(90deg,#22c07a,#5457d9)", borderRadius: 1, transition: "width 0.4s cubic-bezier(.2,.7,.2,1)" }} />
              </div>
              <div className={`ord-tl-steps ${declined ? "is-declined" : ""}`} style={{ gridTemplateColumns: `repeat(${declined ? STEPS.length + 1 : STEPS.length}, 1fr)` }}>
                {declined && (
                  <div className="ord-tl-step ord-tl-step-drafted is-current">
                    <span className="ord-tl-dot ord-tl-dot-drafted" aria-hidden="true">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                        <path d="M1 5 L9 5" stroke="#a87718" strokeWidth="1.6" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="ord-tl-label">Drafted</span>
                  </div>
                )}
                {STEPS.map((label, i) => {
                  const done = i < stepIdx, cur = i === stepIdx;
                  return (
                    <div key={label} className="ord-tl-step">
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: done ? "#22c07a" : cur ? "#5457d9" : "white", border: `2px solid ${done ? "#22c07a" : cur ? "#5457d9" : "rgba(15,20,25,0.18)"}`, color: (done || cur) ? "white" : "#8a93a1", fontFamily: "var(--font-mono,'JetBrains Mono',monospace)", fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2, boxShadow: cur ? "0 0 0 4px rgba(84,87,217,0.18)" : undefined }}>
                        {done ? "✓" : i + 1}
                      </div>
                      <span className="ord-tl-label" style={{ color: cur ? "#5457d9" : done ? "#0f1419" : "#8a93a1", fontWeight: cur ? 600 : 500 }}>
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Accept offer OR What's next ── */}
          {declined ? (
            <section className="ord-declined">
              <div className="ord-decline-banner">
                <span className="ord-decline-banner-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <path d="M12 3 L22 20 H2 Z" fill="rgba(214,158,46,0.18)" stroke="#a87718" strokeWidth="1.6" strokeLinejoin="round" />
                    <path d="M12 10 V14" stroke="#a87718" strokeWidth="1.8" strokeLinecap="round" />
                    <circle cx="12" cy="17" r="1" fill="#a87718" />
                  </svg>
                </span>
                <div className="ord-decline-banner-body">
                  <div className="ord-decline-banner-title">You have declined the offer.</div>
                  <div className="ord-decline-banner-sub">
                    This order has been moved to <b>Drafts</b> on your dashboard. Drafts are automatically removed after <b>3 days</b>. If this was a mistake, you can resubmit below.
                  </div>
                </div>
              </div>
              <div className="ord-declined-meta">
                <div className="ord-declined-meta-row">
                  <span className="ord-declined-meta-key">ORDER</span>
                  <span className="ord-declined-meta-val">{order.id}</span>
                </div>
                <div className="ord-declined-meta-row">
                  <span className="ord-declined-meta-key">STATUS</span>
                  <span className="ord-declined-meta-val"><span className="ord-declined-pill">Draft</span></span>
                </div>
                <div className="ord-declined-meta-row">
                  <span className="ord-declined-meta-key">EXPIRES</span>
                  <span className="ord-declined-meta-val">in 3 days · {formatExpiresDate(order.declinedAt)}</span>
                </div>
              </div>
              <div className="ord-cta-row">
                <button type="button" onClick={handleResubmit} disabled={resubmitting} className="ord-cta-primary is-active">
                  <span>{resubmitting ? "Resubmitting…" : "Resubmit offer"}</span>
                  {!resubmitting && <span aria-hidden="true">→</span>}
                </button>
                <Link href="/sell" className="ord-cta-secondary">Back to /sell</Link>
              </div>
            </section>
          ) : canAccept ? (
            <section className="ord-accept">
              <div className="ord-accept-head">
                <h2>Accept offer</h2>
                <p>Choose how you want to be paid after inspection clears.</p>
              </div>

              <div className="ord-accept-grid">
                <div className="ord-field">
                  <label>Payout method</label>
                  <div className="ord-method-row">
                    {PAYOUT_METHODS.map((m) => (
                      <button key={m} type="button" onClick={() => setPayoutMethod(m)} className={`ord-method ${payoutMethod === m ? "is-selected" : ""}`}>
                        {METHOD_LABELS[m]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="ord-field">
                  <label>
                    Payout details
                    <span className="ord-field-hint">{METHOD_HINTS[payoutMethod]}</span>
                  </label>
                  <input type="text" value={payoutDetails} onChange={(e) => setPayoutDetails(e.target.value)} placeholder={METHOD_PLACEHOLDERS[payoutMethod]} />
                </div>
              </div>

              {/* Legal collapsibles */}
              <div className="ord-legal">
                {[
                  { key: "ship", tag: "SHIP", label: "Shipping instructions", open: showShipping, toggle: () => setShowShipping(v => !v), body: config.shippingInstructions || "Pack products securely. We may reject or reduce the offer if the product doesn't match photos. Use the link we DM you to generate a label within 24 hours of accepting." },
                  { key: "tos", tag: "TOS", label: "Terms of service", open: showTerms, toggle: () => setShowTerms(v => !v), body: config.termsOfService || "Payout is gated on inspection. If the card matches your submission you're paid within 48 hours. Material discrepancies result in a revised offer or return." },
                ].map((row) => (
                  <div key={row.key}>
                    <button type="button" onClick={row.toggle} className="ord-legal-row">
                      <span className="ord-legal-key">{row.tag}</span>
                      <span className="ord-legal-title">{row.label}</span>
                      <span className="ord-legal-chev">{row.open ? "−" : "+"}</span>
                    </button>
                    {row.open && <div className="ord-legal-body">{row.body}</div>}
                  </div>
                ))}
              </div>

              <label className="ord-terms">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(e) => setAcceptedTerms(e.target.checked)}
                />
                <span>I agree to inspection-gated payout and shipping terms above.</span>
              </label>

              {error && (
                <p style={{ margin: "12px 0 0", fontSize: 13, color: "#c43e30", background: "rgba(196,62,48,0.06)", border: "1px solid rgba(196,62,48,0.15)", borderRadius: 8, padding: "10px 14px" }}>{error}</p>
              )}

              <div className="ord-cta-row">
                <button type="button" disabled={!formValid || submitting} onClick={handleAccept} className={`ord-cta-primary ${formValid ? "is-active" : ""}`}>
                  <span>{submitting ? "Accepting…" : `Accept ${fmtUSD(order.payoutCents)} offer`}</span>
                  {!submitting && <span aria-hidden="true">→</span>}
                </button>
                <button type="button" onClick={handleDecline} disabled={declining} className="ord-cta-secondary">
                  {declining ? "Declining…" : "Decline"}
                </button>
              </div>
            </section>
          ) : (
            <section className="ord-next">
              <div className="ord-accept-head">
                <h2>What&apos;s next</h2>
                <p>
                  {order.status === "DRAFT" && "Your submission is under manual review. Our team will respond within 24 hours."}
                  {order.status === "AWAITING_LABEL" && (<>Offer accepted! Preparing your shipping label — watch <b>{order.discordChannelId ?? "your Discord channel"}</b>.</>)}
                  {order.status === "LABEL_READY" && order.manualLabelUrl && (<><a href={order.manualLabelUrl} style={{ color: "#5457d9", fontWeight: 600 }}>Download your shipping label</a>. Drop at USPS — no signature required.</>)}
                  {order.status === "LABEL_READY" && !order.manualLabelUrl && "Label is ready — check your Discord DM."}
                  {order.status === "SHIPPED" && order.trackingNumber && (<>In transit — tracking: <b>{order.trackingNumber}</b>.</>)}
                  {order.status === "SHIPPED" && !order.trackingNumber && "Card is on its way. We'll DM you when it arrives."}
                  {order.status === "DELIVERED" && "Delivered — inspection starting soon."}
                  {order.status === "INSPECTION_PENDING" && "Under inspection. You'll be notified when it clears."}
                  {order.status === "APPROVED" && (<>Inspection passed. Payout via <b>{order.payoutMethod}</b> initiating now.</>)}
                  {order.status === "PAYOUT_PROMPTED" && (<>Payout of {fmtUSD(order.payoutCents)} via <b>{order.payoutMethod}</b> initiated. Watch for confirmation.</>)}
                  {order.status === "PAID" && (<>{fmtUSD(order.payoutCents)} sent via <b>{order.payoutMethod}</b>. Done!</>)}
                  {order.status === "CONDITION_MISMATCH" && "Inspection found a condition mismatch. Check your Discord channel."}
                  {order.status === "FAKE_COUNTERFEIT" && "Product was flagged during inspection. Check your Discord channel immediately."}
                  {order.status === "MISSING_ITEM" && "Item was not found in the package. Check your Discord channel."}
                  {order.status === "NEEDS_SELLER_CONTACT" && "We need to reach you — check your Discord channel."}
                  {order.status === "REJECTED" && "This offer was declined. Check your Discord channel for details."}
                </p>
              </div>
              {order.discordChannelId && (
                <div className="ord-discord">
                  <div className="ord-discord-icon">#</div>
                  <div className="ord-discord-meta">
                    <div className="ord-discord-label">PRIVATE ORDER CHANNEL</div>
                    <div className="ord-discord-name">{order.discordChannelId}</div>
                  </div>
                  <a href="#" className="ord-discord-link">Open in Discord →</a>
                </div>
              )}
            </section>
          )}

          {/* ── Footer ── */}
          <footer className="ord-foot">
            <span>Need help? DM us in your order channel or <a href="mailto:support@cashout.bot">support@cashout.bot</a></span>
            <span className="ord-foot-id">{order.id}</span>
          </footer>

        </main>
      </div>
    </>
  );
}
