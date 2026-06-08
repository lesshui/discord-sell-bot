import { prisma } from "@/lib/prisma";

const MANAGE_GUILD = BigInt(0x20);

// Refresh ~60s before actual expiry so an in-flight render doesn't race the
// expiry boundary.
const REFRESH_SKEW_SECONDS = 60;

export type GuildFetchResult<T> =
  | { ok: true; value: T }
  | { ok: false; status: number };

export async function getBotGuildIds(): Promise<Set<string> | null> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return null;
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bot ${botToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  const guilds = (await res.json()) as { id: string }[];
  return new Set(guilds.map((g) => g.id));
}

export async function syncUserServers(appUserId: string): Promise<void> {
  const token = await getDiscordAccessToken(appUserId);
  if (!token) return;

  const [userGuilds, botGuildIds] = await Promise.all([
    fetchUserGuilds(token),
    getBotGuildIds(),
  ]);

  if (!userGuilds || !botGuildIds) return;

  const ownedGuildsWithBot = userGuilds.filter(
    (g) => g.owner && botGuildIds.has(g.id)
  );

  for (const guild of ownedGuildsWithBot) {
    await prisma.discordServer.upsert({
      where: { id: guild.id },
      // Keep the recorded owner in sync with the live Discord owner so order
      // authorization (by ownerId) matches what the dashboard shows (by live role).
      update: { name: guild.name, iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null, ownerId: appUserId },
      create: {
        id: guild.id,
        name: guild.name,
        iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        ownerId: appUserId,
        active: true,
      },
    });
  }
}

export type GuildRole = "owner" | "admin" | "none";

export interface UserGuild {
  id: string;
  name: string;
  icon: string | null;
  role: GuildRole;
}

interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
}

interface DiscordTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

async function refreshDiscordToken(refreshToken: string): Promise<DiscordTokenResponse | null> {
  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return (await res.json()) as DiscordTokenResponse;
}

export async function getDiscordAccessToken(appUserId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId: appUserId, provider: "discord" },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });
  if (!account) return null;

  const nowSeconds = Math.floor(Date.now() / 1000);
  const isFresh =
    account.access_token && account.expires_at && account.expires_at > nowSeconds + REFRESH_SKEW_SECONDS;
  if (isFresh) return account.access_token;

  // Expired (or about to expire) — try to refresh.
  if (account.refresh_token) {
    const refreshed = await refreshDiscordToken(account.refresh_token);
    if (refreshed) {
      await prisma.account.update({
        where: { id: account.id },
        data: {
          access_token: refreshed.access_token,
          refresh_token: refreshed.refresh_token,
          expires_at: nowSeconds + refreshed.expires_in,
        },
      });
      return refreshed.access_token;
    }
  }

  // Refresh failed or unavailable — hand back the stored token so the caller
  // can attempt the API and surface the real error if Discord rejects it.
  return account.access_token ?? null;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[] | null> {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return null;
  return res.json() as Promise<DiscordGuild[]>;
}

function guildRole(guild: DiscordGuild): GuildRole {
  if (guild.owner) return "owner";
  if ((BigInt(guild.permissions) & MANAGE_GUILD) === MANAGE_GUILD) return "admin";
  return "none";
}

// Servers a seller/buyer can route a submission INTO. Returns every active bot
// server in the DB so the picker works without per-user Discord OAuth (membership
// filtering can be layered on later). UI for picking one is wired separately.
export async function getSellableServers(
  _appUserId: string,
): Promise<{ id: string; name: string; iconUrl: string | null }[]> {
  return prisma.discordServer.findMany({
    where: { active: true },
    select: { id: true, name: true, iconUrl: true },
    orderBy: { name: "asc" },
  });
}

export type AccessibleServersResult =
  | { ok: true; servers: UserGuild[] }
  | { ok: false; reason: "no_token" | "discord_unavailable" };

export async function getAccessibleBotServers(appUserId: string): Promise<AccessibleServersResult> {
  const token = await getDiscordAccessToken(appUserId);
  if (!token) return { ok: false, reason: "no_token" };

  const [guilds, botGuildIds, activeServers] = await Promise.all([
    fetchUserGuilds(token),
    getBotGuildIds(),
    prisma.discordServer.findMany({ where: { active: true }, select: { id: true } }),
  ]);

  // A failed user-guilds fetch means we can't verify membership at all — better
  // to tell the user to re-auth than to silently render a 404.
  if (!guilds) return { ok: false, reason: "discord_unavailable" };

  // Sync owned servers where the bot is present (single guild fetch, no duplicate API call)
  const ownedWithBot = botGuildIds
    ? guilds.filter((g) => g.owner && botGuildIds.has(g.id))
    : [];
  for (const guild of ownedWithBot) {
    await prisma.discordServer.upsert({
      where: { id: guild.id },
      // Keep the recorded owner in sync with the live Discord owner so order
      // authorization (by ownerId) matches what the dashboard shows (by live role).
      update: { name: guild.name, iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null, ownerId: appUserId },
      create: {
        id: guild.id,
        name: guild.name,
        iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null,
        ownerId: appUserId,
        active: true,
      },
    });
  }

  const activeIds = new Set([
    ...activeServers.map((s) => s.id),
    ...ownedWithBot.map((g) => g.id),
  ]);

  const servers = guilds
    .filter((g) => activeIds.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon, role: guildRole(g) }))
    .filter((g) => g.role !== "none");

  return { ok: true, servers };
}
