import { useState } from 'react';
import { colors, fonts, initials, CATEGORIES, DIFFICULTY_LABEL } from '../lib/tokens';
import { useAuth } from '../contexts/AuthContext';
import type { ViewName } from '../lib/viewTypes';
import type { Quiz } from '../lib/types';

interface SearchResult {
  title: string;
  subtitle: string;
  go: () => void;
}

export default function Nav({
  view, go, isMobile, mobileMenuOpen, onToggleMobileMenu, quizzes, startQuiz, startMatchSetup,
}: {
  view: ViewName;
  go: (v: ViewName) => void;
  isMobile: boolean;
  mobileMenuOpen: boolean;
  onToggleMobileMenu: () => void;
  quizzes: Quiz[];
  startQuiz: (id: string) => void;
  startMatchSetup: () => void;
}) {
  const { user, profile } = useAuth();
  const name = profile?.name || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

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

  function closeSearch() {
    setSearchQuery('');
    setSearchOpen(false);
  }

  function goToResult(fn: () => void) {
    closeSearch();
    if (isMobile && mobileMenuOpen) onToggleMobileMenu();
    fn();
  }

  const q = searchQuery.trim().toLowerCase();
  let searchResults: SearchResult[] = [];
  if (q.length > 0) {
    const quizMatches: SearchResult[] = quizzes
      .filter((qz) => qz.title.toLowerCase().includes(q) || qz.description.toLowerCase().includes(q) || qz.category.toLowerCase().includes(q))
      .slice(0, 5)
      .map((qz) => ({
        title: qz.title,
        subtitle: `${DIFFICULTY_LABEL[qz.difficulty]} · ${CATEGORIES.find((c) => c.id === qz.category)?.label || ''}`,
        go: () => goToResult(() => startQuiz(qz.id)),
      }));
    const pageCandidates: { title: string; subtitle: string; go: () => void }[] = [
      { title: 'Quizzes', subtitle: 'Browse all quizzes', go: () => go2('quizzes') },
      { title: 'Leaderboard', subtitle: 'See the top players', go: () => go2('leaderboard') },
      { title: 'Match Room', subtitle: 'Challenge a friend head-to-head', go: startMatchSetup },
      { title: 'Transfer Chain', subtitle: 'A new 5-round chain every day', go: () => go2('transferchain') },
      { title: 'Wordle', subtitle: 'Guess the football word', go: () => go2('wordle') },
      { title: 'FootyGrid', subtitle: 'Fill the 3x3 grid', go: () => go2('footygrid') },
      { title: 'Account', subtitle: 'Your profile & settings', go: () => go2('account') },
    ];
    const pageMatches: SearchResult[] = pageCandidates
      .filter((p) => p.title.toLowerCase().includes(q) || p.subtitle.toLowerCase().includes(q))
      .map((p) => ({ title: p.title, subtitle: p.subtitle, go: () => goToResult(p.go) }));
    searchResults = [...quizMatches, ...pageMatches].slice(0, 8);
  }
  const showSearchResults = searchOpen && q.length > 0;
  const showSearchEmpty = showSearchResults && searchResults.length === 0;

  function SearchBox({ mobile }: { mobile: boolean }) {
    return (
      <div style={{ position: 'relative', ...(mobile ? { marginBottom: 4 } : {}) }}>
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: 999,
            padding: mobile ? '9px 14px' : '7px 14px', boxSizing: 'border-box', width: mobile ? '100%' : 180,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2.2} style={{ flexShrink: 0, opacity: 0.85 }}>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
          </svg>
          <input
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setSearchOpen(true); }}
            onFocus={() => setSearchOpen(true)}
            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
            placeholder="Search FootyNerd"
            style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: mobile ? 14 : 13, fontFamily: fonts.body }}
          />
          {!!searchQuery && (
            <div onClick={closeSearch} style={{ cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: mobile ? 16 : 14, lineHeight: 1, flexShrink: 0 }}>×</div>
          )}
        </div>
        {showSearchResults && (
          <div
            style={{
              position: mobile ? 'static' : 'absolute', top: mobile ? undefined : 'calc(100% + 8px)', right: mobile ? undefined : 0,
              marginTop: mobile ? 8 : 0, width: mobile ? '100%' : 300,
              background: 'white', borderRadius: 8, boxShadow: '0 12px 32px rgba(0,0,0,0.22)', overflow: 'hidden', zIndex: 50,
            }}
          >
            {searchResults.map((r, idx) => (
              <div
                key={idx}
                onClick={r.go}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid oklch(0.94 0.01 250)' }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'oklch(0.2 0.01 250)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                  <div style={{ fontSize: 12, color: 'oklch(0.55 0.01 250)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.subtitle}</div>
                </div>
              </div>
            ))}
            {showSearchEmpty && (
              <div style={{ padding: '20px 16px', textAlign: 'center', fontSize: 13, color: 'oklch(0.55 0.01 250)' }}>No matches found.</div>
            )}
          </div>
        )}
      </div>
    );
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
        {!isMobile && <SearchBox mobile={false} />}
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
          <SearchBox mobile />
          <div onClick={() => go2('home')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Home</div>
          <div onClick={() => go2('quizzes')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Quizzes</div>
          <div onClick={() => go2('leaderboard')} style={{ fontFamily: fonts.heading, fontSize: 17, fontWeight: 600, color: 'white', padding: '16px 0', borderBottom: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer' }}>Leaderboard</div>
        </div>
      )}
    </nav>
  );
}
