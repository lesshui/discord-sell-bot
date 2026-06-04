# Discord Sell Bot — Claude Code Handoff

## Project Overview
A Discord-integrated Pokemon card selling bot with seller/buyer dashboards, order management, and COB design system.

**Tech stack:** Next.js 15 (App Router), TypeScript, Prisma ORM, Discord.js, NextAuth.js, shadcn/ui

---

## Current State

### Completed
- ✅ **Order page redesign** — COB design system, fixed brand, decline → drafts flow with 3-day resubmit window
- ✅ **Dashboard redesign** — stats strip, tabbed orders grid, drafts with expiry badges
- ✅ **Decline/resubmit flow** — API routes + Discord bot notification
- ✅ **Build fix** — `zlib-sync` dependency added via `serverExternalPackages`
- ✅ **PR #2 open** — Full UI redesign awaiting merge into `main`

---

## Next: Card Scraper → Sell Dashboard

### Requirement
**For now, the scraper should populate the seller dashboard with card items.** Later, allow manual adds via the sell form.

### Workflow

#### Phase 1: Scraper Integration (Current)
1. **Create scraper module** — `src/lib/scraper.ts`
   - Fetch card data from external source (TCGPlayer API, PokellectorDB, etc.)
   - Parse & deduplicate results
   - Return standardized card objects: `{ name, set, cardNumber, image }`

2. **Wire scraper to dashboard**
   - Seller visits `/dashboard` → scraper checks for recent import/refresh
   - Display cards in a new "Available" or "Pending" section
   - UI controls: "Add to draft" (→ `/sell` prefilled) or "Skip"

3. **Store scraped items in DB**
   - Add `ScrapedCard` model to Prisma schema
   - Track: `id`, `userId`, `name`, `set`, `cardNumber`, `imageUrl`, `scrapedAt`, `status` (pending/added/skipped)

#### Phase 2: Manual Adds (Future)
- Allow sellers to add cards manually via `/sell` form
- UI distinction: scraped cards vs. manual cards in dashboard
- Bulk actions: "Add all", "Clear all", etc.

### Key Files to Touch
- `prisma/schema.prisma` — add `ScrapedCard` model + relationship to `User`
- `src/lib/scraper.ts` — new scraper module
- `src/app/api/scraper/refresh/route.ts` — trigger scraper (POST)
- `src/components/DashboardClient.tsx` — add "Available cards" section
- `src/app/dashboard/page.tsx` — fetch scraped cards, pass to client

### Edge Cases
- Duplicate detection (same card already in drafts/active orders)
- Rate limiting (external API calls)
- Image caching (store URLs, not files)
- User choice persistence (skip a card for 30 days)

---

## Design Notes

### Color Palette & Typography
- **Background**: `#fbfbfa` (warm off-white)
- **Primary text**: `#0f1419` (dark ink)
- **Accent red**: `#E04A3B` (errors, emphasis)
- **Status colors**:
  - Purple: `#5457d9` (offer ready)
  - Amber: `#a87718` (pending)
  - Green: `#17834f` (paid)
  - Red: `#c0392b` (rejected)
- **Fonts**: Geist (sans-serif), JetBrains Mono (labels/meta)

### Layout
- Max-width: `1280px`, centered
- Padding: `48px` desktop, `24px` mobile
- Full-bleed background: `width: 100vw; margin-left: calc(50% - 50vw);`
- Fixed UI anchors: brand top-left, CTAs top-right

---

## Git & Contributions

- **Main branch**: `main` (default)
- **Feature branch**: `claude/review-code-for-main-O1Yli`
- **PR #2 open**: awaiting merge of dashboard + decline/resubmit redesign
- **Commit author**: Set `git config user.email` to match GitHub verified email for contributions to count

---

## Handoff Checklist

When passing to Claude Code:
- [ ] Clarify scraper data source (TCG API, web scrape, etc.)
- [ ] Confirm Prisma schema additions
- [ ] Test scraper with live data before adding to dashboard
- [ ] Ensure no duplicate cards shown
- [ ] Add loading state to dashboard during scraper refresh
