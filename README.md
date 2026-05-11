# discord-sell-bot

A Discord-integrated Pokemon trading card instant-offer MVP inspired by Tradepost-style buyback flows.

## MVP capabilities

- Discord OAuth-only seller authentication.
- Discord bot `/sell` command that links sellers into the web intake flow.
- Pokemon card seller intake with product selection, condition, quantity, descriptions, and required photo URLs.
- Admin-controlled offer strategy toggles:
  - manual admin pricing
  - rule-based pricing
  - AI-assisted placeholder
  - external API placeholder
- Immediate offer generation with shipping-label deduction shown before acceptance.
- Terms of service and shipping instructions shown before acceptance.
- Seller payout method capture for Zelle, crypto, PayPal, and wire/ACH.
- Admin dashboard for offer mode toggles, label fee, terms, shipping instructions, and order status updates.
- Manual shipping label URL upload for MVP.
- Inspection status outcomes: approved, condition mismatch, fake/counterfeit, missing item, and needs seller contact.
- Discord private order channel creation for seller + admin role + bot updates when Discord environment variables are configured.

## Setup

1. Copy `.env.example` to `.env` and fill in Discord OAuth/bot values.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Push the database schema and seed Pokemon cards:
   ```bash
   npm run db:push
   npm run db:seed
   ```
4. Start the web app:
   ```bash
   npm run dev
   ```
5. In another terminal, start/register the Discord bot commands:
   ```bash
   npm run bot:dev
   ```

## Admin access

Set `ADMIN_DISCORD_IDS` in `.env` to a comma-separated list of Discord user IDs that should be marked as admins on sign-in.

## Notes

Shipping labels are manual for the MVP. Payout automation is intentionally inspection-gated: payout is prompted after both delivery and admin approval.
