import { prisma } from "@/lib/prisma";

const MANAGE_GUILD = BigInt(0x20);

export async function getBotGuildIds(): Promise<Set<string>> {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return new Set();
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bot ${botToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return new Set();
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

  const ownedGuildsWithBot = userGuilds.filter(
    (g) => g.owner && botGuildIds.has(g.id)
  );

  for (const guild of ownedGuildsWithBot) {
    await prisma.discordServer.upsert({
      where: { id: guild.id },
      update: { name: guild.name, iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null },
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

export async function getDiscordAccessToken(appUserId: string): Promise<string | null> {
  const account = await prisma.account.findFirst({
    where: { userId: appUserId, provider: "discord" },
    select: { access_token: true },
  });
  return account?.access_token ?? null;
}

export async function fetchUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bearer ${accessToken}` },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];
  return res.json() as Promise<DiscordGuild[]>;
}

function guildRole(guild: DiscordGuild): GuildRole {
  if (guild.owner) return "owner";
  if ((BigInt(guild.permissions) & MANAGE_GUILD) === MANAGE_GUILD) return "admin";
  return "none";
}

export async function getAccessibleBotServers(appUserId: string): Promise<UserGuild[]> {
  const token = await getDiscordAccessToken(appUserId);
  if (!token) return [];

  const [guilds, botGuildIds, activeServers] = await Promise.all([
    fetchUserGuilds(token),
    getBotGuildIds(),
    prisma.discordServer.findMany({ where: { active: true }, select: { id: true } }),
  ]);

  // Sync owned servers where the bot is present (single guild fetch, no duplicate API call)
  const ownedWithBot = guilds.filter((g) => g.owner && botGuildIds.has(g.id));
  for (const guild of ownedWithBot) {
    await prisma.discordServer.upsert({
      where: { id: guild.id },
      update: { name: guild.name, iconUrl: guild.icon ? `https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png` : null },
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

  return guilds
    .filter((g) => activeIds.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon, role: guildRole(g) }))
    .filter((g) => g.role !== "none");
}
