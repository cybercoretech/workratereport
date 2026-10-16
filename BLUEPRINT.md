# The Workrate Report — Site Blueprint

> **Then & Now · Match ratings since 1980**
> Modern classics up front, with an NWA/WCW vault behind them, all rated by a fan who has watched since 1980.

Status: **Blueprint v1.1** (2026-10-16). Phase 0 (brand) merged; Phase 1 (Astro site skeleton) built. See the README for how to run it.

---

## 1. Identity

| Item | Decision |
|---|---|
| Name | **The Workrate Report** |
| Short mark | **WR** belt-plate emblem |
| Tagline | *Then & Now · Match ratings since 1980* |
| Temporary home | `workrate-report.pages.dev` (Cloudflare Pages, free) |
| Domain (later) | `workratereport.com`: unregistered as of 2026-10-16 (whois "No match"). `theworkratereport.com` is also free. |
| Name checks | Web search found no wrestling site, podcast or newsletter named "The Workrate Report", and no trademark hits. A formal USPTO search is still worth doing before buying the domain. |

### Positioning

- **Modern-first.** Most content covers current wrestling: WWE, AEW, NJPW, TNA, indies (Ospreay, Danielson, Omega, Okada, MJF...).
- **Classic specialty.** The **Classic Vault** covers NWA/Crockett, WCW and the **WWF** (added 2026-10-16) in depth: Dusty Rhodes, Ric Flair, Sting, the Four Horsemen, Starrcade, the Great American Bash, Clash of the Champions; the WWF's Golden Era, New Generation and Attitude Era. Other territories (UWF/Mid-South, USWA/Memphis, AWA, World Class) appear as supporting history.
- **The bridge: Territory DNA.** Modern wrestlers who wrestle, talk and act like territory-era stars. **MJF is the flagship example:** a chickenshit heel champion in the Flair mold, with Memphis-style heat and promos that work like old studio TV. This feature makes the modern/classic mix feel like one site, not two.
- **One expert voice.** Cagematch averages thousands of users. Here, every rating and review comes from one person who watched it the first time around.

---

## 2. Sitemap

**Structure rule (decided 2026-10-16):** each section is a set of pages, not one long page. The **homepage** is a highlights reel that pulls the best of every section. Each **section hub** shows that section's highlights and links into its sub-pages. **Sub-pages** hold the full lists, single items and archives. All highlight blocks are filled automatically from the content files (by `featured`, rating or date), so adding a review updates every level.

```
/                                   Home: highlights from every section

/matches/                           Match Guide hub: Match of the Week, newest, top rated, browse links
  /matches/all/                     Every match, filterable (promotion · era · wrestler · rating · year · type)
  /matches/top-rated/               All ★★★★★ and ★★★★¾ matches
  /matches/modern/                  Modern-era matches
  /matches/classic/                 Classic-era matches
  /matches/year/<yyyy>/             One year, plus best match of that year
  /matches/promotion/<promo>/       One promotion (wwe, aew, njpw, tna, wcw, jcp-nwa...)
  /matches/type/<type>/             Cage, WarGames, Iron Man, tag, ...
  /matches/<slug>/                  A single match page

/wrestlers/                         Wrestlers hub: featured profiles, newest added, A–Z link
  /wrestlers/all/                   A–Z index, filter by era / promotion
  /wrestlers/modern/                Current roster
  /wrestlers/legends/               Classic-era greats
  /wrestlers/factions/              Four Horsemen, Bullet Club, The Elite, ...
  /wrestlers/factions/<slug>/       One faction
  /wrestlers/<slug>/                A single profile

/vault/                             Classic Vault hub: From the Vault picks, eras timeline, feuds
  /vault/jcp-nwa/                   Jim Crockett Promotions / NWA
  /vault/wcw/                       WCW
  /vault/wwf/                       WWF: Golden Era, New Generation, Attitude Era (1979–2002)
  /vault/territories/               UWF/Mid-South, USWA/Memphis, AWA, World Class (supporting)
  /vault/territories/<slug>/        One territory
  /vault/events/                    Starrcade, Great American Bash, Clash of the Champions...
  /vault/events/<slug>/             One event series, with every edition
  /vault/feuds/                     Flair–Steamboat, Horsemen–Dusty, Flair–Sting, ...
  /vault/feuds/<slug>/              One feud, matches in order

/dna/                               Territory DNA hub: flagship pairing (MJF ↔ Flair), all pairings
  /dna/<slug>/                      One modern ↔ classic comparison

/lists/                             Lists hub: newest and most popular lists
  /lists/<slug>/                    A single list

/columns/                           Columns hub: latest, plus series links
  /columns/i-was-there/             "I Was There" memories series
  /columns/analysis/                Booking and era analysis
  /columns/<slug>/                  A single column

/me-vs-meltzer/                     Hub: biggest disagreements (auto-generated)
  /me-vs-meltzer/higher/            Matches I rated above Meltzer
  /me-vs-meltzer/lower/             Matches I rated below Meltzer

/on-this-day/                       Today's date in wrestling history (auto)
  /on-this-day/<mm-dd>/             Any calendar day

/watch/                             Where to Watch hub
  /watch/services/                  Peacock, TrillerTV, IWTV, NJPW World, YouTube channels
  /watch/starter-paths/             All starter paths
  /watch/starter-paths/<slug>/      One path ("10 matches to understand the Horsemen")
  /watch/then-and-now/              Classic → modern back-to-back pairs

/ratings/                           How the star system works
/about/                             About the author (fan since 1980)
/contact/                           info@cybercoretech.net
/copyright/                         Embed + takedown policy
```

