import { colors, fonts, DIFFICULTY_LABEL } from '../lib/tokens';
import type { Quiz, QuizAttempt, PointsLeaderboardRow } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import QuizImage from '../components/QuizImage';
import LeaderboardRow from '../components/LeaderboardRow';

const FEATURED_BASE_IDS = ['worldcup', 'legends'];

export default function Home({
  quizzes,
  attempts,
  hasAccountName,
  quizzesPassedCount,
  totalAccountPoints,
  pointsRows,
  isMobile,
  go,
  startQuiz,
  startMatchSetup,
  startWordlePicker,
  startTransferChain,
  startFootygrid,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  hasAccountName: boolean;
  quizzesPassedCount: number;
  totalAccountPoints: number;
  pointsRows: PointsLeaderboardRow[];
  isMobile: boolean;
  go: (v: ViewName) => void;
  startQuiz: (id: string) => void;
  startMatchSetup: () => void;
  startWordlePicker: () => void;
  startTransferChain: () => void;
  startFootygrid: () => void;
}) {
  const featuredIds = (() => {
    const used = new Set<string>();
    const pickReplacement = () => {
      for (let i = quizzes.length - 1; i >= 0; i--) {
        const cand = quizzes[i];
        if (!attempts[cand.id] && !used.has(cand.id)) return cand.id;
      }
      return null;
    };
    return FEATURED_BASE_IDS.map((id) => {
      if (!attempts[id] && !used.has(id) && quizzes.some((q) => q.id === id)) {
        used.add(id);
        return id;
      }
      const rep = pickReplacement();
      const finalId = rep || id;
      used.add(finalId);
      return finalId;
    });
  })();
  const featured = featuredIds.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];

  const homeLeaderboardTop = pointsRows.slice(0, 10);

  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: isMobile ? '32px 20px 24px' : '56px 48px 56px', textAlign: 'center' }}>
        {!hasAccountName ? (
          <>
            <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 36 : 64, letterSpacing: 0.5, margin: '0 0 16px', lineHeight: 1.1, color: colors.primary }}>
              Know your football?
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 19, color: colors.textSecondary, margin: isMobile ? '0 0 28px' : '0 0 40px', lineHeight: 1.5 }}>
              Soccer trivia across players, leagues, and national team history. Pass a quiz to earn points, and come back daily to build your streak.
            </p>
            <button
              onClick={() => go('quizzes')}
              style={{ background: colors.primary, color: 'white', border: 'none', padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
            >
              Browse Quizzes
            </button>
          </>
        ) : (
          <>
            <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 30 : 56, letterSpacing: 0.5, margin: '0 0 16px', lineHeight: 1.15, color: colors.primary }}>
              Ready for today's quiz?
            </h1>
            <p style={{ fontSize: isMobile ? 16 : 19, color: colors.textSecondary, margin: isMobile ? '0 0 28px' : '0 0 40px', lineHeight: 1.5 }}>
              You've passed {quizzesPassedCount} quizzes and earned {totalAccountPoints} points so far.
            </p>
            <button
              onClick={() => go('quizzes')}
              style={{ background: colors.primary, color: 'white', border: 'none', padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
            >
              Keep Playing
            </button>
          </>
        )}
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: isMobile ? '0 20px 56px' : '0 48px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20, textAlign: 'left' }}>
          <ModeCard
            image="/mode-images/matchroom.webp"
            eyebrow="Friend vs Friend"
            title="Start a Match Room"
            desc="Pick a quiz, play it, then send your friend the link to see who scores higher."
            buttonLabel="Start a Match Room"
            onClick={startMatchSetup}
          />
          <ModeCard
            image="/mode-images/wordle.webp"
            eyebrow="Word Game"
            title="Football Wordle"
            desc="A new word every day — stadiums, players, rules & terms. Click to jump right in."
            buttonLabel="Play Wordle"
            onClick={startWordlePicker}
          />
          <ModeCard
            image="/mode-images/transferchain.webp"
            eyebrow="Club Trivia"
            title="Transfer Chain"
            desc="9 rounds. Name the player who played for all three clubs shown."
            buttonLabel="Play Transfer Chain"
            onClick={startTransferChain}
          />
          <ModeCard
            image="/mode-images/footygrid.png"
            eyebrow="Grid Game"
            title="FootyGrid"
            desc="9 cells, 9 guesses. Name a player who fits both the row and column."
            buttonLabel="Play FootyGrid"
            onClick={startFootygrid}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: isMobile ? '0 20px 64px' : '0 48px 100px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 48 : 64, alignItems: 'start' }}>
          <div>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: '0 0 28px', color: colors.primary }}>Featured Quizzes</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 20 : 24, marginBottom: 28 }}>
              {featured.map((quiz) => {
                const attempt = attempts[quiz.id];
                return (
                  <div key={quiz.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ width: '100%', height: 140 }}>
                      <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
                    </div>
                    <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>
                        {DIFFICULTY_LABEL[quiz.difficulty]} · {quiz.points} pts
                      </div>
                      <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, lineHeight: 1.15, color: colors.primary }}>{quiz.title}</h3>
                      <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, lineHeight: 1.5, flex: 1 }}>{quiz.description}</p>
                      {!attempt ? (
                        <button
                          onClick={() => startQuiz(quiz.id)}
                          style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
                        >
                          Start Quiz
                        </button>
                      ) : (
                        <div style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: attempt.passed ? colors.success : colors.danger }}>
                          {attempt.passed ? 'Passed' : 'Failed'} · no retakes
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <button
                onClick={() => go('quizzes')}
                style={{ background: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '12px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
              >
                View All Quizzes
              </button>
            </div>
          </div>

          <div>
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
        </div>
      </div>
    </main>
  );
}

function ModeCard({ image, eyebrow, title, desc, buttonLabel, onClick }: { image: string; eyebrow: string; title: string; desc: string; buttonLabel: string; onClick: () => void }) {
  return (
    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 8, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      <div style={{ width: '100%', height: 120, marginBottom: 4 }}>
        <img src={image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 8, display: 'block' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary, marginBottom: 6 }}>{eyebrow}</div>
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
