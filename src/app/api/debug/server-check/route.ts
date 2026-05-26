import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDiscordAccessToken, fetchUserGuilds } from "@/lib/discord-guilds";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const appUserId = session.user.id;
  const token = await getDiscordAccessToken(appUserId);
  if (!token) return NextResponse.json({ step: "get_token", error: "No Discord access token" });

  const [guilds, activeServers] = await Promise.all([
    fetchUserGuilds(token),
    prisma.discordServer.findMany({ where: { active: true }, select: { id: true, name: true } }),
  ]);

  const activeIds = new Set(activeServers.map((s) => s.id));
  const matched = guilds.filter((g) => activeIds.has(g.id));

  return NextResponse.json({
    appUserId,
    discordGuildsTotal: guilds.length,
    dbActiveServers: activeServers,
    matchedGuilds: matched,
  });
}
