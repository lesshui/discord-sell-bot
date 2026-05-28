import type { AppConfig, Product } from "@prisma/client";
import type { OfferMode } from "@/types";

// Single card conditions
// Sealed product conditions (box, pack, ETB, tin)
// Graded slab conditions (PSA, BGS, CGC)
export const conditionMultipliers: Record<string, number> = {
  // Single cards
  "Near Mint": 1.0,
  "Lightly Played": 0.82,
  "Moderately Played": 0.62,
  "Heavily Played": 0.38,
  "Damaged": 0.18,
  // Sealed products
  "Factory Sealed": 1.0,
  "Near Mint Packaging": 0.85,
  "Damaged Packaging": 0.55,
  // Graded slabs
  "PSA 10": 2.5,
  "PSA 9": 1.4,
  "PSA 8": 0.9,
  "PSA 7": 0.65,
  "PSA 6": 0.5,
  "BGS 10 (Pristine)": 3.0,
  "BGS 9.5": 2.0,
  "BGS 9": 1.3,
  "BGS 8.5": 0.85,
  "CGC 10": 2.0,
  "CGC 9.5": 1.5,
  "CGC 9": 1.0,
  "CGC 8.5": 0.8,
};

export const PRODUCT_CATEGORIES = [
  "Products",
  "Graded Card",
  "Sealed Booster Pack",
  "Sealed Booster Box",
  "Elite Trainer Box",
  "Collection / Tin",
  "Other",
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export const CONDITIONS_BY_CATEGORY: Record<string, string[]> = {
  "Products": ["Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"],
  "Graded Card": [
    "PSA 10", "PSA 9", "PSA 8", "PSA 7", "PSA 6",
    "BGS 10 (Pristine)", "BGS 9.5", "BGS 9", "BGS 8.5",
    "CGC 10", "CGC 9.5", "CGC 9", "CGC 8.5",
  ],
  "Sealed Booster Pack": ["Factory Sealed", "Near Mint Packaging", "Damaged Packaging"],
  "Sealed Booster Box": ["Factory Sealed", "Near Mint Packaging", "Damaged Packaging"],
  "Elite Trainer Box": ["Factory Sealed", "Near Mint Packaging", "Damaged Packaging"],
  "Collection / Tin": ["Factory Sealed", "Near Mint Packaging", "Damaged Packaging"],
  "Other": ["Near Mint", "Lightly Played", "Moderately Played", "Heavily Played", "Damaged"],
};

export function getConditionsForCategory(category: string): string[] {
  return CONDITIONS_BY_CATEGORY[category] ?? CONDITIONS_BY_CATEGORY["Products"];
}

export type OfferInput = {
  product?: Product | null;
  customCardName?: string;
  condition: string;
  quantity: number;
  requestedMode?: OfferMode;
};

export function enabledOfferModes(config: AppConfig): OfferMode[] {
  const modes: OfferMode[] = [];
  if (config.manualAdminPricing) modes.push("MANUAL_ADMIN");
  if (config.ruleBasedPricing) modes.push("RULE_BASED");
  if (config.aiAssistedPricing) modes.push("AI_ASSISTED");
  if (config.externalApiPricing) modes.push("EXTERNAL_API");
  return modes;
}

export function calculateOfferCents(config: AppConfig, input: OfferInput) {
  const modes = enabledOfferModes(config);
  const mode =
    input.requestedMode && modes.includes(input.requestedMode)
      ? input.requestedMode
      : modes[0] ?? "RULE_BASED";
  const base = input.product?.baseOfferCents ?? 500;
  const multiplier = conditionMultipliers[input.condition] ?? 0.5;
  const quantity = Math.max(1, input.quantity || 1);

  if (mode === "MANUAL_ADMIN") return base * quantity;
  if (mode === "RULE_BASED") return Math.round(base * multiplier * quantity);
  if (mode === "AI_ASSISTED") return Math.round(base * multiplier * quantity * 0.95);
  if (mode === "EXTERNAL_API") return Math.round(base * multiplier * quantity * 0.9);
  return Math.round(base * multiplier * quantity);
}