### Highlight blocks: what each level shows

| Page | Highlights |
|---|---|
| **Home** | Match of the Week · 6 newest reviews · From the Vault (3) · Territory DNA spotlight · On this day · Me vs. Meltzer latest · newest column · a featured list |
| **Match Guide hub** | Match of the Week · newest 9 · top-rated 6 · browse tiles (era / promotion / year / type) |
| **Wrestlers hub** | 4 featured profiles · newest added · factions strip |
| **Classic Vault hub** | 3 vault picks · NWA/Crockett and WCW cards · events strip · featured feud |
| **Territory DNA hub** | Flagship pairing large, then all pairings as cards |
| **Lists / Columns hubs** | Newest 3 large, then the rest as a list |
| **Watch hub** | Featured starter path · services grid · a Then & Now pair |

Every hub ends with "See all →" links into its sub-pages, and every sub-page has breadcrumbs back up (`Home › Classic Vault › Feuds › Flair–Steamboat`).

### Main navigation

`Matches · Wrestlers · Classic Vault · Territory DNA · Lists · Columns · Watch`

---

## 3. Page templates

### Home
1. **Hero:** Match of the Week, with an embedded YouTube video, both ratings and a short review teaser.
2. **Latest reviews:** 6 newest match cards (mostly modern).
3. **From the Vault:** 3 classic NWA/WCW cards on a black and gold panel.
4. **Territory DNA spotlight:** one modern ↔ classic pairing (e.g. MJF ↔ Flair).
5. **On this day:** matches from today's date in past years.
6. **Me vs. Meltzer:** the latest big disagreement.
7. Ring-rope divider between sections (`brand/svg/divider-ropes.svg`).

### Match page
- **Header:** Wrestler A vs. Wrestler B, plus the event, date, venue and promotion.
- **Ratings bar:** *My rating* (large gold stars) next to *Meltzer* (smaller, with attribution) or "Not rated".
- **Badges:** Modern Era / Classic Vault, plus Territory DNA when it applies.
- **Video:** a lite YouTube embed (click to load), or a **Where to Watch** box (Peacock, TrillerTV, IWTV...).
- **Review:** context going in → the match → why the rating.
- **Facts table:** match type, stipulation, duration, title, result.
- **Related:** same feud, same wrestlers, same event.

### Wrestler profile
- Name, years active, main promotions, titles
- Signature matches (pulled automatically from match files), sorted by rating
- "Best work", "Most underrated" and "Where to start" picks
- Territory DNA links (as an influence or as an heir)

