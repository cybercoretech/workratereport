# 🏆 The Workrate Report: Agent Handoff

The state of the project for the next agent (or person). Update it with every phase or significant change.

## 📍 Repository state (2026-10-16)

- **Repo:** `github.com/cybercore-tech/workratereport` (public) · local `~/Webdev/workrate-report`.
- **`main`:** an initial commit (`.gitignore` only), needed because the repo was empty. Phase 0 (brand + blueprint) arrives through PR #1 from `phase-0/brand-blueprint`.
- **No site code yet.** Phase 1 is next: Astro skeleton, match page, Match Guide, first 10 matches, pages.dev deploy.
- **Hosting target:** Cloudflare Pages, project `workrate-report` → `workrate-report.pages.dev`. Not connected yet; the user connects the repo in the Cloudflare dashboard once Phase 1 builds.

## ✅ Resume checklist

1. Read this file, `README.md`, then `BLUEPRINT.md` (§11 lists the open decisions).
2. `git status`, `git log --oneline -5`.
3. Before committing, `git config --show-scope --get user.email` must be `global  332800418+cybercore-tech@users.noreply.github.com`. Abort otherwise.
4. Work on a branch, one PR per phase, never stacked. The user merges.
5. Every change updates README, BLUEPRINT (if the plan changes), this file, and the vault note `~/Vaults/blackbox-notes/Projects/Workrate-Report.md`.

## 🧭 Decisions already made

- **Name:** The Workrate Report (chosen 2026-10-16 from four web-checked options. "Card Subject to Change" and "The Hard Cam" were already taken by wrestling shows).
- **Focus:** modern-first, with NWA/Crockett + WCW as the "Classic Vault" specialty. Other territories are supporting history.
- **Territory DNA** feature bridges the eras; MJF ↔ Flair is the flagship (user's idea).
- **Ratings:** 5-star scale, quarter stars, DUD and negatives, Meltzer's rating alongside.
- **Rating cap: 5 stars max** (Meltzer's 6s/7s still shown as he gave them).
- **Repo:** cybercore-tech/workratereport; branch + PR, user merges.
- **DNA launch pairs:** MJF ↔ Ric Flair, Cody Rhodes ↔ Dusty Rhodes.
- **Launch 10:** BLUEPRINT §6 approved as written.
- **Site structure:** every section = a hub page with highlights + several sub-pages; the homepage is a highlights reel of all sections (BLUEPRINT §2).
- **Hamburger + Pyro effects + Cybercore theme picker** (BLUEPRINT §12). References: NCV `store-nav.*`, `night-effects.*`, `neon-polish.*`; SigilWard `docs/app.js` theme engine. Registry is fetched cross-origin from cybercore-tech.github.io/data (CORS `*`).
- **Contact email:** info@cybercoretech.net (contact, copyright/takedown, footer).
- **Stack (recommended, user hasn't objected):** Astro static + Cloudflare Pages + Pagefind + lite-youtube.

## ❓ Still open

Body font (serif vs. sans; compare in Phase 1), connecting the Cloudflare Pages project, and approving the signature mashup names (§12.3, proposed only).

## ⚠️ Invariants / gotchas

- **Legal:** embed official YouTube uploads only; never link unofficial uploads. Don't scrape Cagematch (their terms forbid it); enter Meltzer ratings by hand with attribution.
- Anton has no `★` glyph. Draw stars as polygons (see `make_brand.py`), never type the character into outlined text.
- Every effect must respect `body.pyro`, `prefers-reduced-motion`, visibility pausing and fine-pointer gating (§12.2 rules).
- Brand SVGs are generated. Edit `brand/tools/make_brand.py` and regenerate, don't hand-edit the SVGs.
- Launch-10 match details in BLUEPRINT §6 are candidates. Verify dates and legal availability before publishing.

## 🔀 PR history

- **#1** Phase 0: brand assets, blueprint, README, handoff.
