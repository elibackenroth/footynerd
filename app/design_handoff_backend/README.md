# Handoff: FootyNerd — Real Backend (Auth, Leaderboard, Match Rooms, Wordle Persistence)

## Overview
FootyNerd is a soccer trivia site: quizzes, an account/streak system, a global leaderboard, an async "Match Room" friend-vs-friend challenge feature, and a two-puzzle daily Wordle. All of it currently works **only in one browser**, backed by `localStorage`. This handoff is to make it work for real — shared across devices and between friends — by adding a backend.

## About the Design Files
The bundled file (`Soccer Quiz.dc.html`) is a **fully-functional interactive prototype built in HTML/React (via a custom in-house "Design Component" runtime)**, not production code to copy verbatim. Treat it as the source of truth for layout, copy, states, and behavior. The task is to **recreate this experience in whatever stack you're standing up** (a normal React/Next.js, Vue, or similar app) using real network calls in place of the current `localStorage` reads/writes, and a real database + auth provider in place of the mocked-out logic.

`support.js` is a runtime shim specific to our design tool — do not port it. Read it only if you need to understand how `{{ }}` template bindings and `<sc-for>`/`<sc-if>` map to the JS below them; otherwise ignore it and re-implement the same states as normal component state/props in your framework.

## Fidelity
**High-fidelity.** Colors, type, spacing, copy, and interaction states in the prototype are final — reproduce them pixel-for-pixel. The only thing that should change is *where the data lives and how it moves* (see "What needs a real backend" below).

## What needs a real backend (the actual ask)

Right now every one of these reads/writes `localStorage` in the client. None of it is shared across devices, browsers, or between two friends' machines. Recommended: **Supabase** (Postgres + Auth + Row Level Security), since this is a small app with no other infra — fastest path to "actually works." A custom Node/Postgres API is an equally valid alternative if the team already has backend conventions to follow.

### 1. Authentication
- Prototype has a fake "Create Account" (name only) and a "Continue with Google" button that doesn't actually authenticate (`signInWithGoogle` in the JS is a stub).
- Replace with real auth: email/password or magic link + Google OAuth (Supabase Auth supports both out of the box).
- `users` table: `id`, `name`, `email`, `created_at`.
- The account page's Name/Email fields become an edit-profile form against this table.

### 2. Leaderboard
- Prototype: every finished quiz appends `{name, quizId, score, points, date}` to a `localStorage` array (see `saveScore` / account-related state near the account/result views), and the Leaderboard view aggregates it client-side by summing points and finding longest streaks.
- Replace with: a `quiz_attempts` table — `id`, `user_id` (FK), `quiz_id`, `score`, `total`, `points`, `completed_at`. One row can't be retaken (the "no retakes" business rule in the quiz list — enforce this server-side, not just client-side, with a unique constraint on `(user_id, quiz_id)`).
- Leaderboard view queries: `SUM(points) GROUP BY user_id ORDER BY DESC` for the points table, and a streak calculation (consecutive days with ≥1 completed attempt) for the streak table. Do this as a SQL view or a scheduled job, not by shipping all attempts to the client.
- Needs to be **live for everyone**, not just the current browser — this is the main functional gap today.

### 3. Match Room (friend vs friend)
- Prototype: `createMatchRoom` generates a random 6-char id, stores the whole match object (list of rounds, each with an array of `{name, score, total}` entries) **base64-encoded directly in the share URL** (`buildMatchShareUrl` / `encodeMatch` / `decodeMatch` in the JS). The "friend" opens the link, the match state comes from the URL itself — there is no server, so state can silently fork if both people don't pass the same link back and forth.
- Replace with: a `matches` table (`id`, `created_at`) and a `match_rounds` table (`id`, `match_id` FK, `quiz_id`, `round_number`) and a `match_entries` table (`id`, `round_id` FK, `user_id` or guest name, `score`, `total`, `played_at`).
- Share link becomes just `?match=<id>` — a short, stable id, not an encoded blob. The app fetches current match/round state from the DB on load.
- Needs realtime-ish behavior: when the first player finishes and shares the link, the second player's "Play Now" / result screen should reflect the live state (Supabase Realtime subscriptions on `match_entries` work well here, or simple polling).
- Guest play: friends may not have accounts. Support playing a match round with just a display name (no login required), same as the prototype does today (`matchIdentity` stored per-match) — just move that identity storage server-side (or keep a per-device cookie/localStorage id purely as "which entry is mine" pointer, not as the source of truth for scores).

