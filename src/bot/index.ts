import {
  ActionRowBuilder,
  Client,
  ComponentType,
  GatewayIntentBits,
  ModalBuilder,
  PermissionFlagsBits,
  REST,
  Routes,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  TextInputStyle,
} from "discord.js";
import { prisma } from "@/lib/prisma";
import { calculateOfferCents } from "@/lib/pricing";

const token     = process.env.DISCORD_BOT_TOKEN;
const clientId  = process.env.DISCORD_CLIENT_ID;
const guildId   = process.env.DISCORD_GUILD_ID;
const baseUrl   = process.env.APP_BASE_URL ?? "http://localhost:3000";

if (!token || !clientId || !guildId) {
  throw new Error("DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, and DISCORD_GUILD_ID are required.");
}

// ── helpers ────────────────────────────────────────────────────────────────────

async function buildCatalogReply(): Promise<string> {
  const products = await prisma.product.findMany({
    where: { active: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  if (products.length === 0) return "No products in the catalog yet — check back soon.";

  const byCategory: Record<string, typeof products> = {};
  for (const p of products) {
    (byCategory[p.category] ??= []).push(p);
  }

  const lines: string[] = ["**📋 Buy List — Instant Offers**\n"];
  for (const [category, items] of Object.entries(byCategory)) {
    lines.push(`**${category}**`);
    for (const p of items) {
      const nmCents = Math.round(p.baseOfferCents * 1.0);
      const dollars = (nmCents / 100).toFixed(2);
      const label = p.setName ? `${p.name} *(${p.setName})*` : p.name;
      lines.push(`• ${label} — NM **$${dollars}**`);
    }
    lines.push("");
  }

  const msg = lines.join("\n");
  if (msg.length > 1900) {
    return msg.slice(0, 1900) + `\n…and more → ${baseUrl}/prices`;
  }
  return msg + `${baseUrl}/prices`;
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function modal(customId: string, title: string, fields: Array<{
  id: string; label: string; style: TextInputStyle; placeholder?: string; required?: boolean; value?: string;
}>) {
  const t = ComponentType.TextInput;
  const a = ComponentType.ActionRow;
  return new ModalBuilder({
    customId,
    title,
    components: fields.map((f) => ({
      type: a,
      components: [{
        type: t,
        custom_id: f.id,
        label: f.label,
        style: f.style,
        placeholder: f.placeholder,
        required: f.required ?? true,
        value: f.value,
      }],
    })),
  });
}

// ── commands ───────────────────────────────────────────────────────────────────

const commands = [
  new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Submit a Pokemon TCG product for an instant offer."),

  new SlashCommandBuilder()
    .setName("orders")
    .setDescription("Open your seller order dashboard."),

  new SlashCommandBuilder()
    .setName("prices")
    .setDescription("See all products we buy and their current offer prices."),

  new SlashCommandBuilder()
    .setName("products")
    .setDescription("See all products we buy and their current offer prices."),

  new SlashCommandBuilder()
    .setName("add")
    .setDescription("Add a new product to the buy list (requires Manage Server).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  new SlashCommandBuilder()
    .setName("update")
    .setDescription("Update or remove a catalog product (requires Manage Server).")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("price")
        .setDescription("Update a product's base offer price.")
        .addStringOption((opt) =>
          opt.setName("product").setDescription("Product to update").setRequired(true).setAutocomplete(true)
        )
        .addStringOption((opt) =>
          opt.setName("price").setDescription("New base offer price in dollars (e.g. 45.00)").setRequired(true)
        )
    )
    .addSubcommand((sub) =>
      sub
        .setName("remove")
        .setDescription("Remove a product from the buy list.")
        .addStringOption((opt) =>
          opt.setName("product").setDescription("Product to remove").setRequired(true).setAutocomplete(true)
        )
    ),
].map((c) => c.toJSON());

// ── main ───────────────────────────────────────────────────────────────────────

async function main() {
  const rest = new REST({ version: "10" }).setToken(token!);
  await rest.put(Routes.applicationGuildCommands(clientId!, guildId!), { body: commands });

  const client = new Client({ intents: [GatewayIntentBits.Guilds] });

  client.on("interactionCreate", async (interaction) => {

    // ── autocomplete (product search for /update price + remove) ──────────────
    if (interaction.isAutocomplete()) {
      const focused = interaction.options.getFocused().toLowerCase();
      const products: Array<{ id: string; name: string; setName: string | null }> = await prisma.product.findMany({
        where: { active: true },
        select: { id: true, name: true, setName: true },
        orderBy: { name: "asc" },
        take: 25,
      });
      const filtered = products
        .filter((p) => p.name.toLowerCase().includes(focused) || (p.setName ?? "").toLowerCase().includes(focused))
        .slice(0, 25)
        .map((p) => ({ name: `${p.name}${p.setName ? ` (${p.setName})` : ""}`, value: p.id }));
      await interaction.respond(filtered);
      return;
    }

    // ── /sell ─────────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === "sell") {
      const user = await prisma.user.findFirst({ where: { discordId: interaction.user.id } });
      if (!user) {
        await interaction.reply({ content: `**Sign in first** to link your account:\n${baseUrl}`, ephemeral: true });
        return;
      }

      const catalogProducts = await prisma.product.findMany({
        where: { active: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        take: 24,
      });

      const options: { label: string; description: string; value: string }[] = [
        ...catalogProducts.map((p) => ({
          label: p.name.slice(0, 100),
          description: (p.setName ?? p.category).slice(0, 100),
          value: p.id,
        })),
        { label: "Product not listed", description: "Submit for manual review", value: "not_listed" },
      ];

      const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("sell_product_select")
          .setPlaceholder("Select a product…")
          .addOptions(options),
      );

      await interaction.reply({ content: "**What would you like to sell?**", components: [row], ephemeral: true });
      return;
    }

    // ── /orders ───────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === "orders") {
      await interaction.reply({ content: `View your orders: ${baseUrl}/dashboard`, ephemeral: true });
      return;
    }

    // ── /prices + /products ───────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && (interaction.commandName === "prices" || interaction.commandName === "products")) {
      await interaction.deferReply({ ephemeral: true });
      const content = await buildCatalogReply();
      await interaction.editReply(content);
      return;
    }

    // ── /add ─────────────────────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === "add") {
      await interaction.showModal(modal("add_modal", "Add Product to Buy List", [
        { id: "name",  label: "Product name",        style: TextInputStyle.Short, placeholder: "e.g. First Partner, Ascending heroes Booster Bundle" },
        { id: "price", label: "Base unit price ($)", style: TextInputStyle.Short, placeholder: "e.g. 45.00" },
      ]));
      return;
    }

    // ── /update price + remove ────────────────────────────────────────────────
    if (interaction.isChatInputCommand() && interaction.commandName === "update") {
      const sub = interaction.options.getSubcommand();

      if (sub === "price") {
        await interaction.deferReply({ ephemeral: true });
        const productId = interaction.options.getString("product", true);
        const priceRaw  = interaction.options.getString("price", true);
        const priceCents = Math.round(parseFloat(priceRaw) * 100);

        if (isNaN(priceCents) || priceCents <= 0) {
          await interaction.editReply("Invalid price. Use a dollar amount like `45.00`.");
          return;
        }

        const product = await prisma.product.update({
          where: { id: productId },
          data:  { baseOfferCents: priceCents },
        });
        await interaction.editReply(
          `✅ **${product.name}** base offer updated to **$${(priceCents / 100).toFixed(2)}**\nView buy list: ${baseUrl}/prices`,
        );
        return;
      }

      if (sub === "remove") {
        await interaction.deferReply({ ephemeral: true });
        const productId = interaction.options.getString("product", true);
        const product = await prisma.product.findUnique({ where: { id: productId } });

        if (!product) {
          await interaction.editReply("Product not found.");
          return;
        }

        await prisma.product.update({ where: { id: productId }, data: { active: false } });
        await interaction.editReply(
          `🗑️ **${product.name}** removed from the buy list.\nTo restore it, use the web admin panel: ${baseUrl}/admin`,
        );
        return;
      }
    }

    // ── add_modal submit ───────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === "add_modal") {
      await interaction.deferReply({ ephemeral: true });

      const name     = interaction.fields.getTextInputValue("name").trim();
      const priceRaw = interaction.fields.getTextInputValue("price").trim();

      const priceCents = Math.round(parseFloat(priceRaw) * 100);
      if (isNaN(priceCents) || priceCents <= 0) {
        await interaction.editReply("Invalid price. Use a dollar amount like `45.00`.");
        return;
      }

      const baseSku = slugify(name);
      const existing = await prisma.product.findUnique({ where: { sku: baseSku } });
      const sku = existing ? `${baseSku}-${Date.now()}` : baseSku;

      const product = await prisma.product.create({
        data: { sku, name, category: "Products", baseOfferCents: priceCents, active: true },
      });

      await interaction.editReply(
        `✅ Added **${product.name}** (${product.category}) to the buy list — base offer **$${(priceCents / 100).toFixed(2)}**\nView buy list: ${baseUrl}/prices`,
      );
      return;
    }

    // ── sell_product_select ───────────────────────────────────────────────────
    if (interaction.isStringSelectMenu() && interaction.customId === "sell_product_select") {
      const value = interaction.values[0];

      if (value === "not_listed") {
        await interaction.showModal(modal("sell_custom_modal", "Describe Your Product", [
          { id: "product_name", label: "Product name", style: TextInputStyle.Short, placeholder: "e.g. Charizard ex, SV Booster Box" },
          { id: "details", label: "Details (set, condition, grade, etc.)", style: TextInputStyle.Paragraph, placeholder: "Any extra info to help us identify it…", required: false },
        ]));
        return;
      }

      const product = await prisma.product.findUnique({ where: { id: value } });
      if (!product) {
        await interaction.update({ content: "Product not found.", components: [] });
        return;
      }

      const config = await prisma.appConfig.upsert({ where: { id: "singleton" }, update: {}, create: { id: "singleton" } });
      const offerCents = calculateOfferCents(config, { product, condition: "Near Mint", quantity: 1 });

      await interaction.update({
        content: [
          `🎴 **${product.name}**`,
          `Near Mint offer: **$${(offerCents / 100).toFixed(2)}**`,
          ``,
          `**[Complete your submission →](<${baseUrl}/sell?productId=${product.id}>)**`,
        ].join("\n"),
        components: [],
      });
      return;
    }

    // ── sell_custom_modal submit ──────────────────────────────────────────────
    if (interaction.isModalSubmit() && interaction.customId === "sell_custom_modal") {
      const productName = interaction.fields.getTextInputValue("product_name").trim();
      await interaction.reply({
        content: [
          `📋 **${productName}** isn't in our catalog — submit it for manual review and we'll respond with an offer within 24 hours.`,
          ``,
          `**[Submit for review →](<${baseUrl}/sell>)**`,
        ].join("\n"),
        ephemeral: true,
      });
      return;
    }
  });

  client.once("ready", () => console.log(`Bot ready: ${client.user?.tag}`));
  await client.login(token);
}

void main();
