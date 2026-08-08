import { colors, fonts, AVATAR_COLORS, initials, passThresholdFor } from '../lib/tokens';
import { todaysDaily } from '../lib/daily';
import { SERIES } from '../lib/series';
import type { Quiz, QuizAttempt, PointsLeaderboardRow, WordlePuzzlePublic, WordleGuess, TransferDaily, FootygridGrid, FootygridAttempt } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import QuizImage, { getQuizImageSrc } from '../components/QuizImage';

function MiniStat({ value, label }: { value: number | string; label: string }) {
  return (
    <div style={{ background: 'oklch(0.965 0.006 60)', borderRadius: 6, padding: '8px 6px', textAlign: 'center' }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 17, lineHeight: 1, color: colors.primary }}>{value}</div>
      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.58 0.01 250)', marginTop: 3 }}>{label}</div>
    </div>
  );
}

function QuizPreviewCard({ quiz, attempt, questionCount, onStart, isMobile }: { quiz: Quiz; attempt?: QuizAttempt; questionCount?: number; onStart: () => void; isMobile?: boolean }) {
  return (
    <div onClick={onStart} style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'white', ...(isMobile ? { flex: '0 0 82%', scrollSnapAlign: 'start' } : {}) }}>
      <div style={{ width: '100%', height: 140, position: 'relative', filter: attempt ? 'grayscale(0.45) saturate(0.7) brightness(0.97)' : 'none' }}>
        <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
        {attempt && (
          <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 999, background: attempt.passed ? colors.success : colors.danger, boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
            {attempt.passed ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round"><polyline points="4 12.5 9.5 18 20 6.5" /></svg>
            ) : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5} strokeLinecap="round"><line x1="5" y1="5" x2="19" y2="19" /><line x1="19" y1="5" x2="5" y2="19" /></svg>
            )}
          </div>
        )}
      </div>
      <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>{quiz.difficulty[0].toUpperCase() + quiz.difficulty.slice(1)}</div>
          {questionCount != null && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'oklch(0.5 0.15 250)', background: 'oklch(0.95 0.04 250)', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>{questionCount} Qs</div>
          )}
        </div>
        <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, margin: 0, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: colors.textBody }}>{quiz.title}</h3>
        <p style={{ fontSize: 13, color: 'oklch(0.52 0.01 250)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
        <div style={{ flex: 1 }} />
        {!attempt ? (
          <button
            onClick={(e) => { e.stopPropagation(); onStart(); }}
            style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '11px 22px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
          >
            Start Quiz
          </button>
        ) : (
          <div style={{ fontSize: 13, fontWeight: 700, color: attempt.passed ? colors.success : colors.danger }}>
            {attempt.passed ? `Passed · ${attempt.score}/${attempt.total}` : `Failed · ${attempt.score}/${attempt.total}`}
          </div>
        )}
      </div>
    </div>
  );
}

function QuizCategorySection({
  title, quizzes, attempts, questionCounts, startQuiz, onViewAll, isMobile,
}: {
  title: string;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  startQuiz: (id: string) => void;
  onViewAll: () => void;
  isMobile: boolean;
}) {
  if (quizzes.length === 0) return null;
  return (
    <div style={{ background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20, marginTop: 32 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>{title}</h2>
        <div onClick={onViewAll} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>See all →</div>
      </div>
      <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginBottom: 22 }}>{quizzes.length} {quizzes.length === 1 ? 'quiz' : 'quizzes'}</div>
      <div style={isMobile
        ? { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 16, margin: '0 -20px', padding: '4px 20px 12px', WebkitOverflowScrolling: 'touch' }
        : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 24 }}
      >
        {quizzes.map((quiz) => (
          <QuizPreviewCard key={quiz.id} quiz={quiz} attempt={attempts[quiz.id]} questionCount={questionCounts[quiz.id]} onStart={() => startQuiz(quiz.id)} isMobile={isMobile} />
        ))}
      </div>
    </div>
  );
}

