import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      discordId?: string | null;
      isAdmin: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    appUserId?: string;
    discordId?: string | null;
    isAdmin?: boolean;
  }
}

export type OfferMode = "MANUAL_ADMIN" | "RULE_BASED" | "AI_ASSISTED" | "EXTERNAL_API";
export type OrderStatus =
  | "DRAFT" | "OFFERED" | "ACCEPTED" | "AWAITING_LABEL" | "LABEL_READY"
  | "SHIPPED" | "DELIVERED" | "INSPECTION_PENDING" | "APPROVED"
  | "CONDITION_MISMATCH" | "FAKE_COUNTERFEIT" | "MISSING_ITEM"
  | "NEEDS_SELLER_CONTACT" | "PAYOUT_PROMPTED" | "PAID" | "REJECTED";
export type PayoutMethod = "ZELLE" | "CRYPTO" | "PAYPAL" | "WIRE_ACH";
