// api.js — all /api/* route handlers.
//
// Routing is done by hand (segments + switch) rather than a framework,
// since the whole point of this backend is to run with zero npm installs
// (Node's built-in http + node:sqlite only). See server.js for the
// dispatch entry point.

const { db, uid, nowIso, POINTS_BY_DIFFICULTY, PASS_THRESHOLD, CATEGORIES } = require('./db');
const authLib = require('./auth');
const { sendJson, readJsonBody, initials, todayStr, daysBetween, genMatchId, AVATAR_COLORS } = require('./util');
const google = require('./google-oauth');

const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

function difficultyLabel(q) {
  return `${DIFFICULTY_LABEL[q.difficulty]} · ${POINTS_BY_DIFFICULTY[q.difficulty]} pts`;
}

// ---------------------------------------------------------------------------
// Shared data-access helpers
// ---------------------------------------------------------------------------

function getQuizRow(quizId) {
  return db.prepare('SELECT * FROM quizzes WHERE id = ?').get(quizId);
}

function getQuizQuestions(quizId) {
  return db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ? ORDER BY position ASC').all(quizId);
}

function publicQuestion(row) {
  return {
    position: row.position,
    question: row.question,
    options: JSON.parse(row.options),
  };
}

function getAttempt(userId, quizId) {
  return db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ? AND quiz_id = ?').get(userId, quizId);
}

// Recompute score server-side from an answers array — the client never
// gets to assert its own score. `answers` is an array of selected option
// indices (or null for skipped), one per question in position order.
function scoreAnswers(questions, answers) {
  let score = 0;
  questions.forEach((q, i) => {
    if (answers[i] === q.answer_index) score += 1;
  });
  return { score, total: questions.length };
}

