import { colors, fonts, DIFFICULTY_LABEL } from '../lib/tokens';
import type { Quiz, QuizAttempt } from '../lib/types';
import QuizImage from './QuizImage';

export default function RecommendedQuizzes({
  quizzes,
  attempts,
  questionCounts,
  startQuiz,
  goQuizzes,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  startQuiz: (id: string) => void;
  goQuizzes: () => void;
}) {
  const recPool = quizzes.filter((q) => !attempts[q.id]);
  const recommended = (recPool.length >= 3 ? recPool : quizzes).slice(0, 3);
  if (recommended.length === 0) return null;

  return (
    <div style={{ marginTop: 56, borderTop: '1px solid oklch(0.91 0.01 250)', paddingTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted }}>Recommended for you</div>
        <div onClick={goQuizzes} style={{ fontSize: 12, fontWeight: 700, color: colors.primary, cursor: 'pointer' }}>Browse all quizzes →</div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 16 }}>
        {recommended.map((q) => (
          <div
            key={q.id}
            onClick={() => startQuiz(q.id)}
            style={{ border: `1px solid ${colors.border}`, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', cursor: 'pointer', background: 'white' }}
          >
            <div style={{ width: '100%', height: 150 }}>
              <QuizImage quizId={q.id} fallback={q.image} alt={q.title} />
            </div>
            <div style={{ padding: '12px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 0.8, textTransform: 'uppercase', color: 'oklch(0.58 0.01 250)' }}>{DIFFICULTY_LABEL[q.difficulty]}</div>
              <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 17, margin: 0, lineHeight: 1.2, color: colors.primary }}>{q.title}</h3>
              <p style={{ fontSize: 12.5, color: colors.textMuted, margin: 0, lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{q.description}</p>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>Start · {questionCounts[q.id] != null ? `${questionCounts[q.id]} Qs` : ''}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
