#!/usr/bin/env node
// Loads the Google OAuth client into Cloudflare Pages secrets straight from
// the JSON file Google gives you, so the secret is never pasted anywhere.
//   node scripts/configure-google.mjs ~/Downloads/client_secret_XXXX.json
// Then delete that JSON file. Secrets apply on the next deployment.
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const file = process.argv[2];
if (!file) { console.error('Usage: node scripts/configure-google.mjs <path to client_secret_*.json>'); process.exit(1); }
const j = JSON.parse(readFileSync(file, 'utf8'));
const c = j.web || j.installed;
if (!c?.client_id || !c?.client_secret) { console.error('That file has no web client_id/client_secret. Download the JSON for a "Web application" OAuth client.'); process.exit(1); }
if (!j.web) console.warn('Warning: this is not a "Web application" client. Sign-in needs that type.');
const want = 'https://workrate-report.pages.dev/api/auth/callback';
if (j.web && !(j.web.redirect_uris || []).includes(want)) console.warn(`Warning: add this Authorized redirect URI in Google Cloud: ${want}`);
for (const [name, value] of [['GOOGLE_CLIENT_ID', c.client_id], ['GOOGLE_CLIENT_SECRET', c.client_secret]]) {
  const r = spawnSync('npx', ['wrangler', 'pages', 'secret', 'put', name, '--project-name', 'workrate-report'], { input: value, stdio: ['pipe', 'inherit', 'inherit'] });
  if (r.status !== 0) process.exit(r.status ?? 1);
}
console.log('\n✅ Google sign-in secrets set. Redeploy (merge, or Retry deployment) to switch sign-in on, then delete the JSON file.');
