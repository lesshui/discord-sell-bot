import { NextResponse } from "next/server";

export async function GET() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  if (!botToken) return NextResponse.json({ error: "No bot token" }, { status: 400 });

  const res = await fetch("https://discord.com/api/users/@me/guilds", {
    headers: { Authorization: `Bot ${botToken}` },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: `Discord API error ${res.status}`, body: text }, { status: 502 });
  }

  const guilds = await res.json() as { id: string; name: string }[];
  return NextResponse.json({ total: guilds.length, guilds });
}
