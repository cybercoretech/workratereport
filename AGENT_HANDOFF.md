# 🏆 The Workrate Report: Agent Handoff

The state of the project for the next agent (or person). Update it with every phase or significant change.

## 📍 Repository state (2026-10-16)

- **Repo:** `github.com/cybercore-tech/workratereport` (public) · local `~/Webdev/workrate-report`.
- **`main`:** `d9e8be1`, the merge of PR #1 (Phase 0: brand + blueprint).
- **Phase 1 (Astro skeleton)** is on branch `phase-1/skeleton` → PR #2. It builds 83 pages; `npm run check` is clean.
- **Hosting:** Cloudflare Pages project `workrate-report` → `workrate-report.pages.dev`. **Not connected yet.** The user connects the repo in the Cloudflare dashboard (settings in README "Deploying"). Never hand-deploy without asking.
- **CI:** `.github/workflows/build.yml` runs `npm ci`, `npm run check` and `npm run build` on PRs and pushes to main.

## ✅ Resume checklist

1. Read this file, `README.md`, then `BLUEPRINT.md` (§11 decisions, §12 nav/effects/themes).
2. `git status`, `git log --oneline -5`; check PRs with `GH_TOKEN=$(gh auth token -u cybercore-tech) gh pr list -R cybercore-tech/workratereport`.
3. `npm install && npm run check && npm run build` before changing anything.
4. Before committing, `git config --show-scope --get user.email` must be `global  332800418+cybercore-tech@users.noreply.github.com`. Abort otherwise.
5. Work on a branch, one PR per phase, never stacked. The user merges. **Open PRs with the explicit `GH_TOKEN=$(gh auth token -u cybercore-tech)` prefix:** plain `gh pr create -R ...` picked the darkstardevx token and failed ("must be a collaborator").
6. Every change updates README, BLUEPRINT (if the plan changes), this file, the Wiki page `~/Wiki/src/web/workrate-report.md`, and the vault note `~/Vaults/blackbox-notes/Projects/Workrate-Report.md`.

## 🧭 Decisions already made

- **Name:** The Workrate Report. "Card Subject to Change" and "The Hard Cam" were taken.
- **Focus:** modern-first; the Classic Vault = NWA/Crockett, WCW **and WWF** (user, 2026-10-16: "we definitely need to add WWF / WWE as well"). Modern WWE sits in the modern section. Territories are supporting history.
- **Ratings:** 5-star scale, quarter stars, DUD and negatives. **5 is the max**, enforced in `src/content.config.ts`. Meltzer's go past 5 and show as "+1" / "6★".
- **Site structure:** every section = a hub with highlights + sub-pages; the homepage = a highlights reel.
- **Hamburger + Pyro effects + Cybercore theme picker** (BLUEPRINT §12). References: NCV `store-nav.*`, `night-effects.*`, `neon-polish.*`; SigilWard `docs/app.js`.
- **Mashup names approved** (2026-10-16): Ten Pounds of Gold (default), Starrcade Neon, WarGames Steel, Nitro Nights, Dome Show, Bunkhouse, plus WWF-era Red & Yellow and Attitude (deliberately no trademarked phrases like "Hulkamania" or "Attitude Era").
- **DNA launch pairs:** MJF ↔ Ric Flair (flagship), Cody Rhodes ↔ Dusty Rhodes.
- **Launch matches:** the original 10 minus open slots 5–6, plus Savage–Steamboat WM3 and Bret–Austin WM13.
- **Contact:** info@cybercoretech.net.
- **Stack:** Astro 7.3.8 static, plain JS in `public/js` (no framework, no animation library), Google Fonts (Anton, Inter, Source Serif 4).

## 🏗️ Architecture

- **Content collections** (`src/content.config.ts`): `matches`, `wrestlers`, `promotions` (group modern/vault/territory), `factions`, `dna`. References are checked at build time.
- **`src/lib/site.ts`:** `SECTIONS` (drives header, drawer and footer), sort helpers, `pick()` for highlight blocks (featured first).
- **`src/lib/ratings.ts`:** rating text/labels; `value()` for sorting (unrated = -Infinity, DUD = 0).
- **Theme engine** `public/js/theme.js`: fetches `cybergrid.json` + palettes cross-origin, maps registry slots to site vars (orange→`--gold`, cyan→`--blue`...), caches the resolved palette in `localStorage` (`wr-theme-palette`) so the inline boot script in `Base.astro` paints it before first render.
- **Effects** `public/js/pyro.js`: `html.pyro` gates everything; toggle key `wr-pyro`; reduced-motion removes the class; canvas only on 5-star reveal; tilt/spotlight need a fine pointer.
- **Graphics:** inline SVGs in `src/components/brand/` are *generated* by `brand/tools/themeable.py` (fixed colors → CSS vars). Don't hand-edit them.

## ⚠️ Invariants / gotchas

- **Legal:** embed official YouTube uploads only; never link unofficial uploads. Don't scrape Cagematch; enter Meltzer ratings by hand.
- **Never invent the author's ratings or reviews.** `my_rating: null` and empty bodies render as "Not rated yet" / "being written". Profile, history and DNA text is the author's to write.
- Match facts marked in `verify:` are shown publicly as "Being verified". Clear them only after checking. Only Okada–Omega WK11 has a Meltzer rating on file (6), because it's the one I was certain of.
- `public/js/*` files are served with immutable caching; `Base.astro` appends `?v=<sha256>` automatically, so no manual bumping.
- Anton has no `★` glyph. Brand stars are polygons; CSS stars use an SVG mask.
- Every effect must respect `html.pyro`, `prefers-reduced-motion`, visibility pausing and fine-pointer gating.
- Duplicate inline SVG gradient ids (`wr-gold`) are intentional and identical. If one is ever recolored differently, give it its own id.

## 🧪 How Phase 1 was verified

- `npm run check`: 0 errors. `npm run build`: 83 pages.
- A test file with `my_rating: 6` failed the build ("Too big: expected number to be <=5").
- Headless Chromium screenshots at 1440px and 390px (home, match page) with reduced motion.
- A CDP-driven test: drawer opens (focus → close button), sub-menu expands, Escape closes and returns focus to ☰. The theme registry loaded 90 options, the ATTITUDE mashup and synthwave-miami applied, `?theme=` updated, and the console was clean.
- **Not verified:** the deployed Cloudflare build (not connected yet), real phones, Safari/Firefox rendering of `@property` and view transitions (they degrade gracefully by design), and mashup contrast against WCAG AA (BLUEPRINT §12.3 still requires that check).

## 🔀 PR history

- **#1** Phase 0: brand assets, blueprint, README, handoff (merged).
- **#2** Phase 1: Astro skeleton, nav, theme picker, effects, launch content.

## ⏭️ Next (Phase 2, BLUEPRINT §10)

Wrestler profile text and Vault history (author), Pagefind search, Lists and Columns hubs, events/feuds sub-pages, starter paths, a mashup contrast audit, then connect Cloudflare Pages.
