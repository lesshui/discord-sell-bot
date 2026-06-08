import {
  ChannelType,
  Client,
  GatewayIntentBits,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel,
} from "discord.js";
import { prisma } from "@/lib/prisma";

let clientPromise: Promise<Client<boolean>> | undefined;

// Single shared bot login. The guild a call targets is passed per-request now
// (orders/tickets are multi-guild via DiscordServer.id), so the only env we
// require is the token. The legacy DISCORD_GUILD_ID is still honored as a
// fallback for callers that don't pass an explicit guild.
export function getDiscordClient() {
  if (!process.env.DISCORD_BOT_TOKEN) return undefined;

  clientPromise ??= new Promise((resolve, reject) => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.once("ready", () => resolve(client));
    client.once("error", reject);
    void client.login(process.env.DISCORD_BOT_TOKEN);
  });

  return clientPromise;
}

function resolveGuildId(explicit?: string | null): string | undefined {
  return explicit ?? process.env.DISCORD_GUILD_ID ?? undefined;
}

export async function createOrderChannel(params: {
  orderId: string;
  guildId?: string | null;
  sellerDiscordId?: string | null;
  sellerName?: string | null;
}) {
  const promise = getDiscordClient();
  const guildId = resolveGuildId(params.guildId);
  if (!promise || !params.sellerDiscordId || !guildId) return undefined;

  const client = await promise;
  const guild = await client.guilds.fetch(guildId);
  const channelName = `sell-${(params.sellerName ?? "seller").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18)}-${params.orderId.slice(0, 6)}`;

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role,
    },
    {
      id: params.sellerDiscordId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      type: OverwriteType.Member,
    },
    {
      id: client.user!.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      type: OverwriteType.Member,
    },
  ];

  if (process.env.DISCORD_ADMIN_ROLE_ID) {
    permissionOverwrites.push({
      id: process.env.DISCORD_ADMIN_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      type: OverwriteType.Role,
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: process.env.SELLER_CHANNEL_CATEGORY_ID || undefined,
    permissionOverwrites,
  });

  if (channel instanceof TextChannel) {
    await channel.send(`Order ${params.orderId} created. This private channel will receive seller, admin, and bot updates.`);
  }

  return channel.id;
}

export async function sendOrderUpdate(channelId: string | null | undefined, message: string) {
  const promise = getDiscordClient();
  if (!promise || !channelId) return;

  const client = await promise;
  const channel = await client.channels.fetch(channelId);

  if (channel?.isTextBased() && "send" in channel) {
    await (channel as TextChannel).send(message);
  }
}

// ── tickets ───────────────────────────────────────────────────────────────────

export const TICKET_REASONS = [
  "CONDITION_MISMATCH",
  "FAKE_COUNTERFEIT",
  "MISSING_ITEM",
  "NEEDS_SELLER_CONTACT",
  "OTHER",
] as const;
export type TicketReason = (typeof TICKET_REASONS)[number];

const REASON_LABEL: Record<TicketReason, string> = {
  CONDITION_MISMATCH: "Condition mismatch",
  FAKE_COUNTERFEIT: "Counterfeit / authenticity",
  MISSING_ITEM: "Missing item",
  NEEDS_SELLER_CONTACT: "Needs seller contact",
  OTHER: "Other issue",
};

export function ticketReasonLabel(reason: string): string {
  return (REASON_LABEL as Record<string, string>)[reason] ?? reason.replace(/_/g, " ");
}

function ticketChannelName(number: number): string {
  return `ticket-${String(number).padStart(4, "0")}`;
}

