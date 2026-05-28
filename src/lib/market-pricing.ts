// Fetches NM market prices from TCGPlayer and eBay.
// Returns null per source when env vars are absent or the lookup fails.
// Collectr does not expose a public API; add it here when available.

const OFFER_RATIO = 0.55; // we offer 55% of market NM value

export const CONDITION_MULTIPLIERS: Record<string, number> = {
  "Near Mint": 1.0,
  "Lightly Played": 0.82,
  "Moderately Played": 0.62,
  "Heavily Played": 0.38,
  Damaged: 0.18,
};

// ── TCGPlayer ─────────────────────────────────────────────────────────────────

async function getTCGPlayerToken(): Promise<string | null> {
  const pub = process.env.TCGPLAYER_PUBLIC_KEY;
  const priv = process.env.TCGPLAYER_PRIVATE_KEY;
  if (!pub || !priv) return null;

  const res = await fetch("https://api.tcgplayer.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=client_credentials&client_id=${encodeURIComponent(pub)}&client_secret=${encodeURIComponent(priv)}`,
    cache: "no-store",
  });
  if (!res.ok) return null;
  const { access_token } = (await res.json()) as { access_token: string };
  return access_token;
}

async function fetchTCGPlayerNmPrice(
  cardName: string,
  setName?: string | null,
): Promise<number | null> {
  try {
    const token = await getTCGPlayerToken();
    if (!token) return null;

    const q = new URLSearchParams({ categoryId: "3", productName: cardName, limit: "5" });
    if (setName) q.set("groupName", setName);

    const searchRes = await fetch(`https://api.tcgplayer.com/catalog/products?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!searchRes.ok) return null;

    const { results } = (await searchRes.json()) as {
      results: Array<{ productId: number }>;
    };
    const productId = results[0]?.productId;
    if (!productId) return null;

    const priceRes = await fetch(`https://api.tcgplayer.com/pricing/product/${productId}`, {
      headers: { Authorization: `Bearer ${token}` },
      next: { revalidate: 3600 },
    });
    if (!priceRes.ok) return null;

    const { results: prices } = (await priceRes.json()) as {
      results: Array<{ subTypeName: string; marketPrice: number | null; midPrice: number | null }>;
    };

    // TCGPlayer returns condition variants; prefer "Normal" (raw NM) market price
    const entry =
      prices.find((p) => p.subTypeName === "Normal") ??
      prices.find((p) => p.subTypeName === "Near Mint") ??
      prices[0];

    const price = entry?.marketPrice ?? entry?.midPrice;
    return price ? Math.round(price * 100) : null;
  } catch {
    return null;
  }
}

// ── eBay Finding API ──────────────────────────────────────────────────────────

async function fetchEbayRecentSalePrice(
  cardName: string,
  setName?: string | null,
): Promise<number | null> {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return null;

  try {
    const keywords = [cardName, setName, "pokemon card"].filter(Boolean).join(" ");
    const params = new URLSearchParams({
      "OPERATION-NAME": "findCompletedItems",
      "SERVICE-VERSION": "1.0.0",
      "SECURITY-APPNAME": appId,
      "RESPONSE-DATA-FORMAT": "JSON",
      keywords,
      "categoryId": "183454", // Pokemon Individual Cards
      "itemFilter(0).name": "SoldItemsOnly",
      "itemFilter(0).value": "true",
      "sortOrder": "EndTimeSoonest",
      "paginationInput.entriesPerPage": "10",
    });

    const res = await fetch(
      `https://svcs.ebay.com/services/search/FindingService/v1?${params}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) return null;

    const data = (await res.json()) as {
      findCompletedItemsResponse: Array<{
        searchResult: Array<{
          item?: Array<{
            sellingStatus: Array<{ currentPrice: Array<{ __value__: string }> }>;
          }>;
        }>;
      }>;
    };

    const items =
      data.findCompletedItemsResponse?.[0]?.searchResult?.[0]?.item ?? [];
    const prices = items
      .map((item) =>
        parseFloat(item.sellingStatus?.[0]?.currentPrice?.[0]?.__value__ ?? "0"),
      )
      .filter((p) => p > 0)
      .sort((a, b) => a - b);

    if (prices.length === 0) return null;
    // Median to avoid outliers
    return Math.round(prices[Math.floor(prices.length / 2)] * 100);
  } catch {
    return null;
  }
}

// ── Public interface ──────────────────────────────────────────────────────────

export async function fetchMarketNmPriceCents(params: {
  cardName: string;
  setName?: string | null;
  cardNumber?: string | null;
}): Promise<number | null> {
  const [tcg, ebay] = await Promise.all([
    fetchTCGPlayerNmPrice(params.cardName, params.setName),
    fetchEbayRecentSalePrice(params.cardName, params.setName),
  ]);

  if (tcg && ebay) return Math.round(tcg * 0.6 + ebay * 0.4); // TCGPlayer weighted higher
  return tcg ?? ebay ?? null;
}

// Converts a NM market price into our offer price for the given condition.
export function marketOfferCents(nmPriceCents: number, condition: string): number {
  const multiplier = CONDITION_MULTIPLIERS[condition] ?? 0.5;
  return Math.round(nmPriceCents * multiplier * OFFER_RATIO);
}
