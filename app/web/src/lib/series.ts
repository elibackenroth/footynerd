export interface SeriesDef {
  id: string;
  heroQuizId: string;
  title: string;
  desc: string;
  quizIds: string[];
}

export const SERIES: SeriesDef[] = [
  {
    id: 'madrid', heroQuizId: 'zidanerealmadrid', title: 'The Real Madrid Dynasty',
    desc: 'Five chapters of the most decorated club in Europe, in order.',
    quizIds: ['realmadridclub', 'zidanerealmadrid', 'sergioramos', 'modric', 'vinicius'],
  },
  {
    id: 'wcfinals', heroQuizId: 'wcfinal2022', title: 'World Cup Finals, Era by Era',
    desc: 'From Wembley 1966 to Lusail 2022 — then the records that frame them.',
    quizIds: ['wcfinal1966', 'france98final', 'wcfinal2022', 'worldcup', 'spainworldcup'],
  },
  {
    id: 'plera', heroQuizId: 'invinciblesarsenal', title: 'Premier League Dynasties',
    desc: 'The four sides that defined England, plus the one nobody predicted.',
    quizIds: ['manutd', 'invinciblesarsenal', 'chelseaclub', 'leicester1516', 'mancityclub'],
  },
  {
    id: 'kingsofeurope', heroQuizId: 'istanbul2005', title: 'Kings of Europe',
    desc: 'European nights, from one famous comeback to continental dominance.',
    quizIds: ['istanbul2005', 'ajaxclub', 'bayernclub', 'lisbonlions', 'championsleague'],
  },
];

const KEY = 'footynerdSeriesBonuses';

export function loadSeriesBonuses(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function markSeriesBonusClaimed(id: string) {
  try {
    const next = { ...loadSeriesBonuses(), [id]: true };
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}
