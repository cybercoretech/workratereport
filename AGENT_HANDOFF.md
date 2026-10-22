# 🏆 The Workrate Report: Agent Handoff

The state of the project for the next agent (or person). Update it with every phase or significant change.

## 📍 Repository state (2026-10-22)

- **Repo:** `github.com/cybercoretech/workratereport` (public) · local `~/Webdev/workrate-report`. **The old `cybercore-tech` account was suspended and the repo was recreated under `cybercoretech` on 2026-10-17** (all branches bulk-pushed within seconds of creation). GitHub PR numbering restarted: old-repo PRs #1–#11 below exist only in git history; see "PR history" for both series.
- **`main`: `ff9f405`** — after the migration repair of 2026-10-22 (new-repo PRs): **#1** org-links fix, **#2** restored everything that had been stranded on `content/full-bios` (Phase 3, the desk fix, the 149 full bios, Phase 3B-A members) onto `main`, **#3** added the `workflow_dispatch` trigger, **#4** documented that state, **#5** the 12-preset avatar set (all 8 originals redrawn + emblem, ladder, referee, five stars). `npm run check`, `npm run build` and the contrast audit all pass on it, and CI ran green on every PR.
- **Hosting: auto-deploy RECONNECTED (2026-10-22).** The user re-pointed the project at `cybercoretech/workratereport` (repo_id `1422923538`, production branch `main`) via dashboard → Settings → Builds & deployments → Connect to Git — the API cannot do it (`PATCH …/source` is accepted and silently ignored). Push-to-deploy is proven end-to-end: merging PR #5 built `ff9f405` into deployment `3da63faa` with no manual step. Ad-hoc `POST …/pages/projects/workrate-report/deployments` with `{"branch":"main"}` also works (used whenever an env change needed a build). Live site verified serving the full bios (org refs corrected, `/on-this-day/` etc. 200).
- **Desk publish path:** `CONTENT_REPO` env var fixed to `cybercoretech/workratereport` in **both** preview and production (Cloudflare API `PATCH` on `deployment_configs.*.env_vars` **merges** — verified it does not wipe sibling vars or the secrets; D1 binding intact). The user has created and set a **new** `DESK_GITHUB_TOKEN` (presence verified alongside the other secrets). **Unproven: no real desk publish has been run since** — the first save from `/desk/` is the end-to-end test of the token (the admin password is the user's; never handle it).
- **Pages secrets (production):** `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `DESK_GITHUB_TOKEN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `ADMIN_GOOGLE_SUB` (= `114042096578887983540`, the owner's Google sub — makes the member `darkstar` the admin). Never choose or see the user's password; never put a broad gh CLI token into Cloudflare.
- **Zero-runs CI incident (resolved 2026-10-22):** from creation until 2026-10-22 02:28 UTC the repo had **zero** workflow runs although every API setting read `enabled: true` / `allowed_actions: all` / workflow `active` — the workflow files arrived in the initial bulk push, and GitHub gates those behind a **UI-only** acknowledgment ("Workflows aren't being run on this repository… I understand my workflows and want to enable them") that the API does not expose. It was acknowledged ~02:12–02:28 and PR #3's events then fired within 3 s (both runs green). **If CI goes silent again, check the Actions tab banner before trusting the API settings.** Note the `events` API feed also drops `PushEvent`s (best-effort) — its silence proves nothing.
- **CI:** `.github/workflows/build.yml` runs `npm ci`, `npm run check`, `npm run build` and `node scripts/contrast-audit.mjs` on PRs and pushes to `main`; it also has `workflow_dispatch` (manual Run-workflow button).
- **Google sign-in (members): DONE (2026-10-22).** The user created the OAuth client (consent screen External, Testing mode with their account as test user; redirect URI `https://workrate-report.pages.dev/api/auth/callback`) and ran `node scripts/configure-google.mjs`, which pipes ID/secret straight into wrangler. Verified live: `/api/auth/google` 302s to Google with PKCE (S256) + state; a sign-in created the member row, and with `ADMIN_GOOGLE_SUB` set a second sign-in flipped it — D1 shows `handle=darkstar, role=admin`. **Promotion happens only inside the sign-in callback: setting/changing `ADMIN_GOOGLE_SUB` requires one more sign-in to take effect.** Local `GOOGLE_*_URL` mock overrides exist for testing only — never set them in production.
- **⚠️ `wrangler.toml` [vars] reconciliation (learned 2026-10-22, cost hours):** because the repo ships `wrangler.toml` with a `[vars]` section, Cloudflare reconciles **plain-text** project env vars against that file — a plain var **not declared in `[vars]` is silently dropped after the next deployment**. This ate `ADMIN_GOOGLE_SUB` twice (each time right after a deploy triggered post-PATCH; the PATCH echo showed 8 keys, the next GET showed 7). Vars matching `[vars]` (`CONTENT_REPO`, `CONTENT_BRANCH`) and **all secrets** are exempt. **Rule: every production env var beyond `CONTENT_*` must be a Pages secret (`wrangler pages secret put`), never plain text.** Diagnose with `GET …/pages/projects/workrate-report` → `deployment_configs.production.env_vars`.
- **New-hostname DNS:** for the first minutes after creation, `pages.dev` names can return NXDOMAIN (Cloudflare's nameservers update unevenly; 60 s negative TTL). Check with `dig @1.1.1.1` before assuming a problem.

## ✅ Resume checklist

1. Read this file, `README.md`, then `BLUEPRINT.md` (§11 decisions, §12 nav/effects/themes).
2. `git status`, `git log --oneline -5`; check PRs with `GH_TOKEN=$(gh auth token -u darkstardevx) gh pr list -R cybercoretech/workratereport`.
3. `npm install && npm run check && npm run build` before changing anything.
4. Before committing, `git config --show-scope --get user.email` must be `global  19244308+darkstardevx@users.noreply.github.com`. Abort otherwise.
5. Work on a branch, one PR per phase, never stacked. The user merges. Open PRs against `cybercoretech/workratereport` using the `darkstardevx` account.
6. Every change updates README, BLUEPRINT (if the plan changes), this file, the Wiki page `~/Wiki/src/web/workrate-report.md`, and the vault note `~/Vaults/blackbox-notes/Projects/Workrate-Report.md`.

## 🧭 Decisions already made

- **Name:** The Workrate Report. "Card Subject to Change" and "The Hard Cam" were taken.
- **Focus:** modern-first; the Classic Vault = NWA/Crockett, WCW **and WWF** (user, 2026-10-16: "we definitely need to add WWF / WWE as well"). Modern WWE sits in the modern section. Territories are supporting history.
- **Ratings:** 5-star scale, DUD and negatives. **5 is the max** and **ours are precise to 0.01** (user, 2026-10-16), enforced in `src/content.config.ts` and `functions/_lib/content.ts`. Meltzer's stay quarter steps. Meltzer's go past 5 and show as "+1" / "6★".
- **Site structure:** every section = a hub with highlights + sub-pages; the homepage = a highlights reel.
- **Hamburger + Pyro effects + Cybercore theme picker** (BLUEPRINT §12). References: NCV `store-nav.*`, `night-effects.*`, `neon-polish.*`; SigilWard `docs/app.js`.
- **Mashup names approved** (2026-10-16): Ten Pounds of Gold (default), Starrcade Neon, WarGames Steel, Nitro Nights, Dome Show, Bunkhouse, plus WWF-era Red & Yellow and Attitude (deliberately no trademarked phrases like "Hulkamania" or "Attitude Era").
- **DNA launch pairs:** MJF ↔ Ric Flair (flagship), Cody Rhodes ↔ Dusty Rhodes.
- **Launch matches:** the original 10 minus open slots 5–6, plus Savage–Steamboat WM3 and Bret–Austin WM13.
- **Contact:** info@cybercoretech.net.
- **Promotions:** ECW added to the Vault, ROH to the modern side; then (user, 2026-10-16) NXT, MLW, GCW, HOG, West Coast Pro, PWG, RevPro, Progress, CZW, CMLL, NWA and Evolve. 26 in all, each with a `/promotions/<slug>/` page. `tier: major | independent` drives the page sections. The modern `nwa` is Billy Corgan's NWA; the 1980s NWA stays `jcp-nwa`.
- **Logos:** only free-license Commons logos (WWE, AEW, ROH, GCW, JCP, WCW); everyone else gets the site's own name badge, never a copy of their artwork. Logos sit on a light plate so dark marks stay visible.
- **Photos only from Wikimedia Commons under free licenses**, credited per profile and on `/credits/`. Facts from Wikidata (CC0). Bios were written by Claude as drafts for the user to edit; they were fact-checked and 16 claims corrected before shipping.
- **Desk publishing goes live right away** (user, 2026-10-16): commits to `main` via the GitHub API, limited to `src/content/matches|wrestlers/`. This is the only exception to branch + PR.
- **Cloudflare resources:** the user approved Claude creating them with wrangler (D1 created 2026-10-16).
- **Forum = option C** (user, 2026-10-16): NCV-style D1 forum + an automatic "Discuss this match" thread per review, with fan ratings. Build it in Phase 3B.
- **Roster:** 138 wrestlers (user, 2026-10-16: "top stars and some mid-card guys that pushed to the top; no generic wrestlers, jobbers or crappy gimmicks"). Chris Benoit and Jimmy Snuka are **permanently excluded** (user confirmed 2026-10-16: sensitive, avoid blowback). For any of their matches, ask the user: skip / name-only / case by case.
- **Stack:** Astro 7.3.8 static, plain JS in `public/js` (no framework, no animation library), Google Fonts (Anton, Inter, Source Serif 4).

## 🏗️ Architecture

- **Content collections** (`src/content.config.ts`): `matches`, `wrestlers`, `promotions` (group modern/vault/territory), `factions`, `dna`. References are checked at build time.
- **`src/lib/site.ts`:** `SECTIONS` (drives header, drawer and footer), sort helpers, `pick()` for highlight blocks (featured first).
- **`src/lib/ratings.ts`:** rating text/labels; `value()` for sorting (unrated = -Infinity, DUD = 0).
- **Theme engine** `public/js/theme.js`: fetches `cybergrid.json` + palettes cross-origin, maps registry slots to site vars (orange→`--gold`, cyan→`--blue`...), caches the resolved palette in `localStorage` (`wr-theme-palette`) so the inline boot script in `Base.astro` paints it before first render.
- **Desk backend** `functions/api/desk/*`: `_middleware.ts` (config check, Origin + JSON for writes, session) → `login` (PBKDF2 verify, D1 rate limit), `logout`, `session`, `match` (PUT: validate via `_lib/content.ts`, which mirrors the schema, then commit), `wrestler` (POST), `log`. The catalog of valid ids comes from the deployed `/data/catalog.json` (built by `src/pages/data/catalog.json.ts`), plus a GitHub lookup for wrestlers added since the last build.
- **Effects** `public/js/pyro.js`: `html.pyro` gates everything; toggle key `wr-pyro`; reduced-motion removes the class; canvas only on 5-star reveal; tilt/spotlight need a fine pointer.
- **Graphics:** inline SVGs in `src/components/brand/` are *generated* by `brand/tools/themeable.py` (fixed colors → CSS vars). Don't hand-edit them.

## ⚠️ Invariants / gotchas

- **Legal:** embed official YouTube uploads only; never link unofficial uploads. Don't scrape Cagematch; enter Meltzer ratings by hand.
- **Never invent the author's ratings or reviews.** `my_rating: null` and empty bodies render as "Not rated yet" / "being written". Profile, history and DNA text is the author's to write.
- Match facts marked in `verify:` are shown publicly as "Being verified". Clear them only after checking. Only Okada–Omega WK11 has a Meltzer rating on file (6), because it's the one I was certain of.
- `public/js/*` files are served with immutable caching; `Base.astro` appends `?v=<sha256>` automatically, so no manual bumping.
- Anton has no `★` glyph. Brand stars are polygons; CSS stars use an SVG mask.
- Every effect must respect `html.pyro`, `prefers-reduced-motion`, visibility pausing and fine-pointer gating.
- **Wikidata name collisions:** "Steve Williams" matched Stone Cold and "Rey Mysterio" matched Rey Misterio Sr. Both are pinned in `scripts/fetch-wrestler-data.mjs` (`PIN`). Check every new wrestler's `wikidata_label` and birth year after fetching.
- **Class-name collisions:** don't name component classes `card` or `hero` (global rules). The photo frame uses `is-card` / `is-hero`.
- **Promotion facts:** hand-checked frontmatter wins over Wikidata. Wikidata had Evolve's founder wrong (it's Sapolsky and Hamaoui, not Davey Richards), lists every past ROH owner, and has TNA's old Impact logo. Unconfirmed facts are left blank (e.g. West Coast Pro and HOG owners), never guessed.
- **Astro 7 preview:** only one preview server runs at a time; stop it with `npx astro preview stop`.
- **On This Day is client-side:** the site is static, so `public/js/onthisday.js` picks "today" in the visitor's time zone from `/data/on-this-day.json` (built by `src/pages/data/on-this-day.json.ts`). The 366 `/on-this-day/<mm-dd>/` pages are static.
- **Bell:** WebAudio synthesis in `pyro.js` (`window.WRBell`), off by default (`wr-bell`), and only ever played on a click, because browsers block audio without a user gesture.
- **Members:** Google OAuth in `functions/api/auth/{google,callback,logout}.ts`, sessions in `_lib/members.ts` (hashed tokens, cookie `wr_member`), `/api/me` (GET/PATCH), `/api/members/<handle>`, `/api/ratings/<match>` (GET/PUT/DELETE, quarter stars). `/u/<handle>/` is served by `functions/u/[[path]].ts` → the static `/u/` shell. Decisions: only `openid email`, 13+, 12 preset avatars (no uploads yet), the admin is set by `ADMIN_GOOGLE_SUB`. `GOOGLE_*_URL` overrides exist **for local mock testing only**; never set them in production.
- **Front-end race:** page scripts must wait on `WRMember.ready` (a promise), not the `wr:member` event, which can fire before a deferred page script loads (this blanked `/account/` once).
- **Bios:** all 149 written by Claude on 2026-10-16 from Wikipedia facts (original prose; never copy Wikipedia text, which is CC BY-SA). They were checked twice for accuracy and over 20 claims were corrected. `breakout` / `signature_match` / `gimmicks` live in frontmatter; ring names, trainers and real names come from `scripts/fetch-wikipedia-facts.mjs` into `wrestler-facts.json`. Benoit isn't named anywhere (user decision).
- **Contrast:** never use `var(--red)`/`var(--blue)` for text; use `--red-text`/`--blue-text`. The CI audit fails if any theme drops below target.
- `functions/` has its own tsconfig (Workers types) and is excluded from the root one; `npm run check` runs both.
- **When the content schema changes, update `functions/_lib/content.ts` too**, or the desk could publish a file the build rejects. Cloudflare would then keep the old version live, but the review wouldn't appear.
- Global `[hidden] { display: none !important }` is relied on: component display rules would otherwise unhide elements.
- Duplicate inline SVG gradient ids (`wr-gold`) are intentional and identical. If one is ever recolored differently, give it its own id.

## 🧪 How Phase 1 was verified

- `npm run check`: 0 errors. `npm run build`: 83 pages.
- A test file with `my_rating: 6` failed the build ("Too big: expected number to be <=5").
- Headless Chromium screenshots at 1440px and 390px (home, match page) with reduced motion.
- A CDP-driven test: drawer opens (focus → close button), sub-menu expands, Escape closes and returns focus to ☰. The theme registry loaded 90 options, the ATTITUDE mashup and synthwave-miami applied, `?theme=` updated, and the console was clean.
- **Live site (2026-10-16):** all key routes 200, 404 page works, `_headers` applied (nosniff, referrer policy, frame options; immutable `/js/*`), and the CDP test passed against the live origin (90 themes, theme switching, drawer, clean console).
- **Not verified:** real phones, Safari/Firefox rendering of `@property` and view transitions (they degrade gracefully by design), and mashup contrast against WCAG AA (BLUEPRINT §12.3 still requires that check).

## 🔀 PR history

The first eleven PRs below are from the **old** `cybercore-tech/workratereport` repo (suspended 2026-10; they live on in git history). The recreated `cybercoretech/workratereport` restarted numbering — see the second list.

- **#1** Phase 0: brand assets, blueprint, README, handoff (merged).
- **#2** Phase 1: Astro skeleton, nav, theme picker, effects, launch content (merged).
- **#3** Docs: record the live Cloudflare Pages deployment (merged).
- **#4** Phase 2A: Author's Desk (merged).
- **#5** Roster to 138 wrestlers, 0.01-precision ratings, forum option C recorded (merged).
- **#6** Phase 2B: search, ECW/ROH, photos + facts + bios, lists, columns (+ desk), starter paths, Then & Now, events, feuds, contrast guard (merged).
- **#7** Promotions page: 26 companies with bios/facts/logos; 12 new promotions; 30 wrestlers tagged (merged).
- **#8** Phase 3: On This Day, Me vs. Meltzer scoreboard, ring bell (merged).
- **#9** Desk fix: typed wrestler names auto-add; "Live now" only after the rebuild (merged).
- **#10** Full wrestler bios for 149 (Wikipedia facts, original prose) (merged).
- **#11** Phase 3B-A: member accounts, profiles, fan ratings (merged before #10; #10 rebased onto it).

New repo (`cybercoretech`), 2026-10-21/22:

- **#1** fix: point links at the cybercoretech org (merged).
- **#2** Restore phases 3–3B + full bios onto `main` (the migration had stranded them on `content/full-bios`) (merged 2026-10-22).
- **#3** ci: add `workflow_dispatch` trigger (merged 2026-10-22; also proved CI live after the enablement fix).

## 🧪 How Phase 2A was verified

- `wrangler pages dev` locally with local D1, a test password, and `CONTENT_BRANCH=desk-test` (a throwaway branch, since deleted):
  - Unauthenticated session → 401; wrong password → 401 with tries left; foreign Origin → 403; right password → cookie, and the session works.
  - A rating of 6 → 422; add wrestler → commit; create match → commit; duplicate create → 409; update → commit; identical save → "unchanged"; publish log listed.
  - 5 failures → 429 lockout, and the correct password is refused while locked.
- The `desk-test` branch with the desk-written files passed `astro build`. Quotes, colons, Unicode, YouTube URL → ID and type slugging all came through, and all commits used the darkstardevx noreply identity.
- A CDP browser run: login screen, wrong-password message, sign-in, list (10 matches), open a match (fields + wrestler chips), rating slider (4.75), review preview, draft saved in localStorage, clean console.
- `wrangler pages functions build` compiled; `npm run check` clean for site and functions.
- **Not verified:** the live production desk, until the user sets `ADMIN_PASSWORD_HASH` + `DESK_GITHUB_TOKEN` and PR #4 deploys.

## 🧪 How Phase 2B was verified

- `npm run check` 0 errors; build 250 pages; Pagefind indexed 194 pages with a type filter.
- Live searches in Chromium: "steamboat" → feuds, profile and both matches; "starrcade" → the event page; "sabu" → his profile. No errors.
- Wikidata: 149/149 matched; 44 birth-year checks passed after fixing two collisions; 148 free photos (Brock Lesnar has none). Photos shrunk from 14 MB to 5.5 MB with metadata stripped.
- Contrast audit: 90 themes, 109 failing pairs before the guard, 0 after.
- Screenshots: wrestlers A–Z, Flair profile, Lesnar placeholder (390px), feud page, search; the theme drive test still lists 90 themes with no errors.

## ⏭️ Next

**Blocking / pending user steps (2026-10-22):**

1. **Desk publish smoke test:** the one unverified piece of today's repairs — log into `/desk/` and save any post to prove the new `DESK_GITHUB_TOKEN` end-to-end (the commit should arrive on `main` and auto-deploy).

**Content / product work:**

2. **Phase 3B community remainder:** the forum (option C: D1 forum + automatic "Discuss this match" thread per review + fan ratings — fan ratings shipped in 3B-A, the forum has not).
3. **Content for the author:** Vault promotion histories, starter paths, hand-picked lists, columns (the `paths`, `lists`, `columns` collections are scaffolded but empty), plus `verify:` flags still to clear.