interface DailyGameCard {
  key: string;
  title: string;
  desc: string;
  isDone: boolean;
  statusText: string;
  onPlay: () => void;
  image: string;
}

export default function Home({
  quizzes,
  attempts,
  hasAccountName,
  myName,
  accountStreak,
  totalAccountPoints,
  pointsRows,
  questionCounts,
  wordlePuzzles,
  wordleAttempts,
  transferDailies,
  doneTransferDays,
  footygridGrids,
  footygridAttempts,
  isMobile,
  go,
  goCategory,
  startQuiz,
  startMatchSetup,
  startWordlePicker,
  startTransferChain,
  startFootygrid,
  startGridDuelSetup,
  openSeries,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  hasAccountName: boolean;
  myName: string | null;
  accountStreak: number;
  totalAccountPoints: number;
  pointsRows: PointsLeaderboardRow[];
  questionCounts: Record<string, number>;
  wordlePuzzles: WordlePuzzlePublic[];
  wordleAttempts: Record<string, { guesses: WordleGuess[]; status: string }>;
  transferDailies: TransferDaily[];
  doneTransferDays: Record<string, { score: number; total: number }>;
  footygridGrids: FootygridGrid[];
  footygridAttempts: Record<string, FootygridAttempt>;
  isMobile: boolean;
  go: (v: ViewName) => void;
  goCategory: (category: string) => void;
  startQuiz: (id: string) => void;
  startMatchSetup: () => void;
  startWordlePicker: () => void;
  startTransferChain: () => void;
  startFootygrid: () => void;
  startGridDuelSetup: () => void;
  openSeries: (id: string) => void;
}) {
  const buildCategoryPreview = (category: string) => quizzes.filter((q) => q.category === category && !q.is_mega).slice().reverse().slice(0, 3);
  const playerQuizzes = buildCategoryPreview('players');
  const clubQuizzes = buildCategoryPreview('clubs');

  const nonMegaQuizzes = quizzes.filter((q) => !q.is_mega);
  const recentQuizzes = nonMegaQuizzes.slice(-4).reverse();

  const seriesCards = SERIES.map((s) => {
    const qs = s.quizIds.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];
    const doneCount = qs.filter((q) => attempts[q.id]?.passed).length;
    const complete = qs.length > 0 && doneCount === qs.length;
    const base = qs.reduce((sum, q) => sum + q.points, 0);
    const heroQuiz = quizzes.find((q) => q.id === s.heroQuizId) || qs[0];
    return {
      id: s.id,
      title: s.title,
      heroImage: heroQuiz ? getQuizImageSrc(heroQuiz.id, heroQuiz.image) : null,
      progressText: `${doneCount} of ${qs.length} complete`,
      progressPct: qs.length ? Math.round((doneCount / qs.length) * 100) + '%' : '0%',
      barColor: complete ? colors.success : colors.primary,
      bonusText: complete ? `Bonus claimed · +${base} pts` : `Finish all ${qs.length} to double the series: +${base} bonus pts`,
    };
  });

  const megas = quizzes.filter((q) => q.is_mega);
  const megaQuiz = megas.length ? todaysDaily(megas.map((q) => ({ ...q, date: q.mega_date || '' }))) : null;
  const megaAttempt = megaQuiz ? attempts[megaQuiz.id] : undefined;
  const megaImageSrc = megaQuiz ? getQuizImageSrc(megaQuiz.id, megaQuiz.image) : null;

  const todayWordle = wordlePuzzles.length ? todaysDaily(wordlePuzzles) : null;
  const wProg = todayWordle ? wordleAttempts[todayWordle.id] : undefined;
  const wDone = !!wProg && (wProg.status === 'won' || wProg.status === 'lost');
  const wStarted = !!wProg && !wDone && (wProg.guesses || []).length > 0;

  const todayChain = transferDailies.length ? todaysDaily(transferDailies) : null;
  const cProg = todayChain ? doneTransferDays[todayChain.id] : undefined;

  const todayGrid = footygridGrids.length ? todaysDaily(footygridGrids) : null;
  const gProg = todayGrid ? footygridAttempts[todayGrid.id] : undefined;
  const gSolved = gProg ? Object.keys(gProg.answers).length : 0;
  const gDone = !!gProg && gProg.status !== 'playing';
  const gStarted = !!gProg && !gDone && gSolved > 0;

  const CHIP_TODO = { bg: 'oklch(0.95 0.015 250)', fg: 'oklch(0.46 0.03 250)' };
  const CHIP_PROG = { bg: 'oklch(0.94 0.09 80)', fg: 'oklch(0.44 0.11 65)' };
  const CHIP_DONE = { bg: 'oklch(0.93 0.08 150)', fg: 'oklch(0.4 0.11 150)' };
  const chipFor = (done: boolean, started: boolean) => (done ? CHIP_DONE : started ? CHIP_PROG : CHIP_TODO);

  const dailyGames: (DailyGameCard & { chip: { bg: string; fg: string } })[] = [
    {
      key: 'wordle', title: 'Football Wordle', desc: todayWordle ? `${todayWordle.category} · ${todayWordle.word.length} letters` : '',
      statusText: !todayWordle ? 'No puzzle today' : (wDone ? (wProg!.status === 'won' ? `Solved in ${wProg!.guesses.length}` : 'Not solved') : (wStarted ? `${wProg!.guesses.length} guesses in` : 'Not played')),
      isDone: wDone, onPlay: startWordlePicker, chip: chipFor(wDone, wStarted), image: '/mode-images/wordle.webp',
    },
    {
      key: 'chain', title: 'Transfer Chain', desc: todayChain ? `${todayChain.rounds.length} rounds · name the link` : '',
      statusText: cProg ? `${cProg.score}/${cProg.total} solved` : 'Not played',
      isDone: !!cProg, onPlay: startTransferChain, chip: chipFor(!!cProg, false), image: '/mode-images/transferchain.webp',
    },
    {
      key: 'grid', title: 'FootyGrid', desc: '3×3 grid · 9 players to find',
      statusText: gDone ? (gProg!.status === 'won' ? `Solved ${gSolved}/9` : `Out of lives · ${gSolved}/9`) : (gStarted ? `${gSolved}/9 filled` : 'Not played'),
      isDone: gDone, onPlay: startFootygrid, chip: chipFor(gDone, gStarted), image: '/mode-images/footygrid.png',
    },
  ];
  const dailyDoneCount = dailyGames.filter((g) => g.isDone).length;
  const dailyDonePct = Math.round((dailyDoneCount / 3) * 100) + '%';
  const todayLabel = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  // leaderboard
  const sorted = [...pointsRows].sort((a, b) => b.points - a.points);
  const topScore = sorted.length ? sorted[0].points : 0;
  const myIdx = myName ? sorted.findIndex((r) => r.name === myName) : -1;
  const homeLeaderboardTop = sorted.slice(0, 5);
  const showMyRow = myIdx >= 5;
  const youRankText = myIdx >= 0 ? `#${myIdx + 1}` : 'Unranked';
  const aheadEntry = myIdx > 0 ? sorted[myIdx - 1] : null;
  const youGapText = aheadEntry && myIdx >= 0
    ? `${aheadEntry.points - sorted[myIdx].points} points behind ${aheadEntry.name}`
    : (myIdx === 0 ? 'Top of the board — hold it.' : 'Pass a quiz to join the board.');

  function LeaderboardHomeRow({ row, rank }: { row: PointsLeaderboardRow; rank: number }) {
    const isMe = !!myName && row.name === myName;
    const barWidth = (topScore ? Math.max(4, Math.round((row.points / topScore) * 100)) : 4) + '%';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 8px', borderRadius: 8, background: isMe ? 'oklch(0.96 0.035 250)' : 'transparent' }}>
        <div style={{ width: 20, textAlign: 'center', flexShrink: 0, fontFamily: fonts.heading, fontWeight: 700, fontSize: 14, color: colors.textFaint }}>{rank}</div>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: AVATAR_COLORS[(rank - 1) % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, flexShrink: 0, overflow: 'hidden' }}>
          {row.avatar_url ? <img src={row.avatar_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials(row.name)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: colors.textBody, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.name}{isMe ? ' (You)' : ''}</div>
          <div style={{ height: 3, borderRadius: 2, background: 'oklch(0.94 0.01 250)', marginTop: 7, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2, width: barWidth, background: isMe ? 'oklch(0.5 0.16 250)' : 'oklch(0.82 0.05 250)' }} />
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, color: 'oklch(0.3 0.01 250)' }}>{row.points}</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'oklch(0.62 0.01 250)' }}>{row.quizzes_completed} played</div>
        </div>
      </div>
    );
  }

  const totalQuizCount = quizzes.length;
  const dailyDoneCountText = `${dailyDoneCount} of 3`;

  return (
    <main style={{ flex: 1, width: '100%' }}>
      {!hasAccountName && !isMobile && (
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '4px 48px 14px', textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 19, lineHeight: 1, color: colors.primary }}>{totalQuizCount}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.55 0.01 250)' }}>Quizzes</div>
            </div>
            <div style={{ width: 1, height: 14, background: 'oklch(0.88 0.01 250)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 19, lineHeight: 1, color: colors.primary }}>{dailyDoneCountText}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.55 0.01 250)' }}>Daily games today</div>
            </div>
            <div style={{ width: 1, height: 14, background: 'oklch(0.88 0.01 250)' }} />
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.55 0.01 250)' }}>{todayLabel}</div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '32px 20px 100px' : '48px 48px 100px' }}>
        <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 32 } : { display: 'grid', gridTemplateColumns: '296px minmax(0,1fr)', gap: 40, alignItems: 'stretch' }}>
          <div style={{ background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, margin: 0, color: colors.primary }}>Today's Daily Games</h2>
            <div style={{ fontSize: 11.5, fontWeight: 600, color: 'oklch(0.55 0.02 250)', margin: '4px 0 14px' }}>{todayLabel}</div>
            <div style={{ height: 4, borderRadius: 2, background: 'oklch(0.92 0.01 250)', overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'oklch(0.5 0.16 250)', width: dailyDonePct, transition: 'width 0.3s' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {dailyGames.map((g) => (
                <div key={g.key} onClick={g.onPlay} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'white', border: '1px solid oklch(0.9 0.02 250)', borderRadius: 8, padding: 10, cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,20,40,0.05)' }}>
                  <div style={{ width: 62, height: 44, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: 'oklch(0.95 0.01 250)' }}>
                    <img src={g.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 15, lineHeight: 1.2, color: 'oklch(0.22 0.01 250)' }}>{g.title}</div>
                    <div style={{ fontSize: 11.5, color: 'oklch(0.55 0.01 250)', marginTop: 3, lineHeight: 1.35 }}>{g.desc}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 7 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, padding: '3px 8px', borderRadius: 999, background: g.chip.bg, color: g.chip.fg }}>{g.statusText}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {megaQuiz && (
              <div style={{ borderTop: '1px solid oklch(0.915 0.006 60)', paddingTop: 16, marginTop: 16 }}>
                <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, margin: 0, color: colors.primary }}>Today's Mega Quiz</h2>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'oklch(0.55 0.02 250)', margin: '4px 0 14px' }}>{todayLabel}</div>
                <div
                  onClick={() => startQuiz(megaQuiz.id)}
                  style={
                    isMobile
                      ? { display: 'flex', alignItems: 'stretch', background: 'white', border: '1px solid oklch(0.9 0.02 250)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,20,40,0.05)' }
                      : { background: 'white', border: '1px solid oklch(0.9 0.02 250)', borderRadius: 10, overflow: 'hidden', cursor: 'pointer', boxShadow: '0 1px 2px rgba(20,20,40,0.05)' }
                  }
                >
                  <div style={isMobile ? { position: 'relative', width: 104, flexShrink: 0, background: 'oklch(0.95 0.01 250)' } : { position: 'relative', width: '100%', height: 108, background: 'oklch(0.95 0.01 250)' }}>
                    {megaImageSrc ? (
                      <img src={megaImageSrc} alt={megaQuiz.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'oklch(0.94 0.03 250)', fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, color: 'oklch(0.5 0.13 250)' }}>100</div>
                    )}
                  </div>
                  <div style={isMobile ? { padding: '12px 14px', minWidth: 0, flex: 1 } : { padding: 14 }}>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, lineHeight: 1.15, color: 'oklch(0.22 0.01 250)', marginBottom: 4 }}>{megaQuiz.title.replace('MEGA QUIZ: ', '')}</div>
                    <div style={{ fontSize: 11.5, color: 'oklch(0.55 0.01 250)', lineHeight: 1.4, marginBottom: 12 }}>{megaQuiz.description}</div>
                    {!isMobile && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
                        <MiniStat value={questionCounts[megaQuiz.id] ?? 100} label="Questions" />
                        <MiniStat value={megaQuiz.points} label="Points" />
                        <MiniStat value={passThresholdFor(questionCounts[megaQuiz.id] ?? 100)} label="To pass" />
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, padding: '3px 8px', borderRadius: 999, background: megaAttempt ? (megaAttempt.passed ? CHIP_DONE.bg : 'oklch(0.95 0.05 27)') : CHIP_TODO.bg, color: megaAttempt ? (megaAttempt.passed ? CHIP_DONE.fg : 'oklch(0.5 0.17 27)') : CHIP_TODO.fg }}>
                        {megaAttempt ? (megaAttempt.passed ? `Passed · ${megaAttempt.score}/${megaAttempt.total}` : `Failed · ${megaAttempt.score}/${megaAttempt.total}`) : 'Not played'}
                      </div>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: colors.primary }}>{megaAttempt ? 'Play again' : 'Play'} →</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div style={{ minWidth: 0, background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
              <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>Latest Quizzes</h2>
              <div onClick={() => go('quizzes')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>View all →</div>
            </div>
            <div style={isMobile
              ? { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 16, margin: '0 -20px', padding: '4px 20px 12px', WebkitOverflowScrolling: 'touch' }
              : { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 22 }}
            >
              {recentQuizzes.map((quiz) => (
                <QuizPreviewCard key={quiz.id} quiz={quiz} attempt={attempts[quiz.id]} questionCount={questionCounts[quiz.id]} onStart={() => startQuiz(quiz.id)} isMobile={isMobile} />
              ))}
            </div>
          </div>
        </div>

        <div style={{ background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20, marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>Quiz Series</h2>
          </div>
          <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginBottom: 22 }}>Play a topic in order — finish every quiz in a series and its points double</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {seriesCards.map((ser) => (
              <div key={ser.id} onClick={() => openSeries(ser.id)} style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'white', border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, padding: '12px 16px 12px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(20,20,40,0.06)' }}>
                <div style={{ width: 96, height: 66, flexShrink: 0, borderRadius: 6, overflow: 'hidden', position: 'relative', background: 'oklch(0.95 0.03 250)' }}>
                  {ser.heroImage && <img src={ser.heroImage} alt={ser.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>
                <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 17, lineHeight: 1.2, color: 'oklch(0.22 0.01 250)' }}>{ser.title}</div>
                  <div style={{ fontSize: 12, color: 'oklch(0.55 0.02 250)', lineHeight: 1.4 }}>{ser.bonusText}</div>
                </div>
                {!isMobile && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                    <div style={{ width: 88, height: 4, borderRadius: 2, background: 'oklch(0.93 0.01 250)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 2, background: ser.barColor, width: ser.progressPct }} />
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, textTransform: 'uppercase', color: 'oklch(0.55 0.01 250)', whiteSpace: 'nowrap' }}>{ser.progressText}</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: colors.primary }}>→</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <QuizCategorySection title="Players" quizzes={playerQuizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} onViewAll={() => goCategory('players')} isMobile={isMobile} />
        <QuizCategorySection title="Clubs" quizzes={clubQuizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} onViewAll={() => goCategory('clubs')} isMobile={isMobile} />

        <div style={{ background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20, marginTop: 32 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>Leaderboard</h2>
            <div onClick={() => go('leaderboard')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>Full standings →</div>
          </div>
          <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginBottom: 20 }}>{sorted.length} ranked · {youGapText}</div>
          {hasAccountName && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', background: 'oklch(0.975 0.01 250)', border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, padding: '14px 18px', marginBottom: 16 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 16, lineHeight: 1, color: 'oklch(0.22 0.01 250)' }}>{myName}</div>
              <div style={{ flex: 1 }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, lineHeight: 1, color: colors.primary }}>{youRankText}</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.58 0.01 250)' }}>Rank</div>
              </div>
              <div style={{ width: 1, height: 16, background: 'oklch(0.88 0.01 250)' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, lineHeight: 1, color: colors.primary }}>{totalAccountPoints}</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.58 0.01 250)' }}>Points</div>
              </div>
              <div style={{ width: 1, height: 16, background: 'oklch(0.88 0.01 250)' }} />
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, lineHeight: 1, color: colors.primary }}>{accountStreak}</div>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: 'oklch(0.58 0.01 250)' }}>Day streak</div>
              </div>
            </div>
          )}
          {homeLeaderboardTop.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {homeLeaderboardTop.map((row, idx) => <LeaderboardHomeRow key={row.name + idx} row={row} rank={idx + 1} />)}
              {showMyRow && myIdx >= 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'center', color: 'oklch(0.75 0.01 250)', fontSize: 13, padding: '4px 0' }}>···</div>
                  <LeaderboardHomeRow row={sorted[myIdx]} rank={myIdx + 1} />
                </>
              )}
            </div>
          ) : (
            <div style={{ padding: '32px 0', color: colors.textMuted, fontSize: 15 }}>No scores yet — play a quiz to take the top spot.</div>
          )}
        </div>

        <div style={{ background: 'oklch(0.965 0.006 60)', border: '1px solid oklch(0.915 0.006 60)', borderRadius: 12, padding: 20, marginTop: 32 }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: '0 0 8px', color: colors.primary }}>Play a Friend</h2>
          <p style={{ fontSize: 15, color: 'oklch(0.5 0.01 250)', margin: '0 0 24px' }}>Same quiz, head to head — or race to fill the grid.</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ background: 'white', border: '1px solid oklch(0.9 0.02 250)', borderRadius: 10, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, maxWidth: isMobile ? '100%' : '50%' }}>
              <div style={{ width: '100%', height: 120 }}>
                <img src="/mode-images/matchroom.webp" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'white', background: colors.primary, padding: '3px 10px', borderRadius: 999, marginBottom: 8 }}>
                  Friend vs Friend
                </div>
                <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 21, margin: '0 0 6px', color: colors.textBody }}>Match Room</h3>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Challenge a friend head-to-head on the same quiz.</p>
              </div>
              <button
                onClick={startMatchSetup}
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '13px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
              >
                Start a Match
              </button>
            </div>
            <div style={{ background: 'white', border: '1px solid oklch(0.9 0.02 250)', borderRadius: 10, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16, flex: 1, maxWidth: isMobile ? '100%' : '50%' }}>
              <div style={{ width: '100%', height: 120 }}>
                <img src="/mode-images/gridduel.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ alignSelf: 'flex-start', fontSize: 11, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: 'white', background: colors.primary, padding: '3px 10px', borderRadius: 999, marginBottom: 8 }}>
                  Friend vs Friend
                </div>
                <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 21, margin: '0 0 6px', color: colors.textBody }}>Grid Duel</h3>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Race a friend to fill the FootyGrid faster.</p>
              </div>
              <button
                onClick={startGridDuelSetup}
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: 'white', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '13px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
              >
                Start a Grid Duel
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
