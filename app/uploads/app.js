// app.js — FootyNerd single-page app.
// Plain JS, no framework/build step: a single state object, an api() fetch
// helper, render functions per screen (return HTML strings), and one
// delegated click/input listener that reads data-action attributes.

(function () {
  'use strict';

  // ---------------------------------------------------------------------
  // Constants (mirrors the design tokens / copy from the prototype)
  // ---------------------------------------------------------------------
  const DIFFICULTY_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
  const PASS_THRESHOLD = 3;
  const WORDLE_KEY_ROWS = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ];
  const WORDLE_COLOR = { correct: 'oklch(0.62 0.15 145)', present: 'oklch(0.75 0.14 85)', absent: 'oklch(0.5 0.01 250)' };
  const PRAISE = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];

  // ---------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------
  const state = {
    view: 'home',
    booted: false,
    user: null,

    quizzes: [],
    categories: [],
    activeCategory: 'all',
    activeDifficulty: 'all',

    activeQuizId: null,
    quizMeta: null,
    quizQuestions: [],
    qIndex: 0,
    selectedIndex: null,
    answerFeedback: null,
    answers: [],
    score: 0,

    resultData: null,
    resultPending: false,
    resultError: null,

    leaderboard: null,

    accountData: null,
    accountNameDraft: '',
    accountEmailDraft: '',
    accountSettingsSaved: false,

    authForm: { mode: 'register', name: '', email: '', password: '', error: '', busy: false },
    authInline: false, // whether the auth form is being shown inline on the Result screen

    showEmailGate: false,
    emailGateInput: '',
    pendingQuizId: null,

    match: null,
    matchId: null,
    matchIdentity: null,
    matchNameDraft: '',
    matchSetupQuizId: null,
    matchPickingRematch: false,
    matchLinkCopied: false,
    matchActive: false,
    matchRoundContext: null, // { matchId, roundId } while a match round is being played

    wordlePuzzles: [],
    wordleGameId: null,
    wordlePuzzle: null,
    wordleGuesses: [],
    wordleCurrentGuess: '',
    wordleStatus: 'playing',
    wordleMessage: '',
    wordleAnonWon: null, // stores correctWord for signed-out finish

    subscribeEmail: '',
    subscribeChecked: false,
    subscribeDone: false,

    toast: null,
    matchPollTimer: null,
  };

  // ---------------------------------------------------------------------
  // API helper
  // ---------------------------------------------------------------------
  async function api(path, options) {
    const opts = Object.assign({ credentials: 'include' }, options || {});
    if (opts.body && typeof opts.body !== 'string') {
      opts.headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
      opts.body = JSON.stringify(opts.body);
    }
    const res = await fetch('/api/' + path.replace(/^\//, ''), opts);
    let data = null;
    try { data = await res.json(); } catch (e) { data = null; }
    if (!res.ok) {
      const err = new Error((data && data.error) || ('Request failed: ' + res.status));
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  // ---------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------
  function initials(name) {
    const n = (name || '').trim();
    if (!n) return '?';
    const parts = n.split(/\s+/);
    return ((parts[0] && parts[0][0]) || '?').toUpperCase() + ((parts[1] && parts[1][0]) || '').toUpperCase();
  }
  function esc(str) {
    return String(str == null ? '' : str).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }
  function anonPlaysCount() {
    return parseInt(sessionStorage.getItem('fn_anon_plays') || '0', 10);
  }
  function bumpAnonPlays() {
    sessionStorage.setItem('fn_anon_plays', String(anonPlaysCount() + 1));
  }
  function anonEmailProvided() {
    return !!sessionStorage.getItem('fn_anon_email');
  }
  function matchIdentityKey(matchId) { return 'fn_match_identity_' + matchId; }

  function showToast(msg) {
    state.toast = msg;
    render();
    setTimeout(() => { state.toast = null; render(); }, 2200);
  }

  window.__fn = { state, api }; // debugging hook

  // ---------------------------------------------------------------------
  // Navigation
  // ---------------------------------------------------------------------
  function stopMatchPolling() {
    if (state.matchPollTimer) { clearInterval(state.matchPollTimer); state.matchPollTimer = null; }
  }

  function goHome() { stopMatchPolling(); state.view = 'home'; render(); }
  function goQuizzes() {
    stopMatchPolling();
    state.view = 'quizzes';
    render();
    loadQuizzes();
  }
  function goLeaderboard() {
    stopMatchPolling();
    state.view = 'leaderboard';
    render();
    loadLeaderboard();
  }
  function goAccount() {
    stopMatchPolling();
    state.view = 'account';
    state.accountSettingsSaved = false;
    if (state.user) {
      state.accountNameDraft = state.user.name || '';
      state.accountEmailDraft = state.user.email || '';
    }
    render();
    if (state.user) loadAccount();
  }

  // ---------------------------------------------------------------------
  // Bootstrapping
  // ---------------------------------------------------------------------
  async function boot() {
    try {
      const me = await api('auth/me');
      state.user = me.user;
    } catch (e) { state.user = null; }
    state.booted = true;

    // Handle ?match=<id> deep link
    const params = new URLSearchParams(window.location.search);
    const matchParam = params.get('match');
    if (matchParam) {
      const url = new URL(window.location.href);
      url.searchParams.delete('match');
      window.history.replaceState({}, '', url.toString());
      try {
        await openMatch(matchParam);
      } catch (e) {
        state.view = 'home';
      }
    }

    render();
    loadQuizzes();
  }

  async function loadQuizzes() {
    try {
      const data = await api('quizzes');
      state.quizzes = data.quizzes;
      state.categories = data.categories;
      render();
    } catch (e) { /* non-fatal */ }
  }

  async function loadLeaderboard() {
    try {
      const data = await api('leaderboard');
      state.leaderboard = data;
      render();
    } catch (e) { /* non-fatal */ }
  }

  async function loadAccount() {
    try {
      const data = await api('account');
      state.accountData = data;
      render();
    } catch (e) { /* non-fatal */ }
  }

  // ---------------------------------------------------------------------
  // Auth actions
  // ---------------------------------------------------------------------
  function setAuthMode(mode) { state.authForm.mode = mode; state.authForm.error = ''; render(); }
  function updateAuthField(field, value) { state.authForm[field] = value; }

  async function submitAuthForm() {
    const f = state.authForm;
    f.error = '';
    f.busy = true; render();
    try {
      if (f.mode === 'register') {
        const data = await api('auth/register', { method: 'POST', body: { name: f.name, email: f.email, password: f.password } });
        state.user = data.user;
      } else {
        const data = await api('auth/login', { method: 'POST', body: { email: f.email, password: f.password } });
        state.user = data.user;
      }
      f.busy = false;
      state.authForm = { mode: 'register', name: '', email: '', password: '', error: '', busy: false };
      state.authInline = false;

      // If we just signed in from the Result screen with a pending completed
      // quiz, submit it now.
      if (state.view === 'result' && state.activeQuizId && !state.resultData) {
        await submitQuizCompletion();
      }
      if (state.view === 'account') {
        state.accountNameDraft = state.user.name || '';
        state.accountEmailDraft = state.user.email || '';
        loadAccount();
      }
      render();
      loadQuizzes();
    } catch (e) {
      f.busy = false;
      f.error = e.message || 'Something went wrong.';
      render();
    }
  }

  async function logout() {
    try { await api('auth/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    state.user = null;
    state.accountData = null;
    render();
    loadQuizzes();
  }

  function signInWithGoogle() {
    window.location.href = '/api/auth/google';
  }

  // ---------------------------------------------------------------------
  // Account settings
  // ---------------------------------------------------------------------
  async function saveAccountSettings() {
    try {
      const data = await api('account', { method: 'PATCH', body: { name: state.accountNameDraft, email: state.accountEmailDraft } });
      state.user = data.user;
      state.accountSettingsSaved = true;
      render();
    } catch (e) {
      showToast(e.message || 'Could not save changes.');
    }
  }

  // ---------------------------------------------------------------------
  // Category / difficulty filters
  // ---------------------------------------------------------------------
  function setCategory(id) { state.activeCategory = id; render(); }
  function setDifficulty(id) { state.activeDifficulty = id; render(); }

  // ---------------------------------------------------------------------
  // Quiz play
  // ---------------------------------------------------------------------
  async function startQuiz(quizId) {
    const quiz = state.quizzes.find((q) => q.id === quizId);
    if (quiz && quiz.attempted) return;

    if (!state.user && anonPlaysCount() >= 5 && !anonEmailProvided()) {
      state.showEmailGate = true;
      state.pendingQuizId = quizId;
      render();
      return;
    }
    await enterQuiz(quizId);
  }

  async function enterQuiz(quizId) {
    try {
      const data = await api('quizzes/' + quizId);
      state.activeQuizId = quizId;
      state.quizMeta = data.quiz;
      state.quizQuestions = data.questions;
      state.qIndex = 0;
      state.selectedIndex = null;
      state.answerFeedback = null;
      state.answers = [];
      state.score = 0;
      state.resultData = null;
      state.resultError = null;
      state.matchActive = !!state.matchRoundContext;
      state.view = 'playing';
      render();
    } catch (e) {
      showToast('Could not load quiz.');
    }
  }

  function closeEmailGate() { state.showEmailGate = false; state.pendingQuizId = null; render(); }
  function updateEmailGateInput(v) { state.emailGateInput = v; }
  async function submitEmailGate() {
    const email = (state.emailGateInput || '').trim();
    if (!email) return;
    try { await api('leads', { method: 'POST', body: { email, source: 'email_gate' } }); } catch (e) { /* non-fatal */ }
    sessionStorage.setItem('fn_anon_email', email);
    const quizId = state.pendingQuizId;
    state.showEmailGate = false;
    state.pendingQuizId = null;
    render();
    if (quizId) await enterQuiz(quizId);
  }

  async function selectAnswer(idx) {
    if (state.selectedIndex !== null) return;
    state.selectedIndex = idx;
    render(); // show as pending immediately
    try {
      const path = state.matchRoundContext
        ? `matches/${state.matchRoundContext.matchId}/rounds/${state.matchRoundContext.roundId}/check-answer`
        : `quizzes/${state.activeQuizId}/check-answer`;
      const data = await api(path, { method: 'POST', body: { questionIndex: state.qIndex, selectedIndex: idx } });
      state.answerFeedback = data;
      state.answers[state.qIndex] = idx;
      if (data.correct) state.score += 1;
      render();
    } catch (e) {
      state.selectedIndex = null;
      showToast('Could not check answer — try again.');
      render();
    }
  }

  async function nextQuestion() {
    if (state.qIndex + 1 < state.quizQuestions.length) {
      state.qIndex += 1;
      state.selectedIndex = null;
      state.answerFeedback = null;
      render();
      return;
    }
    // finished
    if (state.matchRoundContext) {
      await finishMatchRound();
      return;
    }
    state.view = 'result';
    render();
    if (!state.user) {
      bumpAnonPlays();
      state.resultError = { needsAuth: true };
      render();
      return;
    }
    await submitQuizCompletion();
  }

  async function submitQuizCompletion() {
    state.resultPending = true;
    state.resultError = null;
    render();
    try {
      const data = await api(`quizzes/${state.activeQuizId}/complete`, { method: 'POST', body: { answers: state.answers } });
      state.resultData = data;
      state.resultPending = false;
      render();
      loadQuizzes();
    } catch (e) {
      state.resultPending = false;
      if (e.status === 401) {
        state.resultError = { needsAuth: true };
      } else if (e.status === 409) {
        state.resultError = { alreadyAttempted: true, attempt: e.data && e.data.attempt };
      } else {
        state.resultError = { message: e.message };
      }
      render();
    }
  }

  // ---------------------------------------------------------------------
  // Match Room
  // ---------------------------------------------------------------------
  function computeMatchView() {
    const match = state.match;
    if (!match) return { isSetup: true };
    const round = match.rounds[match.rounds.length - 1];
    const roundHasOne = round.entries.length === 1;
    const roundHasTwo = round.entries.length === 2;
    const iPlayedThisRound = roundHasOne && round.entries[0].name === state.matchIdentity;
    const picking = state.matchPickingRematch;
    return {
      isSetup: false,
      round,
      roundHasOne,
      roundHasTwo,
      isRematchPick: picking,
      isResult: !picking && roundHasTwo,
      isWaiting: !picking && roundHasOne && iPlayedThisRound,
      isTurn: !picking && roundHasOne && !iPlayedThisRound,
    };
  }

  function startMatchSetup() {
    stopMatchPolling();
    state.view = 'match';
    state.match = null;
    state.matchId = null;
    state.matchPickingRematch = false;
    state.matchLinkCopied = false;
    state.matchNameDraft = state.matchNameDraft || (state.user ? state.user.name : '') || '';
    if (!state.matchSetupQuizId && state.quizzes.length) state.matchSetupQuizId = state.quizzes[0].id;
    render();
    if (!state.quizzes.length) loadQuizzes().then(() => {
      if (!state.matchSetupQuizId && state.quizzes.length) { state.matchSetupQuizId = state.quizzes[0].id; render(); }
    });
  }
  function pickMatchQuiz(id) { state.matchSetupQuizId = id; render(); }
  function updateMatchNameDraft(v) { state.matchNameDraft = v; }

  async function createMatchRoom() {
    const name = (state.matchNameDraft || '').trim();
    if (!name) return;
    try {
      const data = await api('matches', { method: 'POST', body: { quizId: state.matchSetupQuizId, name } });
      localStorage.setItem(matchIdentityKey(data.id), name);
      state.match = data;
      state.matchId = data.id;
      state.matchIdentity = name;
      state.matchRoundContext = { matchId: data.id, roundId: data.rounds[0].id };
      await enterQuiz(state.matchSetupQuizId);
    } catch (e) {
      showToast(e.message || 'Could not create match.');
    }
  }

  async function openMatch(matchId) {
    const data = await api('matches/' + matchId);
    state.match = data;
    state.matchId = matchId;
    state.matchIdentity = localStorage.getItem(matchIdentityKey(matchId)) || null;
    state.matchPickingRematch = false;
    state.matchLinkCopied = false;
    state.matchNameDraft = state.matchIdentity || (state.user ? state.user.name : '') || '';
    state.view = 'match';
    maybeStartPolling();
  }

  async function reloadMatch() {
    if (!state.matchId) return;
    try {
      const data = await api('matches/' + state.matchId);
      state.match = data;
      render();
      maybeStartPolling();
    } catch (e) { /* non-fatal */ }
  }

  function maybeStartPolling() {
    stopMatchPolling();
    const mv = computeMatchView();
    if (mv.isWaiting) {
      state.matchPollTimer = setInterval(reloadMatch, 3000);
    }
  }

  async function acceptMatchChallenge() {
    const name = (state.matchNameDraft || '').trim();
    if (!name) return;
    localStorage.setItem(matchIdentityKey(state.matchId), name);
    state.matchIdentity = name;
    const round = state.match.rounds[state.match.rounds.length - 1];
    state.matchRoundContext = { matchId: state.matchId, roundId: round.id };
    await enterQuiz(round.quiz.id);
  }

  async function playMyTurn() {
    const round = state.match.rounds[state.match.rounds.length - 1];
    state.matchRoundContext = { matchId: state.matchId, roundId: round.id };
    await enterQuiz(round.quiz.id);
  }

  async function finishMatchRound() {
    const ctx = state.matchRoundContext;
    try {
      await api(`matches/${ctx.matchId}/rounds/${ctx.roundId}/complete`, {
        method: 'POST',
        body: { name: state.matchIdentity, answers: state.answers },
      });
    } catch (e) {
      showToast(e.message || 'Could not submit round.');
    }
    state.matchRoundContext = null;
    state.matchActive = false;
    state.matchLinkCopied = false;
    state.matchPickingRematch = false;
    state.view = 'match';
    await reloadMatch();
  }

  function startRematchPick() {
    state.matchPickingRematch = true;
    if (!state.matchSetupQuizId && state.quizzes.length) state.matchSetupQuizId = state.quizzes[0].id;
    render();
  }

  async function createNextRound() {
    try {
      const round = await api(`matches/${state.matchId}/rounds`, { method: 'POST', body: { quizId: state.matchSetupQuizId } });
      state.matchPickingRematch = false;
      state.matchRoundContext = { matchId: state.matchId, roundId: round.id };
      await enterQuiz(round.quiz.id);
    } catch (e) {
      showToast(e.message || 'Could not start next round.');
    }
  }

  function copyMatchLink() {
    const url = new URL(window.location.href);
    url.search = '';
    url.searchParams.set('match', state.matchId);
    const link = url.toString();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(() => { state.matchLinkCopied = true; render(); })
        .catch(() => { state.matchLinkCopied = true; render(); });
    } else {
      state.matchLinkCopied = true; render();
    }
  }

  function leaveMatch() {
    stopMatchPolling();
    state.view = 'home';
    state.match = null;
    state.matchId = null;
    state.matchIdentity = null;
    state.matchPickingRematch = false;
    state.matchLinkCopied = false;
    state.matchRoundContext = null;
    state.matchActive = false;
    render();
  }

  // ---------------------------------------------------------------------
  // Wordle
  // ---------------------------------------------------------------------
  async function startWordlePicker() {
    stopMatchPolling();
    state.view = 'wordle';
    state.wordleGameId = null;
    state.wordleGuesses = [];
    state.wordleCurrentGuess = '';
    state.wordleStatus = 'playing';
    state.wordleMessage = '';
    state.wordleAnonWon = null;
    render();
    try {
      const data = await api('wordle');
      state.wordlePuzzles = data.puzzles;
      render();
    } catch (e) { /* non-fatal */ }
  }

  async function startWordleGame(id) {
    state.wordleGameId = id;
    state.wordleCurrentGuess = '';
    state.wordleMessage = '';
    state.wordleAnonWon = null;
    render();
    try {
      const data = await api('wordle/' + id);
      state.wordlePuzzle = data;
      state.wordleGuesses = data.guesses || [];
      state.wordleStatus = data.status || 'playing';
      if (state.wordleStatus !== 'playing') {
        state.wordleMessage = state.wordleStatus === 'won' ? 'You already solved this one.' : 'You already used all your guesses.';
      }
      render();
    } catch (e) {
      showToast('Could not load puzzle.');
    }
  }

  function leaveWordle() {
    state.view = 'home';
    state.wordleGameId = null;
    state.wordleGuesses = [];
    state.wordleCurrentGuess = '';
    state.wordleStatus = 'playing';
    state.wordleMessage = '';
    render();
  }

  function wordleKeyPress(letter) {
    if (state.wordleStatus !== 'playing') return;
    if (state.wordleCurrentGuess.length >= 5) return;
    state.wordleCurrentGuess += letter;
    state.wordleMessage = '';
    render();
  }
  function wordleBackspace() {
    if (state.wordleStatus !== 'playing') return;
    state.wordleCurrentGuess = state.wordleCurrentGuess.slice(0, -1);
    render();
  }

  async function wordleSubmitGuess() {
    if (state.wordleStatus !== 'playing') return;
    const guess = state.wordleCurrentGuess;
    if (guess.length < 5) { state.wordleMessage = 'Not enough letters'; render(); return; }
    try {
      const data = await api(`wordle/${state.wordleGameId}/guess`, { method: 'POST', body: { guess } });
      state.wordleGuesses = [...state.wordleGuesses, { word: guess, result: data.result }];
      state.wordleCurrentGuess = '';
      state.wordleStatus = data.status;
      if (data.status === 'won') {
        state.wordleMessage = PRAISE[state.wordleGuesses.length - 1] || 'Solved!';
      } else if (data.status === 'lost') {
        state.wordleMessage = 'Out of guesses — the word was ' + (data.correctWord || '');
      } else {
        state.wordleMessage = '';
      }
      render();
    } catch (e) {
      if (e.status === 409 && e.data) {
        state.wordleGuesses = e.data.guesses || state.wordleGuesses;
        state.wordleStatus = e.data.status;
        state.wordleMessage = e.data.status === 'won' ? 'You already solved this one.' : 'You already used all your guesses.';
        render();
        return;
      }
      showToast(e.message || 'Could not submit guess.');
    }
  }

  function handleWordleKeydown(e) {
    if (state.view !== 'wordle' || !state.wordleGameId || state.wordleStatus !== 'playing') return;
    const tag = (document.activeElement && document.activeElement.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    const key = e.key;
    if (key === 'Enter') { wordleSubmitGuess(); return; }
    if (key === 'Backspace') { wordleBackspace(); return; }
    if (/^[a-zA-Z]$/.test(key)) { wordleKeyPress(key.toUpperCase()); }
  }
  window.addEventListener('keydown', handleWordleKeydown);

  // ---------------------------------------------------------------------
  // Footer subscribe
  // ---------------------------------------------------------------------
  function updateSubscribeEmail(v) { state.subscribeEmail = v; }
  function toggleSubscribeChecked() { state.subscribeChecked = !state.subscribeChecked; render(); }
  async function submitSubscribe() {
    const email = (state.subscribeEmail || '').trim();
    if (!email || !state.subscribeChecked) return;
    try {
      await api('leads', { method: 'POST', body: { email, source: 'subscribe' } });
    } catch (e) { /* non-fatal */ }
    state.subscribeDone = true;
    render();
  }

  // =======================================================================
  // RENDER
  // =======================================================================

  function renderNav() {
    const active = state.view;
    const pill = (id, label, view) => `<div class="nav-pill ${active === view ? 'active' : 'inactive'}" data-action="${id}">${label}</div>`;
    const hasName = state.user && state.user.name;
    const avatarBg = hasName ? 'white' : 'transparent';
    const avatarColor = hasName ? 'var(--primary)' : 'white';
    return `
    <nav class="nav">
      <div class="nav-brand" data-action="goHome">
        <img src="/footynerd-logo.png" alt="FootyNerd home">
        FOOTYNERD
      </div>
      <div class="nav-links">
        ${pill('goHome', 'Home', 'home')}
        ${pill('goQuizzes', 'Quizzes', 'quizzes')}
        ${pill('goLeaderboard', 'Leaderboard', 'leaderboard')}
        <div class="nav-avatar" title="Account" data-action="goAccount" style="background:${avatarBg}; color:${avatarColor};">${esc(hasName ? initials(state.user.name) : '?')}</div>
      </div>
    </nav>`;
  }

  function renderFooter() {
    return `
    <footer>
      <div style="max-width:1160px; margin:0 auto; display:flex; justify-content:space-between; gap:48px; flex-wrap:wrap; margin-bottom:64px;">
        <div style="max-width:460px; flex:1; min-width:280px;">
          <h2 style="font-size:28px; margin:0 0 28px;">Subscribe For Updates</h2>
          ${state.subscribeDone ? `
            <p style="font-size:15px; color:oklch(0.85 0.02 250); margin:0;">You're on the list — thanks for subscribing.</p>
          ` : `
            <div>
              <label style="display:block; font-weight:700; font-size:14px; margin-bottom:10px;">Enter your email here *</label>
              <input id="subscribe-email" data-bind="subscribeEmail" value="${esc(state.subscribeEmail)}" placeholder="" style="margin-bottom:28px;">
              <div style="display:flex; align-items:center; flex-wrap:wrap; gap:24px;">
                <div style="display:flex; align-items:center; gap:12px; cursor:pointer;" data-action="toggleSubscribeChecked">
                  <div style="width:18px; height:18px; border:1px solid rgba(255,255,255,0.6); border-radius:2px; background:${state.subscribeChecked ? 'oklch(0.5 0.19 258)' : 'transparent'}; flex-shrink:0;"></div>
                  <div style="font-size:14px; color:oklch(0.9 0.01 250);">Yes, I want to receive updates *</div>
                </div>
                <button class="btn" data-action="submitSubscribe" style="background:oklch(0.5 0.19 258); color:white; padding:14px 32px; font-size:15px; font-weight:700; border-radius:3px;">Subscribe</button>
              </div>
            </div>
          `}
        </div>
        <nav style="display:flex; flex-direction:column; gap:22px; padding-top:6px;">
          <div class="footer-nav-link" data-action="goHome">Home</div>
          <div class="footer-nav-link" data-action="goQuizzes">Quizzes</div>
          <div class="footer-nav-link" data-action="goLeaderboard">Leaderboard</div>
        </nav>
      </div>
      <div style="max-width:1160px; margin:0 auto; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:16px; border-top:1px solid rgba(255,255,255,0.12); padding-top:28px;">
        <div style="display:flex; gap:14px;">
          <a href="#" class="social-btn">IG</a>
          <a href="#" class="social-btn">X</a>
        </div>
        <div style="font-size:14px; color:oklch(0.75 0.01 250);">© 2026 by FootyNerd</div>
      </div>
    </footer>`;
  }

  function renderEmailGateModal() {
    return `
    <div class="modal-overlay">
      <div class="modal-box">
        <h2 style="font-size:26px; margin:0 0 12px; color:var(--primary);">Keep the streak going</h2>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 24px; line-height:1.5;">You've played 5 quizzes. Enter your email to keep playing.</p>
        <input id="email-gate-input" data-bind="emailGateInput" value="${esc(state.emailGateInput)}" placeholder="you@example.com" class="field-input" style="margin-bottom:16px;">
        <button class="btn btn-primary" style="width:100%; margin-bottom:12px;" data-action="submitEmailGate">Continue Playing</button>
        <div style="cursor:pointer; font-size:13px; color:var(--text-secondary-55);" data-action="closeEmailGate">Not now</div>
      </div>
    </div>`;
  }

  function renderToast() {
    return `<div class="toast">${esc(state.toast)}</div>`;
  }

  // Shared auth form (sign in / create account), used on Account view
  // (signed out) and inline on the Result view when a save requires auth.
  function renderAuthForm(prefix, opts) {
    opts = opts || {};
    const f = state.authForm;
    const isRegister = f.mode === 'register';
    return `
      <div style="max-width:420px; ${opts.center ? 'margin:0 auto;' : ''}">
        <button class="btn btn-white" style="margin-bottom:24px; width:100%; justify-content:center;" data-action="signInWithGoogle">
          <span style="width:18px; height:18px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-size:11px; font-weight:700;">G</span>
          Continue with Google
        </button>
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:16px;">
          <div style="flex:1; height:1px; background:var(--border-light);"></div>
          <div style="font-size:12px; color:oklch(0.6 0.01 250);">or</div>
          <div style="flex:1; height:1px; background:var(--border-light);"></div>
        </div>
        <div style="display:flex; gap:8px; margin-bottom:16px;">
          <div class="chip ${isRegister ? 'active' : 'inactive'}" style="flex:1; text-align:center;" data-action="setAuthMode" data-arg="register">Create Account</div>
          <div class="chip ${!isRegister ? 'active' : 'inactive'}" style="flex:1; text-align:center;" data-action="setAuthMode" data-arg="login">Sign In</div>
        </div>
        <div style="display:flex; flex-direction:column; gap:12px;">
          ${isRegister ? `<input id="${prefix}-name" data-bind="authName" value="${esc(f.name)}" placeholder="Your name" class="field-input">` : ''}
          <input id="${prefix}-email" data-bind="authEmail" value="${esc(f.email)}" placeholder="you@example.com" class="field-input">
          <input id="${prefix}-password" data-bind="authPassword" value="${esc(f.password)}" type="password" placeholder="Password" class="field-input">
          <button class="btn btn-primary-sm" data-action="submitAuthForm" ${f.busy ? 'disabled' : ''}>${f.busy ? 'Please wait…' : (isRegister ? 'Create Account' : 'Sign In')}</button>
          ${f.error ? `<div class="form-error">${esc(f.error)}</div>` : ''}
        </div>
      </div>`;
  }

  function renderHome() {
    const featuredIds = ['worldcup', 'legends', 'ballondor'];
    const featured = featuredIds.map((id) => state.quizzes.find((q) => q.id === id)).filter(Boolean);
    return `
    <main>
      <div style="max-width:720px; margin:0 auto; padding:120px 48px 100px; text-align:center;" class="content-pad">
        <h1 style="font-weight:700; font-size:64px; letter-spacing:0.5px; margin:0 0 20px; line-height:1.05; color:var(--primary);">Know your football?</h1>
        <p style="font-size:19px; color:var(--text-secondary-45); margin:0 0 40px; line-height:1.5;">Soccer trivia across players, leagues, and national team history. Pass a quiz to earn points, and come back daily to build your streak.</p>
        <button class="btn btn-primary" style="margin-bottom:40px;" data-action="goQuizzes">Browse Quizzes</button>
        <div style="display:flex; gap:24px; flex-wrap:wrap; text-align:left;">
          <div style="flex:1; min-width:280px; background:var(--primary-tint); border:1px solid var(--primary-tint-border); border-radius:8px; padding:28px 32px; display:flex; flex-direction:column; gap:16px;">
            <div>
              <div class="eyebrow">Friend vs Friend</div>
              <h3 style="font-weight:600; font-size:21px; margin:0 0 6px; color:var(--text);">Start a Match Room</h3>
              <p style="font-size:14px; color:var(--text-secondary-50); margin:0;">Pick a quiz, play it, then send your friend the link to see who scores higher.</p>
            </div>
            <button class="btn btn-primary-sm" style="align-self:flex-start;" data-action="startMatchSetup">Start a Match Room</button>
          </div>
          <div style="flex:1; min-width:280px; background:var(--accent-tint); border:1px solid var(--accent-tint-border); border-radius:8px; padding:28px 32px; display:flex; flex-direction:column; gap:16px;">
            <div>
              <div class="eyebrow" style="color:var(--accent);">Word Game</div>
              <h3 style="font-weight:600; font-size:21px; margin:0 0 6px; color:var(--text);">Football Wordle</h3>
              <p style="font-size:14px; color:var(--text-secondary-50); margin:0;">Guess the five-letter football word in six tries. Two puzzles to try.</p>
            </div>
            <button class="btn btn-accent" style="align-self:flex-start;" data-action="startWordlePicker">Play Wordle</button>
          </div>
        </div>
      </div>
      <div style="max-width:1000px; margin:0 auto; padding:0 48px 100px;" class="content-pad">
        <h2 style="font-weight:600; font-size:28px; margin:0 0 40px; text-align:center; color:var(--primary);">Featured Quizzes</h2>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:28px; margin-bottom:40px;">
          ${featured.map((q) => `
            <div class="quiz-card">
              <div class="quiz-card-img" style="background-image:url('${esc(q.image)}');"></div>
              <div class="quiz-card-body">
                <div class="eyebrow">${esc(q.difficultyLabel)}</div>
                <h3 style="font-weight:600; font-size:22px; margin:0; line-height:1.15; color:var(--primary);">${esc(q.title)}</h3>
                <p style="font-size:14px; color:var(--text-secondary-50); margin:0; line-height:1.5; flex:1;">${esc(q.desc)}</p>
                <button class="btn btn-primary-xs" style="align-self:flex-start;" data-action="startQuiz" data-arg="${esc(q.id)}">Start Quiz</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div style="text-align:center;">
          <button class="btn btn-outline" data-action="goQuizzes">View All Quizzes</button>
        </div>
      </div>
    </main>`;
  }

  function renderQuizzesView() {
    const DIFFICULTIES = [
      { id: 'all', label: 'All Levels' },
      { id: 'easy', label: 'Easy · 25 pts' },
      { id: 'medium', label: 'Medium · 50 pts' },
      { id: 'hard', label: 'Hard · 75 pts' },
    ];
    const cats = state.categories.length ? state.categories : [
      { id: 'all', label: 'All Quizzes' }, { id: 'players', label: 'Players' },
      { id: 'leagues', label: 'Leagues' }, { id: 'national', label: 'National' },
    ];
    const list = state.quizzes
      .filter((q) => state.activeCategory === 'all' || q.category === state.activeCategory)
      .filter((q) => state.activeDifficulty === 'all' || q.difficulty === state.activeDifficulty)
      .slice()
      .sort((a, b) => (a.attempted ? 1 : 0) - (b.attempted ? 1 : 0));

    return `
    <main class="quizzes-main" style="display:flex; max-width:1160px; margin:0 auto; width:100%;">
      <aside style="width:170px; flex-shrink:0; padding:260px 0 120px 48px;" class="hide-on-narrow">
        <div style="font-size:10px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-65); margin-bottom:10px;">Difficulty</div>
        <div style="display:flex; flex-direction:column; gap:2px;">
          ${DIFFICULTIES.map((d) => `
            <div data-action="setDifficulty" data-arg="${d.id}" style="display:block; padding:6px 10px; border-radius:3px; font-size:12px; cursor:pointer; text-align:left;
              ${state.activeDifficulty === d.id ? 'background:var(--primary-tint); color:var(--primary); font-weight:700;' : 'background:transparent; color:var(--text-secondary-65); font-weight:500;'}">${esc(d.label)}</div>
          `).join('')}
        </div>
      </aside>
      <div style="flex:1; min-width:0; padding:80px 48px 120px; max-width:960px;" class="content-pad">
        <h1 style="font-weight:700; font-size:56px; letter-spacing:0.5px; margin:0 0 16px; line-height:1.05; color:var(--primary);">Test your Ball knowledge.</h1>
        <p style="font-size:18px; color:var(--text-secondary-45); margin:0 0 40px; max-width:520px;">Pick a quiz, answer the questions, and climb the leaderboard.</p>
        <div style="display:flex; flex-wrap:wrap; gap:10px; margin-bottom:48px;">
          ${cats.map((c) => `<div class="chip ${state.activeCategory === c.id ? 'active' : 'inactive'}" data-action="setCategory" data-arg="${c.id}">${esc(c.label)}</div>`).join('')}
        </div>
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(260px, 1fr)); gap:28px;">
          ${list.map((q) => `
            <div class="quiz-card" style="height:440px;">
              <div class="quiz-card-img tall" style="background-image:url('${esc(q.image)}');"></div>
              <div class="quiz-card-body" style="padding:24px 28px 28px;">
                <div class="eyebrow">${esc(q.difficultyLabel)}</div>
                <h2 style="font-weight:600; font-size:26px; margin:0; line-height:1.15; color:var(--primary);">${esc(q.title)}</h2>
                <p style="font-size:15px; color:var(--text-secondary-50); margin:0; line-height:1.5; flex:1;">${esc(q.desc)}</p>
                ${q.attempted
                  ? `<div style="align-self:flex-start; font-size:13px; font-weight:700; letter-spacing:0.3px; color:${q.attempt.passed ? 'var(--success)' : 'var(--danger)'};">${q.attempt.passed ? 'Passed' : 'Failed'} · ${q.attempt.score}/${q.attempt.total} · no retakes</div>`
                  : `<button class="btn btn-primary-sm" style="align-self:flex-start; padding:12px 24px; font-size:14px;" data-action="startQuiz" data-arg="${esc(q.id)}">Start Quiz</button>`
                }
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </main>`;
  }

  function renderPlayingView() {
    const total = state.quizQuestions.length;
    const qIndex = state.qIndex;
    const question = state.quizQuestions[qIndex];
    const progressPct = Math.round(((qIndex + (state.selectedIndex !== null ? 1 : 0)) / total) * 100) + '%';
    const hasAnswered = state.selectedIndex !== null;
    const nextLabel = qIndex + 1 < total ? 'Next Question' : 'See Results';

    const options = (question ? question.options : []).map((text, idx) => {
      let borderColor = 'oklch(0.9 0.01 250)', bgColor = 'white', labelColor = 'transparent', label = '';
      if (state.answerFeedback) {
        if (idx === state.answerFeedback.correctIndex) {
          borderColor = 'var(--primary-light)'; bgColor = 'oklch(0.97 0.03 250)'; labelColor = 'oklch(0.5 0.14 250)'; label = 'CORRECT';
        } else if (idx === state.selectedIndex) {
          borderColor = 'var(--danger-strong)'; bgColor = 'oklch(0.97 0.03 25)'; labelColor = 'var(--danger)'; label = 'YOUR PICK';
        }
      }
      return `
        <div data-action="selectAnswer" data-arg="${idx}" style="border:2px solid ${borderColor}; background:${bgColor}; border-radius:4px; padding:18px 22px; cursor:${hasAnswered ? 'default' : 'pointer'}; font-size:16px; font-weight:500; display:flex; align-items:center; justify-content:space-between;">
          <span>${esc(text)}</span>
          <span style="font-size:13px; font-weight:700; letter-spacing:0.5px; color:${labelColor};">${label}</span>
        </div>`;
    }).join('');

    return `
    <main style="max-width:720px; margin:0 auto; padding:72px 48px 120px; width:100%;" class="content-pad">
      ${state.matchActive ? `<div class="pill" style="margin-bottom:14px;">MATCH ROOM</div>` : ''}
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
        <div style="font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--primary-light);">${esc(state.quizMeta ? state.quizMeta.title : '')}</div>
        <div style="font-size:13px; color:var(--text-secondary-55);">Question ${qIndex + 1} of ${total}</div>
      </div>
      <div style="height:3px; background:oklch(0.93 0.01 250); border-radius:2px; margin-bottom:48px; overflow:hidden;">
        <div style="height:100%; background:var(--primary-light); border-radius:2px; width:${progressPct}; transition:width 0.25s;"></div>
      </div>
      <h2 style="font-weight:600; font-size:32px; line-height:1.25; margin:0 0 40px;">${esc(question ? question.question : '')}</h2>
      <div style="display:flex; flex-direction:column; gap:14px;">${options}</div>
      ${hasAnswered ? `
        <div style="margin-top:40px; display:flex; justify-content:flex-end;">
          <button class="btn btn-dark" data-action="nextQuestion">${nextLabel}</button>
        </div>` : ''}
    </main>`;
  }

  function renderResultView() {
    const total = state.quizQuestions.length;
    const score = state.score;
    const isPerfect = score === total;
    const passed = score >= PASS_THRESHOLD;
    const resultMessage = isPerfect
      ? 'Flawless. You know your football.'
      : passed ? 'You passed — solid performance.' : `Not quite — you needed ${PASS_THRESHOLD} correct to pass. No retakes on this one.`;

    let bottomBlock = '';
    if (state.resultPending) {
      bottomBlock = `<p style="font-size:14px; font-weight:600; color:var(--text-secondary-55);">Saving your result…</p>`;
    } else if (state.resultData) {
      const rd = state.resultData;
      const pointsText = rd.passed ? `+${rd.points} points earned` : '+0 points — quiz not passed';
      bottomBlock = `
        <p style="font-size:15px; font-weight:600; color:var(--primary); margin:0 0 6px;">${esc(pointsText)}</p>
        <p style="font-size:14px; color:var(--text-secondary-50); margin:0;">Streak: ${rd.streak} day(s)</p>`;
    } else if (state.resultError && state.resultError.needsAuth) {
      bottomBlock = `
        <p style="font-size:14px; font-weight:600; letter-spacing:0.3px; margin:0 0 18px;">Sign in to save this result</p>
        ${renderAuthForm('result', { center: true })}`;
    } else if (state.resultError && state.resultError.alreadyAttempted) {
      const a = state.resultError.attempt;
      bottomBlock = `<p style="font-size:14px; font-weight:600; color:var(--text-secondary-55);">You already saved a result for this quiz${a ? ` (${a.score}/${a.total})` : ''}.</p>`;
    } else if (state.resultError && state.resultError.message) {
      bottomBlock = `<p class="form-error">${esc(state.resultError.message)}</p>`;
    }

    return `
    <main style="max-width:640px; margin:0 auto; padding:96px 48px 120px; width:100%; text-align:center;" class="content-pad">
      <div style="font-size:13px; font-weight:600; letter-spacing:1px; text-transform:uppercase; color:var(--primary-light); margin-bottom:16px;">${esc(state.quizMeta ? state.quizMeta.title : '')} — Complete</div>
      <div style="font-weight:700; font-size:88px; line-height:1; margin-bottom:8px; font-family:'Oswald',sans-serif;">${score}<span style="font-size:36px; color:var(--text-secondary-55);">/${total}</span></div>
      <p style="font-size:17px; color:var(--text-secondary-45); margin:0 0 8px;">${resultMessage}</p>
      ${isPerfect ? `<div class="pill" style="margin-top:16px; padding:8px 18px; font-size:13px;">PERFECT SCORE</div>` : ''}
      <div style="margin-top:56px; border-top:1px solid var(--border-lighter); padding-top:40px;">
        ${bottomBlock}
        <div style="margin-top:32px; display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
          <div class="link-underline" data-action="goQuizzes">Back to Quizzes</div>
          <div class="link-underline" data-action="goLeaderboard">View Leaderboard</div>
          <div class="link-underline" data-action="goAccount">View Account</div>
        </div>
      </div>
    </main>`;
  }

  function renderAccountView() {
    if (!state.user) {
      return `
      <main style="max-width:760px; margin:0 auto; padding:80px 48px 120px; width:100%;" class="content-pad">
        <h1 style="font-weight:700; font-size:44px; margin:0 0 12px; color:var(--primary);">Account</h1>
        <p style="font-size:16px; color:var(--text-secondary-45); margin:0 0 32px; max-width:480px;">No account yet. Create one to track your streak, points, and quiz history — or just complete a quiz to get started.</p>
        ${renderAuthForm('account')}
      </main>`;
    }

    const data = state.accountData;
    const stats = data ? data.stats : { streak: state.user.currentStreak, totalPoints: 0, quizzesPassed: 0 };
    const history = data ? data.history : [];

    return `
    <main style="max-width:760px; margin:0 auto; padding:80px 48px 120px; width:100%;" class="content-pad">
      <h1 style="font-weight:700; font-size:44px; margin:0 0 12px; color:var(--primary);">Account</h1>
      <p style="font-size:16px; color:var(--text-secondary-45); margin:0 0 48px;">${esc(state.user.name)}’s quiz history and streak.</p>

      <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:20px; margin-bottom:56px;">
        <div style="border:1px solid var(--border-light); border-radius:4px; padding:24px;">
          <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:8px;">Current Streak</div>
          <div style="font-weight:700; font-size:36px; color:var(--primary); font-family:'Oswald',sans-serif;">${stats.streak} day(s)</div>
        </div>
        <div style="border:1px solid var(--border-light); border-radius:4px; padding:24px;">
          <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:8px;">Total Points</div>
          <div style="font-weight:700; font-size:36px; font-family:'Oswald',sans-serif;">${stats.totalPoints}</div>
        </div>
        <div style="border:1px solid var(--border-light); border-radius:4px; padding:24px;">
          <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:8px;">Quizzes Passed</div>
          <div style="font-weight:700; font-size:36px; font-family:'Oswald',sans-serif;">${stats.quizzesPassed}</div>
        </div>
      </div>

      <h2 style="font-weight:600; font-size:20px; margin:0 0 20px;">Account settings</h2>
      <div style="border:1px solid var(--border-light); border-radius:4px; padding:28px; max-width:420px; margin-bottom:56px;">
        <label class="field-label">Name</label>
        <input id="account-name" data-bind="accountNameDraft" value="${esc(state.accountNameDraft)}" placeholder="Your name" class="field-input" style="margin-bottom:18px;">
        <label class="field-label">Email</label>
        <input id="account-email" data-bind="accountEmailDraft" value="${esc(state.accountEmailDraft)}" placeholder="you@example.com" class="field-input" style="margin-bottom:18px;">
        <button class="btn btn-primary-xs" style="padding:12px 24px; font-size:14px;" data-action="saveAccountSettings">Save Changes</button>
        ${state.accountSettingsSaved ? `<span style="margin-left:14px; font-size:13px; font-weight:600; color:var(--success);">Saved</span>` : ''}
        <div style="margin-top:18px;"><span class="link-underline" style="font-size:13px;" data-action="logout">Sign out</span></div>
      </div>

      <h2 style="font-weight:600; font-size:20px; margin:0 0 20px;">All quizzes</h2>
      <div style="display:flex; flex-direction:column;">
        ${history.map((row) => `
          <div style="display:flex; align-items:center; gap:16px; padding:16px 0; border-bottom:1px solid var(--border-lighter);">
            <div style="flex:1; min-width:0; font-weight:600; font-size:15px;">${esc(row.title)}</div>
            <div style="width:70px; font-size:13px; color:var(--text-secondary-55);">${esc(row.difficultyLabel)}</div>
            <div style="width:70px; font-size:13px; color:var(--text-secondary-55);">${esc(row.scoreText)}</div>
            <div style="width:90px; font-size:13px; font-weight:700; color:${row.statusColor};">${esc(row.statusText)}</div>
            <div style="width:50px; text-align:right; font-weight:700; font-size:15px; font-family:'Oswald',sans-serif;">${esc(row.pointsText)}</div>
          </div>
        `).join('')}
      </div>
    </main>`;
  }

  function renderLeaderboardView() {
    const data = state.leaderboard || { leaderboardRows: [], streakRows: [] };
    return `
    <main style="max-width:760px; margin:0 auto; padding:80px 48px 120px; width:100%;" class="content-pad">
      <h1 style="font-weight:700; font-size:44px; margin:0 0 12px; color:var(--primary);">Leaderboard</h1>
      <p style="font-size:16px; color:var(--text-secondary-45); margin:0 0 56px;">Points earned across every quiz.</p>

      ${data.leaderboardRows.length ? `
        <div style="display:flex; flex-direction:column;">
          ${data.leaderboardRows.map((row) => `
            <div style="display:flex; align-items:center; gap:20px; padding:20px 0; border-bottom:1px solid var(--border-lighter);">
              <div style="width:28px; font-weight:600; font-size:18px; color:var(--text-secondary-60); text-align:center; font-family:'Oswald',sans-serif;">${row.rank}</div>
              <div style="width:44px; height:44px; border-radius:50%; background:${row.avatarColor}; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:15px; flex-shrink:0;">${esc(row.initials)}</div>
              <div style="flex:1; min-width:0;">
                <div style="font-weight:600; font-size:16px;">${esc(row.name)}</div>
                <div style="font-size:13px; color:var(--text-secondary-55); margin-top:2px;">${esc(row.subline)}</div>
              </div>
              ${row.hasBadge ? `<div class="pill" style="white-space:nowrap;">${esc(row.badgeText)}</div>` : ''}
              <div style="font-weight:700; font-size:22px; width:80px; text-align:right; font-family:'Oswald',sans-serif;">${row.points}</div>
            </div>
          `).join('')}
        </div>
      ` : `<div style="text-align:center; padding:60px 0; color:var(--text-secondary-55); font-size:15px;">No scores yet — play a quiz to take the top spot.</div>`}

      <h2 style="font-weight:600; font-size:24px; margin:72px 0 24px; color:var(--primary);">Longest Streak</h2>
      ${data.streakRows.length ? `
        <div style="display:flex; flex-direction:column;">
          ${data.streakRows.map((row) => `
            <div style="display:flex; align-items:center; gap:20px; padding:16px 0; border-bottom:1px solid var(--border-lighter);">
              <div style="width:28px; font-weight:600; font-size:18px; color:var(--text-secondary-60); text-align:center; font-family:'Oswald',sans-serif;">${row.rank}</div>
              <div style="width:40px; height:40px; border-radius:50%; background:${row.avatarColor}; color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; flex-shrink:0;">${esc(row.initials)}</div>
              <div style="flex:1; font-weight:600; font-size:15px;">${esc(row.name)}</div>
              <div style="font-weight:700; font-size:18px; font-family:'Oswald',sans-serif;">${esc(row.streakText)}</div>
            </div>
          `).join('')}
        </div>
      ` : `<div style="text-align:center; padding:40px 0; color:var(--text-secondary-55); font-size:15px;">No streaks yet — play a quiz today to start one.</div>`}
    </main>`;
  }

  function renderQuizChoiceGrid(selectedId) {
    return `
      <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(220px,1fr)); gap:12px; margin-bottom:32px;">
        ${state.quizzes.map((q) => {
          const selected = selectedId === q.id;
          return `
          <div data-action="pickMatchQuiz" data-arg="${esc(q.id)}" style="border:${selected ? '2px solid var(--primary)' : '1px solid oklch(0.9 0.01 250)'}; background:${selected ? 'var(--primary-tint)' : 'white'}; border-radius:4px; padding:14px 16px; cursor:pointer;">
            <div style="font-weight:700; font-size:14px; margin-bottom:4px;">${esc(q.title)}</div>
            <div style="font-size:12px; color:var(--text-secondary-55);">${esc(q.difficultyLabel)}</div>
          </div>`;
        }).join('')}
      </div>`;
  }

  function renderMatchView() {
    const mv = computeMatchView();
    let body = '';

    if (mv.isSetup) {
      body = `
        <h1 style="font-weight:700; font-size:38px; margin:0 0 12px; color:var(--primary);">Challenge a Friend</h1>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 32px;">Pick a quiz and enter your name. You’ll play first, then get a link to send your friend.</p>
        <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:12px;">Choose a quiz</div>
        ${renderQuizChoiceGrid(state.matchSetupQuizId)}
        <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:10px;">Your name</div>
        <div style="display:flex; gap:12px; max-width:420px; margin-bottom:32px;">
          <input id="match-setup-name" data-bind="matchNameDraft" value="${esc(state.matchNameDraft)}" placeholder="Your name" class="field-input">
        </div>
        <button class="btn btn-primary-sm" style="padding:14px 32px; font-size:15px;" data-action="createMatchRoom">Play &amp; Create Room</button>`;
    } else if (mv.isRematchPick) {
      body = `
        <h1 style="font-weight:700; font-size:38px; margin:0 0 12px; color:var(--primary);">Pick the Next Quiz</h1>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 32px;">Round ${state.match.rounds.length + 1} — choose a quiz, then play it.</p>
        ${renderQuizChoiceGrid(state.matchSetupQuizId)}
        <button class="btn btn-primary-sm" style="padding:14px 32px; font-size:15px;" data-action="createNextRound">Play This Round</button>`;
    } else if (mv.isTurn) {
      const round = mv.round;
      const challenger = round.entries[0] ? round.entries[0].name : '';
      const needsIdentity = !state.matchIdentity;
      body = `
        <h1 style="font-weight:700; font-size:36px; margin:0 0 12px; color:var(--primary);">${esc(challenger)} challenged you</h1>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 32px;">Quiz: <strong>${esc(round.quiz.title)}</strong>. Play it now to see who scores higher.</p>
        ${needsIdentity ? `
          <div style="font-size:12px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--text-secondary-55); margin-bottom:10px;">Your name</div>
          <div style="display:flex; gap:12px; max-width:420px; margin-bottom:28px;">
            <input id="match-turn-name" data-bind="matchNameDraft" value="${esc(state.matchNameDraft)}" placeholder="Your name" class="field-input">
          </div>
          <button class="btn btn-primary-sm" style="padding:14px 32px; font-size:15px;" data-action="acceptMatchChallenge">Accept &amp; Play</button>
        ` : `
          <button class="btn btn-primary-sm" style="padding:14px 32px; font-size:15px;" data-action="playMyTurn">Play Now</button>
        `}`;
    } else if (mv.isWaiting) {
      const round = mv.round;
      const mine = round.entries[0];
      const link = (() => { const u = new URL(window.location.href); u.search = ''; u.searchParams.set('match', state.matchId); return u.toString(); })();
      body = `
        <h1 style="font-weight:700; font-size:36px; margin:0 0 12px; color:var(--primary);">You scored ${mine.score}/${mine.total}</h1>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 32px;">Send this link to your friend so they can play <strong>${esc(round.quiz.title)}</strong> and see how they compare.</p>
        <div style="display:flex; gap:12px; max-width:520px; margin-bottom:16px;">
          <input readonly value="${esc(link)}" style="flex:1; padding:14px 16px; border:1px solid var(--border-input); border-radius:4px; font-size:13px; color:var(--text-secondary-45);">
          <button class="btn btn-primary-sm" style="padding:14px 24px; font-size:14px;" data-action="copyMatchLink">Copy Link</button>
        </div>
        ${state.matchLinkCopied ? `<div style="font-size:13px; font-weight:600; color:var(--success);">Link copied — waiting for your friend to play.</div>` : ''}
        <div style="font-size:12px; color:var(--text-secondary-55); margin-top:24px;">This page checks automatically every few seconds.</div>`;
    } else if (mv.isResult) {
      const round = mv.round;
      const meEntry = round.entries.find((e) => e.name === state.matchIdentity) || round.entries[0];
      const oppEntry = round.entries.find((e) => e !== meEntry) || round.entries[1];
      const totalCorrect = (meEntry.score + oppEntry.score) || 1;
      const mePct = Math.round((meEntry.score / totalCorrect) * 100);
      const oppPct = 100 - mePct;
      let winnerText;
      if (meEntry.score > oppEntry.score) winnerText = 'You win this round!';
      else if (oppEntry.score > meEntry.score) winnerText = oppEntry.name + ' wins this round';
      else winnerText = "It's a tie!";

      const historyRows = state.match.rounds.filter((r) => r.entries.length === 2).map((r) => {
        const me2 = r.entries.find((e) => e.name === state.matchIdentity) || r.entries[0];
        const opp2 = r.entries.find((e) => e !== me2) || r.entries[1];
        const result = me2.score > opp2.score ? 'W' : me2.score < opp2.score ? 'L' : 'T';
        return { title: r.quiz.title, myScore: me2.score, oppScore: opp2.score, result };
      });
      let w = 0, l = 0, t = 0;
      historyRows.forEach((r) => { if (r.result === 'W') w++; else if (r.result === 'L') l++; else t++; });
      const seriesText = t ? `Series: ${w}-${l}-${t}` : `Series: ${w}-${l}`;

      body = `
        <div style="font-size:13px; font-weight:600; letter-spacing:0.5px; text-transform:uppercase; color:var(--primary-light); margin-bottom:6px;">Round ${round.roundNumber} · ${esc(round.quiz.title)}</div>
        <h1 style="font-weight:700; font-size:32px; margin:0 0 32px; color:var(--primary);">${esc(winnerText)}</h1>
        <div style="display:flex; align-items:center; justify-content:center; gap:28px; margin-bottom:24px;">
          <div style="text-align:center;">
            <div style="width:64px; height:64px; border-radius:50%; background:var(--primary); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; margin:0 auto 10px;">${esc(initials(meEntry.name))}</div>
            <div style="font-weight:700; font-size:15px;">${esc(meEntry.name)}</div>
            <div style="font-weight:700; font-size:30px; color:var(--primary); font-family:'Oswald',sans-serif;">${meEntry.score}/${meEntry.total}</div>
          </div>
          <div style="font-weight:700; font-size:20px; color:var(--text-secondary-65); font-family:'Oswald',sans-serif;">VS</div>
          <div style="text-align:center;">
            <div style="width:64px; height:64px; border-radius:50%; background:var(--opponent); color:white; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:22px; margin:0 auto 10px;">${esc(initials(oppEntry.name))}</div>
            <div style="font-weight:700; font-size:15px;">${esc(oppEntry.name)}</div>
            <div style="font-weight:700; font-size:30px; color:var(--opponent); font-family:'Oswald',sans-serif;">${oppEntry.score}/${oppEntry.total}</div>
          </div>
        </div>
        <div style="height:14px; border-radius:7px; background:oklch(0.93 0.01 250); overflow:hidden; display:flex; margin-bottom:8px;">
          <div style="height:100%; background:var(--primary); width:${mePct}%;"></div>
          <div style="height:100%; background:var(--opponent); width:${oppPct}%;"></div>
        </div>
        <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-secondary-55); margin-bottom:40px;">
          <span>${mePct}%</span><span>${oppPct}%</span>
        </div>
        <div style="border-top:1px solid var(--border-lighter); padding-top:28px; margin-bottom:32px;">
          <div style="font-weight:700; font-size:15px; margin-bottom:16px;">${esc(seriesText)}</div>
          <div style="display:flex; flex-direction:column;">
            ${historyRows.map((row) => `
              <div style="display:flex; align-items:center; justify-content:space-between; padding:10px 0; border-bottom:1px solid oklch(0.95 0.01 250); font-size:14px;">
                <div style="font-weight:600;">${esc(row.title)}</div>
                <div style="color:var(--text-secondary-50);">${row.myScore} – ${row.oppScore}</div>
                <div style="font-weight:700;">${row.result}</div>
              </div>`).join('')}
          </div>
        </div>
        <div style="display:flex; gap:16px; flex-wrap:wrap;">
          <button class="btn btn-primary-sm" style="padding:14px 28px; font-size:14px;" data-action="startRematchPick">Play Next Round</button>
          <div class="link-underline" data-action="leaveMatch">Done</div>
        </div>`;
    }

    return `
    <main style="max-width:640px; margin:0 auto; padding:72px 48px 120px; width:100%;" class="content-pad">
      <div style="cursor:pointer; font-size:13px; font-weight:600; color:var(--text-secondary-55); margin-bottom:8px;" data-action="leaveMatch">← Back to Home</div>
      <div style="font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--primary-light); margin-bottom:20px;">Match Room</div>
      ${body}
    </main>`;
  }

  function renderWordleView() {
    let body;
    if (!state.wordleGameId) {
      body = `
        <h1 style="font-weight:700; font-size:38px; margin:0 0 12px; color:var(--primary);">Choose a Puzzle</h1>
        <p style="font-size:15px; color:var(--text-secondary-45); margin:0 0 32px;">Two five-letter football words. Six guesses each.</p>
        <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(240px,1fr)); gap:16px;">
          ${state.wordlePuzzles.map((w) => {
            let statusText = 'Not attempted';
            if (w.status === 'won') statusText = `Solved in ${w.guessCount}/6`;
            else if (w.status === 'lost') statusText = 'Not solved';
            return `
            <div data-action="startWordleGame" data-arg="${esc(w.id)}" style="border:1px solid var(--accent-tint-border); background:var(--accent-tint); border-radius:6px; padding:22px; cursor:pointer;">
              <div style="font-weight:700; font-size:16px; margin-bottom:6px;">${esc(w.label)}</div>
              <div style="font-size:13px; color:var(--text-secondary-50); margin-bottom:10px;">${esc(w.hint)}</div>
              <div style="font-size:12px; font-weight:700; color:var(--accent); letter-spacing:0.3px;">${statusText}</div>
            </div>`;
          }).join('')}
        </div>`;
    } else {
      const puzzle = state.wordlePuzzle || { label: '', hint: '' };
      const guesses = state.wordleGuesses;
      const current = state.wordleCurrentGuess;
      const status = state.wordleStatus;
      const guessCount = Math.min(guesses.length + (status === 'playing' ? 1 : 0), 6);
      const finished = status !== 'playing';

      const letterStatus = {};
      guesses.forEach((g) => {
        g.word.split('').forEach((ch, idx) => {
          const s = g.result[idx];
          const rank = { correct: 3, present: 2, absent: 1 };
          if (!letterStatus[ch] || rank[s] > rank[letterStatus[ch]]) letterStatus[ch] = s;
        });
      });

      const rows = [];
      for (let i = 0; i < 6; i++) {
        let cellsHtml;
        if (i < guesses.length) {
          const g = guesses[i];
          cellsHtml = g.word.split('').map((ch, idx) => {
            const c = WORDLE_COLOR[g.result[idx]];
            return `<div class="wordle-cell" style="background:${c}; color:white; border:2px solid ${c};">${esc(ch)}</div>`;
          }).join('');
        } else if (i === guesses.length && status === 'playing') {
          cellsHtml = Array.from({ length: 5 }).map((_, idx) => {
            const ch = current[idx] || '';
            return `<div class="wordle-cell" style="background:white; color:oklch(0.2 0.01 250); border:2px solid ${ch ? 'oklch(0.5 0.01 250)' : 'oklch(0.88 0.01 250)'};">${esc(ch)}</div>`;
          }).join('');
        } else {
          cellsHtml = Array.from({ length: 5 }).map(() => `<div class="wordle-cell" style="background:white; color:oklch(0.2 0.01 250); border:2px solid oklch(0.9 0.01 250);"></div>`).join('');
        }
        rows.push(`<div class="wordle-row" style="display:flex; gap:8px;">${cellsHtml}</div>`);
      }

      const msgColor = status === 'won' ? 'var(--success)' : (status === 'lost' ? 'var(--danger)' : 'var(--text-secondary-45)');

      const keyboardRows = WORDLE_KEY_ROWS.map((row) => `
        <div class="wordle-key-row" style="display:flex; gap:6px;">
          ${row.map((k) => {
            let bg = 'oklch(0.88 0.01 250)', color = 'oklch(0.22 0.01 250)';
            if (k.length === 1 && letterStatus[k]) { bg = WORDLE_COLOR[letterStatus[k]]; color = 'white'; }
            const isWide = k === 'ENTER' || k === '⌫';
            const action = k === 'ENTER' ? 'wordleSubmitGuess' : (k === '⌫' ? 'wordleBackspace' : 'wordleKeyPress');
            const arg = (k === 'ENTER' || k === '⌫') ? '' : ` data-arg="${k}"`;
            return `<div class="wordle-key" data-action="${action}"${arg} style="background:${bg}; color:${color}; min-width:${isWide ? '54px' : '34px'}; font-size:${isWide ? '11px' : '13px'};">${k}</div>`;
          }).join('')}
        </div>`).join('');

      body = `
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px;">
          <h1 style="font-weight:700; font-size:28px; margin:0; color:var(--primary);">${esc(puzzle.label)}</h1>
          <div style="font-size:13px; color:var(--text-secondary-55);">Guess ${guessCount} of 6</div>
        </div>
        <p style="font-size:14px; color:var(--text-secondary-50); margin:0 0 28px;">${esc(puzzle.hint)}</p>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-bottom:24px;">${rows.join('')}</div>
        <div style="min-height:24px; text-align:center; margin-bottom:16px;">
          ${state.wordleMessage ? `<div style="font-size:14px; font-weight:700; color:${msgColor};">${esc(state.wordleMessage)}</div>` : ''}
        </div>
        <div style="display:flex; flex-direction:column; gap:8px; align-items:center; margin-bottom:24px;">${keyboardRows}</div>
        ${finished ? `
          <div style="display:flex; gap:16px; justify-content:center; flex-wrap:wrap;">
            <button class="btn btn-accent" data-action="startWordlePicker">Play the Other Wordle</button>
            <div class="link-underline" data-action="leaveWordle">Done</div>
          </div>` : ''}`;
    }

    return `
    <main style="max-width:640px; margin:0 auto; padding:72px 48px 120px; width:100%;" class="content-pad">
      <div style="cursor:pointer; font-size:13px; font-weight:600; color:var(--text-secondary-55); margin-bottom:8px;" data-action="leaveWordle">← Back to Home</div>
      <div style="font-size:12px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--accent); margin-bottom:20px;">Football Wordle</div>
      ${body}
    </main>`;
  }

  // =======================================================================
  // Top-level render + wiring
  // =======================================================================

  function renderApp() {
    let mainHtml;
    switch (state.view) {
      case 'quizzes': mainHtml = renderQuizzesView(); break;
      case 'playing': mainHtml = renderPlayingView(); break;
      case 'result': mainHtml = renderResultView(); break;
      case 'account': mainHtml = renderAccountView(); break;
      case 'leaderboard': mainHtml = renderLeaderboardView(); break;
      case 'match': mainHtml = renderMatchView(); break;
      case 'wordle': mainHtml = renderWordleView(); break;
      default: mainHtml = renderHome();
    }
    return `
      <div style="min-height:100vh; display:flex; flex-direction:column;">
        ${renderNav()}
        ${mainHtml}
        ${renderFooter()}
      </div>
      ${state.showEmailGate ? renderEmailGateModal() : ''}
      ${state.toast ? renderToast() : ''}
    `;
  }

  const root = document.getElementById('app');

  function render() {
    const active = document.activeElement;
    let focusId = null, selStart = null, selEnd = null;
    if (active && active.id && root.contains(active)) {
      focusId = active.id;
      if ('selectionStart' in active) {
        try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) {}
      }
    }
    root.innerHTML = renderApp();
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) {
        el.focus();
        if (selStart != null && el.setSelectionRange) {
          try { el.setSelectionRange(selStart, selEnd); } catch (e) {}
        }
      }
    }
  }

  // ---------------------------------------------------------------------
  // Action map (data-action) + bind map (data-bind)
  // ---------------------------------------------------------------------
  const ACTIONS = {
    goHome, goQuizzes, goLeaderboard, goAccount,
    startMatchSetup, startWordlePicker,
    startQuiz: (arg) => startQuiz(arg),
    setCategory: (arg) => setCategory(arg),
    setDifficulty: (arg) => setDifficulty(arg),
    selectAnswer: (arg) => selectAnswer(Number(arg)),
    nextQuestion,
    saveAccountSettings, logout, signInWithGoogle,
    setAuthMode: (arg) => setAuthMode(arg),
    submitAuthForm,
    closeEmailGate, submitEmailGate,
    toggleSubscribeChecked, submitSubscribe,
    pickMatchQuiz: (arg) => pickMatchQuiz(arg),
    createMatchRoom, acceptMatchChallenge, playMyTurn,
    startRematchPick, createNextRound, copyMatchLink, leaveMatch,
    startWordleGame: (arg) => startWordleGame(arg),
    wordleKeyPress: (arg) => wordleKeyPress(arg),
    wordleBackspace, wordleSubmitGuess, leaveWordle,
  };

  const BIND = {
    subscribeEmail: updateSubscribeEmail,
    emailGateInput: updateEmailGateInput,
    authName: (v) => updateAuthField('name', v),
    authEmail: (v) => updateAuthField('email', v),
    authPassword: (v) => updateAuthField('password', v),
    accountNameDraft: (v) => { state.accountNameDraft = v; },
    accountEmailDraft: (v) => { state.accountEmailDraft = v; },
    matchNameDraft: updateMatchNameDraft,
  };

  root.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const action = el.getAttribute('data-action');
    const arg = el.hasAttribute('data-arg') ? el.getAttribute('data-arg') : undefined;
    const fn = ACTIONS[action];
    if (fn) fn(arg, el);
  });

  root.addEventListener('input', (e) => {
    const bind = e.target.getAttribute && e.target.getAttribute('data-bind');
    if (!bind) return;
    const fn = BIND[bind];
    if (fn) fn(e.target.value);
  });

  root.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter') return;
    const bind = e.target.getAttribute && e.target.getAttribute('data-bind');
    if (!bind) return;
    // Submit-on-Enter for single-line text inputs in forms.
    if (bind === 'authPassword') submitAuthForm();
    else if (bind === 'emailGateInput') submitEmailGate();
    else if (bind === 'matchNameDraft') {
      const mv = computeMatchView();
      if (mv.isSetup) createMatchRoom();
      else if (mv.isTurn) acceptMatchChallenge();
    }
  });

  // ---------------------------------------------------------------------
  // Boot
  // ---------------------------------------------------------------------
  render();
  boot();
})();
