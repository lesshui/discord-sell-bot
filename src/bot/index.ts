import { Client, GatewayIntentBits, REST, Routes, SlashCommandBuilder } from "discord.js";

const token = process.env.DISCORD_BOT_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
const baseUrl = process.env.APP_BASE_URL ?? "http://localhost:3000";

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID are required.");
}

const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Start a Pokemon trading card instant-offer flow."),
  new SlashCommandBuilder()
    .setName("orders")
    .setDescription("Open your order dashboard.")
].map((command) => command.toJSON());

async function main() {
  const rest = new REST({ version: "10" }).setToken(token!);
  await rest.put(Routes.applicationGuildCommands(clientId!, guildId!), { body: commands });

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("interactionCreate", async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "sell") {
      await interaction.reply({
        content: `Start your Pokemon card submission here: ${baseUrl}/sell\nSign in with Discord, upload card photo URLs, receive an immediate offer, then accept terms and payout details.`,
        ephemeral: true
      });
    }

    if (interaction.commandName === "orders") {
      await interaction.reply({
        content: `Open the web app to view your seller orders: ${baseUrl}/sell`,
        ephemeral: true
      });
    }
  });

  client.once("ready", () => {
    console.log(`Discord seller bot logged in as ${client.user?.tag}`);
  });

  await client.login(token);
}

void main();
