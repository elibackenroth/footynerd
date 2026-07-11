import { colors, fonts } from '../lib/tokens';
import type { Quiz, QuizQuestionPublic } from '../lib/types';

export default function QuizPlay({
  quiz,
  questions,
  qIndex,
  selectedIndex,
  correctIndex,
  matchActive,
  onSelect,
  onNext,
}: {
  quiz: Quiz;
  questions: QuizQuestionPublic[];
  qIndex: number;
  selectedIndex: number | null;
  correctIndex: number | null;
  matchActive: boolean;
  onSelect: (idx: number) => void;
  onNext: () => void;
}) {
  const total = questions.length;
  const question = questions[qIndex];
  const hasAnswered = selectedIndex !== null;
  const progressPct = Math.round(((qIndex + (hasAnswered ? 1 : 0)) / total) * 100) + '%';
  const nextButtonLabel = qIndex + 1 < total ? 'Next Question' : 'See Results';

  return (
    <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: '72px 48px 120px', width: '100%' }}>
      {matchActive && (
        <div style={{ display: 'inline-block', marginBottom: 14, padding: '4px 10px', borderRadius: 999, background: colors.badgeBg, color: 'oklch(0.4 0.14 250)', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
          MATCH ROOM
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryLight }}>{quiz.title}</div>
        <div style={{ fontSize: 13, color: colors.textMuted }}>Question {qIndex + 1} of {total}</div>
      </div>
      <div style={{ height: 3, background: 'oklch(0.93 0.01 250)', borderRadius: 2, marginBottom: 48, overflow: 'hidden' }}>
        <div style={{ height: '100%', background: colors.primaryLight, borderRadius: 2, width: progressPct, transition: 'width 0.25s' }} />
      </div>

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 32, lineHeight: 1.25, margin: '0 0 40px' }}>{question.question}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {question.options.map((text, idx) => {
          let borderColor = 'oklch(0.9 0.01 250)';
          let bgColor = 'white';
          let labelColor = 'transparent';
          let label = '';
          if (hasAnswered) {
            if (idx === correctIndex) {
              borderColor = colors.primaryLight;
              bgColor = 'oklch(0.97 0.03 250)';
              labelColor = 'oklch(0.5 0.14 250)';
              label = 'CORRECT';
            } else if (idx === selectedIndex) {
              borderColor = 'oklch(0.6 0.17 25)';
              bgColor = 'oklch(0.97 0.03 25)';
              labelColor = colors.danger;
              label = 'YOUR PICK';
            }
          }
          return (
            <div
              key={idx}
              onClick={() => !hasAnswered && onSelect(idx)}
              style={{
                border: `2px solid ${borderColor}`, background: bgColor, borderRadius: 4, padding: '18px 22px',
                cursor: hasAnswered ? 'default' : 'pointer', fontSize: 16, fontWeight: 500,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}
            >
              <span>{text}</span>
              <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.5, color: labelColor }}>{label}</span>
            </div>
          );
        })}
      </div>

      {hasAnswered && (
        <div style={{ marginTop: 40, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onNext}
            style={{ background: colors.textBody, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
          >
            {nextButtonLabel}
          </button>
        </div>
      )}
    </main>
  );
}
