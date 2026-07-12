import { colors, fonts, initials } from '../lib/tokens';
import { useAuth } from '../contexts/AuthContext';
import type { ViewName } from '../lib/viewTypes';

export default function Nav({ view, go, isMobile, mobileMenuOpen, onToggleMobileMenu }: { view: ViewName; go: (v: ViewName) => void; isMobile: boolean; mobileMenuOpen: boolean; onToggleMobileMenu: () => void }) {
  const { user, profile } = useAuth();
  const name = profile?.name || '';

  const navBase: React.CSSProperties = { fontFamily: fonts.heading, fontSize: 15, fontWeight: 600, letterSpacing: 0.3, lineHeight: 1, cursor: 'pointer' };
  const activeNav: React.CSSProperties = { ...navBase, color: 'white' };
  const inactiveNav: React.CSSProperties = { ...navBase, color: 'rgba(255,255,255,0.6)' };

  const navStyle: React.CSSProperties = isMobile
    ? { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: colors.primary, position: 'relative' }
    : { display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', padding: '24px 48px', background: colors.primary };

  function go2(v: ViewName) {
    go(v);
    if (isMobile) onToggleMobileMenu();
  }

  return (
    <nav style={navStyle}>
      <div
        onClick={() => go2('home')}
        style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, letterSpacing: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'white', lineHeight: 1 }}
      >
        <img src="/footynerd-logo.png" alt="FootyNerd home" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', background: 'white' }} />
        FOOTYNERD
      </div>

      {!isMobile && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
          <div onClick={() => go2('home')} style={view === 'home' ? activeNav : inactiveNav}>Home</div>
          <div onClick={() => go2('quizzes')} style={view === 'quizzes' ? activeNav : inactiveNav}>Quizzes</div>
          <div onClick={() => go2('leaderboard')} style={view === 'leaderboard' ? activeNav : inactiveNav}>Leaderboard</div>
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, justifySelf: isMobile ? undefined : 'end' }}>
        {isMobile && (
          <div onClick={onToggleMobileMenu} style={{ width: 40, height: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, cursor: 'pointer', flexShrink: 0 }}>
            <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
            <div style={{ width: 20, height: 2, background: 'white', borderRadius: 2 }} />
          </div>
        )}
        <div
          onClick={() => go2('account')}
          title="Account"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: user ? 'white' : 'transparent',
            color: user ? colors.primary : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.5)', overflow: 'hidden', position: 'relative', flexShrink: 0,
          }}
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Your profile photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : user ? (
            initials(name)
          ) : (
            <>
              <div style={{ width: 13, height: 13, borderRadius: '50%', background: 'currentColor', position: 'absolute', top: 6, left: '50%', transform: 'translateX(-50%)' }} />
              <div style={{ width: 24, height: 16, borderRadius: '12px 12px 0 0', background: 'currentColor', position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)' }} />
            </>
          )}
        </div>
      </div>

      {isMobile && mobileMenuOpen && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'oklch(0.38 0.16 250)', display: 'flex', flexDirection: 'column', padding: '4px 20px 12px', boxShadow: '0 8px 16px rgba(0,0,0,0.15)', zIndex: 50 }}>
          <div onClick={() => go2('home')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Home</div>
          <div onClick={() => go2('quizzes')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Quizzes</div>
          <div onClick={() => go2('leaderboard')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Leaderboard</div>
        </div>
      )}
    </nav>
  );
}
