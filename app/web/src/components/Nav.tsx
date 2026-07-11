import { colors, fonts, initials } from '../lib/tokens';
import { useAuth } from '../contexts/AuthContext';
import type { ViewName } from '../lib/viewTypes';

const navBase: React.CSSProperties = { padding: '9px 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer' };
const activeNav: React.CSSProperties = { ...navBase, background: 'white', color: colors.primary };
const inactiveNav: React.CSSProperties = { ...navBase, background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.45)' };

export default function Nav({ view, go }: { view: ViewName; go: (v: ViewName) => void }) {
  const { user, profile } = useAuth();
  const name = profile?.name || '';

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 48px', background: colors.primary }}>
      <div
        onClick={() => go('home')}
        style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, letterSpacing: 0.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, color: 'white' }}
      >
        <img src="/footynerd-logo.png" alt="FootyNerd home" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover', background: 'white' }} />
        FOOTYNERD
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div onClick={() => go('home')} style={view === 'home' ? activeNav : inactiveNav}>Home</div>
        <div onClick={() => go('quizzes')} style={view === 'quizzes' ? activeNav : inactiveNav}>Quizzes</div>
        <div onClick={() => go('leaderboard')} style={view === 'leaderboard' ? activeNav : inactiveNav}>Leaderboard</div>
        <div
          onClick={() => go('account')}
          title="Account"
          style={{
            width: 34, height: 34, borderRadius: '50%',
            background: user ? 'white' : 'transparent',
            color: user ? colors.primary : 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 700, fontSize: 13, cursor: 'pointer', marginLeft: 4,
            border: '1px solid rgba(255,255,255,0.5)', overflow: 'hidden', position: 'relative',
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
    </nav>
  );
}