### 4. Wordle
- Prototype: `WORDLE_WORDS` (2 entries, both 5 letters — `MESSI`, `PITCH`) are hardcoded in the JS, and each result is saved to `localStorage` keyed by puzzle id (`loadWordleResults`/`saveWordleResults`), permanently marking that puzzle "solved" per browser (no retakes, same as quizzes).
- Replace with: a `wordle_puzzles` table (`id`, `word`, `label`, `hint`, `active_date` or similar) so puzzles can rotate/expand without a code deploy, and a `wordle_attempts` table (`user_id`, `puzzle_id`, `guesses` (jsonb), `status`, `completed_at`) with the same one-attempt-per-puzzle-per-user constraint.

### 5. Streak logic
- Currently computed from whatever's in `localStorage` (`daysBetween` helper). Move to a server-computed value: on each quiz completion, compare `completed_at` dates server-side and update a `current_streak` / `longest_streak` column on `users`, or compute on read from `quiz_attempts` timestamps.

## Screens / Views (all in `Soccer Quiz.dc.html`)
- **Home** — hero, "Start a Match Room" panel, "Football Wordle" panel (side by side, directly under the Browse Quizzes button), featured quizzes grid.
- **Quizzes list** — difficulty filter sidebar, category chips, quiz card grid (image, difficulty label, title, description, Start Quiz button or "Passed/Failed · no retakes" status).
- **Quiz Play** — progress bar, question, 4 answer options with correct/incorrect coloring after answering, Next button. Shows a "MATCH ROOM" pill badge when played as part of a match round.
- **Result** — score, message, perfect-score badge, save-score form (name input) or saved confirmation with points/streak.
- **Account** — streak/points/quizzes-passed stat cards, editable name/email, full quiz history table. Signed-out state shows Google button + name-only create-account fallback.
- **Leaderboard** — ranked points list with avatar initials and badges, separate "Longest Streak" ranked list.
- **Match Room** — 5 sub-states: setup (pick quiz + name), rematch quiz picker, "X challenged you" turn view, waiting-for-friend view (share link + copy button), and head-to-head result (avatars, VS score bars, percentage split, round-by-round series history, "Play Next Round").
- **Wordle** — puzzle picker (2 cards) and play view (6x5 guess grid with flip-style tile coloring, on-screen QWERTY keyboard, win/lose message, "Play the Other Wordle" / Done).
- **Email gate modal** — appears after 5 quizzes played signed-out, asks for email to continue.

## Design Tokens
- Primary blue: `oklch(0.42 0.18 250)` (headers, primary buttons, nav bg is a lighter/darker variant of same hue).
- Accent for Wordle/warm accents: `oklch(0.55 0.15 70)`.
- Match "opponent" color: `oklch(0.6 0.17 60)`.
- Success green (saved/correct/copied states): `oklch(0.5 0.14 145)`.
- Neutral text: `oklch(0.22 0.01 250)` (body), `oklch(0.45–0.55 0.01 250)` (secondary).
- Fonts: `Oswald` (600/700) for headings, `Inter` (400–700) for body/UI — both loaded from Google Fonts.
- Border radius: 4px (buttons/cards/inputs) up to 6-8px (larger panels).
- Card border: `1px solid oklch(0.92 0.01 250)`.

## Assets
- `footynerd-logo.png` — nav logo.
- `favicon.png` — favicon.
- Quiz card images are drag-and-drop placeholders (`image-slot.js`, a custom drop-target web component) — real quiz photos still need to be sourced/uploaded; not blocking for backend work.

## Files
- `Soccer Quiz.dc.html` — the entire app (markup + all logic inline in a `<script>`), reference for every screen, state, and copy string above.
- `support.js` — internal runtime shim for our design tool's template syntax; not for porting, reference only if the templating syntax is unclear.
- `footynerd-logo.png`, `favicon.png` — brand assets.
- `image-slot.js` — placeholder image-drop component, not relevant to backend work.
