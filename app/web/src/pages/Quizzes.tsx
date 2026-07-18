import { colors, fonts, CATEGORIES, DIFFICULTIES, SORTS, DIFFICULTY_LABEL, quizHash } from '../lib/tokens';
import type { Quiz, QuizAttempt } from '../lib/types';
import QuizImage from '../components/QuizImage';

export default function Quizzes({
  quizzes,
  attempts,
  questionCounts,
  activeCategory,
  setCategory,
  activeDifficulty,
  setDifficulty,
  activeSort,
  setSort,
  startQuiz,
  quizzesPassedCount,
  totalPoints,
  isMobile,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  activeCategory: string;
  setCategory: (id: string) => void;
  activeDifficulty: string;
  setDifficulty: (id: string) => void;
  activeSort: string;
  setSort: (id: string) => void;
  startQuiz: (id: string) => void;
  quizzesPassedCount: number;
  totalPoints: number;
  isMobile: boolean;
}) {
  const filtered = quizzes
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => activeCategory === 'all' || q.category === activeCategory)
    .filter(({ q }) => activeDifficulty === 'all' || q.difficulty === activeDifficulty)
    .sort((a, b) => {
      if (activeSort === 'recent') return b.idx - a.idx;
      const aAttempt = attempts[a.q.id] ? 1 : 0;
      const bAttempt = attempts[b.q.id] ? 1 : 0;
      if (aAttempt !== bAttempt) return aAttempt - bAttempt;
      return quizHash(a.q.id) - quizHash(b.q.id);
    })
    .map(({ q }) => q);

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxWidth: 1160, margin: '0 auto', width: '100%', position: 'relative', overflowX: 'hidden', boxSizing: 'border-box' }}>
      <div
        style={
          isMobile
            ? { display: 'inline-flex', gap: 10, background: 'oklch(0.97 0.01 250)', border: '1px solid oklch(0.9 0.01 250)', borderRadius: 999, padding: '10px 20px', margin: '20px 20px 0' }
            : { position: 'absolute', top: 28, right: 48, display: 'flex', gap: 10, background: 'oklch(0.97 0.01 250)', border: '1px solid oklch(0.9 0.01 250)', borderRadius: 999, padding: '10px 20px' }
        }
      >
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

      {isMobile && (
        <div style={{ display: 'flex', gap: 10, padding: '20px 20px 0' }}>
          <select
            value={activeCategory}
            onChange={(e) => setCategory(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', fontSize: 14, fontFamily: fonts.body, border: '1px solid oklch(0.85 0.02 250)', borderRadius: 6, background: 'white', color: colors.textBody }}
          >
            {CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
          <select
            value={activeDifficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            style={{ flex: 1, padding: '10px 12px', fontSize: 14, fontFamily: fonts.body, border: '1px solid oklch(0.85 0.02 250)', borderRadius: 6, background: 'white', color: colors.textBody }}
          >
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
        </div>
      )}

      {isMobile && (
        <div style={{ padding: '10px 20px 0' }}>
          <select
            value={activeSort}
            onChange={(e) => setSort(e.target.value)}
            style={{ width: '100%', padding: '10px 12px', fontSize: 14, fontFamily: fonts.body, border: '1px solid oklch(0.85 0.02 250)', borderRadius: 6, background: 'white', color: colors.textBody }}
          >
            {SORTS.map((s) => (
              <option key={s.id} value={s.id}>{s.label}</option>
            ))}
          </select>
        </div>
      )}

      {!isMobile && (
        <aside style={{ width: 170, flexShrink: 0, padding: '260px 0 120px 48px' }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textFaint, marginBottom: 10 }}>Sort By</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
            {SORTS.map((s) => {
              const active = activeSort === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setSort(s.id)}
                  style={{
                    display: 'block', padding: '6px 10px', borderRadius: 3, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left',
                    background: active ? 'oklch(0.95 0.03 250)' : 'transparent',
                    color: active ? colors.primary : 'oklch(0.65 0.01 250)',
                  }}
                >
                  {s.label}
                </div>
              );
            })}
          </div>
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
      )}

      <div style={isMobile ? { flex: 1, minWidth: 0, padding: '24px 20px 80px', maxWidth: 960 } : { flex: 1, minWidth: 0, padding: '80px 48px 120px', maxWidth: 960 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 32 : 56, letterSpacing: 0.5, margin: '0 0 16px', lineHeight: 1.1, color: colors.primary }}>
          Test your Ball knowledge.
        </h1>
        <p style={{ fontSize: 18, color: colors.textSecondary, margin: '0 0 40px', maxWidth: 520 }}>
          Pick a quiz, answer the questions, and climb the leaderboard.
        </p>

        {!isMobile && (
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
        )}

        <div
          style={
            isMobile
              ? { display: 'flex', overflowX: 'auto', scrollSnapType: 'x mandatory', gap: 16, margin: '0 -20px', padding: '4px 20px 12px', WebkitOverflowScrolling: 'touch' }
              : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28 }
          }
        >
          {filtered.map((quiz) => {
            const attempt = attempts[quiz.id];
            const questionCount = questionCounts[quiz.id];
            return (
              <div
                key={quiz.id}
                style={{
                  border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', height: 454, display: 'flex', flexDirection: 'column',
                  ...(isMobile ? { flex: '0 0 82%', scrollSnapAlign: 'start' } : {}),
                }}
              >
                <div style={{ width: '100%', height: 160 }}>
                  <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
                </div>
                <div style={{ padding: '24px 28px 28px', display: 'flex', flexDirection: 'column', gap: 18, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>
                      {DIFFICULTY_LABEL[quiz.difficulty]} · {quiz.points} pts
                    </div>
                    {questionCount != null && (
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'oklch(0.5 0.15 250)', background: 'oklch(0.95 0.04 250)', padding: '3px 10px', borderRadius: 999, flexShrink: 0 }}>{questionCount} Qs</div>
                    )}
                  </div>
                  <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 26, margin: 0, lineHeight: 1.15, minHeight: 60, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: colors.primary }}>{quiz.title}</h2>
                  <p style={{ fontSize: 15, color: colors.textMuted, margin: 0, lineHeight: 1.5, minHeight: 45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
                  <div style={{ flex: 1 }} />
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
