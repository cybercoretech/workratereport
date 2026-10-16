# 🏆 The Workrate Report

> **Then & Now · Match ratings since 1980**

A pro wrestling match-review site. It covers modern wrestling first (WWE, AEW, NJPW, TNA, indies) and backs that up with a deep **Classic Vault** of NWA/Crockett and WCW: Dusty, Flair, Sting, the Four Horsemen. Every match gets a rating out of 5 stars (5 is the max) from a fan who has watched since 1980, shown next to Dave Meltzer's rating.

![The Workrate Report](brand/png/logo-horizontal.png)

## ⭐ Status

**Phase 0 · Brand: done.** The name, domain check, original graphics and the full site blueprint are in place. The site itself (Astro) isn't built yet; that's Phase 1.

👉 Start with **[BLUEPRINT.md](BLUEPRINT.md)**. It covers the sitemap, page templates, content model, rating scale, features, brand system, tech stack, legal policy, roadmap and open decisions.

## 🥇 What makes it different

- 🧬 **Territory DNA:** modern wrestlers who carry territory-era traits, starting with MJF ↔ Ric Flair.
- ⚖️ **Me vs. Meltzer:** the matches where our rating and Meltzer's differ most.
- 📼 **Classic Vault:** NWA/WCW history pages, feuds and must-watch matches.
- 🎥 **Video on the page:** official YouTube embeds only, or links to licensed services.
- 🔥 **Pyro effects:** entrance spotlights, pyro bursts on 5-star matches, star fills, holo-foil cards, a ring-rope hamburger menu. All of it can be switched off and respects reduced-motion.
- 🎨 **Cybercore theme picker:** 82 shared Cybercore palettes plus wrestling mashups (default **Ten Pounds of Gold**).

## 🎨 Brand assets

All original. Text is outlined to paths, so no font needs to be installed.

| 📁 | Contents |
|---|---|
| `brand/svg/` | Logos (light/dark), WR emblem, favicon, OG card, rating stars, DUD/MINUS stamps, section badges, rope divider |
| `brand/png/` | Rendered previews, favicon sizes 16/32/180/512, `og-card.png` 1200×630 |
| `brand/fonts/` | Anton (SIL Open Font License, see `OFL-Anton.txt`) |
| `brand/tools/` | `make_brand.py` + `textpath.py` generator |

### 🔁 Regenerate the graphics

```sh
cd brand
python3 -I tools/make_brand.py fonts/Anton-Regular.ttf svg
for f in svg/*.svg; do rsvg-convert -z 2 "$f" -o "png/$(basename "${f%.svg}").png"; done
rsvg-convert -w 1200 -h 630 svg/og-card.svg -o png/og-card.png
for s in 16 32 180 512; do rsvg-convert -w $s -h $s svg/favicon.svg -o png/favicon-$s.png; done
```

Needs Python 3 with `fontTools`, plus `rsvg-convert` (librsvg).

## 🎨 Palette

| Token | Hex |
|---|---|
| Arena black `--ink` | `#111014` |
| Ring canvas `--canvas` | `#F3EEE3` |
| Championship gold `--gold` | `#D4A537` |
| Ring red `--red` | `#C8102E` |
| Rope blue `--blue` | `#1F4E9C` |

## 🚀 Hosting

Cloudflare Pages at `workrate-report.pages.dev` until a domain is bought. `workratereport.com` was unregistered on 2026-10-16.

## ⚖️ Content policy

Official video embeds only, original writing, owned or licensed images, and Meltzer ratings quoted individually with credit. See BLUEPRINT §9.

An independent fan site, not affiliated with any wrestling promotion.

## 📬 Contact

**info@cybercoretech.net**: questions, corrections and takedown requests.
