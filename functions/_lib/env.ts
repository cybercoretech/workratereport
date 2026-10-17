export interface Env {
  DB: D1Database;
  ASSETS: Fetcher;
  CONTENT_REPO: string;
  CONTENT_BRANCH: string;
  /** pbkdf2-sha256$<iterations>$<salt b64>$<hash b64>, from scripts/set-desk-password.mjs */
  ADMIN_PASSWORD_HASH?: string;
  /** Random secret that signs desk session cookies. Rotating it logs every session out. */
  SESSION_SECRET?: string;
  /** Fine-grained GitHub token: this repo only, Contents read/write. */
  DESK_GITHUB_TOKEN?: string;
  /** Google OAuth client (Web application) for member sign-in. */
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  /** The owner's Google subject id: that member becomes admin. */
  ADMIN_GOOGLE_SUB?: string;
  /** Test-only overrides for Google's endpoints (local mock). Never set in production. */
  GOOGLE_AUTH_URL?: string;
  GOOGLE_TOKEN_URL?: string;
  GOOGLE_USERINFO_URL?: string;
}

export const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => json({ ok: false, error, ...extra }, status);
