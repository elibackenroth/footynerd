import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import type { ViewName } from './lib/viewTypes';
import type { Quiz, QuizAttempt, QuizQuestionPublic, PointsLeaderboardRow, FootygridPlayer, FootygridGrid, WordlePuzzlePublic, WordleGuess, TransferDaily, FootygridAttempt } from './lib/types';
import type { MatchFull, GridDuelFull } from './lib/api';
import {
  fetchQuizzes,
  fetchQuizQuestions,
  fetchQuizQuestionCounts,
  fetchMyAttempts,
  completeQuiz,
  updateProfile,
  fetchPointsLeaderboard,
  createMatch,
  createNextRound,
  submitMatchEntry,
  fetchMatch,
  fetchFootygridPlayers,
  fetchFootygridGrids,
  createGridDuelRoom,
  createGridDuelNextRound,
  submitGridDuelEntry,
  fetchGridDuelRoom,
  fetchWordlePuzzles,
  fetchMyWordleAttempts,
  fetchTransferDailies,
  fetchMyFootygridAttempts,
} from './lib/api';
import { loadDoneTransferDays } from './lib/daily';
import { pathForView, routeFromPath } from './lib/routing';

import Nav from './components/Nav';
import Footer from './components/Footer';
import EmailGateModal from './components/EmailGateModal';
import Home from './pages/Home';
import Quizzes from './pages/Quizzes';
import Series from './pages/Series';
import { SERIES } from './lib/series';
import QuizPlay from './pages/QuizPlay';
import Result from './pages/Result';
import Account from './pages/Account';
import Leaderboard from './pages/Leaderboard';
import MatchRoom from './pages/MatchRoom';
import Wordle from './pages/Wordle';
import TransferChain from './pages/TransferChain';
import FootyGrid from './pages/FootyGrid';
import GridDuel from './pages/GridDuel';
import GridDuelPlay from './pages/GridDuelPlay';

const GUEST_PLAYS_KEY = 'footynerd_guest_plays';
function getGuestPlayCount() { return parseInt(localStorage.getItem(GUEST_PLAYS_KEY) || '0', 10); }
function incrementGuestPlayCount() { localStorage.setItem(GUEST_PLAYS_KEY, String(getGuestPlayCount() + 1)); }

function matchIdentityKey(matchId: string) { return 'footynerd_match_identity_' + matchId; }
function gridDuelIdentityKey(roomId: string) { return 'footynerd_gridduel_identity_' + roomId; }

