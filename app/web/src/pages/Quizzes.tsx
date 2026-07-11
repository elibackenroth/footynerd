import { colors, fonts, CATEGORIES, DIFFICULTIES, DIFFICULTY_LABEL } from '../lib/tokens';
import type { Quiz, QuizAttempt } from '../lib/types';
import QuizImage from '../components/QuizImage';

export default function Quizzes({
  quizzes,
  attempts,
  activeCategory,
  setCategory,
  activeDifficulty,
  setDifficulty,
  startQuiz,
  quizzesPassedCount,
  totalPoints,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  activeCategory: string;
  setCategory: (id: string) => void;
  activeDifficulty: string;
  setDifficulty: (id: string) => void;
  startQuiz: (id: string) => void;
  quizzesPassedCount: number;
  totalPoints: number;
}) {
  const filtered = quizzes
    .filter((q) => activeCategory === 'all' || q.category === activeCategory)
    .filter((q) => activeDifficulty === 'all' || q.difficulty === activeDifficulty)
    .slice()
    .sort((a, b) => (attempts[a.id] ? 1 : 0) - (attempts[b.id] ? 1 : 0));

  return (
    <main style={{ flex: 1, display: 'flex', maxWidth: 1160, margin: '0 auto', width: '100%', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 28, right: 48, display: 'flex', gap: 10, background: 'oklch(0.97 0.01 250)', border: '1px solid oklch(0.9 0.01 250)', borderRadius: 999, padding: '10px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, color: colors.primary, lineHeight: 1 }}>{quizzesPassedCount}</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted }}>Passed</div>
        </div>
        <div style={{ width: 1, background: 'oklch(0.88 0.01 250)' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, color: colors.primary, lineHeight: 1 }}>{totalPoints}</div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted }}>Points</div>
        </div>
      </div>

      <aside style={{ width: 170, flexShrink: 0, padding: '260px 0 120px 48px' }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textFaint, marginBottom: 10 }}>Difficulty</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {DIFFICULTIES.map((d) => {
            const active = activeDifficulty === d.id;
            return (
              <div
                key={d.id}
                onClick={() => setDifficulty(d.id)}
                style={{
                  display: 'block', padding: '6px 10px', borderRadius: 3, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left',
                  background: active ? 'oklch(0.95 0.03 250)' : 'transparent',
                  color: active ? colors.primary : 'oklch(0.65 0.01 250)',
                }}
              >
                {d.label}
              </div>
            );
          })}
        </div>
      </aside>

      <div style={{ flex: 1, minWidth: 0, padding: '80px 48px 120px', maxWidth: 960 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 56, letterSpacing: 0.5, margin: '0 0 16px', lineHeight: 1.05, color: colors.primary }}>
          Test your Ball knowledge.
        </h1>
        <p style={{ fontSize: 18, color: colors.textSecondary, margin: '0 0 40px', maxWidth: 520 }}>
          Pick a quiz, answer the questions, and climb the leaderboard.
        </p>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 48 }}>
          {CATEGORIES.map((c) => {
            const active = activeCategory === c.id;
            return (
              <div
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  padding: '8px 18px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', letterSpacing: 0.2,
                  background: active ? colors.primary : 'oklch(0.95 0.03 250)',
                  color: active ? 'white' : colors.primary,
                }}
              >
                {c.label}
              </div>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }}>
          {filtered.map((quiz) => {
            const attempt = attempts[quiz.id];
            return (
              <div key={quiz.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', height: 440, display: 'flex', flexDirection: 'column' }}>
                <div style={{ width: '100%', height: 160 }}>
                  <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
                </div>
                <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>
                    {DIFFICULTY_LABEL[quiz.difficulty]} · {quiz.points} pts
                  </div>
                  <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: 0, lineHeight: 1.15, color: colors.primary }}>{quiz.title}</h2>
                  <p style={{ fontSize: 15, color: colors.textMuted, margin: 0, lineHeight: 1.5, flex: 1 }}>{quiz.description}</p>
                  {!attempt ? (
                    <button
                      onClick={() => startQuiz(quiz.id)}
                      style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <div style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: attempt.passed ? colors.success : colors.danger }}>
                      {attempt.passed ? 'Passed' : 'Failed'} · {attempt.score}/{attempt.total} · no retakes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
