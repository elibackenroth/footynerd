import { useState, useEffect, useRef } from 'react';
import { colors, fonts, DIFFICULTY_LABEL, initials } from '../lib/tokens';
import { uploadAvatar, removeAvatar } from '../lib/api';
import type { Quiz, QuizAttempt, Profile } from '../lib/types';

export default function Account({
  profile,
  quizzes,
  attempts,
  totalPoints,
  quizzesPassedCount,
  onSaveSettings,
  onAuthSubmit,
  onGoogleSignIn,
  onSignOut,
  onProfileChanged,
}: {
  profile: Profile | null;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  totalPoints: number;
  quizzesPassedCount: number;
  onSaveSettings: (name: string, email: string, username: string) => Promise<string | null>;
  onAuthSubmit: (mode: 'signin' | 'signup', email: string, password: string, name: string) => Promise<string | null>;
  onGoogleSignIn: () => Promise<string | null>;
  onSignOut: () => void;
  onProfileChanged: () => Promise<void>;
}) {
  return profile ? (
    <SignedInAccount
      profile={profile}
      quizzes={quizzes}
      attempts={attempts}
      totalPoints={totalPoints}
      quizzesPassedCount={quizzesPassedCount}
      onSaveSettings={onSaveSettings}
      onSignOut={onSignOut}
      onProfileChanged={onProfileChanged}
    />
  ) : (
    <SignedOutAccount onAuthSubmit={onAuthSubmit} onGoogleSignIn={onGoogleSignIn} />
  );
}

function SignedInAccount({
  profile,
  quizzes,
  attempts,
  totalPoints,
  quizzesPassedCount,
  onSaveSettings,
  onSignOut,
  onProfileChanged,
}: {
  profile: Profile;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  totalPoints: number;
  quizzesPassedCount: number;
  onSaveSettings: (name: string, email: string, username: string) => Promise<string | null>;
  onSignOut: () => void;
  onProfileChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [username, setUsername] = useState(profile.username || '');
  const [saved, setSaved] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(profile.name || ''); setEmail(profile.email || ''); setUsername(profile.username || ''); }, [profile.name, profile.email, profile.username]);

  async function save() {
    setUsernameError(null);
    const err = await onSaveSettings(name.trim(), email.trim(), username.trim());
    if (err) setUsernameError(err);
    else setSaved(true);
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      await uploadAvatar(profile.id, file);
      await onProfileChanged();
    } finally {
      setPhotoBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleRemovePhoto() {
    setPhotoBusy(true);
    try {
      await removeAvatar(profile.id);
      await onProfileChanged();
    } finally {
      setPhotoBusy(false);
    }
  }

  const attemptedQuizzes = quizzes.filter((q) => attempts[q.id]);
  const quizzesTakenText = `${attemptedQuizzes.length} ${attemptedQuizzes.length === 1 ? 'quiz taken' : 'quizzes taken'}`;

  return (
    <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', padding: '64px 48px 120px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 40, margin: 0, color: colors.primary }}>Account</h1>
        <div onClick={onSignOut} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, textDecoration: 'underline' }}>Sign out</div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 19, overflow: 'hidden', flexShrink: 0, border: '1px solid oklch(0.88 0.01 250)' }}>
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt="Your profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            initials(profile.name)
          )}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 24, lineHeight: 1.15, color: colors.textBody }}>{profile.name}</div>
          <div style={{ fontSize: 13.5, color: colors.textMuted, marginTop: 3 }}>{quizzesTakenText}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
        <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.55 0.02 250)', marginBottom: 6 }}>Current Streak</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 34, lineHeight: 1, color: colors.primary }}>
            {profile.current_streak}<span style={{ fontSize: 15, fontWeight: 600, color: 'oklch(0.55 0.02 250)', marginLeft: 6 }}>{profile.current_streak === 1 ? 'day' : 'days'}</span>
          </div>
        </div>
        <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.55 0.02 250)', marginBottom: 6 }}>Total Points</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 34, lineHeight: 1, color: colors.textBody }}>{totalPoints}</div>
        </div>
        <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.55 0.02 250)', marginBottom: 6 }}>Quizzes Passed</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 34, lineHeight: 1, color: colors.textBody }}>{quizzesPassedCount}</div>
        </div>
      </div>

      <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20, marginBottom: 32 }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: '0 0 16px', color: colors.primary }}>Account settings</h2>
        <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 10, padding: 24 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Profile photo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, overflow: 'hidden', position: 'relative', flexShrink: 0, border: `1px solid ${colors.border}` }}>
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Your profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                initials(profile.name)
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <label style={{ display: 'inline-block', background: 'white', color: 'oklch(0.25 0.01 250)', border: `1px solid ${colors.border}`, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body, width: 'fit-content' }}>
                {photoBusy ? 'Uploading…' : 'Upload photo'}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} disabled={photoBusy} style={{ display: 'none' }} />
              </label>
              {profile.avatar_url && (
                <div onClick={handleRemovePhoto} style={{ cursor: 'pointer', fontSize: 12, color: colors.textMuted, textDecoration: 'underline', width: 'fit-content' }}>Remove photo</div>
              )}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 20 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Name</label>
              <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, fontFamily: fonts.body }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Email</label>
              <input value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="you@example.com" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, fontFamily: fonts.body }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Username</label>
              <input value={username} onChange={(e) => { setUsername(e.target.value); setSaved(false); setUsernameError(null); }} placeholder="yourname" style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 8, fontSize: 15, fontFamily: fonts.body }} />
            </div>
          </div>
          {usernameError && <p style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px' }}>{usernameError}</p>}
          <button onClick={save} style={{ background: colors.primary, color: 'white', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}>Save Changes</button>
          {saved && <span style={{ marginLeft: 14, fontSize: 13, fontWeight: 600, color: colors.success }}>Saved</span>}
        </div>
      </div>

      <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 16 }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>Quizzes Taken</h2>
        </div>
        {attemptedQuizzes.length > 0 ? (
          <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '11px 18px', background: 'oklch(0.975 0.005 250)', borderBottom: '1px solid oklch(0.93 0.01 250)', fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: colors.textMuted }}>
              <div style={{ flex: 1, minWidth: 0 }}>Quiz</div>
              <div style={{ width: 76 }}>Level</div>
              <div style={{ width: 64 }}>Score</div>
              <div style={{ width: 86 }}>Result</div>
              <div style={{ width: 56, textAlign: 'right' }}>Pts</div>
            </div>
            {attemptedQuizzes.map((q) => {
              const attempt = attempts[q.id];
              const statusText = attempt.passed ? 'Passed' : 'Failed';
              const statusColor = attempt.passed ? colors.success : colors.danger;
              const scoreText = `${attempt.score}/${attempt.total}`;
              const pointsText = attempt.passed ? `+${attempt.points}` : '0';
              return (
                <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderBottom: '1px solid oklch(0.95 0.01 250)' }}>
                  <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 14.5, color: colors.textBody, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.title}</div>
                  <div style={{ width: 76, fontSize: 13, color: colors.textMuted }}>{DIFFICULTY_LABEL[q.difficulty]}</div>
                  <div style={{ width: 64, fontSize: 13, color: colors.textMuted }}>{scoreText}</div>
                  <div style={{ width: 86, fontSize: 12.5, fontWeight: 700, color: statusColor }}>{statusText}</div>
                  <div style={{ width: 56, textAlign: 'right', fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: 'oklch(0.3 0.01 250)' }}>{pointsText}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ background: 'white', border: `1px solid ${colors.border}`, borderRadius: 10, padding: '36px 24px', textAlign: 'center' }}>
            <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 18px' }}>No quizzes yet. Play one and it lands here with your score and points.</p>
          </div>
        )}
      </div>
    </main>
  );
}

