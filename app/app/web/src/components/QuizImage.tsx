import type { CSSProperties } from 'react';

// Quiz ids that actually have a real photo extracted from the design's uploaded images
// (see public/quiz-images/). Any quiz not in this set just uses its DB `image` field directly —
// guessing a local path and falling back on error is unreliable because the site's SPA
// rewrite rule serves index.html (200 OK) for unknown paths instead of a real 404.
const LOCAL_IMAGE_QUIZ_IDS = new Set([
  'worldcup', 'legends', 'ballondor', 'clubfootball', 'nationalrecords',
  'serieabundesliga', 'womensworldcup', 'goldenboot', 'laligarecords',
  'rivalries', 'playmakers', 'worldcupfinals', 'premierleaguebasics',
  'ronaldo', 'messi', 'mbappe',
  'eurochampionship', 'worldcuprecords', 'kvaratskhelia', 'wirtz', 'ligue1',
  'copaamerica', 'manutd', 'realmadridclub', 'bayernclub', 'athleticbilbao',
  'rbleipzig', 'sportingcp',
  'oldfirm', 'mls', 'eredivisie', 'calciopoli', 'totalfootball', 'ajaxclub',
  'napoliclub', 'bellingham', 'morocco2022', 'liverpoolclub',
  'mascots', 'bosman', 'managermerrygoround', 'photofinish',
  'onemoteams', 'sevillaclub', 'portugalnt',
  'kante', 'iceland2016', 'leicester1516', 'costarica2014', 'tagliafico', 'acmilanclub', 'portugueseleague',
  'dortmundacademy', 'france98final', 'haalandquiz', 'henryarsenal', 'invinciblesarsenal',
  'istanbul2005', 'messicopaamerica', 'simeoneatletico', 'varera', 'zidanerealmadrid',
  'aguero', 'arsenalclub', 'beckham', 'belgianproleague', 'chelseaclub',
  'croatia', 'iniesta', 'jleague', 'juventusclub', 'psgclub',
  'scottishprem', 'tottenham', 'vinicius', 'wales', 'zlatan',
  'barcelonaclub', 'brazilnt', 'brazilserieA', 'championship', 'euro2024',
  'intermilanclub', 'mancityclub', 'modric', 'neymar', 'saudiproleague',
  'sergioramos', 'superlig', 'vandijk', 'wcfinal1966', 'wcfinal2022',
  'anthonytaylor', 'astonvilla', 'championsleague', 'chinesesuperleague', 'dimaria',
  'ezrikonsa', 'footballmoney', 'franklampard', 'iagoaspas', 'josebordalas',
  'megaengland', 'megapremierleague', 'morocco', 'neymarsantos', 'ribery',
  'spainworldcup', 'sportinglisbon', 'megaworldcup',
  'afcon', 'aleague', 'argentinant', 'argentineprimera', 'baggio',
  'belgiumgolden', 'bocajuniors', 'bundesliga', 'cavani', 'cloughforest',
  'clubbrugge', 'crystalpalace', 'danielolmo', 'davidraum', 'debruyne',
  'egyptianleague', 'francent', 'galatasaray', 'germanynt', 'goalkeepers',
  'greece2004', 'italynt', 'japannt', 'kaka', 'lewandowski',
  'ligamx', 'ligaportugaldeep', 'lisbonlions', 'megachampionsleague', 'messi50',
  'musiala', 'nigeriant', 'nordicleagues', 'realsociedad', 'riverplate',
  'ronaldinho', 'salah', 'seriea', 'terstegen', 'thomasmuller', 'yamal',
]);

export function getQuizImageSrc(quizId: string, fallback: string | null): string | null {
  return LOCAL_IMAGE_QUIZ_IDS.has(quizId) ? `/quiz-images/${quizId}.webp` : fallback;
}

export default function QuizImage({ quizId, fallback, alt, style }: { quizId: string; fallback: string | null; alt: string; style?: CSSProperties }) {
  const hasLocalImage = LOCAL_IMAGE_QUIZ_IDS.has(quizId);
  if (!hasLocalImage && !fallback) {
    return <div style={{ width: '100%', height: '100%', background: 'oklch(0.95 0.03 250)', ...style }} />;
  }
  return (
    <img
      src={hasLocalImage ? `/quiz-images/${quizId}.webp` : fallback ?? undefined}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      onError={(e) => {
        const img = e.currentTarget;
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  );
}
