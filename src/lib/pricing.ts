import type { AppConfig, OfferMode, Product } from "@prisma/client";

const conditionMultipliers: Record<string, number> = {
  "Near Mint": 1,
  "Lightly Played": 0.82,
  "Moderately Played": 0.62,
  "Heavily Played": 0.38,
  Damaged: 0.18
};

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
  const mode = input.requestedMode && modes.includes(input.requestedMode) ? input.requestedMode : modes[0] ?? "RULE_BASED";
  const base = input.product?.baseOfferCents ?? 500;
  const multiplier = conditionMultipliers[input.condition] ?? 0.5;
  const quantity = Math.max(1, input.quantity || 1);

  if (mode === "MANUAL_ADMIN") return base * quantity;
  if (mode === "RULE_BASED") return Math.round(base * multiplier * quantity);

  // MVP-safe placeholders: enabled toggles route to review-biased offers until real AI/API integrations are added.
  if (mode === "AI_ASSISTED") return Math.round(base * multiplier * quantity * 0.95);
  if (mode === "EXTERNAL_API") return Math.round(base * multiplier * quantity * 0.9);

  return Math.round(base * multiplier * quantity);
}
