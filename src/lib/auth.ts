import type { NextAuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "@/lib/prisma";

const adminDiscordIds = new Set(
  (process.env.ADMIN_DISCORD_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
);

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID ?? "",
      clientSecret: process.env.DISCORD_CLIENT_SECRET ?? "",
      authorization: { params: { scope: "identify email guilds" } }
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account?.provider === "discord" && account.providerAccountId) {
        const user = await prisma.user.upsert({
          where: { discordId: account.providerAccountId },
          update: {
            name: token.name,
            email: token.email,
            image: token.picture,
            isAdmin: adminDiscordIds.has(account.providerAccountId)
          },
          create: {
            discordId: account.providerAccountId,
            name: token.name,
            email: token.email,
            image: token.picture,
            isAdmin: adminDiscordIds.has(account.providerAccountId)
          }
        });

        token.appUserId = user.id;
        token.discordId = user.discordId;
        token.isAdmin = user.isAdmin;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.appUserId);
        session.user.discordId = typeof token.discordId === "string" ? token.discordId : null;
        session.user.isAdmin = Boolean(token.isAdmin);
      }

      return session;
    }
  }
};
