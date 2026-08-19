import { useState } from 'react';
import { colors, fonts, USERNAME_RE, USERNAME_HINT } from '../lib/tokens';
import { isUsernameAvailable, updateProfile } from '../lib/api';

export default function UsernameGateModal({ userId, onDone }: { userId: string; onDone: () => Promise<void> }) {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    const trimmed = username.trim();
    setError(null);
    if (!USERNAME_RE.test(trimmed)) {
      setError(USERNAME_HINT);
      return;
    }
    setBusy(true);
    try {
      const available = await isUsernameAvailable(trimmed);
      if (!available) {
        setError('That username is taken — try another.');
        return;
      }
      await updateProfile(userId, { username: trimmed });
      await onDone();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg.includes('duplicate') || msg.includes('unique') ? 'That username is taken — try another.' : 'Something went wrong — try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', borderRadius: 6, padding: 40, maxWidth: 420, width: '90%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, margin: '0 0 12px', color: colors.primary }}>Pick a username</h2>
        <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>Every account needs a unique username — this is how you'll show up on the leaderboard.</p>
        <input
          value={username}
          onChange={(e) => { setUsername(e.target.value); setError(null); }}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
          placeholder="yourname"
          style={{ width: '100%', boxSizing: 'border-box', padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 12 }}
        />
        {error && <p style={{ color: colors.danger, fontSize: 13, margin: '0 0 12px' }}>{error}</p>}
        <button
          onClick={submit}
          disabled={busy || !username.trim()}
          style={{ width: '100%', background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: busy ? 'default' : 'pointer', fontFamily: fonts.body, opacity: busy ? 0.7 : 1 }}
        >
          {busy ? 'Checking…' : 'Save Username'}
        </button>
      </div>
    </div>
  );
}
