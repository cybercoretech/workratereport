-- Author's Desk: login attempts for rate limiting (BLUEPRINT §13).
-- User accounts (Google sign-in), profiles and the forum get their own
-- migrations later.
CREATE TABLE IF NOT EXISTS desk_login_attempts (
  ip TEXT NOT NULL,
  at INTEGER NOT NULL,      -- unix seconds
  ok INTEGER NOT NULL       -- 1 = success, 0 = failure
);
CREATE INDEX IF NOT EXISTS desk_login_attempts_ip_at ON desk_login_attempts (ip, at);

-- Audit trail of everything published from the desk.
CREATE TABLE IF NOT EXISTS desk_publish_log (
  at INTEGER NOT NULL,
  path TEXT NOT NULL,
  commit_sha TEXT,
  title TEXT
);
