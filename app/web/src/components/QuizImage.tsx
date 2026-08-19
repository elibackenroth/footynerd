import type { CSSProperties } from 'react';

// Quiz ids that actually have a real photo checked into public/quiz-images/, mapped to
// that file's extension (whatever format it was uploaded in — no conversion required).
// Any quiz not in this map just uses its DB `image` field directly — guessing a local path
// and falling back on error is unreliable because the site's SPA rewrite rule serves
// index.html (200 OK) for unknown paths instead of a real 404.
const LOCAL_IMAGE_QUIZ_IDS: Record<string, string> = Object.fromEntries(
  [
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
    'megaseriea', 'megarealmadrid', 'megabarcelona', 'arsenalpl', 'astonvillaclub',
    'bournemouthclub', 'brentfordclub', 'brightonclub', 'burnleyclub', 'chelseapl',
    'crystalpalaceclub', 'evertonclub', 'fulhamclub', 'leedsclub', 'liverpoolpl',
    'mancitypl', 'manutdclub', 'newcastleclub', 'forestclub', 'sunderlandclub',
    'spursclub', 'westhamclub', 'wolvesclub', 'valenciaclub', 'villarrealclub',
    'betisclub', 'celtaclub', 'espanyolclub', 'osasunaclub', 'gironaclub',
    'alavesclub', 'elcheclub', 'getafeclub', 'levanteclub', 'mallorcaclub',
    'rayoclub', 'oviedoclub', 'guardiola', 'mourinho', 'ferguson',
    'ancelotti', 'griezmann', 'saka', 'colepalmer', 'netherlandsnt',
    'uruguaynt', 'colombiant', 'romaclub', 'lazioclub', 'atalantaclub',
    'benficaclub', 'portoclub', 'leverkusen2024',
    'neymarpsg', 'argentinaworldcup', 'xavihernandez', 'sadiomane', 'megamessi',
    'buffon', 'marseille', 'southkorea', 'mls', 'handofgod',
    'drogba', 'flamengo', 'libertadores', 'denmark', 'pirlo',
    'redstar', 'trebles', 'ghana', 'etoo', 'facup',
    'fenerbahce', 'rodri', 'sweden', 'shootouts', 'feyenoord',
    'robertocarlos', 'palmeiras', 'egyptnt', 'scottishcup', 'gullit',
    'frankfurt', 'bale', 'shakhtar', 'clubworldcup', 'carabaocup',
    'maldini', 'asmonaco', 'switzerlandnt', 'ronaldonazario', 'lyon',
    'cameroon', 'copadelrey', 'shearer', 'olympiacos', 'poland',
    'europaleague', 'casillas', 'corinthians', 'chilent', 'laligaquiz',
    'xabialonso', 'schalke', 'socceroos', 'megacristiano',
    'anderlecht', 'argentineleague', 'austrianbundesliga', 'besiktas', 'brasileirao',
    'bulgariant', 'cafuquiz', 'cannavaroquiz', 'celticfc', 'danishsuperliga',
    'dfbpokal', 'dynamokyiv', 'figoquiz', 'fiorentina', 'ivorycoastnt',
    'megalibertadores', 'northernirelandnt', 'norwaynt', 'paraguaynt', 'psveindhoven',
    'rivaldoquiz', 'senegalnt', 'swisssuperleague', 'torinoclub', 'tottiquiz',
    'vannistelrooy', 'coppaitalia', 'deportivolacoruna', 'nedved', 'perunt', 'puyol',
  ].map((id) => [id, 'webp']).concat([['megabundesliga', 'jpg']])
);

// Quizzes that reuse another quiz's photo instead of shipping their own file
// (e.g. a mega quiz on a topic that already has a regular quiz with a good photo).
const IMAGE_ALIASES: Record<string, string> = {
  megalaliga: 'laligaquiz',
  megamanutd: 'manutd',
  megaeuros: 'eurochampionship',
  megaliverpool: 'liverpoolclub',
};

function localImageSrc(quizId: string): string | null {
  const sourceId = IMAGE_ALIASES[quizId] || quizId;
  const ext = LOCAL_IMAGE_QUIZ_IDS[sourceId];
  return ext ? `/quiz-images/${sourceId}.${ext}` : null;
}

export function getQuizImageSrc(quizId: string, fallback: string | null): string | null {
  return localImageSrc(quizId) || fallback;
}

export default function QuizImage({ quizId, fallback, alt, style }: { quizId: string; fallback: string | null; alt: string; style?: CSSProperties }) {
  const localSrc = localImageSrc(quizId);
  const hasLocalImage = !!localSrc;
  if (!hasLocalImage && !fallback) {
    return <div style={{ width: '100%', height: '100%', background: 'oklch(0.95 0.03 250)', ...style }} />;
  }
  return (
    <img
      src={hasLocalImage ? localSrc! : fallback ?? undefined}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      onError={(e) => {
        const img = e.currentTarget;
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  );
}
