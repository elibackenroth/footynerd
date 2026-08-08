import { useEffect, useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchTransferClubs, fetchTransferDailies, fetchFootygridPlayers, completeTransferChain } from '../lib/api';
import { pushActivity } from '../lib/activityFeed';
import { todaysDaily, buildDailyAxis, markTransferDayDone } from '../lib/daily';
import type { DailyKind } from '../lib/daily';
import type { TransferClub, TransferDaily, FootygridPlayer, WordlePuzzlePublic, WordleGuess, FootygridGrid, FootygridAttempt, Quiz, QuizAttempt } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import DailyPicker from '../components/DailyPicker';
import RecommendedQuizzes from '../components/RecommendedQuizzes';

const TRANSFER_POINTS_PER_CHAIN = 10;

function normalizeAnswer(s: string) {
  return (s || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toUpperCase().replace(/[^A-Z]/g, '');
}

function ClubBadge({ club, size, ring }: { club: TransferClub | undefined; size: number; ring?: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = club && !broken;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size > 60 ? 8 : '50%', overflow: 'hidden',
        border: ring ? `2px solid ${ring}` : `1px solid ${colors.border}`,
        background: colors.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fonts.heading, fontWeight: 700, color: colors.primary, fontSize: size > 60 ? 22 : 14,
      }}
    >
      {showImage ? (
        <img
          src={`/club-logos/${club!.id}.webp`}
          alt={club!.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: size > 60 ? 12 : 6 }}
          onError={() => setBroken(true)}
        />
      ) : (
        club ? club.short_name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '?'
      )}
    </div>
  );
}

