#!/usr/bin/env node
// Sets the Author's Desk password on Cloudflare without it ever being
// stored in plain text: asks for it twice (hidden), derives a PBKDF2 hash,
// and pipes only the hash into `wrangler pages secret put`.
// Usage: node scripts/set-desk-password.mjs   (run in your own terminal)
import { spawn } from 'node:child_process';
import { webcrypto as crypto } from 'node:crypto';
import readline from 'node:readline';

const ITERATIONS = 100_000; // Cloudflare Workers' PBKDF2 maximum
const PROJECT = 'workrate-report';

function ask(prompt) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(prompt)) rl.output.write(s); };
    rl.question(prompt, (answer) => { rl.close(); process.stdout.write('\n'); resolve(answer); });
  });
}

if (!process.stdin.isTTY) { console.error('Run this in a real terminal so the password stays hidden.'); process.exit(1); }
const pw = await ask('New desk password (12+ characters): ');
if (pw.length < 12) { console.error('Too short: use at least 12 characters.'); process.exit(1); }
if ((await ask('Type it again: ')) !== pw) { console.error("Those didn't match. Nothing was changed."); process.exit(1); }

const salt = crypto.getRandomValues(new Uint8Array(16));
const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: ITERATIONS }, key, 256);
const hash = `pbkdf2-sha256$${ITERATIONS}$${Buffer.from(salt).toString('base64')}$${Buffer.from(bits).toString('base64')}`;

const child = spawn('npx', ['wrangler', 'pages', 'secret', 'put', 'ADMIN_PASSWORD_HASH', '--project-name', PROJECT], { stdio: ['pipe', 'inherit', 'inherit'] });
child.stdin.end(hash);
child.on('exit', (code) => {
  if (code === 0) console.log('\n✅ Desk password set. It takes effect on the next deployment.');
  process.exit(code ?? 1);
});
