import { prisma } from "@/lib/prisma";

const MANAGE_GUILD = BigInt(0x20);

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

  const [guilds, activeServers] = await Promise.all([
    fetchUserGuilds(token),
    prisma.discordServer.findMany({
      where: { active: true },
      select: { id: true },
    }),
  ]);

  const activeIds = new Set(activeServers.map((s) => s.id));

  return guilds
    .filter((g) => activeIds.has(g.id))
    .map((g) => ({ id: g.id, name: g.name, icon: g.icon, role: guildRole(g) }))
    .filter((g) => g.role !== "none");
}
