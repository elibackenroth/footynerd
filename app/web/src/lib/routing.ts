import type { ViewName } from './viewTypes';

// Only "top-level" views that don't depend on ephemeral session state (an in-progress
// quiz, a match room, a grid duel) get a real URL — those make sense to refresh or
// bookmark. Views like 'playing'/'result'/'match'/'gridduel' fall back to whatever
// mapped view was last active, which is the expected behavior for a mid-session refresh.
const VIEW_PATHS: Partial<Record<ViewName, string>> = {
  home: '/',
  quizzes: '/quizzes',
  leaderboard: '/leaderboard',
  account: '/account',
  wordle: '/wordle',
  transferchain: '/transferchain',
  footygrid: '/footygrid',
};

// Returns null for ephemeral views (playing/result/match/gridduel/...) that shouldn't
// touch the URL at all — the last-synced route stays in the address bar for those.
export function pathForView(view: ViewName, seriesId: string | null): string | null {
  if (view === 'series') return seriesId ? `/series/${seriesId}` : null;
  return VIEW_PATHS[view] || null;
}

export function routeFromPath(pathname: string): { view: ViewName; seriesId: string | null } {
  const seriesMatch = pathname.match(/^\/series\/([^/]+)$/);
  if (seriesMatch) return { view: 'series', seriesId: seriesMatch[1] };
  const entry = (Object.entries(VIEW_PATHS) as [ViewName, string][]).find(([, p]) => p === pathname);
  return { view: entry ? entry[0] : 'home', seriesId: null };
}