function updateStreakForUser(user) {
  const today = todayStr();
  let streak = user.current_streak;
  const last = user.last_played_date;
  if (last === today) {
    // already played today — unchanged
  } else if (last && daysBetween(last, today) === 1) {
    streak = streak + 1;
  } else {
    streak = 1;
  }
  const longest = Math.max(user.longest_streak, streak);
  db.prepare('UPDATE users SET current_streak = ?, longest_streak = ?, last_played_date = ? WHERE id = ?')
    .run(streak, longest, today, user.id);
  return { streak, longest };
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

async function handleRegister(req, res) {
  const body = await readJsonBody(req);
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  if (!name) return sendJson(res, 400, { error: 'Name is required.' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, { error: 'A valid email is required.' });
  if (password.length < 6) return sendJson(res, 400, { error: 'Password must be at least 6 characters.' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) return sendJson(res, 409, { error: 'An account with that email already exists.' });

  const id = uid();
  db.prepare(
    `INSERT INTO users (id, name, email, password_hash, auth_provider, created_at)
     VALUES (?, ?, ?, ?, 'password', ?)`
  ).run(id, name, email, authLib.hashPassword(password), nowIso());

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  const { token, expires } = authLib.createSession(id);
  authLib.setSessionCookie(res, token, expires);
  sendJson(res, 201, { user: authLib.publicUser(user) });
}

async function handleLogin(req, res) {
  const body = await readJsonBody(req);
  const email = (body.email || '').trim().toLowerCase();
  const password = body.password || '';
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !authLib.verifyPassword(password, user.password_hash)) {
    return sendJson(res, 401, { error: 'Invalid email or password.' });
  }
  const { token, expires } = authLib.createSession(user.id);
  authLib.setSessionCookie(res, token, expires);
  sendJson(res, 200, { user: authLib.publicUser(user) });
}

async function handleLogout(req, res, ctx) {
  authLib.destroySession(ctx.token);
  authLib.clearSessionCookie(res);
  sendJson(res, 200, { ok: true });
}

async function handleMe(req, res, ctx) {
  sendJson(res, 200, { user: authLib.publicUser(ctx.user) });
}

async function handleUpdateAccount(req, res, ctx) {
  if (!ctx.user) return sendJson(res, 401, { error: 'Sign in required.' });
  const body = await readJsonBody(req);
  const name = (body.name || '').trim();
  const email = (body.email || '').trim().toLowerCase();
  if (!name) return sendJson(res, 400, { error: 'Name is required.' });
  if (email) {
    const conflict = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, ctx.user.id);
    if (conflict) return sendJson(res, 409, { error: 'That email is already in use.' });
  }
  db.prepare('UPDATE users SET name = ?, email = ? WHERE id = ?').run(name, email || null, ctx.user.id);
  const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(ctx.user.id);
  sendJson(res, 200, { user: authLib.publicUser(updated) });
}

// ---------------------------------------------------------------------------
// Quizzes
// ---------------------------------------------------------------------------

async function handleListQuizzes(req, res, ctx) {
  const quizzes = db.prepare('SELECT * FROM quizzes').all();
  const attempts = ctx.user
    ? db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ?').all(ctx.user.id)
    : [];
  const byQuiz = Object.fromEntries(attempts.map((a) => [a.quiz_id, a]));
  const questionCounts = Object.fromEntries(
    db.prepare('SELECT quiz_id, COUNT(*) AS n FROM quiz_questions GROUP BY quiz_id').all().map((r) => [r.quiz_id, r.n])
  );

  const out = quizzes.map((q) => {
    const attempt = byQuiz[q.id];
    return {
      id: q.id,
      category: q.category,
      difficulty: q.difficulty,
      difficultyLabel: difficultyLabel(q),
      title: q.title,
      desc: q.description,
      image: q.image,
      imageCredit: q.image_credit,
      questionCount: questionCounts[q.id] || 0,
      attempted: !!attempt,
      attempt: attempt ? { score: attempt.score, total: attempt.total, passed: !!attempt.passed } : null,
    };
  });
  sendJson(res, 200, { quizzes: out, categories: CATEGORIES });
}

async function handleGetQuiz(req, res, ctx, quizId) {
  const quiz = getQuizRow(quizId);
  if (!quiz) return sendJson(res, 404, { error: 'Quiz not found.' });
  const questions = getQuizQuestions(quizId);
  const attempt = ctx.user ? getAttempt(ctx.user.id, quizId) : null;
  sendJson(res, 200, {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      desc: quiz.description,
      difficulty: quiz.difficulty,
      difficultyLabel: difficultyLabel(quiz),
      image: quiz.image,
      imageCredit: quiz.image_credit,
    },
    questions: questions.map(publicQuestion),
    attempted: !!attempt,
    attempt: attempt ? { score: attempt.score, total: attempt.total, passed: !!attempt.passed, points: attempt.points } : null,
  });
}

async function handleCheckAnswer(req, res, ctx, quizId) {
  const body = await readJsonBody(req);
  const questions = getQuizQuestions(quizId);
  const q = questions[body.questionIndex];
  if (!q) return sendJson(res, 404, { error: 'Question not found.' });
  const correct = body.selectedIndex === q.answer_index;
  sendJson(res, 200, { correct, correctIndex: q.answer_index });
}