### Vault promotion page (e.g. `/vault/jcp-nwa/`)
- History: rise, peak, how it ended
- Key feuds and factions (Horsemen vs. Dusty, Flair vs. Steamboat '89...)
- Top workers
- Must-watch matches (auto-listed by rating)
- Timeline strip

### Territory DNA page
- Two columns: **Modern** (e.g. MJF) vs. **Classic** (e.g. Ric Flair)
- Traits compared: promos, heel tactics, in-ring psychology, presentation
- Paired matches to watch back-to-back
- Verdict paragraph

---

## 4. Content model

Every item is a text file with a short header (frontmatter) followed by the review in plain Markdown. You add a match by adding one file, and every list, filter and wrestler page updates on its own.

### Match (`src/content/matches/2017-01-04-okada-omega-wk11.md`)
```yaml
---
title: "Kazuchika Okada vs. Kenny Omega"
date: 2017-01-04
promotion: njpw
event: "Wrestle Kingdom 11"
venue: "Tokyo Dome, Tokyo"
wrestlers: [kazuchika-okada, kenny-omega]
era: modern            # modern | classic
type: singles          # singles | tag | six-man | cage | wargames | iron-man | ...
title_match: "IWGP Heavyweight Championship"
duration: "46:45"
my_rating: 4.89        # max 5, up to two decimals; "dud"; negatives allowed (-1, -2.5...)
meltzer_rating: 6      # optional; omit if he never rated it
youtube: null          # official upload ID only; null → show where_to_watch
where_to_watch: [njpw-world]
dna: []                # Territory DNA page slugs this match belongs to
tags: [wrestle-kingdom, ibushi-era]
featured: false
---
Review text here...
```

### Wrestler (`src/content/wrestlers/mjf.md`)
```yaml
---
name: "MJF"
real_name: "Maxwell Jacob Friedman"
active: "2015–present"
promotions: [mlw, aew]
eras: [modern]
dna_influences: [ric-flair]
photo: null            # only images we own or have rights to
---
```

### Promotion (`src/content/promotions/jcp-nwa.md`)
`name, years, region, owner_notes, vault: true|false, summary`

### Faction, Event series, Feud (feed the hub sub-pages)
- **Faction:** `name, members (wrestler slugs), years, promotions, summary`
- **Event series:** `name, promotion, years, summary`. Its editions are listed from match `event` values.
- **Feud:** `name, wrestlers, years, summary`. Its matches are listed by `tags: [feud-<slug>]`, in date order.

### Column, List, DNA pairing
Each has `title, date, summary`. A column adds `series` (`i-was-there` | `analysis`). A list adds an ordered `items` array of match or wrestler slugs. A DNA pairing adds `modern`, `classic`, a `traits` table and `paired_matches`.

### Automatic pages
- **Me vs. Meltzer:** every match with both ratings, sorted by `|my_rating − meltzer_rating|`.
- **On this day:** matches whose month and day equal today's (built daily, see §8).
- **Best match of each year:** highest `my_rating` per year.

---

## 5. Rating system

A **5-star scale** following Meltzer's convention. **Our ratings are precise to 0.01** (user, 2026-10-16: "so I can make precise adjustments like 4.89, 4.97"). Meltzer's are quoted in his quarter steps. Reference points:

| Rating | Meaning |
|---|---|
| ★★★★★ | All-time classic |
| ★★★★½ – ★★★★¾ | Match of the year contender |
| ★★★★ | Great, worth going out of your way to see |
| ★★★ – ★★★¾ | Good, solid |
| ★★ – ★★¾ | Average TV match |
| ★ – ★¾ | Below average |
| ¼ – ¾ | Bad |
| **DUD** | Nothing worthwhile |
| **MINUS ★** | Offensively bad |

**Decided (2026-10-16): our scale caps at ★★★★★.** A 5 means all-time classic, and nothing goes past it. The schema rejects `my_rating` above 5. Meltzer's ratings still display as he gave them, including 6 and 7 stars, which feeds Me vs. Meltzer.

Display rule: Meltzer's rating is a **quoted fact with attribution** ("Dave Meltzer, Wrestling Observer"). It's never copied in bulk from Cagematch or any other database (Cagematch's terms forbid scraping). Each one is entered by hand.

---

## 6. Signature features

| Feature | What it is | Why it matters |
|---|---|---|
| **Territory DNA** | Modern ↔ classic pairings. Launch pairs: **MJF ↔ Ric Flair** (flagship) and **Cody Rhodes ↔ Dusty Rhodes**; more added over time | Ties the eras together; nobody else does this in depth |
| **Me vs. Meltzer** | Where your rating differs most from his | Built-in debate content |
| **Classic Vault** | Deep NWA/WCW coverage with history pages | Your real specialty |
| **Then & Now pairs** | Watch a classic and a modern match back-to-back (e.g. Flair–Steamboat '89 → Okada–Omega '17) | Teaches newer fans the lineage |
| **Starter Paths** | "10 matches to understand the Horsemen", "Get into NJPW in 8 matches" | Gives newcomers a place to start |
| **Match of the Week** | Home hero, rotated weekly | A reason to come back |
| **I Was There** | Column series: memories of watching live or on TV in the 80s | Credibility no database has |

### Launch set (12 matches, ratings yours to give)

Approved as the launch set (2026-10-16). **Before publishing each one, still verify its date, details and where it can legally be watched.** Slots 5 and 6 are picked when they're written.

*Modern (6)*
1. Kazuchika Okada vs. Kenny Omega, NJPW Wrestle Kingdom 11 (2017-01-04)
2. Will Ospreay vs. Bryan Danielson, AEW × NJPW Forbidden Door (2023)
3. MJF vs. Bryan Danielson, 60-minute Iron Man, AEW Revolution (2023-03-05) ← **DNA flagship**
4. Will Ospreay vs. Kenny Omega, NJPW Wrestle Kingdom 17 (2023-01-04)
5. A current WWE match of your choice
6. An indie match of your choice (IWTV or GCW)

*Classic Vault (4)*
7. Ric Flair vs. Ricky Steamboat, NWA WrestleWar (1989-05-07)
8. Ric Flair vs. Sting, Clash of the Champions I, 45-minute draw (1988-03-27)
9. Ric Flair vs. Harley Race, Starrcade '83 cage (1983-11-24)
10. The first WarGames: Horsemen vs. Dusty & co., Great American Bash (1987)

*WWF additions (2026-10-16, after the user asked for WWF/WWE coverage)*

11. "Macho Man" Randy Savage vs. Ricky Steamboat, WrestleMania III (1987-03-29)
12. Bret Hart vs. "Stone Cold" Steve Austin, WrestleMania 13 submission match (1997-03-23)

---

## 7. Brand system

All graphics are original and live in `brand/`. Text is converted to outlines, so they don't need a font installed. Regenerate them with `brand/tools/make_brand.py`.

### Colors

| Token | Hex | Use |
|---|---|---|
| `--ink` | `#111014` | Arena black: backgrounds, dark text |
| `--canvas` | `#F3EEE3` | Ring-canvas off-white: light backgrounds |
| `--gold` | `#D4A537` | Championship gold: stars, emblem, accents |
| `--gold-hi` / `--gold-lo` | `#F2D27A` / `#8C6A1C` | Gold gradient |
| `--red` | `#C8102E` | Modern Era, "THE", DUD stamps |
| `--blue` | `#1F4E9C` | Territory DNA, rope stripe |

The site supports a light mode (canvas background) and a dark mode (ink background, default for the Vault).

### Type
- **Display:** Anton (OFL, Google Fonts), for headlines, logos and badges. It has a fight-poster feel.
- **Body:** a readable serif for reviews (e.g. Source Serif 4), with Inter for UI and data tables. *Open choice.*

### Graphics inventory (`brand/svg/`, PNG previews in `brand/png/`)

| File | Use |
|---|---|
| `logo-horizontal.svg` / `-dark.svg` | Site header |
| `emblem.svg` | WR belt plate with five stars: avatar, about page, watermark |
| `favicon.svg` (+ PNG 16/32/180/512) | Browser tab, iOS icon |
| `og-card.svg` / `png/og-card.png` | Social share preview (1200×630) |
| `star-full/three-quarter/half/quarter/empty.svg` | Rating stars |
| `rating-dud.svg`, `rating-negative.svg` | DUD and negative-star stamps |
| `badge-modern-era.svg`, `badge-classic-vault.svg`, `badge-territory-dna.svg`, `badge-me-vs-meltzer.svg` | Section and match badges |
| `divider-ropes.svg` | Red-white-blue ring-rope section divider |

The site itself renders ratings with a CSS star component (one gold star row clipped to the rating width), so any value down to 0.01 (like 4.89) fills exactly. The SVG stars are for social images and fallbacks.

---

## 8. Technology

| Piece | Choice | Why |
|---|---|---|
| Framework | **Astro** (static output) | Markdown content collections, fast pages, free hosting |
| Hosting | **Cloudflare Pages** | Free; `*.pages.dev` until a domain is bought |
| Build | `npm run build` → output `dist/` | Standard Astro settings in Pages |
| Search | **Pagefind** | Static search index, no server |
| Filters | Small client-side script on `/matches/` | Promotion / era / wrestler / rating / year |
| Video | `lite-youtube` embed using `youtube-nocookie.com` | Loads fast; no YouTube tracking until clicked |
| Analytics | Cloudflare Web Analytics | Free, no cookies, no consent banner |
| On this day | Daily rebuild via a Pages deploy hook on a cron (GitHub Actions) | Keeps the date-based page fresh |

### Deploy path
1. Code in **`cybercore-tech/workratereport`** (public) → connect it to Cloudflare Pages → auto-deploys on every push to `main`. Work happens on branches and merges through PRs.
2. Project name `workrate-report` → site at `workrate-report.pages.dev`.
3. Later: buy `workratereport.com`, add it under Pages → Custom domains.

### Quality checks (CI)
- Validate every match file against the schema (a bad rating value fails the build).
- **Dead-embed checker:** checks each `youtube` ID through YouTube's oEmbed endpoint weekly and flags removed or private videos.
- Link checker for Where to Watch URLs.

---

## 9. Legal & content policy

- **Video:** embed **official uploads only** (WWE, WWE Vault, AEW, NJPW, TNA, NWA, promotions' own channels). Otherwise link to licensed services. Never link to unofficial uploads.
- **Images:** own photos, licensed images, or images used under the promoter's media terms. No Google Images grabs. Wrestler photos are Wikimedia Commons files under free licenses (CC0, PD, CC BY, CC BY-SA), credited on each profile and on `/credits/`; resized copies keep the original license.
- **Text:** all reviews are original. Facts (results, dates, times) are free to use. Quote other writers briefly, with credit.
- **Ratings:** Meltzer ratings are quoted individually with attribution. No bulk copying from Cagematch.
- **/copyright page:** states the embed policy and gives **info@cybercoretech.net** for takedown requests, with a promise to act fast.
- **Disclaimer:** an independent fan site, not affiliated with any promotion.

---

## 10. Roadmap

| Phase | Deliverable |
|---|---|
| **0 · Brand** ✅ | Name, domain check, graphics, this blueprint |
| **1 · Skeleton** ✅ (live 2026-10-16) | Astro project, layouts, header and footer, **hamburger drawer + theme picker** (§12), match page, section hubs, Match Guide list, first 10 matches, deploy to `pages.dev` |
| **2A · Author's Desk** ✅ | Password-protected `/desk/` editor that publishes reviews live (§13.1), D1 database, Pages Functions |
| **2C · Promotions** ✅ | `/promotions/` hub + 26 company pages (bios, founders, owners, based, standouts, official sites, free logos or badges); added NXT, MLW, GCW, HOG, West Coast Pro, PWG, RevPro, Progress, CZW, CMLL, NWA (modern), Evolve |
| **2B · Depth** ✅ | Pagefind search; ECW (Vault) and ROH (modern); 149 wrestlers with Commons photos, Wikidata facts and bios; Lists (auto + hand-picked); Columns (+ desk tab); Starter Paths; Then & Now; Vault events and feuds; contrast guard + CI audit |
| **2 · Depth (original plan)** | Wrestler profiles, Vault promotion pages, filters, Pagefind search |
| **3 · Signature** | Territory DNA (MJF ↔ Flair first), Me vs. Meltzer, On This Day, Starter Paths, **full Pyro effects set** (§12.2) |
| **3B · Members & forum** | Google sign-in, profiles, fan ratings, forum (option chosen from §13.3) |
| **4 · Grow** | Buy domain, analytics, newsletter, dead-embed CI, columns cadence |

---

## 11. Decisions

### Made (2026-10-16)

| Decision | Answer |
|---|---|
| Rating cap | **5 stars maximum** |
| Repository | `github.com/cybercore-tech/workratereport`; local `~/Webdev/workrate-report` |
| Territory DNA launch pairs | MJF ↔ Ric Flair, Cody Rhodes ↔ Dusty Rhodes |
| Launch 10 | The §6 list as written |
| Contact email | **info@cybercoretech.net** (/contact, /copyright, footer) |

### Still open

1. **Body font:** a serif for reviews (recommended) or all sans-serif. This can be settled in Phase 1 by comparing both in the browser.

---

## 12. Navigation, effects & themes

Added 2026-10-16 at the user's request: a hamburger menu, lots of strong CSS/JS effects, and the Cybercore theme picker. The reference implementations are the user's own sites:

| Reference | Path | What we take |
|---|---|---|
| Neon Coffin Video menu | `~/Webdev/NeonCoffinVideo/website/store-nav.js` / `.css` | Accessible hamburger: `aria-expanded`, Escape and outside-click close, focus returns to the button, menu height fitted to the viewport |
| Neon Coffin Video effects | `night-effects.js/.css`, `neon-polish.js/.css` | Pointer-tracked light, conic border sweep (`@property` angle), canvas particles throttled to ~30 fps, staggered card arrival, scroll-spy, scroll progress, an effects on/off class, reduced-motion and hidden-tab pausing |
| Cybercore theme kit | `~/Devspace/Cybercore/security/sigilward/docs/app.js` | Theme engine: registry fetch, categorized dark listbox menu, signature mashups, `?theme=` links, `localStorage` |

### 12.1 Hamburger menu: "the ropes"

- **All screen sizes.** One ☰ button in the header. On desktop the main sections also show inline, and the hamburger opens the full menu with every sub-page.
- **The icon is three ring ropes** (red, white, blue). On open, the top and bottom ropes swing into an X and the middle rope "snaps" out like a rope being hit.
- **The menu is a drawer** that slides in from the right with a canvas-texture background. Each section from §2 is a group: tap **Classic Vault** and it expands to JCP/NWA · WCW · Territories · Events · Feuds. The current page is marked with `aria-current`.
- **Behavior from NCV:** `aria-expanded` and `aria-label` switch between Open/Close; Escape and outside clicks close it; focus goes back to the button; the page behind can't scroll; links close the drawer. The menu also holds the **theme picker** and the **effects toggle**.

### 12.2 Effects ("Pyro")

Every effect is a wrestling moment, built with the techniques from the NCV sites.

| Effect | Where | How |
|---|---|---|
| **Entrance spotlights** | Home hero, hub heroes | Two conic-gradient spotlights sweep across on load and then idle-sway; a third follows the pointer (`--spot-x/--spot-y`, rAF-throttled, desktop only) |
| **Pyro burst** | Match of the Week; any ★★★★★ match on reveal | Canvas sparks from the bottom corners, about 1.2 s, ~30 fps cap; runs once per view |
| **Star fill** | Every rating | Stars fill quarter by quarter when scrolled into view, then a gold glint passes over; DUD and MINUS stamps slam in with a rotate-and-settle (NCV "rental stamp") |
| **Gold plate sweep** | Featured cards, DNA flagship | Animated conic gold border (`@property --plate-angle`), like NCV's frame sweep |
| **Holo foil tilt** | Match and wrestler cards | 3D tilt that follows the pointer, with a foil shine layer; fine pointers only, never on touch |
| **Tale of the tape** | Match page header | The two wrestler names slide in from opposite corners, "VS" punches in at the centre, and the ratings bar rises underneath |
| **Card arrival** | Lists, hubs, filters | Staggered rise-in (12 ms steps, capped) whenever a grid fills or a filter changes |
| **Camera flashes** | 5-star cards on hover; hero | Brief random white flash points, like flashbulbs in the crowd |
| **Rope progress bar** | Top of every page | The reading-progress bar is a red-white-blue rope that fills as you scroll |
| **Ticker** | Under the header | A "ON THIS DAY · NEW REVIEW · ME VS. MELTZER" scrolling strip with a pulsing "LIVE" dot (NCV issue strip) |
| **Era filters** | Classic Vault pages only | A light VHS scanline, a tracking-wobble on hover and warm color on thumbnails; modern pages stay crisp HD |
| **Count-up stats** | Hubs, About | Matches rated, 5-star count and years watching count up when shown |
| **Bell** | Optional | "Ding ding" when a Match of the Week video starts. Off by default, with a sound toggle in the menu |
| **Page transitions** | Site-wide | Cross-document View Transitions (`@view-transition`): the match card morphs into the match-page header. Browsers without support get a normal page load |
| **Me vs. Meltzer meter** | Match page, /me-vs-meltzer | A tug-of-war bar that slides to show who rated it higher |

**Rules (from NCV, mandatory):**
- **An effects toggle** in the menu sets `body.pyro`; all motion hangs off that class. It defaults to on and is remembered per visitor.
- `prefers-reduced-motion: reduce` turns all motion off, whatever the toggle says.
- Canvas and rAF loops run only while visible (IntersectionObserver) and pause when the tab is hidden.
- Tilt and pointer effects are for `(hover:hover) and (pointer:fine)` only.
- Performance budget: a Lighthouse performance score of 90+ on mobile. Effects scripts load deferred and stay under ~25 KB total. No animation libraries. The only vendored script allowed is a tiny particle helper, if canvas code gets large.
- Content must never depend on an effect: everything is readable with JS off.

### 12.3 Theme picker

The same engine as the Cybercore project sites, so the wrestling site gets every registry palette plus its own mashups.

- **Registry:** `https://cybercore-tech.github.io/data` (`cybergrid.json` + `themes/<family>/<name>.json`, 11-slot palettes). It's served with `access-control-allow-origin: *`, so a Cloudflare Pages site can fetch it. `SITE.dataRoot` points there.
- **Menu:** a "THEME" button in the header and in the drawer opens a dark categorized listbox: **Signature Mashups** first, then the families (Cybercore Tech, Cyberdyne, Cyberpunk, Default/Classics, Dystopian, Neosynth, Omarchy Live, Synthwave). Today that's 82 registry themes plus the site mashups.
- **Persistence:** `localStorage` key `cybercore-theme`, and shareable links with `?theme=<id>`. (The key is the same as the kit's, but storage is per site, so the choice doesn't carry over from github.io.)
- **Offline fallback:** if the registry can't be reached, the built-in **TEN POUNDS OF GOLD** palette is used and the menu shows only the local mashup.
- **Slot → site role mapping:**

| Registry slot | Site variable | Used for |
|---|---|---|
| `bg` | `--ink` | Page background |
| `white` | `--canvas` | Main text |
| `panel` / `line` / `muted` | `--panel` / `--line` / `--muted` | Cards, borders, secondary text |
| `orange` | `--gold` | Stars, emblem, accents |
| `red` | `--red` | Modern Era, DUD, ropes |
| `cyan` | `--blue` | Territory DNA, links, ropes |
| `hot_pink` | `--hot` | Hover glows, pyro sparks |
| `acid_green` / `purple` | `--acid` / `--purple` | Badges, Me vs. Meltzer meter |

- **Graphics follow the theme.** The site inlines the logo, emblem, stars, badges and ropes as SVG using `var(--gold)` and the other variables, so they recolor with every theme. The fixed-color files in `brand/` stay for social cards, favicons and print. `brand/tools/themeable.py` writes the theme-following copies to `src/components/brand/`.

**Signature mashups.** Names approved by the user on 2026-10-16 (base = surfaces/text, accent = neons). The two WWF-era mashups avoid trademarked phrases:

| ID | Name | Base × Accent | Idea |
|---|---|---|---|
| `ten-pounds-of-gold` | **TEN POUNDS OF GOLD** | *built-in brand palette* (§7) | Default: arena black, canvas, championship gold |
| `starrcade-neon` | **STARRCADE NEON** | `cyberdyne-steel` × `synthwave-sunset` | Thanksgiving-night Starrcade glow |
| `wargames-steel` | **WARGAMES STEEL** | `blackbox-industrial` × `cyberdyne-t800` | Two rings, one cage, red steel |
| `nitro-nights` | **NITRO NIGHTS** | `neosynth-core` × `cyberpunk-neon` | Monday Nitro, mid-90s neon |
| `dome-show` | **DOME SHOW** | `tokyo-night` × `neosynth-plasma` | Wrestle Kingdom at the Tokyo Dome |
| `bunkhouse` | **BUNKHOUSE** | `gruvbox-dark` × `dystopian-ash` | Denim, boots and dust; the Bunkhouse Stampede |
| `red-and-yellow` | **RED & YELLOW** | `dystopian-ash` × `cyberdyne-t800` | The 1980s WWF: yellow and red under the arena lights |
| `attitude` | **ATTITUDE** | `demon` × `cyberdyne-judgment` | Late-90s WWF: black with scratched-in red |

Before launch, each mashup gets a contrast check (WCAG AA for body text) in both the hub and the match-page layout.

---

## 13. Author's Desk, accounts & forum

Added 2026-10-16. The site stays static and fast; everything interactive runs as **Cloudflare Pages Functions** (`functions/`) with a **D1 database** (`workrate-report`, binding `DB`, schema in `migrations/`).

### 13.1 Author's Desk (built in Phase 2A; Columns tab added in 2B)

A private page at **`/desk/`** where the owner writes and publishes reviews. It isn't linked anywhere on the public site, is `noindex`, and is blocked in `robots.txt`.

| Piece | How it works |
|---|---|
| **Sign-in** | One password. Only a PBKDF2-SHA256 hash (100,000 iterations, the Workers maximum) is stored, as the Pages secret `ADMIN_PASSWORD_HASH`, set with `node scripts/set-desk-password.mjs`. |
| **Session** | A signed, HttpOnly, Secure, SameSite=Strict cookie (`wr_desk`, 12 hours), HMAC'd with the `SESSION_SECRET` Pages secret. Rotating that secret signs every session out. |
| **Brute force** | 5 failed attempts per IP, or 50 from everyone, within 15 minutes locks sign-in (D1 table `desk_login_attempts`). |
| **CSRF** | Every write must come from the site's own Origin with a JSON body. |
| **Publishing** | **Decided 2026-10-16: live right away.** Publish validates the review with the same rules as the site's schema (5-star cap and all), writes the Markdown file and commits it to `main` through the GitHub API, using a fine-grained token (`DESK_GITHUB_TOKEN`: this repo only, Contents read/write). Cloudflare rebuilds in about a minute. Commits use the cybercore-tech noreply identity. Only `src/content/matches/` and `src/content/wrestlers/` can be written. This is the one exception to branch + PR, for the owner's content only. |
| **Safety net** | Every publish is a Git commit (undo = revert) and is logged in D1 (`desk_publish_log`). If a file ever failed the build, Cloudflare keeps the last good version live. |
| **Drafts** | Saved in the owner's browser as you type, and restored when you reopen the match. |
| **Editor** | Match list with search, every match field, wrestler chips with quick-add, a 0.01-precision rating slider with an exact box, ±0.01/±0.25 nudges and live stars (plus DUD and negatives), Meltzer's rating, YouTube link → ID with thumbnail, where to watch, review with live preview and word count, DNA, tags, verify list, featured toggle. |

### 13.2 Member accounts (planned, Phase 3)

Modeled on Neon Coffin Video's Midnight Lounge (`~/Webdev/NeonCoffinVideo/website/COMMUNITY.md`, migrations `0001` and `0007`), which is already proven in production:

- **Google sign-in:** server-side authorization-code flow with PKCE, one-use browser-bound `state`, verified userinfo. Sessions are hashed server-side in HttpOnly Secure SameSite cookies and revoked on logout. Google access tokens and real names aren't stored. The email is kept privately for authentication only.
- **Profiles** at `/u/<handle>`: pseudonymous handle (changeable), display name, avatar (wrestling-themed presets plus optional upload), bio, favorite era/promotion/wrestler, "watching since" year, public/members/private visibility.
- **The owner's account:** a Pages secret `ADMIN_GOOGLE_SUB` marks the owner's Google account as admin/moderator. The desk can then also accept that Google sign-in, with the password kept as a fallback.
- **Fan ratings (recommended):** members rate matches on the same 5-star scale, and match pages show a third column (**Mine · Meltzer · Fans**).

### 13.3 Forum options: **decided 2026-10-16, option C**

The user chose **C (A + B hybrid)**: an NCV-style D1 forum plus an automatic "Discuss this match" thread on every review, alongside fan ratings (§13.2). The comparison is kept below for the record.

| Option | What it is | Pros | Cons |
|---|---|---|---|
| **A. Custom D1 forum** *(recommended)* | Adapt NCV's Midnight Lounge: rooms, threads, replies, spoiler tags, reactions, followed threads, reports + moderator desk, per-member rate limits | Same Google accounts and profiles; free tier; full control and design; proven code to adapt; can link threads to matches and wrestlers | The most work; we run moderation ourselves |
| **B. Match discussions only** | No boards; each match, wrestler and DNA page gets a comment thread | Simplest; keeps talk on-topic | No general chat; less of a community hub |
| **C. A + B hybrid** | The A forum, plus an automatic "Discuss this match" thread on every match page that lives in the forum | Best of both; reviews drive forum traffic | Slightly more than A |
| **D. Hosted forum** (Discourse, Flarum) | A separate forum app on a subdomain | Mature moderation tools out of the box | Monthly cost or a server to run; separate accounts/SSO; doesn't match the site |
| **E. Discord** | A community server linked from the site | Zero build; real-time chat | Off-site; no profiles or ratings on the site; not searchable |

Room ideas for A/C (names to choose together): Main Event (general), The Vault (classic), Modern Era, Puroresu, Indies, Star Ratings Debate, Fantasy Booking, Live Thread (show nights).
