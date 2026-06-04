import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sets the seller's default destination server. New submissions route here, and
// any of the seller's still-pending submissions without a server are moved here
// too, so they immediately appear on that buyer's dashboard.
const schema = z.object({
  serverId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = schema.parse(await request.json());

  const server = await prisma.discordServer.findFirst({
    where: { id: body.serverId, active: true },
    select: { id: true },
  });
  if (!server) {
    return NextResponse.json({ error: "Server not found or inactive." }, { status: 404 });
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: session.user.id },
      data: { defaultSellServerId: server.id },
    }),
    prisma.order.updateMany({
      where: { sellerId: session.user.id, serverId: null, status: { in: ["DRAFT", "OFFERED"] } },
      data: { serverId: server.id },
    }),
  ]);

  return NextResponse.json({ ok: true, serverId: server.id });
}