async function handleCompleteQuiz(req, res, ctx, quizId) {
  if (!ctx.user) return sendJson(res, 401, { error: 'Sign in to save this result.' });
  const quiz = getQuizRow(quizId);
  if (!quiz) return sendJson(res, 404, { error: 'Quiz not found.' });

  const existing = getAttempt(ctx.user.id, quizId);
  if (existing) {
    return sendJson(res, 409, {
      error: 'You already played this quiz — no retakes.',
      attempt: { score: existing.score, total: existing.total, passed: !!existing.passed, points: existing.points },
    });
  }

  const body = await readJsonBody(req);
  const questions = getQuizQuestions(quizId);
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.length !== questions.length) {
    return sendJson(res, 400, { error: 'Answers do not match question count.' });
  }
  const { score, total } = scoreAnswers(questions, answers);
  const passed = score >= PASS_THRESHOLD;
  const points = passed ? (POINTS_BY_DIFFICULTY[quiz.difficulty] || 0) : 0;

  db.prepare(
    `INSERT INTO quiz_attempts (user_id, quiz_id, score, total, passed, points, completed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(ctx.user.id, quizId, score, total, passed ? 1 : 0, points, nowIso());

  const { streak } = updateStreakForUser(ctx.user);

  sendJson(res, 200, {
    score, total, passed, points, streak,
    isPerfect: score === total,
  });
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

async function handleLeaderboard(req, res) {
  const pointsRows = db.prepare(`
    SELECT u.id, u.name,
           SUM(qa.points) AS points,
           COUNT(*) AS quizzesCompleted,
           SUM(CASE WHEN qa.score = qa.total THEN 1 ELSE 0 END) AS perfectRuns
    FROM quiz_attempts qa
    JOIN users u ON u.id = qa.user_id
    GROUP BY u.id
    ORDER BY points DESC, quizzesCompleted DESC
  `).all();

  const leaderboardRows = pointsRows.map((row, idx) => {
    const badgeText = row.perfectRuns > 0 ? 'PERFECT' : (row.quizzesCompleted >= 3 ? 'REGULAR' : '');
    return {
      rank: idx + 1,
      name: row.name,
      initials: initials(row.name),
      avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
      subline: `${row.quizzesCompleted} ${row.quizzesCompleted === 1 ? 'quiz played' : 'quizzes played'}`,
      points: row.points,
      hasBadge: !!badgeText,
      badgeText,
    };
  });

  const streakUsers = db.prepare(
    'SELECT id, name, longest_streak FROM users WHERE longest_streak > 0 ORDER BY longest_streak DESC'
  ).all();
  const streakRows = streakUsers.map((row, idx) => ({
    rank: idx + 1,
    name: row.name,
    initials: initials(row.name),
    avatarColor: AVATAR_COLORS[idx % AVATAR_COLORS.length],
    streakText: `${row.longest_streak} ${row.longest_streak === 1 ? 'day' : 'days'}`,
  }));

  sendJson(res, 200, { leaderboardRows, streakRows });
}

// ---------------------------------------------------------------------------
// Account
// ---------------------------------------------------------------------------

async function handleAccount(req, res, ctx) {
  if (!ctx.user) return sendJson(res, 401, { error: 'Sign in required.' });
  const quizzes = db.prepare('SELECT * FROM quizzes').all();
  const attempts = db.prepare('SELECT * FROM quiz_attempts WHERE user_id = ?').all(ctx.user.id);
  const byQuiz = Object.fromEntries(attempts.map((a) => [a.quiz_id, a]));

  const history = quizzes.map((q) => {
    const attempt = byQuiz[q.id];
    return {
      id: q.id,
      title: q.title,
      difficultyLabel: DIFFICULTY_LABEL[q.difficulty],
      statusText: attempt ? (attempt.passed ? 'Passed' : 'Failed') : 'Not played',
      statusColor: attempt ? (attempt.passed ? 'oklch(0.5 0.14 145)' : 'oklch(0.55 0.17 25)') : 'oklch(0.6 0.01 250)',
      scoreText: attempt ? `${attempt.score}/${attempt.total}` : '—',
      pointsText: attempt ? (attempt.passed ? `+${attempt.points}` : '0') : '—',
    };
  });

  const totalPoints = attempts.filter((a) => a.passed).reduce((sum, a) => sum + a.points, 0);
  const quizzesPassed = attempts.filter((a) => a.passed).length;

  sendJson(res, 200, {
    user: authLib.publicUser(ctx.user),
    stats: { streak: ctx.user.current_streak, totalPoints, quizzesPassed },
    history,
  });
}

// ---------------------------------------------------------------------------
// Match Rooms
// ---------------------------------------------------------------------------

function roundToJson(round) {
  const quiz = getQuizRow(round.quiz_id);
  const entries = db.prepare('SELECT * FROM match_entries WHERE round_id = ? ORDER BY played_at ASC').all(round.id);
  return {
    id: round.id,
    roundNumber: round.round_number,
    quiz: {
      id: quiz.id,
      title: quiz.title,
      difficulty: quiz.difficulty,
      difficultyLabel: difficultyLabel(quiz),
      image: quiz.image,
    },
    entries: entries.map((e) => ({ name: e.guest_name, score: e.score, total: e.total, playedAt: e.played_at })),
  };
}

function matchToJson(matchId) {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return null;
  const rounds = db.prepare('SELECT * FROM match_rounds WHERE match_id = ? ORDER BY round_number ASC').all(matchId);
  return { id: match.id, createdAt: match.created_at, rounds: rounds.map(roundToJson) };
}

async function handleCreateMatch(req, res, ctx) {
  const body = await readJsonBody(req);
  const quizId = body.quizId;
  const name = (body.name || '').trim();
  if (!name) return sendJson(res, 400, { error: 'Your name is required.' });
  const quiz = getQuizRow(quizId);
  if (!quiz) return sendJson(res, 404, { error: 'Quiz not found.' });

  let id;
  for (let i = 0; i < 8; i++) {
    id = genMatchId();
    const clash = db.prepare('SELECT id FROM matches WHERE id = ?').get(id);
    if (!clash) break;
  }
  db.prepare('INSERT INTO matches (id, created_at) VALUES (?, ?)').run(id, nowIso());
  db.prepare('INSERT INTO match_rounds (match_id, quiz_id, round_number) VALUES (?, ?, 1)').run(id, quizId);

  sendJson(res, 201, matchToJson(id));
}

async function handleGetMatch(req, res, ctx, matchId) {
  const json = matchToJson(matchId);
  if (!json) return sendJson(res, 404, { error: 'Match not found.' });
  sendJson(res, 200, json);
}

async function handleCreateRound(req, res, ctx, matchId) {
  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) return sendJson(res, 404, { error: 'Match not found.' });
  const lastRound = db.prepare(
    'SELECT * FROM match_rounds WHERE match_id = ? ORDER BY round_number DESC LIMIT 1'
  ).get(matchId);
  const entryCount = db.prepare('SELECT COUNT(*) AS n FROM match_entries WHERE round_id = ?').get(lastRound.id).n;
  if (entryCount < 2) return sendJson(res, 409, { error: 'Current round is not finished yet.' });

  const body = await readJsonBody(req);
  const quiz = getQuizRow(body.quizId);
  if (!quiz) return sendJson(res, 404, { error: 'Quiz not found.' });

  const roundNumber = lastRound.round_number + 1;
  const info = db.prepare(
    'INSERT INTO match_rounds (match_id, quiz_id, round_number) VALUES (?, ?, ?)'
  ).run(matchId, quiz.id, roundNumber);
  const round = db.prepare('SELECT * FROM match_rounds WHERE id = ?').get(info.lastInsertRowid);
  sendJson(res, 201, roundToJson(round));
}

async function handleMatchCheckAnswer(req, res, ctx, matchId, roundId) {
  const round = db.prepare('SELECT * FROM match_rounds WHERE id = ? AND match_id = ?').get(roundId, matchId);
  if (!round) return sendJson(res, 404, { error: 'Round not found.' });
  const body = await readJsonBody(req);
  const questions = getQuizQuestions(round.quiz_id);
  const q = questions[body.questionIndex];
  if (!q) return sendJson(res, 404, { error: 'Question not found.' });
  const correct = body.selectedIndex === q.answer_index;
  sendJson(res, 200, { correct, correctIndex: q.answer_index });
}

async function handleMatchCompleteRound(req, res, ctx, matchId, roundId) {
  const round = db.prepare('SELECT * FROM match_rounds WHERE id = ? AND match_id = ?').get(roundId, matchId);
  if (!round) return sendJson(res, 404, { error: 'Round not found.' });
  const entryCount = db.prepare('SELECT COUNT(*) AS n FROM match_entries WHERE round_id = ?').get(round.id).n;
  if (entryCount >= 2) return sendJson(res, 409, { error: 'This round already has two players.' });

  const body = await readJsonBody(req);
  const name = (body.name || '').trim();
  if (!name) return sendJson(res, 400, { error: 'Your name is required.' });

  const questions = getQuizQuestions(round.quiz_id);
  const answers = Array.isArray(body.answers) ? body.answers : [];
  if (answers.length !== questions.length) {
    return sendJson(res, 400, { error: 'Answers do not match question count.' });
  }
  const { score, total } = scoreAnswers(questions, answers);

  db.prepare(
    `INSERT INTO match_entries (round_id, user_id, guest_name, score, total, played_at)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(round.id, ctx.user ? ctx.user.id : null, name, score, total, nowIso());

  sendJson(res, 200, roundToJson(round));
}

