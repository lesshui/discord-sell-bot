import {
  ChannelType,
  Client,
  GatewayIntentBits,
  OverwriteType,
  PermissionFlagsBits,
  TextChannel
} from "discord.js";

let clientPromise: Promise<Client<boolean>> | undefined;

export function getDiscordClient() {
  if (!process.env.DISCORD_BOT_TOKEN || !process.env.DISCORD_GUILD_ID) {
    return undefined;
  }

  clientPromise ??= new Promise((resolve, reject) => {
    const client = new Client({ intents: [GatewayIntentBits.Guilds] });
    client.once("ready", () => resolve(client));
    client.once("error", reject);
    void client.login(process.env.DISCORD_BOT_TOKEN);
  });

  return clientPromise;
}

export async function createOrderChannel(params: {
  orderId: string;
  sellerDiscordId?: string | null;
  sellerName?: string | null;
}) {
  const promise = getDiscordClient();
  if (!promise || !params.sellerDiscordId) return undefined;

  const client = await promise;
  const guild = await client.guilds.fetch(process.env.DISCORD_GUILD_ID!);
  const channelName = `sell-${(params.sellerName ?? "seller").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 18)}-${params.orderId.slice(0, 6)}`;

  const permissionOverwrites = [
    {
      id: guild.roles.everyone.id,
      deny: [PermissionFlagsBits.ViewChannel],
      type: OverwriteType.Role
    },
    {
      id: params.sellerDiscordId,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      type: OverwriteType.Member
    },
    {
      id: client.user!.id,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      type: OverwriteType.Member
    }
  ];

  if (process.env.DISCORD_ADMIN_ROLE_ID) {
    permissionOverwrites.push({
      id: process.env.DISCORD_ADMIN_ROLE_ID,
      allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      type: OverwriteType.Role
    });
  }

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: process.env.SELLER_CHANNEL_CATEGORY_ID || undefined,
    permissionOverwrites
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
