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
