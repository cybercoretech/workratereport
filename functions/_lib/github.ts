// Minimal GitHub Contents API client for publishing content files.
import { b64, unb64 } from './crypto';
import type { Env } from './env';

// Commits are attributed to the darkstardevx noreply address so no
// personal email is ever published (see the repo's git identity rules).
const IDENTITY = { name: 'darkstar', email: '19244308+darkstardevx@users.noreply.github.com' };

const api = (env: Env, path: string) =>
  `https://api.github.com/repos/${env.CONTENT_REPO}/contents/${path.split('/').map(encodeURIComponent).join('/')}`;

const headers = (env: Env) => ({
  authorization: `Bearer ${env.DESK_GITHUB_TOKEN}`,
  accept: 'application/vnd.github+json',
  'x-github-api-version': '2022-11-28',
  'user-agent': 'workrate-report-desk',
});

// Thrown when GitHub refuses a call; handlers surface these to the desk UI
// instead of letting a bare 500 render as the generic "Publishing failed".
export class GitHubError extends Error {}

export async function getFile(env: Env, path: string): Promise<{ sha: string; text: string } | null> {
  const res = await fetch(`${api(env, path)}?ref=${encodeURIComponent(env.CONTENT_BRANCH)}`, { headers: headers(env) });
  if (res.status === 404) return null;
  if (!res.ok) throw new GitHubError(`GitHub read ${res.status}`);
  const body = (await res.json()) as { sha: string; content: string };
  return { sha: body.sha, text: new TextDecoder().decode(unb64(body.content.replace(/\n/g, ''))) };
}

export async function putFile(env: Env, path: string, text: string, message: string, sha?: string) {
  const res = await fetch(api(env, path), {
    method: 'PUT',
    headers: { ...headers(env), 'content-type': 'application/json' },
    body: JSON.stringify({
      message, branch: env.CONTENT_BRANCH, content: b64(new TextEncoder().encode(text)),
      author: IDENTITY, committer: IDENTITY, ...(sha ? { sha } : {}),
    }),
  });
  if (!res.ok) {
    const detail = await res.text();
    throw new GitHubError(`GitHub write ${res.status}: ${detail.slice(0, 200)}`);
  }
  const out = (await res.json()) as { commit: { sha: string; html_url: string } };
  return out.commit;
}
