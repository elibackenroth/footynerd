// Shared helpers for date-driven daily content (Wordle, Transfer Chain, FootyGrid, Mega Quiz).
// Dates are stored as human-readable strings ("August 3, 2026") to match the design's format.

export function todaysDaily<T extends { date: string }>(list: T[]): T | null {
  const now = new Date();
  let pick: T | null = null;
  list.forEach((item) => {
    const d = new Date(item.date);
    if (d <= now && (!pick || d > new Date(pick.date))) pick = item;
  });
  return pick || list[0] || null;
}

export function isFutureDaily(dateStr: string): boolean {
  return new Date(dateStr) > new Date();
}

const TRANSFER_DONE_KEY = 'footynerdTransferDaysDone';

export function loadDoneTransferDays(): Record<string, { score: number; total: number }> {
  try {
    const raw = localStorage.getItem(TRANSFER_DONE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markTransferDayDone(dayId: string, score: number, total: number) {
  try {
    const next = { ...loadDoneTransferDays(), [dayId]: { score, total } };
    localStorage.setItem(TRANSFER_DONE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function relativeDayLabel(dateStr: string): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date(dateStr)) - startOfDay(new Date())) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  return diffDays < 0 ? `${-diffDays} days ago` : `In ${diffDays} days`;
}

export type DailyKind = 'wordle' | 'transfer' | 'footygrid';

export const DAILY_KIND_META: { kind: DailyKind; name: string; image: string; view: 'wordle' | 'transferchain' | 'footygrid' }[] = [
  { kind: 'wordle', name: 'Football Wordle', image: '/mode-images/wordle.webp', view: 'wordle' },
  { kind: 'transfer', name: 'Transfer Chain', image: '/mode-images/transferchain.webp', view: 'transferchain' },
  { kind: 'footygrid', name: 'FootyGrid', image: '/mode-images/footygrid.png', view: 'footygrid' },
];

export type DailyDotState = 'done' | 'progress' | 'todo' | 'none' | 'locked';

export const DAILY_DOT_COLOR: Record<DailyDotState, string> = {
  done: 'oklch(0.62 0.14 150)',
  progress: 'oklch(0.78 0.15 80)',
  todo: 'oklch(0.92 0.01 250)',
  none: 'transparent',
  locked: 'oklch(0.92 0.01 250)',
};

export function buildDailyAxis(dateLists: string[][]): string[] {
  const seen = new Set<string>();
  dateLists.forEach((list) => list.forEach((d) => seen.add(d)));
  return Array.from(seen).sort((a, b) => Date.parse(a) - Date.parse(b));
}
