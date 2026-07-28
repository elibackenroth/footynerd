export interface ActivityEntry {
  ts: number;
  name: string;
  kind: 'transferchain';
  title: string;
  points: number;
  passed: boolean;
}

const KEY = 'footynerdActivityFeed';

export function loadActivityFeed(): ActivityEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function pushActivity(entry: Omit<ActivityEntry, 'ts'>): ActivityEntry[] {
  try {
    const next = [{ ts: Date.now(), ...entry }, ...loadActivityFeed()].slice(0, 40);
    localStorage.setItem(KEY, JSON.stringify(next));
    return next;
  } catch {
    return loadActivityFeed();
  }
}

export function relativeTimeFrom(ts: number): string {
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}
