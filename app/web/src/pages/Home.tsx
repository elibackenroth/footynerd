import { colors, fonts, DIFFICULTY_LABEL } from '../lib/tokens';
import type { Quiz, QuizAttempt, PointsLeaderboardRow } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import QuizImage from '../components/QuizImage';
import LeaderboardRow from '../components/LeaderboardRow';

const FEATURED_BASE_IDS = ['istanbul2005', 'henryarsenal', 'dortmundacademy'];

export default function Home({
  quizzes,
  attempts,
  hasAccountName,
  quizzesPassedCount,
  totalAccountPoints,
  pointsRows,
  questionCounts,
  isMobile,
  go,
  goCategory,
  startQuiz,
  startMatchSetup,
  startWordlePicker,
  startTransferChain,
  startFootygrid,
  startGridDuelSetup,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  hasAccountName: boolean;
  quizzesPassedCount: number;
  totalAccountPoints: number;
  pointsRows: PointsLeaderboardRow[];
  questionCounts: Record<string, number>;
  isMobile: boolean;
  go: (v: ViewName) => void;
  goCategory: (category: string) => void;
  startQuiz: (id: string) => void;
  startMatchSetup: () => void;
  startWordlePicker: () => void;
  startTransferChain: () => void;
  startFootygrid: () => void;
  startGridDuelSetup: () => void;
}) {
  const featured = FEATURED_BASE_IDS.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];

  const buildCategoryPreview = (category: string) => quizzes.filter((q) => q.category === category).slice().reverse().slice(0, 3);
  const playerQuizzes = buildCategoryPreview('players');
  const clubQuizzes = buildCategoryPreview('clubs');
  const nationalQuizzes = buildCategoryPreview('national');

  const homeLeaderboardTop = pointsRows.slice(0, 10);

  const cardStyle = { background: 'oklch(0.97 0.02 250)', border: '1px solid oklch(0.91 0.02 250)', borderRadius: 12, padding: 32 };

  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div style={{ width: '100%' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '32px 20px 24px' : '56px 48px 56px', textAlign: 'center' }}>
          <div style={{ display: 'inline-block', background: 'white', border: `1px solid ${colors.panelBorder}`, color: colors.primary, fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', padding: '6px 16px', borderRadius: 999, marginBottom: 20 }}>
            {hasAccountName ? 'Welcome back' : 'New quizzes, wordles & grids daily'}
          </div>
          <h1
            style={{
              fontFamily: fonts.heading, fontWeight: 700,
              fontSize: isMobile ? (hasAccountName ? 30 : 36) : (hasAccountName ? 56 : 64),
              letterSpacing: 0.5, margin: '0 0 16px', lineHeight: hasAccountName ? 1.15 : 1.1, color: colors.primary,
            }}
          >
            {hasAccountName ? "Ready for today's quiz?" : 'Know your football?'}
          </h1>
          <p style={{ fontSize: isMobile ? 16 : 19, color: colors.textSecondary, margin: isMobile ? '0 0 28px' : '0 0 40px', lineHeight: 1.5 }}>
            {hasAccountName
              ? `You've passed ${quizzesPassedCount} quizzes and earned ${totalAccountPoints} points so far.`
              : 'Soccer trivia across players, leagues, and national team history. Pass a quiz to earn points, and come back daily to build your streak.'}
          </p>
          <button
            onClick={() => go('quizzes')}
            style={{ background: colors.primary, color: 'white', border: 'none', padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body, boxShadow: `0 8px 24px oklch(0.42 0.18 250 / 0.25)` }}
          >
            View All Quizzes
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '32px 20px 100px' : '48px 48px 100px' }}>
        <div style={cardStyle}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: '0 0 20px', color: colors.primary }}>Daily Games</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, textAlign: 'left' }}>
            <ModeCard
              image="/mode-images/wordle.webp"
              title="Football Wordle"
              desc="10 puzzles — stadiums, players, coaches & clubs. Click to jump right in."
              buttonLabel="Play Wordle"
              onClick={startWordlePicker}
            />
            <ModeCard
              image="/mode-images/transferchain.webp"
              title="Transfer Chain"
              desc="A new 5-round chain every day. Name the player who links three clubs."
              buttonLabel="Play Transfer Chain"
              onClick={startTransferChain}
            />
            <ModeCard
              image="/mode-images/footygrid.png"
              title="FootyGrid"
              desc="A 3x3 grid of clubs, countries, and trophies. One player links each row and column."
              buttonLabel="Play FootyGrid"
              onClick={startFootygrid}
            />
          </div>
        </div>

        <div style={{ height: 48 }} />

        <div style={cardStyle}>
          <div style={{ marginBottom: 48 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 24, margin: 0, color: colors.primary }}>Featured Quizzes</h2>
              <div onClick={() => go('quizzes')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>View all →</div>
            </div>
            <div style={isMobile
              ? { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 16, margin: '0 -20px', padding: '4px 20px 12px', WebkitOverflowScrolling: 'touch' }
              : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}
            >
              {featured.map((quiz) => (
                <QuizPreviewCard key={quiz.id} quiz={quiz} attempt={attempts[quiz.id]} questionCount={questionCounts[quiz.id]} onStart={() => startQuiz(quiz.id)} isMobile={isMobile} />
              ))}
            </div>
          </div>

          <QuizCategorySection title="Latest Player Quizzes" quizzes={playerQuizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} onViewAll={() => goCategory('players')} isMobile={isMobile} />
          <QuizCategorySection title="Latest Club Quizzes" quizzes={clubQuizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} onViewAll={() => goCategory('clubs')} isMobile={isMobile} />
          <QuizCategorySection title="Latest National Team Quizzes" quizzes={nationalQuizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} onViewAll={() => goCategory('national')} isMobile={isMobile} />
        </div>

        <div style={{ ...cardStyle, marginTop: 48 }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: '0 0 28px', color: colors.primary }}>Leaderboard</h2>
          {homeLeaderboardTop.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', borderTop: `1px solid ${colors.borderLight}`, marginBottom: 20 }}>
              {homeLeaderboardTop.map((row, idx) => (
                <LeaderboardRow key={row.name + idx} row={row} rank={idx + 1} size="compact" />
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 0', color: colors.textMuted, fontSize: 15, borderTop: `1px solid ${colors.borderLight}`, marginBottom: 20 }}>
              No scores yet — play a quiz to take the top spot.
            </div>
          )}
          <div>
            <button
              onClick={() => go('leaderboard')}
              style={{ background: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '12px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
            >
              View Full Leaderboard
            </button>
          </div>
        </div>

        <div style={{ ...cardStyle, marginTop: 48 }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: '0 0 28px', color: colors.primary }}>Multiplayer Game Modes</h2>
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
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: colors.primary, color: 'white', border: 'none', padding: '14px 20px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
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
                style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: colors.primary, color: 'white', border: 'none', padding: '14px 20px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
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

function ModeCard({ image, title, desc, buttonLabel, onClick }: { image: string; title: string; desc: string; buttonLabel: string; onClick: () => void }) {
  return (
    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 8, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      <div style={{ width: '100%', height: 120, marginBottom: 4 }}>
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
      </div>
      <div style={{ flex: 1 }}>
        <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 21, margin: '0 0 6px', color: colors.textBody }}>{title}</h3>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>{desc}</p>
      </div>
      <button
        onClick={onClick}
        style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: colors.primary, color: 'white', border: 'none', padding: '14px 20px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

function QuizPreviewCard({ quiz, attempt, questionCount, onStart, isMobile }: { quiz: Quiz; attempt?: QuizAttempt; questionCount?: number; onStart: () => void; isMobile?: boolean }) {
  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...(isMobile ? { flex: '0 0 82%', scrollSnapAlign: 'start' } : {}) }}>
      <div style={{ width: '100%', height: 140 }}>
        <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>{DIFFICULTY_LABEL[quiz.difficulty]}</div>
          {questionCount != null && (
            <div style={{ fontSize: 11, fontWeight: 700, color: 'oklch(0.5 0.15 250)', background: 'oklch(0.95 0.04 250)', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>{questionCount} Qs</div>
          )}
        </div>
        <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, margin: 0, lineHeight: 1.15, minHeight: 44, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: colors.textBody }}>{quiz.title}</h3>
        <div style={{ flex: 1 }} />
        {!attempt ? (
          <button
            onClick={onStart}
            style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '9px 18px', fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
          >
            Start Quiz
          </button>
        ) : (
          <div style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, color: attempt.passed ? colors.success : colors.danger }}>
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
    <div style={{ marginBottom: 48 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24 }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 24, margin: 0, color: colors.primary }}>{title}</h2>
        <div onClick={onViewAll} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>View all →</div>
      </div>
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
