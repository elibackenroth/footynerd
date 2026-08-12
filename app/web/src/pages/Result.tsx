import { useState } from 'react';
import { colors, fonts, passThresholdFor, quizDateLabel, DIFFICULTY_LABEL } from '../lib/tokens';
import type { ViewName } from '../lib/viewTypes';
import type { Quiz, QuizAttempt } from '../lib/types';
import QuizImage from '../components/QuizImage';

export default function Result({
  quizTitle,
  score,
  total,
  passed,
  points,
  persisted,
  streak,
  needsAuth,
  onAuthAndSave,
  go,
  quizzes,
  activeQuizId,
  attempts,
  questionCounts,
  onStartQuiz,
  isMobile,
}: {
  quizTitle: string;
  score: number;
  total: number;
  passed: boolean;
  points: number;
  persisted: boolean;
  streak: number;
  needsAuth: boolean;
  onAuthAndSave: (mode: 'signin' | 'signup', email: string, password: string, name: string) => Promise<string | null>;
  go: (v: ViewName) => void;
  quizzes: Quiz[];
  activeQuizId: string;
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  onStartQuiz: (id: string) => void;
  isMobile?: boolean;
}) {
  const isPerfect = score === total;
  const resultMessage = isPerfect
    ? 'Flawless. You know your football.'
    : passed
    ? 'You passed — solid performance.'
    : `Not quite — you needed ${passThresholdFor(total)} correct to pass. No retakes on this one.`;

  const activeQuiz = quizzes.find((q) => q.id === activeQuizId) || null;
  const simCat = activeQuiz ? activeQuiz.category : null;
  const sameCat = quizzes.filter((q) => q.id !== activeQuizId && q.category === simCat);
  const otherCat = quizzes.filter((q) => q.id !== activeQuizId && q.category !== simCat);
  const unplayedFirst = (arr: Quiz[]) => arr.filter((q) => !attempts[q.id]).concat(arr.filter((q) => attempts[q.id]));
  const similarQuizzes = unplayedFirst(sameCat).concat(unplayedFirst(otherCat)).slice(0, 6);

  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const err = await onAuthAndSave(mode, email.trim(), password, name.trim());
    setBusy(false);
    if (err) setError(err);
  }

  return (
    <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '96px 48px 120px', width: '100%', textAlign: 'center' }}>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryLight, marginBottom: 16 }}>
        {quizTitle} — Complete
      </div>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 88, lineHeight: 1, marginBottom: 8 }}>
        {score}<span style={{ fontSize: 36, color: colors.textMuted }}>/{total}</span>
      </div>
      <p style={{ fontSize: 17, color: colors.textSecondary, margin: '0 0 8px' }}>{resultMessage}</p>

      {isPerfect && (
        <div style={{ display: 'inline-block', marginTop: 16, padding: '8px 18px', borderRadius: 999, background: colors.badgeBg, color: 'oklch(0.4 0.14 250)', fontSize: 13, fontWeight: 700, letterSpacing: 0.5 }}>
          PERFECT SCORE
        </div>
      )}

      <div style={{ marginTop: 56, borderTop: `1px solid ${colors.borderLight}`, paddingTop: 40 }}>
        {!needsAuth && persisted && (
          <>
            <p style={{ fontSize: 15, fontWeight: 600, color: colors.primary, margin: '0 0 6px' }}>
              {passed ? `+${points} points earned` : '+0 points — quiz not passed'}
            </p>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>Streak: {streak} day(s)</p>
          </>
        )}

        {needsAuth && (
          <div style={{ maxWidth: 340, margin: '0 auto', textAlign: 'left' }}>
            <p style={{ fontSize: 14, fontWeight: 600, letterSpacing: 0.3, margin: '0 0 18px', textAlign: 'center' }}>Sign in to save this result</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16, justifyContent: 'center' }}>
              <button onClick={() => setMode('signup')} style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${colors.primary}`, background: mode === 'signup' ? colors.primary : 'white', color: mode === 'signup' ? 'white' : colors.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign up</button>
              <button onClick={() => setMode('signin')} style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${colors.primary}`, background: mode === 'signin' ? colors.primary : 'white', color: mode === 'signin' ? 'white' : colors.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign in</button>
            </div>
            {mode === 'signup' && (
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, marginBottom: 10, fontFamily: fonts.body }} />
            )}
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, marginBottom: 10, fontFamily: fonts.body }} />
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, marginBottom: 14, fontFamily: fonts.body }} />
            {error && <p style={{ color: colors.danger, fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
            <button onClick={submit} disabled={busy} style={{ width: '100%', background: colors.primary, color: 'white', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>
              {busy ? 'Saving…' : mode === 'signup' ? 'Create Account & Save' : 'Sign In & Save'}
            </button>
          </div>
        )}

        <div style={{ marginTop: 32, display: 'flex', gap: 16, justifyContent: 'center' }}>
          <div onClick={() => go('quizzes')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Back to Quizzes</div>
          <div onClick={() => go('leaderboard')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>View Leaderboard</div>
          <div onClick={() => go('account')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>View Account</div>
        </div>
      </div>

      {similarQuizzes.length > 0 && (
        <div style={{ marginTop: 48, textAlign: 'left', background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>More Like This</h2>
            <div onClick={() => go('quizzes')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary }}>See all →</div>
          </div>
          <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginBottom: 22 }}>Six more quizzes to keep the streak going</div>
          <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr', gap: 14 } : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {similarQuizzes.map((quiz) => {
              const attempt = attempts[quiz.id];
              const questionCount = questionCounts[quiz.id];
              return (
                <div
                  key={quiz.id}
                  onClick={() => onStartQuiz(quiz.id)}
                  style={{ border: `1px solid ${colors.border}`, borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white', cursor: 'pointer', boxShadow: '0 1px 3px rgba(20,20,40,0.06)' }}
                >
                  <div style={{ width: '100%', height: 120, position: 'relative', filter: attempt ? 'grayscale(0.45) saturate(0.7) brightness(0.97)' : 'none' }}>
                    <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
                  </div>
                  <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'oklch(0.5 0.01 250)' }}>{DIFFICULTY_LABEL[quiz.difficulty]}</div>
                      {questionCount != null && (
                        <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, background: colors.badgeBg, padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>{questionCount} Qs</div>
                      )}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'oklch(0.62 0.01 250)' }}>{quizDateLabel(quiz.date)}</div>
                    <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 18, margin: 0, lineHeight: 1.2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: 'oklch(0.22 0.01 250)' }}>{quiz.title}</h3>
                    <div style={{ flex: 1 }} />
                    {!attempt ? (
                      <button
                        onClick={(e) => { e.stopPropagation(); onStartQuiz(quiz.id); }}
                        style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
                      >
                        Start Quiz
                      </button>
                    ) : (
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: attempt.passed ? colors.success : colors.danger }}>
                        {attempt.passed ? `Passed · ${attempt.score}/${attempt.total}` : `Failed · ${attempt.score}/${attempt.total}`}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
