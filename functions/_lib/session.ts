// Stateless signed session cookie: "<expires>.<nonce>.<hmac>".
import { b64url, sign, verifySig } from './crypto';

export const COOKIE = 'wr_desk';
export const SESSION_HOURS = 12;

export async function createSession(secret: string) {
  const exp = Math.floor(Date.now() / 1000) + SESSION_HOURS * 3600;
  const nonce = b64url(crypto.getRandomValues(new Uint8Array(16)));
  const payload = `${exp}.${nonce}`;
  const value = `${payload}.${await sign(secret, payload)}`;
  return `${COOKIE}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_HOURS * 3600}`;
}

export const clearSession = () => `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export async function hasSession(request: Request, secret: string) {
  const cookie = request.headers.get('cookie') ?? '';
  const raw = cookie.split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return false;
  const parts = raw.split('.');
  if (parts.length !== 3) return false;
  const [exp, nonce, sig] = parts;
  if (!/^\d+$/.test(exp) || Number(exp) < Date.now() / 1000) return false;
  return verifySig(secret, `${exp}.${nonce}`, sig);
}
