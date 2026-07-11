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
  onSignOut,
  onProfileChanged,
}: {
  profile: Profile | null;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  totalPoints: number;
  quizzesPassedCount: number;
  onSaveSettings: (name: string, email: string) => Promise<void>;
  onAuthSubmit: (mode: 'signin' | 'signup', email: string, password: string, name: string) => Promise<string | null>;
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
    <SignedOutAccount onAuthSubmit={onAuthSubmit} />
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
  onSaveSettings: (name: string, email: string) => Promise<void>;
  onSignOut: () => void;
  onProfileChanged: () => Promise<void>;
}) {
  const [name, setName] = useState(profile.name || '');
  const [email, setEmail] = useState(profile.email || '');
  const [saved, setSaved] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setName(profile.name || ''); setEmail(profile.email || ''); }, [profile.name, profile.email]);

  async function save() {
    await onSaveSettings(name.trim(), email.trim());
    setSaved(true);
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

  return (
    <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '80px 48px 120px', width: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 44, margin: '0 0 12px', color: colors.primary }}>Account</h1>
        <div onClick={onSignOut} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, textDecoration: 'underline' }}>Sign out</div>
      </div>
      <p style={{ fontSize: 16, color: colors.textSecondary, margin: '0 0 48px' }}>{profile.name}'s quiz history and streak.</p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 56 }}>
        <StatCard label="Current Streak" value={`${profile.current_streak} day(s)`} accent />
        <StatCard label="Total Points" value={String(totalPoints)} />
        <StatCard label="Quizzes Passed" value={String(quizzesPassedCount)} />
      </div>

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 20, margin: '0 0 20px' }}>Account settings</h2>
      <div style={{ border: `1px solid ${colors.border}`, borderRadius: 4, padding: 28, maxWidth: 420, marginBottom: 56 }}>
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
            <label style={{ display: 'inline-block', background: 'white', color: 'oklch(0.25 0.01 250)', border: `1px solid ${colors.border}`, padding: '8px 16px', fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body, width: 'fit-content' }}>
              {photoBusy ? 'Uploading…' : 'Upload photo'}
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} disabled={photoBusy} style={{ display: 'none' }} />
            </label>
            {profile.avatar_url && (
              <div onClick={handleRemovePhoto} style={{ cursor: 'pointer', fontSize: 12, color: colors.textMuted, textDecoration: 'underline', width: 'fit-content' }}>Remove photo</div>
            )}
          </div>
        </div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Name</label>
        <input value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} placeholder="Your name" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 18 }} />
        <label style={{ display: 'block', fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 6 }}>Email</label>
        <input value={email} onChange={(e) => { setEmail(e.target.value); setSaved(false); }} placeholder="you@example.com" style={{ width: '100%', padding: '12px 14px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 18 }} />
        <button onClick={save} style={{ background: colors.primary, color: 'white', border: 'none', padding: '12px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Save Changes</button>
        {saved && <span style={{ marginLeft: 14, fontSize: 13, fontWeight: 600, color: colors.success }}>Saved</span>}
      </div>

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 20, margin: '0 0 20px' }}>All quizzes</h2>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {quizzes.filter((q) => attempts[q.id]).map((q) => {
          const attempt = attempts[q.id];
          const statusText = attempt ? (attempt.passed ? 'Passed' : 'Failed') : 'Not played';
          const statusColor = attempt ? (attempt.passed ? colors.success : colors.danger) : colors.textFaint;
          const scoreText = attempt ? `${attempt.score}/${attempt.total}` : '—';
          const pointsText = attempt ? (attempt.passed ? `+${attempt.points}` : '0') : '—';
          return (
            <div key={q.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '16px 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div style={{ flex: 1, minWidth: 0, fontWeight: 600, fontSize: 15 }}>{q.title}</div>
              <div style={{ width: 70, fontSize: 13, color: colors.textMuted }}>{DIFFICULTY_LABEL[q.difficulty]}</div>
              <div style={{ width: 70, fontSize: 13, color: colors.textMuted }}>{scoreText}</div>
              <div style={{ width: 90, fontSize: 13, fontWeight: 700, color: statusColor }}>{statusText}</div>
              <div style={{ width: 50, textAlign: 'right', fontFamily: fonts.heading, fontWeight: 700, fontSize: 15 }}>{pointsText}</div>
            </div>
          );
        })}
      </div>
    </main>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div style={{ border: `1px solid ${colors.border}`, borderRadius: 4, padding: 24 }}>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 8 }}>{label}</div>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, color: accent ? colors.primary : undefined }}>{value}</div>
    </div>
  );
}

function SignedOutAccount({
  onAuthSubmit,
}: {
  onAuthSubmit: (mode: 'signin' | 'signup', email: string, password: string, name: string) => Promise<string | null>;
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checkEmail, setCheckEmail] = useState(false);

  async function submit() {
    setError(null);
    setBusy(true);
    const err = await onAuthSubmit(mode, email.trim(), password, name.trim());
    setBusy(false);
    if (err) setError(err);
    else if (mode === 'signup') setCheckEmail(true);
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
