import { relativeTimeFrom } from '../lib/activityFeed';
import { colors, fonts, AVATAR_COLORS, initials, DIFFICULTY_LABEL } from '../lib/tokens';
import { getQuizImageSrc } from '../components/QuizImage';
import type { PointsLeaderboardRow, Quiz, QuizAttempt } from '../lib/types';

export default function Leaderboard({
  pointsRows,
  myName,
  isMobile,
  quizzes,
  attempts,
  startQuiz,
}: {
  pointsRows: PointsLeaderboardRow[];
  myName: string | null;
  isMobile: boolean;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  startQuiz: (id: string) => void;
}) {
  const quizById: Record<string, Quiz> = {};
  quizzes.forEach((q) => { quizById[q.id] = q; });
  const activityRows = Object.values(attempts)
    .filter((a) => quizById[a.quiz_id])
    .slice()
    .sort((a, b) => Date.parse(b.completed_at) - Date.parse(a.completed_at))
    .slice(0, 8)
    .map((a) => ({
      name: myName || 'You',
      headline: `${myName || 'You'} ${a.passed ? 'passed' : 'attempted'} "${quizById[a.quiz_id].title}"`,
      ts: Date.parse(a.completed_at),
      points: a.passed ? a.points : 0,
    }));

  const sorted = [...pointsRows].sort((a, b) => b.points - a.points);
  const myRank = myName ? sorted.findIndex((r) => r.name === myName) + 1 : 0;
  const myRow = myRank > 0 ? sorted[myRank - 1] : null;
  const nextRow = myRank > 1 ? sorted[myRank - 2] : null;
  const youRankText = myRank > 0 ? `#${myRank}` : '—';
  const youPointsText = myRow ? String(myRow.points) : '0';
  const youGapText = myRow
    ? (nextRow ? `${nextRow.points - myRow.points} pts to #${myRank - 1}` : 'You’re #1')
    : (sorted.length ? 'Play a quiz to get ranked' : 'Be the first to score');

  const nextQuizzes = quizzes
    .filter((q) => !q.is_mega && !attempts[q.id])
    .slice(0, 3);

  return (
    <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', padding: isMobile ? '32px 20px 80px' : '48px 48px 100px', width: '100%' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 30 : 42, margin: '0 0 8px', lineHeight: 1.1, color: colors.primary }}>Leaderboard</h1>
      <p style={{ fontSize: 15, color: colors.textMuted, margin: '0 0 32px' }}>Points earned across every quiz.</p>

      <div
        style={{
          display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1.4fr', gap: 1, background: 'oklch(0.92 0.01 250)',
          border: '1px solid oklch(0.92 0.01 250)', borderRadius: 10, overflow: 'hidden', marginBottom: 32,
        }}
      >
        <div style={{ background: 'white', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', marginBottom: 5 }}>Your rank</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, lineHeight: 1, color: colors.primary }}>{youRankText}</div>
        </div>
        <div style={{ background: 'white', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', marginBottom: 5 }}>Your points</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, lineHeight: 1, color: colors.primary }}>{youPointsText}</div>
        </div>
        <div style={{ background: 'white', padding: '16px 20px' }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.7, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', marginBottom: 5 }}>Next up</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'oklch(0.32 0.01 250)' }}>{youGapText}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 280px', gap: 32, alignItems: 'start' }}>
        <div style={{ minWidth: 0 }}>
          {sorted.length > 0 ? (
            <div style={{ border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, overflow: 'hidden', background: 'white' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 18px', borderBottom: '1px solid oklch(0.94 0.006 60)', fontSize: 9.5, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', color: 'oklch(0.68 0.01 250)' }}>
                <div style={{ width: 26, flexShrink: 0 }}>#</div>
                <div style={{ flex: 1, minWidth: 0 }}>Player</div>
                <div style={{ width: 62, flexShrink: 0, textAlign: 'right' }}>Points</div>
              </div>
              {sorted.map((row, idx) => {
                const rank = idx + 1;
                const isMe = !!myName && row.name === myName;
                return (
                  <div
                    key={row.name + rank}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '11px 18px',
                      borderBottom: '1px solid oklch(0.95 0.01 250)', background: isMe ? 'oklch(0.96 0.03 258)' : 'white',
                    }}
                  >
                    <div style={{ width: 26, flexShrink: 0, fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: rank <= 3 ? colors.primary : 'oklch(0.5 0.01 250)' }}>{rank}</div>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: 'hidden', marginRight: -2 }}>
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials(row.name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 14.5, color: colors.textBody, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.name}{isMe ? ' (you)' : ''}
                      </div>
                      <div style={{ fontSize: 12, color: 'oklch(0.6 0.01 250)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.quizzes_completed} {row.quizzes_completed === 1 ? 'quiz played' : 'quizzes played'}
                      </div>
                    </div>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, width: 62, flexShrink: 0, textAlign: 'right', color: 'oklch(0.3 0.01 250)' }}>{row.points}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, textAlign: 'center', padding: '56px 28px', color: colors.textMuted, fontSize: 15, lineHeight: 1.55 }}>
              No scores yet — play a quiz to take the top spot.
            </div>
          )}
        </div>

        {activityRows.length > 0 && (
          <aside>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 15, letterSpacing: 0.4, textTransform: 'uppercase', margin: '0 0 14px', color: 'oklch(0.55 0.01 250)' }}>Recent Activity</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {activityRows.map((item, idx) => (
                <div key={item.ts} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 0', borderBottom: '1px solid oklch(0.95 0.01 250)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 11, flexShrink: 0 }}>
                    {initials(item.name)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'oklch(0.28 0.01 250)' }}>
                      {item.headline}
                    </div>
                    <div style={{ fontSize: 11.5, color: 'oklch(0.62 0.01 250)', marginTop: 2 }}>{relativeTimeFrom(item.ts)}</div>
                  </div>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 14, color: 'oklch(0.5 0.01 250)', flexShrink: 0 }}>+{item.points}</div>
                </div>
              ))}
            </div>
          </aside>
        )}
      </div>

      {nextQuizzes.length > 0 && (
        <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 12, padding: 20, marginTop: 40 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, marginBottom: 6 }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, color: colors.primary }}>Your Next Quizzes</h2>
          </div>
          <div style={{ fontSize: 13, color: 'oklch(0.55 0.02 250)', marginBottom: 22 }}>Three quizzes you are yet to discover</div>
          <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 16 } : { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px,1fr))', gap: 24 }}>
            {nextQuizzes.map((quiz) => (
              <div
                key={quiz.id}
                onClick={() => startQuiz(quiz.id)}
                style={{ border: '1px solid oklch(0.92 0.01 250)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'white', cursor: 'pointer', boxShadow: '0 1px 3px rgba(20,20,40,0.06)' }}
              >
                <div style={{ width: '100%', height: 140, position: 'relative' }}>
                  {(() => {
                    const src = getQuizImageSrc(quiz.id, quiz.image);
                    return src ? (
                      <img src={src} alt={quiz.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: 'oklch(0.95 0.03 250)' }} />
                    );
                  })()}
                </div>
                <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 9, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: 'oklch(0.5 0.01 250)' }}>{DIFFICULTY_LABEL[quiz.difficulty]}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, background: 'oklch(0.95 0.04 250)', padding: '2px 8px', borderRadius: 999, flexShrink: 0 }}>{quiz.points} pts</div>
                  </div>
                  <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 19, margin: 0, lineHeight: 1.2, color: colors.textBody }}>{quiz.title}</h3>
                  <p style={{ fontSize: 13, color: 'oklch(0.52 0.01 250)', margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={(e) => { e.stopPropagation(); startQuiz(quiz.id); }}
                    style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '11px 22px', fontSize: 13.5, fontWeight: 600, borderRadius: 8, cursor: 'pointer', fontFamily: fonts.body }}
                  >
                    Start Quiz
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
