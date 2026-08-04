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

export function relativeDayLabel(dateStr: string): string {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date(dateStr)) - startOfDay(new Date())) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays === 1) return 'Tomorrow';
  return diffDays < 0 ? `${-diffDays} days ago` : `In ${diffDays} days`;
}