// Open a new ticket for an order. Idempotent: if an OPEN ticket already exists
// it returns that one instead of opening a duplicate, so admins flipping order
// statuses repeatedly don't spawn multiple channels.
export async function openTicket(params: {
  orderId: string;
  reason: TicketReason;
  notes?: string | null;
  openedById?: string | null;
}) {
  const order = await prisma.order.findUniqueOrThrow({
    where: { id: params.orderId },
    include: {
      seller: { select: { discordId: true, name: true, id: true } },
      server: { select: { id: true, ownerId: true } },
    },
  });

  const existingOpen = await prisma.ticket.findFirst({
    where: { orderId: order.id, status: "OPEN" },
  });
  if (existingOpen) return existingOpen;

  const ticket = await prisma.ticket.create({
    data: {
      orderId: order.id,
      reason: params.reason,
      notes: params.notes ?? null,
      openedById: params.openedById ?? null,
    },
  });

  const promise = getDiscordClient();
  const guildId = resolveGuildId(order.serverId);
  if (!promise || !guildId) return ticket;

  const client = await promise;
  const guild = await client.guilds.fetch(guildId);

  const ownerDiscordId = order.server
    ? (
        await prisma.user.findUnique({
          where: { id: order.server.ownerId },
          select: { discordId: true },
        })
      )?.discordId ?? null
    : null;

  const permissionOverwrites: Array<{
    id: string;
    allow?: bigint[];
    deny?: bigint[];
    type: OverwriteType;
  }> = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role,
    },
    {
      id: client.user!.id,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ManageChannels,
      ],
      type: OverwriteType.Member,
    },
  ];

  if (order.seller.discordId) {
    permissionOverwrites.push({
      id: order.seller.discordId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      type: OverwriteType.Member,
    });
  }

  if (ownerDiscordId) {
    permissionOverwrites.push({
      id: ownerDiscordId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      type: OverwriteType.Member,
    });
  }

  if (process.env.DISCORD_ADMIN_ROLE_ID) {
    permissionOverwrites.push({
      id: process.env.DISCORD_ADMIN_ROLE_ID,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
      ],
      type: OverwriteType.Role,
    });
  }

  const channel = await guild.channels.create({
    name: ticketChannelName(ticket.number),
    type: ChannelType.GuildText,
    parent: process.env.SUPPORT_TICKET_CATEGORY_ID || process.env.SELLER_CHANNEL_CATEGORY_ID || undefined,
    permissionOverwrites,
  });

  const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";
  const sellerPing = order.seller.discordId ? `<@${order.seller.discordId}>` : `seller`;
  const buyerPing = ownerDiscordId ? `<@${ownerDiscordId}>` : `buyer`;
  const adminPing = process.env.DISCORD_ADMIN_ROLE_ID ? `<@&${process.env.DISCORD_ADMIN_ROLE_ID}>` : null;

  const lines = [
    `**Ticket #${String(ticket.number).padStart(4, "0")} — Order \`${order.id}\`**`,
    `Issue: **${ticketReasonLabel(params.reason)}**`,
  ];
  if (params.notes && params.notes.trim()) {
    lines.push(`Notes: ${params.notes.trim()}`);
  }
  lines.push(`Seller: ${sellerPing}  •  Buyer: ${buyerPing}${adminPing ? `  •  ${adminPing}` : ""}`);
  lines.push(`[View order](${baseUrl}/orders/${order.id}) — discuss below. An admin will close this when resolved.`);

  if (channel instanceof TextChannel) {
    await channel.send(lines.join("\n"));
  }

  return prisma.ticket.update({
    where: { id: ticket.id },
    data: { channelId: channel.id },
  });
}

export async function closeTicket(params: {
  ticketId?: string;
  channelId?: string;
  closedById?: string | null;
}) {
  const ticket = params.ticketId
    ? await prisma.ticket.findUnique({ where: { id: params.ticketId } })
    : params.channelId
    ? await prisma.ticket.findFirst({ where: { channelId: params.channelId } })
    : null;

  if (!ticket || ticket.status === "CLOSED") return ticket;

  const updated = await prisma.ticket.update({
    where: { id: ticket.id },
    data: { status: "CLOSED", closedAt: new Date() },
  });

  if (ticket.channelId) {
    await sendOrderUpdate(
      ticket.channelId,
      `🔒 Ticket #${String(ticket.number).padStart(4, "0")} closed. Channel will remain for record.`,
    );
  }

  return updated;
}
