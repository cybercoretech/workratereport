-- Member accounts (Google sign-in), sessions and fan ratings (BLUEPRINT §13.2).
CREATE TABLE IF NOT EXISTS members (
  id TEXT PRIMARY KEY,                     -- random id
  google_sub TEXT UNIQUE NOT NULL,         -- Google's stable account id; never shown
  email TEXT NOT NULL,                     -- private; used only to contact/authenticate
  handle TEXT UNIQUE NOT NULL COLLATE NOCASE,
  display_name TEXT NOT NULL DEFAULT '',
  bio TEXT NOT NULL DEFAULT '',
  avatar TEXT NOT NULL DEFAULT 'preset:belt',
  favorite_era TEXT NOT NULL DEFAULT '',
  favorite_promotion TEXT NOT NULL DEFAULT '',
  favorite_wrestler TEXT NOT NULL DEFAULT '',
  watching_since INTEGER,
  visibility TEXT NOT NULL DEFAULT 'public', -- public | members | private
  role TEXT NOT NULL DEFAULT 'member',       -- member | moderator | admin
  banned INTEGER NOT NULL DEFAULT 0,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL
);

-- Session tokens are stored hashed (SHA-256); the raw token only lives in the cookie.
CREATE TABLE IF NOT EXISTS member_sessions (
  token_hash TEXT PRIMARY KEY,
  member TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  created INTEGER NOT NULL,
  expires INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS member_sessions_member ON member_sessions(member);
CREATE INDEX IF NOT EXISTS member_sessions_expires ON member_sessions(expires);

-- One-use OAuth state, bound to the browser that started sign-in (PKCE verifier kept server-side).
CREATE TABLE IF NOT EXISTS oauth_states (
  state TEXT PRIMARY KEY,
  browser_hash TEXT NOT NULL,
  verifier TEXT NOT NULL,
  return_to TEXT NOT NULL DEFAULT '/',
  expires INTEGER NOT NULL
);

-- Fan ratings: one per member per match, 0–5 in quarter steps.
CREATE TABLE IF NOT EXISTS fan_ratings (
  member TEXT NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  match_id TEXT NOT NULL,
  rating REAL NOT NULL,
  created INTEGER NOT NULL,
  updated INTEGER NOT NULL,
  PRIMARY KEY (member, match_id)
);
CREATE INDEX IF NOT EXISTS fan_ratings_match ON fan_ratings(match_id);

-- Fixed-window rate limits keyed by bucket (e.g. "auth:<ip>", "rate:<member>").
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT PRIMARY KEY,
  window INTEGER NOT NULL,
  count INTEGER NOT NULL
);
