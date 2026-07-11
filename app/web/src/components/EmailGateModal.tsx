import { useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { submitLead } from '../lib/api';

export default function EmailGateModal({ onContinue, onClose }: { onContinue: (email: string) => void; onClose: () => void }) {
  const [email, setEmail] = useState('');

  async function submit() {
    const trimmed = email.trim();
    if (!trimmed) return;
    try { await submitLead(trimmed, 'email_gate'); } catch { /* non-blocking */ }
    onContinue(trimmed);
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
      <div style={{ background: 'white', borderRadius: 6, padding: 40, maxWidth: 420, width: '90%', textAlign: 'center' }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, margin: '0 0 12px', color: colors.primary }}>Keep the streak going</h2>
        <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 24px', lineHeight: 1.5 }}>You've played 5 quizzes. Enter your email to keep playing.</p>
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          style={{ width: '100%', padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body, marginBottom: 16 }}
        />
        <button onClick={submit} style={{ width: '100%', background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body, marginBottom: 12 }}>
          Continue Playing
        </button>
        <div onClick={onClose} style={{ cursor: 'pointer', fontSize: 13, color: colors.textMuted }}>Not now</div>
      </div>
    </div>
  );
}
