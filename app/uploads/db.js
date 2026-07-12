// db.js — SQLite persistence layer.
//
// Uses Node's built-in `node:sqlite` module (stable enough for this app,
// available Node >= 22.5) so the whole backend runs with zero npm installs.
//
// This file is intentionally the ONLY place that touches SQL, and the SQL
// used is plain/portable. If you outgrow SQLite (multiple server instances,
// need for Supabase Auth/RLS, etc.) swap this module for a Postgres client
// (e.g. `pg` or the Supabase JS client) — nothing else in the server should
// need to change beyond this file, since routes call the exported functions
// below rather than writing SQL themselves.

const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const crypto = require('node:crypto');
const seed = require('./seed-data');

const DB_PATH = process.env.FOOTYNERD_DB_PATH || path.join(__dirname, '..', 'footynerd.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE,
  password_hash TEXT,
  auth_provider TEXT NOT NULL DEFAULT 'password',
  google_sub TEXT UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_played_date TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS quizzes (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image TEXT,
  image_credit TEXT
);

CREATE TABLE IF NOT EXISTS quiz_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  question TEXT NOT NULL,
  options TEXT NOT NULL,      -- JSON array of 4 strings
  answer_index INTEGER NOT NULL
);

-- One row per user per quiz. UNIQUE constraint is the server-side
-- enforcement of the "no retakes" business rule from the design.
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  passed INTEGER NOT NULL,
  points INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  UNIQUE(user_id, quiz_id)
);

CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS match_rounds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  match_id TEXT NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  quiz_id TEXT NOT NULL REFERENCES quizzes(id),
  round_number INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS match_entries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  round_id INTEGER NOT NULL REFERENCES match_rounds(id) ON DELETE CASCADE,
  user_id TEXT REFERENCES users(id),
  guest_name TEXT NOT NULL,
  score INTEGER NOT NULL,
  total INTEGER NOT NULL,
  played_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS wordle_puzzles (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  label TEXT NOT NULL,
  hint TEXT NOT NULL,
  active_date TEXT
);

CREATE TABLE IF NOT EXISTS wordle_attempts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  puzzle_id TEXT NOT NULL REFERENCES wordle_puzzles(id) ON DELETE CASCADE,
  guesses TEXT NOT NULL,   -- JSON array of { word, result }
  status TEXT NOT NULL,     -- 'playing' | 'won' | 'lost'
  completed_at TEXT,
  UNIQUE(user_id, puzzle_id)
);

CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL,
  source TEXT NOT NULL,     -- 'subscribe' | 'email_gate'
  created_at TEXT NOT NULL
);
`);

// ---------------------------------------------------------------------------
// Seed static content (quizzes / wordle puzzles) if empty. Safe to re-run.
// ---------------------------------------------------------------------------
function seedContent() {
  const countRow = db.prepare('SELECT COUNT(*) AS n FROM quizzes').get();
  if (countRow.n > 0) return;

  const insertQuiz = db.prepare(
    `INSERT INTO quizzes (id, category, difficulty, title, description, image, image_credit)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );
  const insertQuestion = db.prepare(
    `INSERT INTO quiz_questions (quiz_id, position, question, options, answer_index)
     VALUES (?, ?, ?, ?, ?)`
  );

  db.exec('BEGIN');
  try {
    for (const q of seed.QUIZZES) {
      insertQuiz.run(q.id, q.category, q.difficulty, q.title, q.desc, q.image || null, q.imageCredit || null);
      q.questions.forEach((question, i) => {
        insertQuestion.run(q.id, i, question.q, JSON.stringify(question.options), question.answer);
      });
    }
    const insertWordle = db.prepare(
      `INSERT INTO wordle_puzzles (id, word, label, hint) VALUES (?, ?, ?, ?)`
    );
    for (const w of seed.WORDLE_WORDS) {
      insertWordle.run(w.id, w.word, w.label, w.hint);
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}
seedContent();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function uid() {
  return crypto.randomUUID();
}
function nowIso() {
  return new Date().toISOString();
}

module.exports = {
  db,
  uid,
  nowIso,
  POINTS_BY_DIFFICULTY: seed.POINTS_BY_DIFFICULTY,
  PASS_THRESHOLD: seed.PASS_THRESHOLD,
  CATEGORIES: seed.CATEGORIES,
};