// ---------------------------------------------------------------------------
// Wordle
// ---------------------------------------------------------------------------

function evalWordleGuess(guess, answer) {
  const g = guess.split('');
  const a = answer.split('');
  const result = Array(5).fill('absent');
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { result[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    const idx = a.findIndex((ch, j) => ch === g[i] && !used[j]);
    if (idx > -1) { result[i] = 'present'; used[idx] = true; }
  }
  return result;
}

async function handleListWordle(req, res, ctx) {
  const puzzles = db.prepare('SELECT id, label, hint FROM wordle_puzzles').all();
  const attempts = ctx.user
    ? db.prepare('SELECT * FROM wordle_attempts WHERE user_id = ?').all(ctx.user.id)
    : [];
  const byPuzzle = Object.fromEntries(attempts.map((a) => [a.puzzle_id, a]));
  const out = puzzles.map((p) => {
    const attempt = byPuzzle[p.id];
    return {
      id: p.id,
      label: p.label,
      hint: p.hint,
      status: attempt ? attempt.status : 'not_attempted',
      guessCount: attempt ? JSON.parse(attempt.guesses).length : 0,
    };
  });
  sendJson(res, 200, { puzzles: out });
}

async function handleGetWordle(req, res, ctx, puzzleId) {
  const puzzle = db.prepare('SELECT id, label, hint FROM wordle_puzzles WHERE id = ?').get(puzzleId);
  if (!puzzle) return sendJson(res, 404, { error: 'Puzzle not found.' });
  const attempt = ctx.user
    ? db.prepare('SELECT * FROM wordle_attempts WHERE user_id = ? AND puzzle_id = ?').get(ctx.user.id, puzzleId)
    : null;
  sendJson(res, 200, {
    id: puzzle.id,
    label: puzzle.label,
    hint: puzzle.hint,
    status: attempt ? attempt.status : 'playing',
    guesses: attempt ? JSON.parse(attempt.guesses) : [],
  });
}

async function handleWordleGuess(req, res, ctx, puzzleId) {
  const puzzle = db.prepare('SELECT * FROM wordle_puzzles WHERE id = ?').get(puzzleId);
  if (!puzzle) return sendJson(res, 404, { error: 'Puzzle not found.' });

  const body = await readJsonBody(req);
  const guess = (body.guess || '').trim().toUpperCase();
  if (guess.length !== 5 || !/^[A-Z]{5}$/.test(guess)) {
    return sendJson(res, 400, { error: 'Guess must be a 5-letter word.' });
  }

  if (!ctx.user) {
    // Stateless mode for signed-out play: compute the result but don't
    // persist anything server-side. The client keeps guesses in memory
    // only for this session (mirrors the "sign in to save progress"
    // pattern used for quizzes).
    const result = evalWordleGuess(guess, puzzle.word);
    const won = guess === puzzle.word;
    return sendJson(res, 200, {
      result,
      status: won ? 'won' : 'playing',
      correctWord: won ? puzzle.word : undefined,
    });
  }

  let attempt = db.prepare('SELECT * FROM wordle_attempts WHERE user_id = ? AND puzzle_id = ?').get(ctx.user.id, puzzleId);
  if (attempt && attempt.status !== 'playing') {
    return sendJson(res, 409, {
      error: 'This puzzle is already finished — no retakes.',
      status: attempt.status,
      guesses: JSON.parse(attempt.guesses),
    });
  }

  const guesses = attempt ? JSON.parse(attempt.guesses) : [];
  const result = evalWordleGuess(guess, puzzle.word);
  guesses.push({ word: guess, result });

  let status = 'playing';
  if (guess === puzzle.word) status = 'won';
  else if (guesses.length >= 6) status = 'lost';

  const completedAt = status !== 'playing' ? nowIso() : null;

  if (attempt) {
    db.prepare('UPDATE wordle_attempts SET guesses = ?, status = ?, completed_at = ? WHERE id = ?')
      .run(JSON.stringify(guesses), status, completedAt, attempt.id);
  } else {
    db.prepare(
      `INSERT INTO wordle_attempts (user_id, puzzle_id, guesses, status, completed_at)
       VALUES (?, ?, ?, ?, ?)`
    ).run(ctx.user.id, puzzleId, JSON.stringify(guesses), status, completedAt);
  }

  sendJson(res, 200, {
    result,
    status,
    guessNumber: guesses.length,
    correctWord: status !== 'playing' ? puzzle.word : undefined,
  });
}

// ---------------------------------------------------------------------------
// Leads (newsletter subscribe + email gate)
// ---------------------------------------------------------------------------

async function handleLead(req, res) {
  const body = await readJsonBody(req);
  const email = (body.email || '').trim().toLowerCase();
  const source = body.source === 'email_gate' ? 'email_gate' : 'subscribe';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return sendJson(res, 400, { error: 'A valid email is required.' });
  db.prepare('INSERT INTO leads (email, source, created_at) VALUES (?, ?, ?)').run(email, source, nowIso());
  sendJson(res, 200, { ok: true });
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

async function router(req, res, ctx, segments, method) {
  const [a, b, c, d] = segments;

  // /api/auth/*
  if (a === 'auth') {
    if (b === 'register' && method === 'POST') return handleRegister(req, res, ctx);
    if (b === 'login' && method === 'POST') return handleLogin(req, res, ctx);
    if (b === 'logout' && method === 'POST') return handleLogout(req, res, ctx);
    if (b === 'me' && method === 'GET') return handleMe(req, res, ctx);
    if (b === 'google' && !c && method === 'GET') return google.startGoogleAuth(req, res);
    if (b === 'google' && c === 'callback' && method === 'GET') return google.handleGoogleCallback(req, res, ctx);
  }

  if (a === 'account') {
    if (method === 'GET') return handleAccount(req, res, ctx);
    if (method === 'PATCH') return handleUpdateAccount(req, res, ctx);
  }

  if (a === 'quizzes') {
    if (!b && method === 'GET') return handleListQuizzes(req, res, ctx);
    if (b && !c && method === 'GET') return handleGetQuiz(req, res, ctx, b);
    if (b && c === 'check-answer' && method === 'POST') return handleCheckAnswer(req, res, ctx, b);
    if (b && c === 'complete' && method === 'POST') return handleCompleteQuiz(req, res, ctx, b);
  }

  if (a === 'leaderboard' && method === 'GET') return handleLeaderboard(req, res, ctx);

  if (a === 'matches') {
    if (!b && method === 'POST') return handleCreateMatch(req, res, ctx);
    if (b && !c && method === 'GET') return handleGetMatch(req, res, ctx, b);
    if (b && c === 'rounds' && !d && method === 'POST') return handleCreateRound(req, res, ctx, b);
    if (b && c === 'rounds' && d && method === 'GET') {
      const round = db.prepare('SELECT * FROM match_rounds WHERE id = ? AND match_id = ?').get(d, b);
      if (!round) return sendJson(res, 404, { error: 'Round not found.' });
      return sendJson(res, 200, roundToJson(round));
    }
    if (b && c === 'rounds' && d) {
      const rest = segments[4];
      if (rest === 'check-answer' && method === 'POST') return handleMatchCheckAnswer(req, res, ctx, b, d);
      if (rest === 'complete' && method === 'POST') return handleMatchCompleteRound(req, res, ctx, b, d);
    }
  }

  if (a === 'wordle') {
    if (!b && method === 'GET') return handleListWordle(req, res, ctx);
    if (b && !c && method === 'GET') return handleGetWordle(req, res, ctx, b);
    if (b && c === 'guess' && method === 'POST') return handleWordleGuess(req, res, ctx, b);
  }

  if (a === 'leads' && method === 'POST') return handleLead(req, res);

  sendJson(res, 404, { error: 'Not found.' });
}

module.exports = { router };
