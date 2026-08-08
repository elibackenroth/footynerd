import { colors, fonts, DIFFICULTY_LABEL } from '../lib/tokens';
import type { SeriesDef } from '../lib/series';
import type { Quiz, QuizAttempt } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import { getQuizImageSrc } from '../components/QuizImage';

export default function Series({
  series,
  quizzes,
  attempts,
  isMobile,
  go,
  startQuiz,
}: {
  series: SeriesDef;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  isMobile: boolean;
  go: (v: ViewName) => void;
  startQuiz: (id: string) => void;
}) {
  const seriesQuizzes = series.quizIds.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];
  const doneCount = seriesQuizzes.filter((q) => attempts[q.id]?.passed).length;
  const complete = doneCount === seriesQuizzes.length && seriesQuizzes.length > 0;
  const basePoints = seriesQuizzes.reduce((sum, q) => sum + q.points, 0);
  const progressPct = seriesQuizzes.length ? Math.round((doneCount / seriesQuizzes.length) * 100) + '%' : '0%';

  const heroQuiz = quizzes.find((q) => q.id === series.heroQuizId) || seriesQuizzes[0];
  const heroImage = heroQuiz ? getQuizImageSrc(heroQuiz.id, heroQuiz.image) : null;

  let nextFound = false;

  return (
    <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', padding: isMobile ? '32px 20px 90px' : '48px 24px 110px', width: '100%' }}>
      <div onClick={() => go('home')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13.5, fontWeight: 600, color: colors.primary, marginBottom: 20 }}>
        <span style={{ fontSize: 15, lineHeight: 1 }}>←</span>
        <span>Back to home</span>
      </div>

      <div
        style={{
          position: 'relative', borderRadius: 16, overflow: 'hidden', padding: isMobile ? '28px 22px' : '48px 40px',
          backgroundImage: `linear-gradient(180deg, rgba(12,14,30,0.55), rgba(12,14,30,0.86))${heroImage ? `, url(${heroImage})` : ''}`,
          backgroundSize: 'cover', backgroundPosition: 'center', backgroundColor: colors.primary, color: 'white', marginBottom: 32,
        }}
      >
        <div style={{ fontSize: 11.5, fontWeight: 700, letterSpacing: 1.4, textTransform: 'uppercase', opacity: 0.85, marginBottom: 10 }}>
          Series · {doneCount} of {seriesQuizzes.length} complete
        </div>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 28 : 42, lineHeight: 1.05, margin: '0 0 12px', maxWidth: 640 }}>{series.title}</h1>
        <p style={{ fontSize: 15.5, lineHeight: 1.55, margin: '0 0 22px', maxWidth: 560, opacity: 0.9 }}>{series.desc}</p>
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.28)', overflow: 'hidden', maxWidth: 420, marginBottom: 12 }}>
          <div style={{ height: '100%', borderRadius: 3, background: 'white', width: progressPct, transition: 'width 0.3s' }} />
        </div>
        <div style={{ display: 'inline-block', fontSize: 12.5, fontWeight: 700, letterSpacing: 0.2, padding: '7px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.16)', border: '1px solid rgba(255,255,255,0.3)' }}>
          {complete ? `Bonus claimed · +${basePoints} pts` : `Finish all ${seriesQuizzes.length} to double the series: +${basePoints} bonus pts`}
        </div>
      </div>

      <div style={isMobile ? { display: 'grid', gridTemplateColumns: '1fr', gap: 16 } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px,1fr))', gap: 20 }}>
        {seriesQuizzes.map((q, i) => {
          const at = attempts[q.id];
          const done = !!at?.passed;
          const isNext = !done && !nextFound;
          if (isNext) nextFound = true;
          const stepBg = done ? colors.success : isNext ? colors.primary : 'oklch(0.93 0.01 250)';
          const stepColor = done || isNext ? 'white' : 'oklch(0.55 0.01 250)';
          const imgSrc = getQuizImageSrc(q.id, q.image);
          return (
            <div
              key={q.id}
              onClick={() => startQuiz(q.id)}
              style={{ border: `1px solid ${colors.border}`, borderRadius: 10, overflow: 'hidden', background: 'white', cursor: 'pointer', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 3px rgba(20,20,40,0.06)' }}
            >
              <div style={{ width: '100%', height: 150, position: 'relative' }}>
                {imgSrc ? (
                  <img src={imgSrc} alt={q.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: 'oklch(0.95 0.03 250)' }} />
                )}
                <div style={{ position: 'absolute', top: 10, left: 10, width: 28, height: 28, borderRadius: '50%', background: stepBg, color: stepColor, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(20,20,40,0.25)' }}>
                  {i + 1}
                </div>
              </div>
              <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 18, margin: 0, lineHeight: 1.2, color: colors.textBody }}>{q.title}</h3>
                <div style={{ fontSize: 11.5, color: colors.textMuted }}>{DIFFICULTY_LABEL[q.difficulty]} · {q.points} pts</div>
                <div style={{ flex: 1 }} />
                {at && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: at.passed ? colors.success : colors.danger }}>
                    {at.passed ? `Passed ${at.score}/${at.total}` : `Failed ${at.score}/${at.total}`}
                  </div>
                )}
                <div style={{ fontSize: 12.5, fontWeight: 700, color: colors.primary }}>{at ? (at.passed ? 'Replay' : 'Try again') : 'Play'} →</div>
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
