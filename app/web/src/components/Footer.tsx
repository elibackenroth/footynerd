import { useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { submitLead } from '../lib/api';
import type { ViewName } from '../lib/viewTypes';

export default function Footer({ go }: { go: (v: ViewName) => void }) {
  const [email, setEmail] = useState('');
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(false);

  async function submit() {
    const trimmed = email.trim();
    if (!trimmed || !checked) return;
    await submitLead(trimmed, 'footer');
    setDone(true);
  }

  return (
    <footer style={{ background: colors.footerBg, color: 'white', padding: '80px 48px 32px', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', justifyContent: 'space-between', gap: 48, flexWrap: 'wrap', marginBottom: 64 }}>
        <div style={{ maxWidth: 460, flex: 1, minWidth: 280 }}>
          <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, margin: '0 0 28px' }}>Subscribe For Updates</h2>

          {done ? (
            <p style={{ fontSize: 15, color: 'oklch(0.85 0.02 250)', margin: 0 }}>You're on the list — thanks for subscribing.</p>
          ) : (
            <div>
              <label style={{ display: 'block', fontWeight: 700, fontSize: 14, marginBottom: 10 }}>Enter your email here *</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: '1px solid rgba(255,255,255,0.4)', color: 'white', fontSize: 15, padding: '0 0 12px', marginBottom: 28, fontFamily: fonts.body }}
              />
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
                <div onClick={() => setChecked(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                  <div style={{ width: 18, height: 18, border: '1px solid rgba(255,255,255,0.6)', borderRadius: 2, background: checked ? 'oklch(0.5 0.19 258)' : 'transparent', flexShrink: 0 }} />
                  <div style={{ fontSize: 14, color: 'oklch(0.9 0.01 250)' }}>Yes, I want to receive updates *</div>
                </div>
                <button onClick={submit} style={{ background: 'oklch(0.5 0.19 258)', color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 700, borderRadius: 3, cursor: 'pointer', fontFamily: fonts.body }}>
                  Subscribe
                </button>
              </div>
            </div>
          )}
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 22, paddingTop: 6 }}>
          <div onClick={() => go('home')} style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, cursor: 'pointer' }}>Home</div>
          <div onClick={() => go('quizzes')} style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, cursor: 'pointer' }}>Quizzes</div>
          <div onClick={() => go('leaderboard')} style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, cursor: 'pointer' }}>Leaderboard</div>
        </nav>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 28 }}>
        <div style={{ display: 'flex', gap: 14 }}>
          <a href="#" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>IG</a>
          <a href="#" style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white' }}>X</a>
        </div>
        <div style={{ fontSize: 14, color: 'oklch(0.75 0.01 250)' }}>© 2026 by FootyNerd</div>
      </div>
    </footer>
  );
}