function SignedOutAccount({
  onAuthSubmit,
  onGoogleSignIn,
}: {
  onAuthSubmit: (mode: 'signin' | 'signup', email: string, password: string, name: string) => Promise<string | null>;
  onGoogleSignIn: () => Promise<string | null>;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const err = await onAuthSubmit(mode, email.trim(), password, name.trim());
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'signup') setCheckEmail(true);
  }

  async function submitGoogle() {
    setError(null);
    setGoogleBusy(true);
    const err = await onGoogleSignIn();
    setGoogleBusy(false);
    if (err) setError(err);
  }

  return (
    <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '80px 48px 120px', width: '100%' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 44, margin: '0 0 12px', color: colors.primary }}>Account</h1>
      <p style={{ fontSize: 16, color: colors.textSecondary, margin: '0 0 32px', maxWidth: 480 }}>
        No account yet. Create one to track your streak, points, and quiz history — or just complete a quiz to get started.
      </p>

      {checkEmail ? (
        <p style={{ fontSize: 14, color: colors.success, maxWidth: 420 }}>Check your email to confirm your account, then come back and sign in.</p>
      ) : (
        <div style={{ maxWidth: 420 }}>
          <button
            onClick={submitGoogle}
            disabled={googleBusy}
            style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, background: 'white', color: 'oklch(0.25 0.01 250)', border: `1px solid ${colors.border}`, padding: '12px 14px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: googleBusy ? 'default' : 'pointer', fontFamily: fonts.body, marginBottom: 14 }}
          >
            <svg width="16" height="16" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 12.4 3 3 12.4 3 24s9.4 21 21 21 21-9.4 21-21c0-1.4-.1-2.5-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l6-6C34 5.1 29.3 3 24 3 16.3 3 9.6 7.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 45c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 36.4 26.7 37 24 37c-5.2 0-9.6-3.3-11.2-7.9l-6.5 5C9.5 40.6 16.2 45 24 45z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C40.9 36 44 30.5 44 24c0-1.4-.1-2.5-.4-3.5z"/></svg>
            {googleBusy ? 'Connecting…' : 'Continue with Google'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '0 0 14px', color: colors.textMuted, fontSize: 12 }}>
            <div style={{ flex: 1, height: 1, background: colors.border }} />
            or
            <div style={{ flex: 1, height: 1, background: colors.border }} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <button onClick={() => setMode('signup')} style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${colors.primary}`, background: mode === 'signup' ? colors.primary : 'white', color: mode === 'signup' ? 'white' : colors.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Create Account</button>
            <button onClick={() => setMode('signin')} style={{ flex: 1, padding: '8px 0', borderRadius: 4, border: `1px solid ${colors.primary}`, background: mode === 'signin' ? colors.primary : 'white', color: mode === 'signin' ? 'white' : colors.primary, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Sign In</button>
          </div>
          {mode === 'signup' && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 12 }} />
          )}
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 12 }} />
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="Password" style={{ width: '100%', padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 12 }} />
          {error && <p style={{ color: colors.danger, fontSize: 13, margin: '0 0 10px' }}>{error}</p>}
          <button onClick={submit} disabled={busy} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>
            {busy ? 'Please wait…' : mode === 'signup' ? 'Create Account' : 'Sign In'}
          </button>
        </div>
      )}
    </main>
  );
}
