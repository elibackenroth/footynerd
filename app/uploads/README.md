# FootyNerd — real backend implementation

This is a working implementation of the backend handoff described in the
original `README.md` (auth, leaderboard, match rooms, Wordle persistence),
plus a frontend that reproduces the design prototype (`Soccer Quiz.dc.html`)
screen-for-screen. Nothing reads or writes `localStorage` for app data
anymore — everything shared across devices/browsers goes through the API
and a real database.

## Why this stack

The brief said Supabase (Postgres + Auth + RLS) *or* a custom Node/Postgres
API are both fine — "a custom Node/Postgres API is an equally valid
alternative if the team already has backend conventions to follow." This
implementation is that second option, with one adjustment: it uses SQLite
(via Node's built-in `node:sqlite`) instead of Postgres, so the whole app —
frontend and backend — runs with **zero `npm install`**, using only:

- Node's built-in `http` module (no Express)
- Node's built-in `node:sqlite` module (no `pg`, no ORM)
- Plain HTML/CSS/JS on the frontend (no React/build step)

This was a practical call for getting something you can actually run and
review immediately. All the SQL is plain, portable SQL, and every query
lives in `server/db.js` and `server/api.js` — nothing else touches the
database — so swapping in real Postgres (via `pg`) or Supabase later is a
matter of rewriting those two files, not a rearchitecture. See "Moving to
Postgres / Supabase" below.

## Requirements

- **Node.js 22.5 or newer** (needed for `node:sqlite`). Check with `node -v`.
- No other dependencies. No `npm install` step.

## Running it

```bash
npm start
# or: node server/server.js
```

Then open **http://localhost:8787**. The SQLite database file
(`footynerd.db`) is created automatically on first run, next to
`package.json`, and seeded with the 13 quizzes and 2 Wordle puzzles ported
directly from the prototype's data.

Delete `footynerd.db` (and `.db-shm` / `.db-wal`) at any time to reset all
data and reseed from scratch.

## What's implemented

Everything in the original handoff's "What needs a real backend" list:

1. **Authentication** — real email/password accounts (scrypt-hashed
   passwords, server-side sessions via an HttpOnly cookie). "Continue with
   Google" is fully wired OAuth 2.0 code (not a stub) — see
   `server/google-oauth.js` for the 60-second setup with real Google
   credentials. Without credentials it degrades to a clear "not configured"
   message instead of the prototype's fake `window.prompt`.
2. **Leaderboard** — computed live from a `quiz_attempts` table
   (`SUM(points) GROUP BY user`), not shipped to the client and aggregated
   there. Streaks are maintained server-side on `users.current_streak` /
   `longest_streak`.
3. **Match Room** — `matches` / `match_rounds` / `match_entries` tables. The
   share link is just `?match=<short-id>`, no encoded state in the URL. The
   waiting player's screen polls the server every 3s until the opponent's
   entry appears (see README's suggestion — "Supabase Realtime … or simple
   polling"). Guest play (name only, no account) works exactly as specced.
4. **Wordle** — puzzles live in a `wordle_puzzles` table; the secret word is
   never sent to the client. Guesses are scored server-side, and a signed-in
   player's attempt (guesses + status) persists in `wordle_attempts` with a
   one-attempt-per-user-per-puzzle constraint.
5. **Streak logic** — computed and stored server-side on every quiz
   completion, not derived from client-side dates.

Plus the "no retakes" rule is a real `UNIQUE(user_id, quiz_id)` constraint
on `quiz_attempts` (and `UNIQUE(user_id, puzzle_id)` on `wordle_attempts`),
enforced with a 409 response — not just a disabled button.

### A deliberate adaptation: anonymous play

The prototype let you play quizzes with no account at all, and only asked
for a name at save time. With real accounts, "no retakes" needs a real
identity to key off of, so:

- You can still play any quiz or Wordle puzzle **signed out** for fun.
- The result only **persists** (leaderboard, streak, history, no-retake
  lock) once you're signed in. If you finish a quiz while signed out, the
  Result screen shows a "Sign in to save this result" form inline
  (matching the prototype's copy) — sign up or log in right there, and the
  just-finished attempt is submitted immediately.
- The 5-plays-then-email-gate modal from the prototype is preserved as a
  soft marketing capture (stored in a `leads` table), tracked client-side
  per browser session since it's intentionally a low-friction nudge, not a
  security boundary.

## Project structure

```
server/
  server.js       entry point — static file serving + /api dispatch
  api.js          all route handlers (auth, quizzes, matches, wordle, ...)
  db.js           SQLite schema + seeding (the only file with SQL DDL)
  auth.js         password hashing, session cookies
  google-oauth.js real Google OAuth 2.0 flow (needs your own credentials)
  seed-data.js    the 13 quizzes + 2 Wordle puzzles, extracted verbatim
                  from the design prototype's embedded JS
  util.js         small shared helpers
public/
  index.html      app shell
  app.js          the whole frontend (state + render + API calls)
  styles.css      design tokens ported from the prototype (colors, type)
  footynerd-logo.png, favicon.png
```

## API summary

All endpoints are under `/api`. Session auth is an HttpOnly cookie set by
`/api/auth/*`; no token handling needed client-side.

| Endpoint | Notes |
|---|---|
| `POST /api/auth/register` `{name,email,password}` | |
| `POST /api/auth/login` `{email,password}` | |
| `POST /api/auth/logout` | |
| `GET /api/auth/me` | `{user: null \| {...}}` |
| `GET /api/auth/google` / `/callback` | real OAuth, needs env vars |
| `GET /api/account` / `PATCH /api/account` | profile + stats + history |
| `GET /api/quizzes` | list, includes your attempt status if signed in |
| `GET /api/quizzes/:id` | questions (no answer key) |
| `POST /api/quizzes/:id/check-answer` `{questionIndex,selectedIndex}` | immediate correct/incorrect reveal |
| `POST /api/quizzes/:id/complete` `{answers}` | scores server-side, 401 if signed out, 409 if already attempted |
| `GET /api/leaderboard` | points + streak boards |
| `POST /api/matches` `{quizId,name}` | |
| `GET /api/matches/:id` | full nested match/round/entry state |
| `POST /api/matches/:id/rounds` `{quizId}` | next round, only once current round has 2 entries |
| `POST /api/matches/:id/rounds/:roundId/check-answer` / `/complete` | |
| `GET /api/wordle` / `GET /api/wordle/:id` | |
| `POST /api/wordle/:id/guess` `{guess}` | stateless if signed out, persisted if signed in |
| `POST /api/leads` `{email,source}` | footer subscribe + email gate |

## Moving to Postgres / Supabase

Everything SQL-shaped lives in `server/db.js` (schema + seeding) and the
query calls inside `server/api.js`. To move to Postgres:

1. Swap `node:sqlite`'s `DatabaseSync` in `db.js` for a `pg` `Pool` (or the
   Supabase JS client).
2. The `CREATE TABLE` statements in `db.js` are near-standard SQL already;
   the only SQLite-specific bits are `AUTOINCREMENT` (→ `SERIAL` /
   `GENERATED ALWAYS AS IDENTITY` in Postgres) and `PRAGMA` lines (drop
   them).
3. Prepared statement calls (`db.prepare(sql).get/all/run(...)`) become
   `pool.query(sql, params)` calls — same call sites, same SQL.
4. If moving to Supabase specifically, you'd likely also replace
   `server/auth.js`'s custom session/password logic with Supabase Auth, and
   could drop `google-oauth.js` in favor of Supabase's built-in Google
   provider.

## Known simplifications

- Match room "which entry is mine" is a `localStorage` pointer per the
  handoff's own suggestion ("keep a per-device cookie/localStorage id
  purely as which entry is mine pointer, not as the source of truth for
  scores") — the scores themselves always come from the server.
- Google sign-in needs your own OAuth client credentials (see
  `server/google-oauth.js`) — there's no way around that; it's not
  something that can be faked in code.
- `node:sqlite` is a Node.js "experimental" API as of the Node versions
  this was built against. It's been stable in practice for an app this
  size, but if you'd rather not depend on an experimental core module,
  that's the main argument for doing the Postgres swap above sooner rather
  than later.
