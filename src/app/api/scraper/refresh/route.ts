import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { refreshAllMarketPrices } from "@/lib/market-price-cache";

// Admin-only. Refreshes cached market prices for active products.
// Pass { onlyMissingManualPrice: true } to limit to products without a manual bid.
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const onlyMissingManualPrice = Boolean(body?.onlyMissingManualPrice);

  const summary = await refreshAllMarketPrices({ onlyMissingManualPrice });
  return NextResponse.json({ summary });
}
