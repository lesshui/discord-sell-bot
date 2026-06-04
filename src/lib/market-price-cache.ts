// Caches market prices in the ProductMarketPrice table.
// Real source: fetchMarketNmPriceCents (TCGPlayer + eBay Finding API).
// MVP mode: when no upstream creds are configured, returns a mock price so the
// UI/refresh flow can be exercised without going live.

import type { Product, ProductMarketPrice } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { fetchMarketNmPriceCents } from "@/lib/market-pricing";

export const MARKET_PRICE_FRESH_MS = 24 * 60 * 60 * 1000; // 24h

export type MarketPriceResult = {
  priceCents: number;
  sampleSize: number;
  source: "ebay" | "tcgplayer" | "blended" | "mock";
};

function hasUpstreamCreds(): boolean {
  return Boolean(
    process.env.EBAY_APP_ID ||
      (process.env.TCGPLAYER_PUBLIC_KEY && process.env.TCGPLAYER_PRIVATE_KEY),
  );
}

// Deterministic mock so a given product always returns the same mock price.
function mockPriceFor(product: Pick<Product, "id" | "name" | "baseOfferCents">): MarketPriceResult {
  let seed = 0;
  for (let i = 0; i < product.id.length; i++) seed = (seed * 31 + product.id.charCodeAt(i)) & 0xffff;
  const jitter = (seed % 40) - 20; // -20%..+20%
  const base = product.baseOfferCents > 0 ? product.baseOfferCents : 1000;
  const priceCents = Math.max(100, Math.round(base * (1 + jitter / 100)));
  return { priceCents, sampleSize: 10, source: "mock" };
}

async function lookupRealPrice(
  product: Pick<Product, "name" | "setName" | "cardNumber">,
): Promise<MarketPriceResult | null> {
  const cents = await fetchMarketNmPriceCents({
    cardName: product.name,
    setName: product.setName,
    cardNumber: product.cardNumber,
  });
  if (cents == null) return null;
  // fetchMarketNmPriceCents blends sources internally; we record the blended result.
  return { priceCents: cents, sampleSize: 10, source: "blended" };
}

export async function refreshProductMarketPrice(
  product: Pick<Product, "id" | "name" | "setName" | "cardNumber" | "baseOfferCents">,
): Promise<ProductMarketPrice | null> {
  const result = hasUpstreamCreds()
    ? (await lookupRealPrice(product)) ?? mockPriceFor(product)
    : mockPriceFor(product);

  return prisma.productMarketPrice.upsert({
    where: { productId: product.id },
    create: {
      productId: product.id,
      priceCents: result.priceCents,
      sampleSize: result.sampleSize,
      source: result.source,
      scrapedAt: new Date(),
    },
    update: {
      priceCents: result.priceCents,
      sampleSize: result.sampleSize,
      source: result.source,
      scrapedAt: new Date(),
    },
  });
}

export type RefreshSummary = {
  updated: number;
  failed: number;
  skipped: number;
  total: number;
};

// Refreshes all active products. Sequential to be polite to upstream APIs.
export async function refreshAllMarketPrices(options?: {
  onlyMissingManualPrice?: boolean;
}): Promise<RefreshSummary> {
  const products = await prisma.product.findMany({
    where: {
      active: true,
      ...(options?.onlyMissingManualPrice ? { baseOfferCents: 0 } : {}),
    },
  });

  let updated = 0;
  let failed = 0;
  for (const p of products) {
    try {
      await refreshProductMarketPrice(p);
      updated++;
    } catch {
      failed++;
    }
  }

  return { updated, failed, skipped: 0, total: products.length };
}

export function isMarketPriceFresh(scrapedAt: Date | string | null | undefined): boolean {
  if (!scrapedAt) return false;
  const ts = typeof scrapedAt === "string" ? new Date(scrapedAt).getTime() : scrapedAt.getTime();
  return Date.now() - ts < MARKET_PRICE_FRESH_MS;
}
