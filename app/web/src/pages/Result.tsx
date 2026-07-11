import { useState } from 'react';
import { colors, fonts, PASS_THRESHOLD } from '../lib/tokens';
import type { ViewName } from '../lib/viewTypes';

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
}) {
  const isPerfect = score === total;
  const resultMessage = isPerfect
    ? 'Flawless. You know your football.'
    : passed
    ? 'You passed — solid performance.'
    : `Not quite — you needed ${PASS_THRESHOLD} correct to pass. No retakes on this one.`;

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
    </main>
  );
}
