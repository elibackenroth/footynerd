// Design tokens ported verbatim from Soccer Quiz.dc.html (see design_handoff_backend/README.md "Design Tokens").
export const colors = {
  primary: 'oklch(0.42 0.18 250)',
  primaryLight: 'oklch(0.55 0.15 250)',
  wordleAccent: 'oklch(0.55 0.15 70)',
  matchOpponent: 'oklch(0.6 0.17 60)',
  success: 'oklch(0.5 0.14 145)',
  danger: 'oklch(0.55 0.17 25)',
  textBody: 'oklch(0.22 0.01 250)',
  textSecondary: 'oklch(0.45 0.01 250)',
  textMuted: 'oklch(0.55 0.01 250)',
  textFaint: 'oklch(0.6 0.01 250)',
  border: 'oklch(0.92 0.01 250)',
  borderLight: 'oklch(0.93 0.01 250)',
  panelBg: 'oklch(0.97 0.035 250)',
  panelBorder: 'oklch(0.88 0.05 250)',
  badgeBg: 'oklch(0.96 0.04 250)',
  footerBg: 'oklch(0.24 0.045 250)',
  bodyBg: 'oklch(0.99 0.003 250)',
};

export const fonts = {
  heading: "'Oswald', sans-serif",
  body: "'Inter', sans-serif",
};

export const AVATAR_COLORS = [
  'oklch(0.42 0.18 250)',
  'oklch(0.55 0.15 250)',
  'oklch(0.6 0.17 60)',
  'oklch(0.6 0.16 25)',
  'oklch(0.55 0.13 300)',
];

export const CATEGORIES = [
  { id: 'all', label: 'All Quizzes' },
  { id: 'players', label: 'Players' },
  { id: 'leagues', label: 'Leagues' },
  { id: 'national', label: 'National' },
  { id: 'clubs', label: 'Clubs' },
];

export const DIFFICULTIES = [
  { id: 'all', label: 'All Levels' },
  { id: 'easy', label: 'Easy · 25 pts' },
  { id: 'medium', label: 'Medium · 50 pts' },
  { id: 'hard', label: 'Hard · 75 pts' },
];

export const DIFFICULTY_LABEL: Record<string, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };

export function passThresholdFor(total: number) {
  return total >= 20 ? 13 : total >= 10 ? 7 : 3;
}

export function quizHash(id: string) {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return h;
}

export function initials(name: string | null | undefined) {
  const n = (name || '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/);
  return (parts[0]?.[0] || '?').toUpperCase() + (parts[1]?.[0] || '').toUpperCase();
}
