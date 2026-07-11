import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from './contexts/AuthContext';
import type { ViewName } from './lib/viewTypes';
import type { Quiz, QuizAttempt, QuizQuestionPublic, PointsLeaderboardRow, StreakLeaderboardRow, TransferLeaderboardRow } from './lib/types';
import type { MatchFull } from './lib/api';
import {
  fetchQuizzes,
  fetchQuizQuestions,
  fetchMyAttempts,
  checkQuizAnswer,
  completeQuiz,
  updateProfile,
  fetchPointsLeaderboard,
  fetchStreakLeaderboard,
  fetchTransferLeaderboard,
  createMatch,
  createNextRound,
  submitMatchEntry,
  fetchMatch,
} from './lib/api';

import Nav from './components/Nav';
import Footer from './components/Footer';
import EmailGateModal from './components/EmailGateModal';
import Home from './pages/Home';
import Quizzes from './pages/Quizzes';
import QuizPlay from './pages/QuizPlay';
import Result from './pages/Result';
import Account from './pages/Account';
import Leaderboard from './pages/Leaderboard';
import MatchRoom from './pages/MatchRoom';
import Wordle from './pages/Wordle';
import TransferChain from './pages/TransferChain';

const GUEST_PLAYS_KEY = 'footynerd_guest_plays';
function getGuestPlayCount() { return parseInt(localStorage.getItem(GUEST_PLAYS_KEY) || '0', 10); }
function incrementGuestPlayCount() { localStorage.setItem(GUEST_PLAYS_KEY, String(getGuestPlayCount() + 1)); }

function matchIdentityKey(matchId: string) { return 'footynerd_match_identity_' + matchId; }

export default function App() {
  const { user, profile, refreshProfile, signUp, signIn, signInWithGoogle, signOut } = useAuth();

  const [view, setView] = useState<ViewName>('home');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [attempts, setAttempts] = useState<Record<string, QuizAttempt>>({});
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDifficulty, setActiveDifficulty] = useState('all');

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
  const [streakRows, setStreakRows] = useState<StreakLeaderboardRow[]>([]);
  const [transferRows, setTransferRows] = useState<TransferLeaderboardRow[]>([]);

  // match room
  const [match, setMatch] = useState<MatchFull | null>(null);
  const [matchIdentity, setMatchIdentity] = useState<string | null>(null);
  const [matchPickingRematch, setMatchPickingRematch] = useState(false);
  const [matchSetupQuizId, setMatchSetupQuizId] = useState('');
  const [matchNameDraft, setMatchNameDraft] = useState('');
  const [matchLinkCopied, setMatchLinkCopied] = useState(false);

  const contentRef = useRef<HTMLDivElement>(null);
  const lastView = useRef(view);

  // ---------- initial load ----------
  useEffect(() => {
    fetchQuizzes().then((qs) => {
      setQuizzes(qs);
      setMatchSetupQuizId((prev) => prev || qs[0]?.id || '');
    });

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
  }, []);

  useEffect(() => {
    if (user) fetchMyAttempts(user.id).then(setAttempts);
    else setAttempts({});
  }, [user]);

  useEffect(() => {
    if (view === 'leaderboard') {
      fetchPointsLeaderboard().then(setPointsRows);
      fetchStreakLeaderboard().then(setStreakRows);
      fetchTransferLeaderboard().then(setTransferRows);
    }
  }, [view]);

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

  // scroll-to-top + fade on every view change
  useEffect(() => {
    if (lastView.current !== view) {
      lastView.current = view;
      window.scrollTo(0, 0);
      const el = contentRef.current;
      if (el) {
        el.style.transition = 'none';
        el.style.opacity = '0.4';
        void el.offsetHeight;
        el.style.transition = 'opacity 1s ease';
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

  async function selectAnswer(idx: number) {
    if (selectedIndex !== null || !activeQuizId) return;
    const res = await checkQuizAnswer(activeQuizId, qIndex, idx);
    setSelectedIndex(idx);
    setCorrectIndex(res.correctIndex);
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
    else { await refreshAttempts(); await refreshProfile(); }
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

  const quizzesPassedCount = Object.values(attempts).filter((a) => a.passed).length;
  const totalPoints = Object.values(attempts).reduce((sum, a) => sum + (a.passed ? a.points : 0), 0) + (profile?.transfer_points ?? 0);

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || null;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Nav view={view} go={go} />

      <div ref={contentRef} style={{ transition: 'opacity 1s ease', opacity: 1, display: 'flex', flexDirection: 'column', flex: 1 }}>
        {view === 'home' && (
          <Home
            quizzes={quizzes}
            go={go}
            startQuiz={startQuiz}
            startMatchSetup={startMatchSetup}
            startWordlePicker={() => go('wordle')}
            startTransferChain={() => go('transferchain')}
          />
        )}

        {view === 'quizzes' && (
          <Quizzes
            quizzes={quizzes}
            attempts={attempts}
            activeCategory={activeCategory}
            setCategory={setActiveCategory}
            activeDifficulty={activeDifficulty}
            setDifficulty={setActiveDifficulty}
            startQuiz={startQuiz}
            quizzesPassedCount={quizzesPassedCount}
            totalPoints={totalPoints}
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
            onSelect={selectAnswer}
            onNext={nextQuestion}
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
            onSignInWithGoogle={signInWithGoogle}
            onAuthSubmit={handleAccountAuthSubmit}
            onSignOut={signOut}
          />
        )}

        {view === 'leaderboard' && (
          <Leaderboard pointsRows={pointsRows} streakRows={streakRows} transferRows={transferRows} />
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

        {view === 'wordle' && <Wordle go={go} user={user} />}
        {view === 'transferchain' && <TransferChain go={go} />}
      </div>

      {showEmailGate && <EmailGateModal onContinue={submitEmailGate} onClose={closeEmailGate} />}

      <Footer go={go} />
    </div>
  );
}
