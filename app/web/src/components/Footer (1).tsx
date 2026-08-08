import { useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { submitLead } from '../lib/api';
import type { ViewName } from '../lib/viewTypes';

export default function Footer({ go, isMobile, isTablet }: { go: (v: ViewName) => void; isMobile: boolean; isTablet: boolean }) {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  async function submit() {
    const trimmed = email.trim();
    if (!trimmed) return;
    await submitLead(trimmed, 'footer');
    setDone(true);
  }

  return (
    <footer style={{ position: 'relative', zIndex: 2, background: colors.footerBg, color: 'white', padding: isMobile ? '26px 20px 20px' : '56px 48px 24px', marginTop: 'auto' }}>
      <div
        style={
          isMobile
            ? { display: 'flex', flexDirection: 'column', gap: 18, marginBottom: 20 }
            : { maxWidth: 1160, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? 'minmax(200px,1fr) minmax(260px,1fr)' : 'minmax(240px,1fr) minmax(340px,1.1fr) 150px', gap: 64, alignItems: 'flex-start', marginBottom: 40 }
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
          <div onClick={() => go('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', height: 26 }}>
            <img src="/footynerd-logo.png" alt="FootyNerd" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', background: 'white' }} />
            <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 19, letterSpacing: 0.5, lineHeight: 1 }}>FOOTYNERD</div>
          </div>
          {!isMobile && (
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'oklch(0.76 0.02 250)', margin: 0 }}>Daily Football Quizzes. Build a streak, climb the board, settle the argument.</p>
          )}
        </div>

        {!isMobile && (
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, lineHeight: '26px', marginBottom: 12 }}>Never miss a daily</div>
            {done ? (
              <p style={{ fontSize: 14, lineHeight: 1.6, color: 'oklch(0.76 0.02 250)', margin: 0 }}>You're on the list — new quizzes land in your inbox every Friday.</p>
            ) : (
              <div>
                <p style={{ fontSize: 14, lineHeight: 1.6, color: 'oklch(0.76 0.02 250)', margin: '0 0 14px' }}>One email a week: new quizzes and where you finished.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    style={{ flex: 1, minWidth: 0, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.22)', borderRadius: 8, color: 'white', fontSize: 14, padding: '11px 14px', fontFamily: fonts.body, outline: 'none', boxSizing: 'border-box' }}
                  />
                  <button
                    onClick={submit}
                    style={{ flexShrink: 0, background: 'white', color: 'oklch(0.26 0.06 250)', border: 'none', padding: '11px 20px', fontSize: 14, fontWeight: 700, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body, whiteSpace: 'nowrap' }}
                  >
                    Subscribe
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <nav style={isMobile ? { display: 'flex', flexDirection: 'row', gap: 22, flexWrap: 'wrap' } : { display: 'flex', flexDirection: 'column', gap: 16, paddingTop: 2 }}>
          <div onClick={() => go('home')} style={{ fontFamily: fonts.heading, fontSize: isMobile ? 16 : 22, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1, color: 'white', cursor: 'pointer' }}>Home</div>
          <div onClick={() => go('quizzes')} style={{ fontFamily: fonts.heading, fontSize: isMobile ? 16 : 22, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1, color: 'white', cursor: 'pointer' }}>Quizzes</div>
          <div onClick={() => go('leaderboard')} style={{ fontFamily: fonts.heading, fontSize: isMobile ? 16 : 22, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1, color: 'white', cursor: 'pointer' }}>Leaderboard</div>
        </nav>
      </div>

      <div style={{ maxWidth: 1160, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, borderTop: '1px solid rgba(255,255,255,0.12)', paddingTop: 22 }}>
        <div style={{ fontSize: 13, color: 'oklch(0.66 0.01 250)' }}>© 2026 FootyNerd</div>
        {!isMobile && (
          <div style={{ fontSize: 13, color: 'oklch(0.66 0.01 250)' }}>Made for people who remember the squad numbers.</div>
        )}
      </div>
    </footer>
  );
}