export default function App() {
  const { user, profile, refreshProfile, signUp, signIn, signOut } = useAuth();

  const [isMobile, setIsMobile] = useState(() => { try { return window.innerWidth <= 767; } catch { return false; } });
  const [isTablet, setIsTablet] = useState(() => { try { return window.innerWidth > 767 && window.innerWidth <= 1024; } catch { return false; } });
  const [dailyJumpDate, setDailyJumpDate] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [view, setView] = useState<ViewName>(() => { try { return routeFromPath(window.location.pathname).view; } catch { return 'home'; } });
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [questionCounts, setQuestionCounts] = useState<Record<string, number>>({});
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');
  const [activeSort, setActiveSort] = useState('recent');
  const [quizQuery, setQuizQuery] = useState('');
  const [seriesId, setSeriesId] = useState<string | null>(() => { try { return routeFromPath(window.location.pathname).seriesId; } catch { return null; } });

  // quiz play
  const [activeQuizId, setActiveQuizId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<QuizQuestionPublic[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [correctIndex, setCorrectIndex] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [matchActive, setMatchActive] = useState(false);

  // result
  const [resultData, setResultData] = useState<{ score: number; total: number; passed: boolean; points: number; persisted: boolean; streak?: number } | null>(null);

  // email gate
  const [showEmailGate, setShowEmailGate] = useState(false);
  const [pendingQuizId, setPendingQuizId] = useState<string | null>(null);

  // leaderboard
  const [pointsRows, setPointsRows] = useState<PointsLeaderboardRow[]>([]);

  // match room
  const [match, setMatch] = useState<MatchFull | null>(null);
  const [matchIdentity, setMatchIdentity] = useState<string | null>(null);
  const [matchPickingRematch, setMatchPickingRematch] = useState(false);
  const [matchSetupQuizId, setMatchSetupQuizId] = useState('');
  const [matchNameDraft, setMatchNameDraft] = useState('');
  const [matchLinkCopied, setMatchLinkCopied] = useState(false);

  // footygrid (shared between FootyGrid page and Grid Duel)
  const [footygridPlayers, setFootygridPlayers] = useState<FootygridPlayer[]>([]);
  const [footygridGrids, setFootygridGrids] = useState<FootygridGrid[]>([]);
  const [footygridAttempts, setFootygridAttempts] = useState<Record<string, FootygridAttempt>>({});

  // daily games summary (for Home page "Today's Daily Games")
  const [wordlePuzzles, setWordlePuzzles] = useState<WordlePuzzlePublic[]>([]);
  const [wordleAttempts, setWordleAttempts] = useState<Record<string, { guesses: WordleGuess[]; status: string }>>({});
  const [transferDailies, setTransferDailies] = useState<TransferDaily[]>([]);
  const [doneTransferDays, setDoneTransferDays] = useState<Record<string, { score: number; total: number }>>({});

  // grid duel
  const [gridDuel, setGridDuel] = useState<GridDuelFull | null>(null);
  const [gridDuelIdentity, setGridDuelIdentity] = useState<string | null>(null);
  const [gridDuelPickingRematch, setGridDuelPickingRematch] = useState(false);
  const [gridDuelSetupGridId, setGridDuelSetupGridId] = useState('');
  const [gridDuelNameDraft, setGridDuelNameDraft] = useState('');
  const [gridDuelLinkCopied, setGridDuelLinkCopied] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const lastView = useRef(view);

  function setQuizSort(mode: string) {
    setActiveSort(mode);
  }

  // ---------- initial load ----------
  useEffect(() => {
    fetchQuizzes().then((qs) => {
      setQuizzes(qs);
      setMatchSetupQuizId((prev) => prev || qs[0]?.id || '');
    });
    fetchQuizQuestionCounts().then(setQuestionCounts);
    fetchFootygridPlayers().then(setFootygridPlayers);
    fetchFootygridGrids().then((gs) => {
      setFootygridGrids(gs);
      setGridDuelSetupGridId((prev) => prev || gs[gs.length - 1]?.id || '');
    });
    fetchWordlePuzzles().then(setWordlePuzzles);
    fetchTransferDailies().then(setTransferDailies);
    setDoneTransferDays(loadDoneTransferDays());

    const params = new URLSearchParams(window.location.search);
    const matchParam = params.get('match');
    if (matchParam) {
      fetchMatch(matchParam).then((fresh) => {
        if (!fresh) return;
        const storedIdentity = localStorage.getItem(matchIdentityKey(matchParam));
        setMatch(fresh);
        setMatchIdentity(storedIdentity || null);
        setMatchPickingRematch(false);
        setMatchLinkCopied(false);
        setView('match');
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('match');
      window.history.replaceState({}, '', url.toString());
    }
    const duelParam = params.get('duel');
    if (duelParam) {
      fetchGridDuelRoom(duelParam).then((fresh) => {
        if (!fresh) return;
        const storedIdentity = localStorage.getItem(gridDuelIdentityKey(duelParam));
        setGridDuel(fresh);
        setGridDuelIdentity(storedIdentity || null);
        setGridDuelPickingRematch(false);
        setGridDuelLinkCopied(false);
        setView('gridduel');
      });
      const url = new URL(window.location.href);
      url.searchParams.delete('duel');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMyAttempts(user.id).then(setAttempts);
      fetchMyWordleAttempts(user.id).then(setWordleAttempts);
      fetchMyFootygridAttempts(user.id).then(setFootygridAttempts);
    } else {
      setAttempts({});
      setWordleAttempts({});
      setFootygridAttempts({});
    }
  }, [user]);

  useEffect(() => {
    if (view === 'leaderboard' || view === 'home') {
      fetchPointsLeaderboard().then(setPointsRows);
    }
  }, [view]);

  // keep the URL in sync with the current top-level view, so refresh and browser
  // back/forward work for the pages that don't depend on an in-progress session
  // (an active quiz, a match room, a grid duel keep the URL of whatever page launched
  // them — but still leave a single history entry there, so Back from mid-session
  // lands on that launching page instead of skipping past it to whatever came earlier)
  const inEphemeralViewRef = useRef(false);
  useEffect(() => {
    const path = pathForView(view, seriesId);
    if (path) {
      if (window.location.pathname !== path) {
        window.history.pushState({ view, seriesId }, '', path);
      }
      inEphemeralViewRef.current = false;
    } else if (!inEphemeralViewRef.current) {
      window.history.pushState({ view, seriesId }, '', window.location.pathname);
      inEphemeralViewRef.current = true;
    }
  }, [view, seriesId]);

  useEffect(() => {
    function handlePopState() {
      const { view: v, seriesId: sid } = routeFromPath(window.location.pathname);
      setView(v);
      setSeriesId(sid);
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // track viewport size for the mobile nav/layout
  useEffect(() => {
    function handleResize() {
      const m = window.innerWidth <= 767;
      const t = window.innerWidth > 767 && window.innerWidth <= 1024;
      setIsMobile((prev) => {
        if (prev !== m) setMobileMenuOpen(false);
        return m;
      });
      setIsTablet(t);
    }
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // poll for opponent activity while sitting on the match view
  useEffect(() => {
    if (view !== 'match' || !match) return;
    const round = match.rounds[match.rounds.length - 1];
    if (round.entries.length >= 2) return;
    const id = setInterval(() => {
      fetchMatch(match.id).then((fresh) => { if (fresh) setMatch(fresh); });
    }, 4000);
    return () => clearInterval(id);
  }, [view, match]);

  // poll for opponent activity while sitting on the grid duel view
  useEffect(() => {
    if (view !== 'gridduel' || !gridDuel) return;
    const round = gridDuel.rounds[gridDuel.rounds.length - 1];
    if (round.entries.length >= 2) return;
    const id = setInterval(() => {
      fetchGridDuelRoom(gridDuel.id).then((fresh) => { if (fresh) setGridDuel(fresh); });
    }, 4000);
    return () => clearInterval(id);
  }, [view, gridDuel]);

  // scroll-to-top + fade on every view change
  useEffect(() => {
    if (lastView.current !== view) {
      lastView.current = view;
      window.scrollTo(0, 0);
      const el = contentRef.current;
      if (el) {
        el.style.transition = 'none';
        el.style.opacity = '0.85';
        void el.offsetHeight;
        el.style.transition = 'opacity 0.15s ease';
        el.style.opacity = '1';
      }
    }
  }, [view]);

  const refreshAttempts = useCallback(async () => {
    if (user) setAttempts(await fetchMyAttempts(user.id));
  }, [user]);

  async function loadQuizPlay(quizId: string, opts: { matchActive: boolean }) {
    const qs = await fetchQuizQuestions(quizId);
    setQuestions(qs);
    setActiveQuizId(quizId);
    setQIndex(0);
    setSelectedIndex(null);
    setCorrectIndex(null);
    setAnswers([]);
    setMatchActive(opts.matchActive);
    setView('playing');
  }

  function go(v: ViewName) { setView(v); }

  function goDaily(v: ViewName, date: string) { setDailyJumpDate(date); setView(v); }

  function refreshDoneTransferDays() { setDoneTransferDays(loadDoneTransferDays()); }
  function refreshWordleAttempts() { if (user) fetchMyWordleAttempts(user.id).then(setWordleAttempts); }
  function refreshFootygridAttempts() { if (user) fetchMyFootygridAttempts(user.id).then(setFootygridAttempts); }

  function openSeries(id: string) { setSeriesId(id); setView('series'); }

  function goCategory(category: string) {
    setActiveCategory(category);
    setView('quizzes');
  }

  // ---------- regular quiz flow ----------
  async function startQuiz(quizId: string) {
    if (attempts[quizId]) return;
    if (!user && getGuestPlayCount() >= 5) {
      setShowEmailGate(true);
      setPendingQuizId(quizId);
      return;
    }
    await loadQuizPlay(quizId, { matchActive: false });
  }

  function selectAnswer(idx: number) {
    if (selectedIndex !== null || !activeQuizId) return;
    setSelectedIndex(idx);
    setCorrectIndex(questions[qIndex].correct_index);
    setAnswers((prev) => { const next = [...prev]; next[qIndex] = idx; return next; });
  }

  async function finishMatchRound() {
    if (!match) return;
    const round = match.rounds[match.rounds.length - 1];
    await submitMatchEntry(round.id, matchIdentity || 'Guest', answers);
    const fresh = await fetchMatch(match.id);
    setMatch(fresh);
    setMatchActive(false);
    setMatchPickingRematch(false);
    setView('match');
  }

  async function finishRegularQuiz() {
    if (!activeQuizId) return;
    const res = await completeQuiz(activeQuizId, answers);
    setResultData(res);
    if (!user) incrementGuestPlayCount();
    else {
      await refreshAttempts();
      await refreshProfile();
      fetchPointsLeaderboard().then(setPointsRows);
    }
    setView('result');
  }

  function nextQuestion() {
    if (qIndex + 1 < questions.length) {
      setQIndex(qIndex + 1);
      setSelectedIndex(null);
      setCorrectIndex(null);
      return;
    }
    if (matchActive) finishMatchRound();
    else finishRegularQuiz();
  }

  async function handleAuthAndSave(mode: 'signin' | 'signup', email: string, password: string, name: string): Promise<string | null> {
    if (!email || !password) return 'Email and password are required.';
    if (mode === 'signup') {
      if (!name) return 'Name is required.';
      const { error } = await signUp(email, password, name);
      if (error) return error;
    } else {
      const { error } = await signIn(email, password);
      if (error) return error;
    }
    if (!activeQuizId) return null;
    const res = await completeQuiz(activeQuizId, answers);
    setResultData(res);
    await refreshAttempts();
    await refreshProfile();
    fetchPointsLeaderboard().then(setPointsRows);
    return res.persisted ? null : 'Check your email to confirm your account, then come back and sign in to save this result.';
  }

  function closeEmailGate() { setShowEmailGate(false); setPendingQuizId(null); }
  async function submitEmailGate() {
    setShowEmailGate(false);
    localStorage.setItem(GUEST_PLAYS_KEY, '0');
    const quizId = pendingQuizId;
    setPendingQuizId(null);
    if (quizId) await loadQuizPlay(quizId, { matchActive: false });
  }

  // ---------- account ----------
  async function saveAccountSettings(name: string, email: string) {
    if (!user) return;
    await updateProfile(user.id, { name, email });
    await refreshProfile();
  }

  async function handleAccountAuthSubmit(mode: 'signin' | 'signup', email: string, password: string, name: string): Promise<string | null> {
    if (!email || !password) return 'Email and password are required.';
    if (mode === 'signup') {
      if (!name) return 'Name is required.';
      const { error } = await signUp(email, password, name);
      return error;
    }
    const { error } = await signIn(email, password);
    return error;
  }

  // ---------- match room ----------
  function startMatchSetup() {
    setMatch(null);
    setMatchPickingRematch(false);
    setMatchLinkCopied(false);
    setMatchNameDraft(profile?.name || matchNameDraft || '');
    setMatchSetupQuizId(quizzes[0]?.id || '');
    setView('match');
  }

  async function handleCreateMatchRoom() {
    const name = matchNameDraft.trim();
    if (!name || !matchSetupQuizId) return;
    const { matchId } = await createMatch(matchSetupQuizId);
    localStorage.setItem(matchIdentityKey(matchId), name);
    setMatchIdentity(name);
    const fresh = await fetchMatch(matchId);
    setMatch(fresh);
    await loadQuizPlay(matchSetupQuizId, { matchActive: true });
  }

  async function handleAcceptChallenge() {
    const name = matchNameDraft.trim();
    if (!name || !match) return;
    localStorage.setItem(matchIdentityKey(match.id), name);
    setMatchIdentity(name);
    const round = match.rounds[match.rounds.length - 1];
    await loadQuizPlay(round.quiz_id, { matchActive: true });
  }

  async function handlePlayMyTurn() {
    if (!match) return;
    const round = match.rounds[match.rounds.length - 1];
    await loadQuizPlay(round.quiz_id, { matchActive: true });
  }

  function handleCopyMatchLink() {
    if (!match) return;
    const url = `${window.location.origin}${window.location.pathname}?match=${match.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => setMatchLinkCopied(true)).catch(() => setMatchLinkCopied(true));
    } else {
      setMatchLinkCopied(true);
    }
  }

  function handleStartRematchPick() {
    setMatchPickingRematch(true);
    setMatchSetupQuizId((prev) => prev || quizzes[0]?.id || '');
  }

  async function handleCreateNextRound() {
    if (!match || !matchSetupQuizId) return;
    const nextRoundNumber = match.rounds.length + 1;
    await createNextRound(match.id, nextRoundNumber, matchSetupQuizId);
    const fresh = await fetchMatch(match.id);
    setMatch(fresh);
    setMatchPickingRematch(false);
    await loadQuizPlay(matchSetupQuizId, { matchActive: true });
  }

  function leaveMatch() {
    setView('home');
    setMatch(null);
    setMatchIdentity(null);
    setMatchPickingRematch(false);
    setMatchLinkCopied(false);
    setMatchActive(false);
  }

  // ---------- grid duel ----------
  function startGridDuelSetup() {
    setGridDuel(null);
    setGridDuelPickingRematch(false);
    setGridDuelLinkCopied(false);
    setGridDuelNameDraft(profile?.name || gridDuelNameDraft || '');
    setGridDuelSetupGridId(footygridGrids[footygridGrids.length - 1]?.id || '');
    setView('gridduel');
  }

  async function handleCreateGridDuelRoom() {
    const name = gridDuelNameDraft.trim();
    if (!name || !gridDuelSetupGridId) return;
    const { roomId } = await createGridDuelRoom(gridDuelSetupGridId);
    localStorage.setItem(gridDuelIdentityKey(roomId), name);
    setGridDuelIdentity(name);
    const fresh = await fetchGridDuelRoom(roomId);
    setGridDuel(fresh);
    setView('gridduelplay');
  }

  function handleAcceptGridDuelChallenge() {
    const name = gridDuelNameDraft.trim();
    if (!name || !gridDuel) return;
    localStorage.setItem(gridDuelIdentityKey(gridDuel.id), name);
    setGridDuelIdentity(name);
    setView('gridduelplay');
  }

  function handlePlayGridDuelTurn() {
    if (!gridDuel) return;
    setView('gridduelplay');
  }

  function handleCopyGridDuelLink() {
    if (!gridDuel) return;
    const url = `${window.location.origin}${window.location.pathname}?duel=${gridDuel.id}`;
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => setGridDuelLinkCopied(true)).catch(() => setGridDuelLinkCopied(true));
    } else {
      setGridDuelLinkCopied(true);
    }
  }

  function handleStartGridDuelRematchPick() {
    setGridDuelPickingRematch(true);
    setGridDuelSetupGridId((prev) => prev || footygridGrids[footygridGrids.length - 1]?.id || '');
  }

  async function handleCreateGridDuelNextRound() {
    if (!gridDuel || !gridDuelSetupGridId) return;
    const nextRoundNumber = gridDuel.rounds.length + 1;
    await createGridDuelNextRound(gridDuel.id, nextRoundNumber, gridDuelSetupGridId);
    const fresh = await fetchGridDuelRoom(gridDuel.id);
    setGridDuel(fresh);
    setGridDuelPickingRematch(false);
    setView('gridduelplay');
  }

  async function handleGridDuelFinish(result: { answers: Record<string, { id: string; name: string; position: string }>; livesUsed: number; timeMs: number }) {
    if (!gridDuel) return;
    const round = gridDuel.rounds[gridDuel.rounds.length - 1];
    const answersForServer: Record<string, string> = {};
    Object.entries(result.answers).forEach(([key, player]) => { answersForServer[key] = player.id; });
    await submitGridDuelEntry(round.id, gridDuelIdentity || 'Guest', answersForServer, result.livesUsed, result.timeMs);
    const fresh = await fetchGridDuelRoom(gridDuel.id);
    setGridDuel(fresh);
    setGridDuelPickingRematch(false);
    setView('gridduel');
  }

  function leaveGridDuel() {
    setView('home');
    setGridDuel(null);
    setGridDuelIdentity(null);
    setGridDuelPickingRematch(false);
    setGridDuelLinkCopied(false);
  }

  const quizzesPassedCount = Object.values(attempts).filter((a) => a.passed).length;
  const totalPoints = Object.values(attempts).reduce((sum, a) => sum + (a.passed ? a.points : 0), 0) + (profile?.transfer_points ?? 0);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || null;

  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative', background: 'white', overflowX: 'hidden' }}>
      <Nav view={view} go={go} isMobile={isMobile} mobileMenuOpen={mobileMenuOpen} onToggleMobileMenu={() => setMobileMenuOpen((v) => !v)} />

      <div ref={contentRef} style={{ transition: 'opacity 0.15s ease', opacity: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {view === 'home' && (
          <Home
            quizzes={quizzes}
            attempts={attempts}
            hasAccountName={!!user}
            myName={profile?.name || null}
            accountStreak={profile?.current_streak ?? 0}
            totalAccountPoints={totalPoints}
            pointsRows={pointsRows}
            questionCounts={questionCounts}
            wordlePuzzles={wordlePuzzles}
            wordleAttempts={wordleAttempts}
            transferDailies={transferDailies}
            doneTransferDays={doneTransferDays}
            footygridGrids={footygridGrids}
            footygridAttempts={footygridAttempts}
            isMobile={isMobile}
            go={go}
            goCategory={goCategory}
            startQuiz={startQuiz}
            startMatchSetup={startMatchSetup}
            startWordlePicker={() => go('wordle')}
            startTransferChain={() => go('transferchain')}
            startFootygrid={() => go('footygrid')}
            startGridDuelSetup={startGridDuelSetup}
            openSeries={openSeries}
          />
        )}

        {view === 'series' && (
          <Series
            series={SERIES.find((s) => s.id === seriesId) || SERIES[0]}
            quizzes={quizzes}
            attempts={attempts}
            isMobile={isMobile}
            go={go}
            startQuiz={startQuiz}
          />
        )}

        {view === 'quizzes' && (
          <Quizzes
            quizzes={quizzes}
            attempts={attempts}
            questionCounts={questionCounts}
            activeCategory={activeCategory}
            setCategory={setActiveCategory}
            activeDifficulty={activeDifficulty}
            setDifficulty={setActiveDifficulty}
            activeSort={activeSort}
            setSort={setQuizSort}
            quizQuery={quizQuery}
            setQuizQuery={setQuizQuery}
            startQuiz={startQuiz}
            quizzesPassedCount={quizzesPassedCount}
            totalPoints={totalPoints}
            accountStreak={profile?.current_streak ?? 0}
            isMobile={isMobile}
            isTablet={isTablet}
          />
        )}

        {view === 'playing' && activeQuiz && questions.length > 0 && (
          <QuizPlay
            quiz={activeQuiz}
            questions={questions}
            qIndex={qIndex}
            selectedIndex={selectedIndex}
            correctIndex={correctIndex}
            matchActive={matchActive}
            isMobile={isMobile}
            onSelect={selectAnswer}
            onNext={nextQuestion}
            onQuit={() => go('quizzes')}
          />
        )}

        {view === 'result' && resultData && activeQuiz && (
          <Result
            quizTitle={activeQuiz.title}
            score={resultData.score}
            total={resultData.total}
            passed={resultData.passed}
            points={resultData.points}
            persisted={resultData.persisted}
            streak={resultData.streak ?? profile?.current_streak ?? 0}
            needsAuth={!user}
            onAuthAndSave={handleAuthAndSave}
            go={go}
          />
        )}

        {view === 'account' && (
          <Account
            profile={user ? profile : null}
            quizzes={quizzes}
            attempts={attempts}
            totalPoints={totalPoints}
            quizzesPassedCount={quizzesPassedCount}
            onSaveSettings={saveAccountSettings}
            onAuthSubmit={handleAccountAuthSubmit}
            onSignOut={signOut}
            onProfileChanged={refreshProfile}
          />
        )}

        {view === 'leaderboard' && (
          <Leaderboard pointsRows={pointsRows} myName={profile?.name || null} isMobile={isMobile} quizzes={quizzes} attempts={attempts} startQuiz={startQuiz} />
        )}

        {view === 'match' && (
          <MatchRoom
            quizzes={quizzes}
            match={match}
            identity={matchIdentity}
            pickingRematch={matchPickingRematch}
            setupQuizId={matchSetupQuizId}
            nameDraft={matchNameDraft}
            linkCopied={matchLinkCopied}
            onPickQuiz={setMatchSetupQuizId}
            onNameDraftChange={setMatchNameDraft}
            onCreateRoom={handleCreateMatchRoom}
            onAcceptChallenge={handleAcceptChallenge}
            onPlayTurn={handlePlayMyTurn}
            onCopyLink={handleCopyMatchLink}
            onStartRematchPick={handleStartRematchPick}
            onCreateNextRound={handleCreateNextRound}
            onLeave={leaveMatch}
          />
        )}

        {view === 'wordle' && (
          <Wordle
            go={go}
            user={user}
            isMobile={isMobile}
            transferDailies={transferDailies}
            doneTransferDays={doneTransferDays}
            footygridGrids={footygridGrids}
            footygridAttempts={footygridAttempts}
            quizzes={quizzes}
            attempts={attempts}
            questionCounts={questionCounts}
            startQuiz={startQuiz}
            jumpDate={dailyJumpDate}
            clearJumpDate={() => setDailyJumpDate(null)}
            goDaily={goDaily}
            onProgressChange={refreshWordleAttempts}
          />
        )}
        {view === 'transferchain' && (
          <TransferChain
            go={go}
            isMobile={isMobile}
            playerName={profile?.name}
            wordlePuzzles={wordlePuzzles}
            wordleAttempts={wordleAttempts}
            footygridGrids={footygridGrids}
            footygridAttempts={footygridAttempts}
            doneTransferDays={doneTransferDays}
            quizzes={quizzes}
            attempts={attempts}
            questionCounts={questionCounts}
            startQuiz={startQuiz}
            jumpDate={dailyJumpDate}
            clearJumpDate={() => setDailyJumpDate(null)}
            goDaily={goDaily}
            onChainComplete={refreshDoneTransferDays}
          />
        )}
        {view === 'footygrid' && (
          <FootyGrid
            go={go}
            user={user}
            isMobile={isMobile}
            players={footygridPlayers}
            grids={footygridGrids}
            wordlePuzzles={wordlePuzzles}
            wordleAttempts={wordleAttempts}
            transferDailies={transferDailies}
            doneTransferDays={doneTransferDays}
            quizzes={quizzes}
            attempts={attempts}
            questionCounts={questionCounts}
            startQuiz={startQuiz}
            jumpDate={dailyJumpDate}
            clearJumpDate={() => setDailyJumpDate(null)}
            goDaily={goDaily}
            onProgressChange={refreshFootygridAttempts}
          />
        )}

        {view === 'gridduel' && (
          <GridDuel
            grids={footygridGrids}
            gridDuel={gridDuel}
            identity={gridDuelIdentity}
            pickingRematch={gridDuelPickingRematch}
            setupGridId={gridDuelSetupGridId}
            nameDraft={gridDuelNameDraft}
            linkCopied={gridDuelLinkCopied}
            onPickGrid={setGridDuelSetupGridId}
            onNameDraftChange={setGridDuelNameDraft}
            onCreateRoom={handleCreateGridDuelRoom}
            onAcceptChallenge={handleAcceptGridDuelChallenge}
            onPlayTurn={handlePlayGridDuelTurn}
            onCopyLink={handleCopyGridDuelLink}
            onStartRematchPick={handleStartGridDuelRematchPick}
            onCreateNextRound={handleCreateGridDuelNextRound}
            onLeave={leaveGridDuel}
          />
        )}

        {view === 'gridduelplay' && gridDuel && (() => {
          const round = gridDuel.rounds[gridDuel.rounds.length - 1];
          const grid = footygridGrids.find((g) => g.id === round.grid_id);
          if (!grid) return null;
          return (
            <main style={{ flex: 1, width: '100%', background: 'white', padding: isMobile ? '32px 16px 80px' : '48px 20px 100px' }}>
              <div style={{ maxWidth: 520, margin: '0 auto' }}>
                <GridDuelPlay grid={grid} players={footygridPlayers} isMobile={isMobile} onFinish={handleGridDuelFinish} />
              </div>
            </main>
          );
        })()}
      </div>

      {showEmailGate && <EmailGateModal onContinue={submitEmailGate} onClose={closeEmailGate} />}

      <Footer go={go} isMobile={isMobile} isTablet={isTablet} />
    </div>
  );
}
