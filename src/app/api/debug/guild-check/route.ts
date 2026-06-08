import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getDiscordAccessToken, fetchUserGuilds } from "@/lib/discord-guilds";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const token = await getDiscordAccessToken(session.user.id);
  if (!token) return NextResponse.json({ error: "No Discord access token stored" }, { status: 400 });

  const guilds = await fetchUserGuilds(token);
  if (!guilds) {
    return NextResponse.json({ error: "Discord rejected the access token (likely expired)" }, { status: 502 });
  }

  const MANAGE_GUILD = BigInt(0x20);
  const summary = guilds.map((g) => ({
    id: g.id,
    name: g.name,
    owner: g.owner,
    hasManageGuild: (BigInt(g.permissions) & MANAGE_GUILD) === MANAGE_GUILD,
  }));

  return NextResponse.json({ userId: session.user.id, totalGuilds: guilds.length, guilds: summary });
}
