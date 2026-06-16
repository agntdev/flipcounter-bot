# FlipCounter Bot — refined brief

Summary

A minimal Telegram bot that flips a coin on demand and counts how many flips each Telegram user has done. Commands: /flip and /count. Data persisted in a local SQLite database.

Audience

Telegram users who want a tiny, per-user coin-flip counter (works in private chats and groups).

Core entities

- User
  - telegram_id (INTEGER, unique) — primary identifier
  - username (TEXT, nullable)
  - flips_count (INTEGER) — total flips for this user
  - last_flip_at (DATETIME, nullable)
- Flip (audit log)
  - id (INTEGER PK)
  - user_id (FK -> users.id)
  - result (TEXT ENUM: 'heads'|'tails')
  - created_at (DATETIME)
  - source_chat_id (INTEGER) — Telegram chat id where /flip was invoked

Integrations & notification targets

- Telegram Bot API (Bot token provided via environment variable BOT_TOKEN)
- Local SQLite file for persistence (default path: ./data/flips.db)
- No external notification targets or webhooks by default (long-polling)

Interaction flows

1) /flip
- Who triggers: any Telegram user (private chat or group).
- Behaviour:
  - Determine user by message.from.id and upsert a users row (store username if present).
  - Randomly choose 'heads' or 'tails' with equal probability.
  - In a single DB transaction: insert flips row (user_id, result, source_chat_id), increment users.flips_count, update last_flip_at.
  - Reply in the same chat where command came from with a short message, e.g. "🎲 You flipped: Heads. Total flips: 7." (use localized capitalization 'Heads'|'Tails').
  - If the bot is used in a group, the reply is posted to the group (no DMs by default).

2) /count
- Who triggers: any Telegram user.
- Behaviour:
  - Look up users row by telegram_id; if not found, reply "You haven't flipped yet (0 flips)." Otherwise reply "You've flipped N times." Include last_flip_at optionally.
  - Reply in the same chat where command came from.

Edge and error handling

- If DB is unavailable, reply with a short error message asking to try later and log the error.
- Validate Telegram updates and ignore non-command messages.

Persistence

- SQLite DB at ./data/flips.db (configurable via environment variable DATABASE_PATH).
- On startup, create tables if missing. Provide SQL schema (below).
- All writes use transactions to keep counters consistent under concurrent requests.

SQL schema (to be applied at startup)

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER NOT NULL UNIQUE,
  username TEXT,
  flips_count INTEGER NOT NULL DEFAULT 0,
  last_flip_at DATETIME
);

CREATE TABLE IF NOT EXISTS flips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  result TEXT NOT NULL CHECK(result IN ('heads','tails')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  source_chat_id INTEGER
);

Payments

- None.

Non-goals

- No user authentication beyond Telegram identity.
- No multi-user leaderboards, no analytics dashboards, no web UI.
- No payment handling, no external backups by default.

## Assumptions & defaults

1. Track counts per Telegram user (telegram_id) across chats — rationale: owner wrote "this user"; simplest global per-user counter.
2. Persist data in a local SQLite file at ./data/flips.db (env var DATABASE_PATH allowed) — rationale: owner asked SQLite; local file is simplest.
3. Use long-polling by default (no webhook) — rationale: simplest deploy for small bot and easier local testing.
4. Bot replies in the same chat where the command was issued (private or group) and attributes flips to message.from.id — rationale: predictable UX and minimal configuration.
5. Provide an audit table (flips) in addition to aggregated counter — rationale: useful for debugging and ensures counters can be audited; storage cost is negligible.
6. Environment variables: BOT_TOKEN (required), DATABASE_PATH (optional, default ./data/flips.db) — rationale: standard secret management.
7. Concurrency handled via SQLite transactions; code should serialize writes to avoid race conditions (use BEGIN IMMEDIATE or a lightweight mutex) — rationale: maintain correct counts under concurrent /flip calls.
8. No telemetry or external notifications will be sent by default; logs are written to stdout/stderr for host to capture — rationale: minimal, privacy-preserving default.

This brief contains everything the build needs: exact commands, DB schema, behavior in private/group chats, error handling, environment variables, and non-goals. Implementations may add minor logging and health-check endpoints, but must not change the command behaviors or persistence semantics above.