# 🏆 The Workrate Report

> **Then & Now · Match ratings since 1980**

A pro wrestling match-review site. It covers modern wrestling first (WWE, AEW, NJPW, TNA, indies) and backs that up with a deep **Classic Vault** of NWA/Crockett, WCW and the WWF: Dusty, Flair, Sting, the Four Horsemen, Savage, Steamboat, Bret and Austin. Every match gets a rating out of 5 stars (5 is the max), shown next to Dave Meltzer's.

![The Workrate Report](brand/png/logo-horizontal.png)

## ⭐ Status

- **Phase 0 · Brand:** done (PR #1).
- **Phase 1 · Skeleton:** built. Astro static site with 83 pages, the ring-rope hamburger drawer, the Cybercore theme picker (90 themes), Pyro effects and 12 launch matches.
- **Hosting:** Cloudflare Pages → `workrate-report.pages.dev`. The repo still needs connecting in the Cloudflare dashboard.

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
npm run check     # type check + content schema
npm run build     # static site → dist/
npm run preview   # serve dist/
```

## ✍️ Add a match review

Create one file in `src/content/matches/`, named `YYYY-MM-DD-wrestler-wrestler-event.md`:

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
my_rating: 5                   # max 5, quarter steps (4.75), "dud", negatives, or null
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

## 🧱 Project layout

| 📁 | Contents |
|---|---|
| `src/content/` | Matches, wrestlers, promotions, factions, Territory DNA pairings (Markdown + frontmatter) |
| `src/content.config.ts` | The content schema, including the 5-star cap |
| `src/pages/` | Every route: hubs plus sub-pages (BLUEPRINT §2) |
| `src/layouts/Base.astro` | Header, hamburger drawer, theme pickers, ticker, footer |
| `src/components/` | Stars, cards, grids, video facade, breadcrumbs; `brand/` = theme-following SVGs |
| `src/styles/global.css` | Tokens, layout and all effect styles |
| `public/js/` | `theme.js` (theme engine), `nav.js` (drawer), `pyro.js` (effects). Cache-busted by content hash |
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

The picker loads the shared registry from `https://cybercore-tech.github.io/data` (it allows cross-origin requests). If the registry is unreachable, the built-in **Ten Pounds of Gold** palette is used. Signature mashups:

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

Cloudflare Pages, connected to this repo:

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
