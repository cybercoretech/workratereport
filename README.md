# 🏆 The Workrate Report

> **Then & Now · Match ratings since 1980**

A pro wrestling match-review site. It covers modern wrestling first (WWE, AEW, NJPW, TNA, indies) and backs that up with a deep **Classic Vault** of NWA/Crockett, WCW and the WWF: Dusty, Flair, Sting, the Four Horsemen, Savage, Steamboat, Bret and Austin. Every match gets a rating out of 5 stars (5 is the max), shown next to Dave Meltzer's.

![The Workrate Report](brand/png/logo-horizontal.png)

## ⭐ Status

- **Phase 0 · Brand:** done (PR #1).
- **Phase 1 · Skeleton:** built. Astro static site with 83 pages, the ring-rope hamburger drawer, the Cybercore theme picker (90 themes), Pyro effects and 12 launch matches.
- **Live:** 🌐 **https://workrate-report.pages.dev/** (Cloudflare Pages, auto-deploys from `main`).
- **Phase 2A · Author's Desk:** a private `/desk/` page to write and publish reviews and columns from the browser.
- **Phase 3:** On This Day (homepage block, ticker item, calendar, 366 day pages), the Me vs. Meltzer scoreboard (agreement, average gap, by promotion), and an optional ring-bell sound on video play.
- **Promotions page:** 26 companies (majors, independents, Vault, territories) with bios, founders, owners, standout stars, official sites and free-license logos.
- **Phase 2B · Depth:** search, 149 wrestler profiles with photos and bios, Lists, Columns, Starter Paths, Then & Now, Vault events and feuds, ECW and ROH, and a contrast guard on all 90 themes.

👉 The full plan is in **[BLUEPRINT.md](BLUEPRINT.md)**.

## 🥇 What makes it different

- 🧬 **Territory DNA:** modern wrestlers who carry territory-era traits, starting with MJF ↔ Ric Flair and Cody ↔ Dusty.
- ⚖️ **Me vs. Meltzer:** the matches where our rating and Meltzer's differ most, with a tug-of-war meter on each match page.
- 📼 **Classic Vault:** NWA/Crockett, WCW and WWF history pages plus the territories.
- 🎥 **Video on the page:** official YouTube embeds only (click-to-load), or links to licensed services.
- 🔥 **Pyro effects:** entrance spotlights, pyro bursts on 5-star matches, filling stars, holo-foil cards, a tale-of-the-tape VS intro, camera flashes, a rope scroll bar, VHS scanlines in the Vault. All of it can be switched off and respects reduced-motion.
- 🎨 **Cybercore theme picker:** 82 shared Cybercore palettes plus 8 wrestling mashups (default **Ten Pounds of Gold**).

## 🛠️ Run it locally

Needs Node 22.12 or newer.

```sh
npm install
npm run dev       # http://localhost:4321 with live reload
npm run check     # type check (site + functions) + content schema
npm run build     # static site → dist/
npm run preview   # serve dist/
```

## 🖋️ The Author's Desk (owner only)

**https://workrate-report.pages.dev/desk/**: sign in with the desk password, pick a match (or **New match**), set your rating (the slider, the exact box, or the ±0.01 nudges for things like 4.89), write the review, and hit **Publish**. It's live in about a minute. Drafts are saved in your browser as you type.

Under the hood, Publish commits the Markdown file to `main` through the GitHub API, and Cloudflare rebuilds. Every publish is a commit you can revert. See BLUEPRINT §13.1.

### 🔐 One-time setup (Cloudflare Pages secrets)

| Secret | How to set it |
|---|---|
| `SESSION_SECRET` | Already set (random). Re-run to sign every session out: `node -e "process.stdout.write(require('crypto').randomBytes(32).toString('base64url'))" \| npx wrangler pages secret put SESSION_SECRET --project-name workrate-report` |
| `ADMIN_PASSWORD_HASH` | `node scripts/set-desk-password.mjs` in your own terminal. It asks for the password twice (hidden) and uploads only a PBKDF2 hash. |
| `DESK_GITHUB_TOKEN` | A GitHub **fine-grained** token from the `darkstardevx` account: repository access *only* `cybercoretech/workratereport`, permission **Contents: Read and write**. Then `npx wrangler pages secret put DESK_GITHUB_TOKEN --project-name workrate-report` and paste it. |

Secrets take effect on the next deployment (a merge to `main`, or **Retry deployment** in the Cloudflare dashboard).

### 🧪 Test the desk locally

```sh
npm run build
npx wrangler d1 migrations apply workrate-report --local
# .dev.vars (gitignored): ADMIN_PASSWORD_HASH, SESSION_SECRET, DESK_GITHUB_TOKEN,
# and CONTENT_BRANCH=<a throwaway branch> so tests never touch main
npx wrangler pages dev dist --port 8788      # http://localhost:8788/desk/
```

Delete `.dev.vars` and the throwaway branch when you're done.

## ✍️ Add a match review by hand

You can also skip the desk and create one file in `src/content/matches/`, named `YYYY-MM-DD-wrestler-wrestler-event.md`:

```yaml
---
title: "Kazuchika Okada vs. Kenny Omega"
date: 2017-01-04
promotion: njpw                # a file in src/content/promotions/
event: "Wrestle Kingdom 11"
venue: "Tokyo Dome, Tokyo, Japan"
wrestlers: [kazuchika-okada, kenny-omega]   # files in src/content/wrestlers/
era: modern                    # modern | classic
type: singles                  # singles, tag, cage, wargames, iron-man, submission...
title_match: "IWGP Heavyweight Championship"
duration: "46:45"
result: "Okada retained"
my_rating: 4.89                # max 5, up to two decimals (4.89), "dud", negatives, or null
meltzer_rating: 6              # as he gave it; null if he never rated it
youtube: null                  # official upload ID only, e.g. "dQw4w9WgXcQ"
where_to_watch: ["NJPW World"]
featured: true                 # shows in homepage/hub highlights
summary: "One line for cards and social previews."
verify: []                     # facts still to check before launch
---
Your review in plain text. Blank lines start new paragraphs.
```

Every list, filter, wrestler page, year page and highlight block updates on its own. A bad value (a rating of 6, a wrestler with no file) stops the build with a clear error.

## 📷 Wrestler photos & facts

Photos come only from **Wikimedia Commons** under free licenses (CC0, public domain, CC BY, CC BY-SA). Facts (born, hometown, height, debut) come from **Wikidata**, which is CC0. Each profile shows the photo credit, and `/credits/` lists them all.

```sh
node scripts/fetch-wrestler-data.mjs            # fetch anyone not fetched yet
node scripts/fetch-wrestler-data.mjs ric-flair  # refresh one wrestler
node scripts/fetch-wrestler-data.mjs --all      # refresh everyone
```

It writes `src/data/wrestler-facts.json` and `public/wrestlers/<slug>.jpg` (400px, metadata stripped; needs ImageMagick). Name collisions are real ("Steve Williams" is also Stone Cold's real name), so check new matches and pin the right Wikidata ID in the script's `PIN` table when needed. Bios are in each wrestler's Markdown file and are yours to edit.

## 🏢 Promotions

`/promotions/` lists every company; each has a page with its history, an at-a-glance table, standout stars (linked when they have a profile), the site's wrestlers and matches, and the official site. Hand-checked facts live in each `src/content/promotions/*.md`; Wikidata facts and free logos are the fallback:

```sh
node scripts/fetch-promotion-data.mjs   # src/data/promotion-facts.json + public/promotions/<slug>.png
```

Logos appear only when Commons lists a free license; everyone else gets the site's own name badge. `SKIP_LOGO` in the script drops out-of-date marks (TNA's Wikidata logo is still Impact's).

## 👥 Members (Google sign-in)

`/account/` signs members in with Google, then lets them set a handle, display name, avatar (8 presets), bio, favorites and profile visibility. Public profiles live at `/u/<handle>/`. Signed-in members rate matches 0–5 in quarter stars, and match pages show **Mine · Meltzer · Fans**.

- Only `openid email` is requested from Google. Email stays private, and names and access tokens aren't stored.
- Authorization-code flow with PKCE (S256) and a one-use state bound to the browser; sessions are random tokens stored as SHA-256 hashes, 90 days, HttpOnly Secure SameSite=Lax.
- Writes need our Origin; profile and rating writes are rate-limited; open redirects are blocked.

### One-time Google setup

1. In [Google Cloud](https://console.cloud.google.com/auth/overview), create a project, set up the consent screen (External, app name The Workrate Report), and create an **OAuth client → Web application** with the redirect URI `https://workrate-report.pages.dev/api/auth/callback`.
2. Download its JSON and run `node scripts/configure-google.mjs <file>`. Then delete the file.
3. Optional: set `ADMIN_GOOGLE_SUB` to the owner's Google account id to make that member the admin.
4. Redeploy.

## 📖 Wrestler bios

Every wrestler has a full career bio (in the Markdown body), a `breakout` moment and a `signature_match` in frontmatter, and optional `gimmicks` notes. Real names, previous ring names and gimmicks, trainers and debut/retirement years come from each wrestler's Wikipedia infobox:

```sh
node scripts/fetch-wikipedia-facts.mjs                 # all wrestlers
node scripts/fetch-wikipedia-facts.mjs --leads <dir> sting   # one wrestler, saving its article intro for reference
```

Wikipedia is used **as a source of facts only**. Bios are written in our own words, never copied (Wikipedia text is CC BY-SA), and each profile links to its Wikipedia and Wikidata sources. Keep the `--leads` folder out of the repo.

## 🎨 Theme readability

`public/js/contrast.js` nudges any too-faint text color in a theme until it meets WCAG AA. Red and blue keep their true colors for backgrounds and get readable copies (`--red-text`, `--blue-text`) for text. Audit every theme with:

```sh
node scripts/contrast-audit.mjs   # also runs in CI; fails if any pair is below target
```

## 🧱 Project layout

| 📁 | Contents |
|---|---|
| `src/content/` | Matches, wrestlers, promotions, factions, Territory DNA, lists, columns, starter paths, events, feuds (Markdown + frontmatter) |
| `src/content.config.ts` | The content schema, including the 5-star cap |
| `src/pages/` | Every route: hubs plus sub-pages (BLUEPRINT §2) |
| `src/layouts/Base.astro` | Header, hamburger drawer, theme pickers, ticker, footer |
| `src/components/` | Stars, cards, grids, video facade, breadcrumbs; `brand/` = theme-following SVGs |
| `src/styles/global.css` | Tokens, layout and all effect styles |
| `public/js/` | `theme.js` (theme engine), `nav.js` (drawer), `pyro.js` (effects), `desk.js` (Author's Desk). Cache-busted by content hash |
| `functions/` | Cloudflare Pages Functions: `/api/desk/*` (login, session, publish match, add wrestler, log) and `_lib/` helpers |
| `migrations/` | D1 schema (`workrate-report` database): 0001 desk, 0002 members, sessions, OAuth state, fan ratings, rate limits |
| `scripts/` | `set-desk-password.mjs`, `fetch-wrestler-data.mjs`, `fetch-promotion-data.mjs`, `contrast-audit.mjs` |
| `src/data/` | `wrestler-facts.json`, `promotion-facts.json` (generated: Wikidata facts, photo and logo credits) |
| `public/promotions/` | Free-license promotion logos (see `/credits/`) |
| `public/wrestlers/` | Wrestler photos (free licenses, see `/credits/`) |
| `wrangler.toml` | Pages config: D1 binding, repo/branch vars (no secrets) |
| `brand/` | Source graphics and generators |

## 🎨 Brand assets

All original. Text is outlined to paths, so no font needs to be installed.

| 📁 | Contents |
|---|---|
| `brand/svg/` | Logos (light/dark), WR emblem, favicon, OG card, rating stars, DUD/MINUS stamps, section badges, rope divider |
| `brand/png/` | Rendered previews, favicon sizes 16/32/180/512, `og-card.png` 1200×630 |
| `brand/fonts/` | Anton (SIL Open Font License, see `OFL-Anton.txt`) |
| `brand/tools/` | `make_brand.py` + `textpath.py` generators, `themeable.py` (theme-following copies for the site) |

### 🔁 Regenerate the graphics

```sh
cd brand
python3 -I tools/make_brand.py fonts/Anton-Regular.ttf svg
for f in svg/*.svg; do rsvg-convert -z 2 "$f" -o "png/$(basename "${f%.svg}").png"; done
rsvg-convert -w 1200 -h 630 svg/og-card.svg -o png/og-card.png
for s in 16 32 180 512; do rsvg-convert -w $s -h $s svg/favicon.svg -o png/favicon-$s.png; done
cd .. && python3 -I brand/tools/themeable.py brand/svg src/components/brand
```

Needs Python 3 with `fontTools`, plus `rsvg-convert` (librsvg).

## 🎨 Themes

The picker loads the shared registry from `https://cybercoretech.github.io/data` (it allows cross-origin requests). If the registry is unreachable, the built-in **Ten Pounds of Gold** palette is used. Signature mashups:

| Mashup | Base × Accent |
|---|---|
| 🥇 Ten Pounds of Gold | built-in brand palette |
| 🎄 Starrcade Neon | cyberdyne-steel × synthwave-sunset |
| ⛓️ WarGames Steel | blackbox-industrial × cyberdyne-t800 |
| 📺 Nitro Nights | neosynth-core × cyberpunk-neon |
| 🗼 Dome Show | tokyo-night × neosynth-plasma |
| 🤠 Bunkhouse | gruvbox-dark × dystopian-ash |
| 💛 Red & Yellow | dystopian-ash × cyberdyne-t800 |
| 🖤 Attitude | demon × cyberdyne-judgment |

Links like `/?theme=attitude` open the site in that theme.

## 🚀 Deploying

Cloudflare Pages project `workrate-report`, connected to this repo (live since 2026-10-16):

| Setting | Value |
|---|---|
| Framework preset | Astro |
| Build command | `npm run build` |
| Output directory | `dist` |
| Environment | `NODE_VERSION=22` |

Pushes to `main` deploy, and PRs get preview URLs. `public/_headers` sets security headers and long caching for hashed assets.

## ⚖️ Content policy

Official video embeds only, original writing, owned or licensed images, and Meltzer ratings quoted individually with credit. See BLUEPRINT §9 and `/copyright/` on the site.

An independent fan site, not affiliated with any wrestling promotion.

## 📬 Contact

**info@cybercoretech.net**: questions, corrections and takedown requests.
