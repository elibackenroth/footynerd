import { useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { getQuizImageSrc } from '../components/QuizImage';
import type { Quiz, QuizQuestionPublic } from '../lib/types';

export default function QuizPlay({
  quiz,
  questions,
  qIndex,
  selectedIndex,
  correctIndex,
  matchActive,
  isMobile,
  onSelect,
  onNext,
  onQuit,
}: {
  quiz: Quiz;
  questions: QuizQuestionPublic[];
  qIndex: number;
  selectedIndex: number | null;
  correctIndex: number | null;
  matchActive: boolean;
  isMobile: boolean;
  onSelect: (idx: number) => void;
  onNext: () => void;
  onQuit: () => void;
}) {
  const [confirmQuitOpen, setConfirmQuitOpen] = useState(false);
  const total = questions.length;
  const question = questions[qIndex];
  const hasAnswered = selectedIndex !== null;
  const progressPct = Math.round(((qIndex + (hasAnswered ? 1 : 0)) / total) * 100) + '%';
  const nextButtonLabel = qIndex + 1 < total ? 'Next Question' : 'See Results';
  const backdropSrc = getQuizImageSrc(quiz.id, quiz.image);

  const optionMinHeight = isMobile ? 62 : 0;
  const optionGap = 14;
  const optionRowPadding = isMobile ? '16px 18px' : '17px 20px';

  return (
    <div style={{ position: 'relative' }}>
      {backdropSrc && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', overflow: 'hidden' }}>
          <img
            src={backdropSrc}
            alt=""
            style={isMobile
              ? { width: '100%', height: '100%', objectFit: 'cover', opacity: 0.24, filter: 'saturate(0.8) blur(3px)', transform: 'scale(1.06)' }
              : {
                  width: '100%', height: '100%', objectFit: 'cover', opacity: 0.24,
                  filter: 'saturate(0.8) blur(3px)', transform: 'scale(1.04)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.25) 85%, rgba(0,0,0,0) 100%)',
                  maskImage: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,1) 40%, rgba(0,0,0,0.25) 85%, rgba(0,0,0,0) 100%)',
                }}
          />
          {isMobile && (
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.8) 42%, rgba(255,255,255,0.98) 78%, rgb(255,255,255) 100%)' }} />
          )}
        </div>
      )}
    <main style={{ flex: 1, maxWidth: 720, margin: '0 auto', padding: isMobile ? '24px 20px 96px' : '72px 48px 120px', width: '100%', position: 'relative', zIndex: 1 }}>
      <div
        onClick={() => setConfirmQuitOpen(true)}
        style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: colors.primary, marginBottom: 16 }}
      >
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span>
        <span>Back to quizzes</span>
      </div>
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

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: isMobile ? 23 : 32, lineHeight: 1.3, margin: '0 0 32px' }}>{question.question}</h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: optionGap }}>
        {question.options.map((text, idx) => {
          if (hasAnswered && idx !== correctIndex && idx !== selectedIndex) return null;
          let borderColor = 'oklch(0.9 0.01 250)';
          let bgColor = 'white';
          let labelColor = 'transparent';
          let label = '';
          if (hasAnswered) {
            if (correctIndex === null) {
              if (idx === selectedIndex) {
                borderColor = colors.primaryLight;
                bgColor = 'oklch(0.97 0.03 250)';
              }
            } else if (idx === correctIndex) {
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
                border: `2px solid ${borderColor}`, background: bgColor, borderRadius: 4, padding: optionRowPadding, minHeight: optionMinHeight, boxSizing: 'border-box',
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
        <div
          style={
            isMobile
              ? { position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 40, display: 'flex', padding: '12px 20px calc(12px + env(safe-area-inset-bottom))', background: 'rgba(255,255,255,0.96)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)', borderTop: '1px solid oklch(0.92 0.01 250)' }
              : { marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16 }
          }
        >
          <button
            onClick={onNext}
            style={
              isMobile
                ? { background: colors.textBody, color: 'white', border: 'none', fontWeight: 600, borderRadius: 12, cursor: 'pointer', fontFamily: fonts.body, flex: 1, height: 54, fontSize: 16 }
                : { background: colors.textBody, color: 'white', border: 'none', fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body, padding: '14px 32px', fontSize: 15 }
            }
          >
            {nextButtonLabel}
          </button>
        </div>
      )}

      {confirmQuitOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(20,20,40,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 14, padding: 28, maxWidth: 400, width: '100%', boxShadow: '0 24px 60px rgba(20,20,40,0.25)' }}>
            <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: '0 0 10px', color: colors.textBody }}>Quit this quiz?</h3>
            <p style={{ fontSize: 14.5, lineHeight: 1.55, color: colors.textSecondary, margin: '0 0 22px' }}>Nothing is recorded and your progress is lost — but the quiz stays available to play again.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmQuitOpen(false)}
                style={{ background: 'white', color: colors.textSecondary, border: '1px solid oklch(0.88 0.01 250)', padding: '11px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
              >
                Keep playing
              </button>
              <button
                onClick={onQuit}
                style={{ background: colors.textBody, color: 'white', border: 'none', padding: '11px 20px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
              >
                Quit quiz
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
    </div>
  );
}