export default function TransferChain({
  go, isMobile, playerName,
  wordlePuzzles, wordleAttempts, footygridGrids, footygridAttempts, doneTransferDays,
  quizzes, attempts, questionCounts, startQuiz,
  jumpDate, clearJumpDate, goDaily, onChainComplete,
}: {
  go: (v: ViewName) => void;
  isMobile: boolean;
  playerName?: string | null;
  wordlePuzzles: WordlePuzzlePublic[];
  wordleAttempts: Record<string, { guesses: WordleGuess[]; status: string }>;
  footygridGrids: FootygridGrid[];
  footygridAttempts: Record<string, FootygridAttempt>;
  doneTransferDays: Record<string, { score: number; total: number }>;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  startQuiz: (id: string) => void;
  jumpDate: string | null;
  clearJumpDate: () => void;
  goDaily: (view: ViewName, date: string) => void;
  onChainComplete: () => void;
}) {
  const [clubs, setClubs] = useState<TransferClub[]>([]);
  const [dailies, setDailies] = useState<TransferDaily[]>([]);
  const [players, setPlayers] = useState<FootygridPlayer[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'finished'>('playing');
  const [score, setScore] = useState(0);
  const [answerReveal, setAnswerReveal] = useState('');
  const [pointsAwardedText, setPointsAwardedText] = useState('');
  const [pointsPersisted, setPointsPersisted] = useState(true);
  const [autoSelected, setAutoSelected] = useState(false);
  const [roundHistory, setRoundHistory] = useState<{ clubs: string[]; input: string; correct: boolean; display: string }[]>([]);

  useEffect(() => {
    fetchTransferClubs().then(setClubs);
    fetchTransferDailies().then(setDailies);
    fetchFootygridPlayers().then(setPlayers);
  }, []);

  function selectDay(dayId: string) {
    setSelectedId(dayId);
    setStep(0);
    setInput('');
    setStatus('playing');
    setScore(0);
    setAnswerReveal('');
    setPointsAwardedText('');
    setPointsPersisted(true);
    setRoundHistory([]);
  }

  useEffect(() => {
    if (dailies.length > 0 && !autoSelected) {
      setAutoSelected(true);
      if (jumpDate) {
        const match = dailies.find((d) => d.date === jumpDate);
        clearJumpDate();
        if (match) { selectDay(match.id); return; }
      }
      const today = todaysDaily(dailies);
      if (today) selectDay(today.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dailies, autoSelected]);

  const day = dailies.find((d) => d.id === selectedId) || null;
  const clubById = (id: string) => clubs.find((c) => c.id === id);
  const currentLink = day ? day.rounds[Math.min(step, day.rounds.length - 1)] : null;
  const notFinished = status !== 'finished';

  const searchQ = input.trim().toLowerCase();
  const suggestions = status === 'playing' && searchQ.length > 1
    ? players.filter((p) => p.name.toLowerCase().includes(searchQ)).slice(0, 6)
    : [];

  function submit() {
    if (status !== 'playing' || !input.trim() || !currentLink) return;
    const normalizedGuess = normalizeAnswer(input);
    const nameParts = currentLink.display.split(' ').map(normalizeAnswer).filter(Boolean);
    const acceptable = new Set(currentLink.answers.map(normalizeAnswer));
    nameParts.forEach((p) => acceptable.add(p));
    acceptable.add(nameParts.join(''));
    const correct = acceptable.has(normalizedGuess);
    setAnswerReveal(currentLink.display);
    setStatus(correct ? 'correct' : 'wrong');
    if (correct) setScore((s) => s + 1);
    setRoundHistory((h) => [...h, { clubs: currentLink.clubs, input: input.trim(), correct, display: currentLink.display }]);
  }

  async function next() {
    if (!day) return;
    const nextStep = step + 1;
    if (nextStep >= day.rounds.length) {
      const res = await completeTransferChain(score);
      setPointsAwardedText(res.persisted ? '+10 points earned for completing the chain' : 'Sign in to save your Transfer Chain points');
      setPointsPersisted(res.persisted);
      pushActivity({ name: playerName || 'Guest', kind: 'transferchain', title: 'Transfer Chain', points: TRANSFER_POINTS_PER_CHAIN, passed: true });
      markTransferDayDone(day.id, score, day.rounds.length);
      onChainComplete();
      setStep(nextStep);
      setStatus('finished');
    } else {
      setStep(nextStep);
      setInput('');
      setStatus('playing');
    }
  }

  const finalMessage = day && (
    score === day.rounds.length ? 'Perfect chain — you know your transfers.' : score >= day.rounds.length * 0.6 ? 'Solid work tracing the chain.' : 'A tough chain — give it another run.'
  );

  const dailyCurrentDate = day ? day.date : (todaysDaily(dailies)?.date || '');
  const axisDates = buildDailyAxis([wordlePuzzles.map((p) => p.date), dailies.map((d) => d.date), footygridGrids.map((g) => g.date)]);

  function hasItem(kind: DailyKind, date: string) {
    if (kind === 'wordle') return wordlePuzzles.some((p) => p.date === date);
    if (kind === 'transfer') return dailies.some((d) => d.date === date);
    return footygridGrids.some((g) => g.date === date);
  }

  function wordleStatusText(date: string) {
    const p = wordlePuzzles.find((x) => x.date === date);
    if (!p) return 'No puzzle this day';
    const prog = wordleAttempts[p.id];
    if (!prog || (prog.status !== 'won' && prog.status !== 'lost' && prog.guesses.length === 0)) return 'Not started';
    if (prog.status === 'won') return `Solved in ${prog.guesses.length}/${Math.max(6, p.word.length + 1)}`;
    if (prog.status === 'lost') return 'Not solved';
    return `${prog.guesses.length} guesses in`;
  }

  function transferStatusText(date: string) {
    const d = dailies.find((x) => x.date === date);
    if (!d) return 'No puzzle this day';
    if (d.id === selectedId && !notFinished) return `${score}/${day!.rounds.length} solved`;
    const prog = doneTransferDays[d.id];
    return prog ? `${prog.score}/${prog.total} solved` : 'Not started';
  }

  function footygridStatusText(date: string) {
    const g = footygridGrids.find((x) => x.date === date);
    if (!g) return 'No puzzle this day';
    const prog = footygridAttempts[g.id];
    const solved = prog ? Object.keys(prog.answers).length : 0;
    if (!prog || (prog.status === 'playing' && solved === 0)) return 'Not started';
    if (prog.status === 'won') return `Solved ${solved}/9`;
    if (prog.status === 'over') return `Out of lives · ${solved}/9`;
    return `${solved}/9 filled`;
  }

  function statusText(kind: DailyKind, date: string) {
    if (kind === 'wordle') return wordleStatusText(date);
    if (kind === 'footygrid') return footygridStatusText(date);
    return transferStatusText(date);
  }

  function dotState(kind: DailyKind, date: string): 'done' | 'progress' | 'todo' | 'none' | 'locked' {
    if (!hasItem(kind, date)) return 'none';
    if (new Date(date) > new Date()) return 'locked';
    const st = statusText(kind, date);
    if (st === 'Not started') return 'todo';
    if (st.startsWith('Solved') || st === 'Not solved' || st.startsWith('Out of lives')) return 'done';
    return 'progress';
  }

  function handleDailyNavigate(kind: DailyKind, date: string) {
    if (kind === 'transfer') {
      const match = dailies.find((d) => d.date === date);
      if (match) selectDay(match.id);
    } else if (kind === 'wordle') {
      goDaily('wordle', date);
    } else {
      goDaily('footygrid', date);
    }
  }

  return (
    <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', padding: isMobile ? '24px 16px 80px' : '72px 48px 120px', width: '100%' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>← Back to Home</div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, margin: '0 0 24px', color: colors.primary }}>Transfer Chain</h1>

      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'stretch' } : { display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 340 }}>
          {day && notFinished && (
            <>
              <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>
                Three clubs, one player who's worn all three shirts. Name them — first name, last name, or full name all count, no accents needed. Round {step + 1} of {day.rounds.length}.
              </p>

              <div style={isMobile
                ? { display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 10, marginBottom: 26 }
                : { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}
              >
                {currentLink && currentLink.clubs.map((id) => {
                  const c = clubById(id);
                  return (
                    <div key={id} style={{ textAlign: 'center' }}>
                      <div style={{ marginBottom: isMobile ? 8 : 10 }}><ClubBadge club={c} size={isMobile ? 90 : 110} /></div>
                      <div style={{ fontWeight: 700, fontSize: isMobile ? 11.5 : 14 }}>{c?.short_name}</div>
                    </div>
                  );
                })}
              </div>

              <div style={{ maxWidth: 360, margin: '0 auto', position: 'relative' }}>
                {status === 'playing' ? (
                  <>
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                      placeholder="First name, last name, or full name"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: '1px solid oklch(0.85 0.01 250)', borderRadius: 4, fontSize: 15, fontFamily: fonts.body, textAlign: 'center', marginBottom: 8 }}
                    />
                    {suggestions.length > 0 && (
                      <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 4, marginBottom: 8, overflow: 'hidden' }}>
                        {suggestions.map((s) => (
                          <div
                            key={s.id}
                            onClick={() => setInput(s.name)}
                            style={{ padding: '8px 14px', cursor: 'pointer', fontSize: 14, textAlign: 'center', borderBottom: `1px solid ${colors.borderLight}` }}
                          >
                            {s.name}
                          </div>
                        ))}
                      </div>
                    )}
                    <button onClick={submit} style={{ width: '100%', background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body, marginTop: 8 }}>Submit</button>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 8, color: status === 'correct' ? colors.success : colors.danger }}>
                      {status === 'correct' ? 'Correct!' : 'Not quite.'}
                    </div>
                    <div style={{ textAlign: 'center', fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>Answer: {answerReveal}</div>
                    <button onClick={next} style={{ width: '100%', background: colors.textBody, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>
                      {step + 1 >= day.rounds.length ? 'See Final Score' : 'Next Round'}
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {day && !notFinished && (
            <div style={{ textAlign: 'center' }}>
              <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, margin: '0 0 8px', color: colors.primary }}>{score} / {day.rounds.length} rounds solved</h1>
              <p style={{ fontSize: 15, color: colors.textMuted, margin: '0 0 24px' }}>{finalMessage}</p>
              {!pointsPersisted && (
                <p style={{ fontSize: 13, color: colors.textMuted, margin: '0 0 16px' }}>{pointsAwardedText}</p>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 380, margin: '0 auto 28px' }}>
                <div style={{ background: 'oklch(0.97 0.01 250)', borderRadius: 8, padding: '16px 8px' }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, color: colors.primary }}>{Math.round((score / day.rounds.length) * 100)}%</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted, marginTop: 4 }}>Accuracy</div>
                </div>
                <div style={{ background: 'oklch(0.97 0.03 145)', borderRadius: 8, padding: '16px 8px' }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, color: colors.success }}>+{TRANSFER_POINTS_PER_CHAIN}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted, marginTop: 4 }}>Points Earned</div>
                </div>
              </div>

              <div style={{ textAlign: 'left', maxWidth: 520, margin: '0 auto 32px', border: `1px solid ${colors.borderLight}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, padding: '12px 16px', background: 'oklch(0.98 0.01 250)', borderBottom: `1px solid ${colors.borderLight}` }}>Round by Round</div>
                {roundHistory.map((h, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < roundHistory.length - 1 ? `1px solid ${colors.borderLight}` : 'none' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', background: h.correct ? colors.success : colors.danger }}>
                      {h.correct ? '✓' : '✕'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, color: colors.textMuted, marginBottom: 2 }}>
                        {h.clubs.map((id) => clubById(id)?.short_name || id).join(' → ')}
                      </div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: colors.textBody }}>{h.display}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => go('quizzes')}
                  style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 26px', fontSize: 14, fontWeight: 700, borderRadius: 999, cursor: 'pointer', fontFamily: fonts.body }}
                >
                  Play a Different Quiz
                </button>
                <div onClick={() => go('home')} style={{ alignSelf: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'oklch(0.4 0.01 250)', textDecoration: 'underline' }}>Return to Home</div>
              </div>
            </div>
          )}
        </div>

        {dailyCurrentDate && (
          <div style={{ width: isMobile ? '100%' : 250, flexShrink: 0 }}>
            <DailyPicker
              currentKind="transfer"
              currentDate={dailyCurrentDate}
              axisDates={axisDates}
              hasItem={hasItem}
              statusText={statusText}
              dotState={dotState}
              onNavigate={handleDailyNavigate}
            />
          </div>
        )}
      </div>

      <RecommendedQuizzes quizzes={quizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} goQuizzes={() => go('quizzes')} />
    </main>
  );
}
