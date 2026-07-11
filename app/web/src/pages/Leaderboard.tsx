import { colors, fonts, AVATAR_COLORS, initials } from '../lib/tokens';
import type { PointsLeaderboardRow, StreakLeaderboardRow, TransferLeaderboardRow } from '../lib/types';

export default function Leaderboard({
  pointsRows,
  streakRows,
  transferRows,
}: {
  pointsRows: PointsLeaderboardRow[];
  streakRows: StreakLeaderboardRow[];
  transferRows: TransferLeaderboardRow[];
}) {
  return (
    <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '80px 48px 120px', width: '100%' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 44, margin: '0 0 12px', color: colors.primary }}>Leaderboard</h1>
      <p style={{ fontSize: 16, color: colors.textSecondary, margin: '0 0 56px' }}>Points earned across every quiz.</p>

      {pointsRows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pointsRows.map((row, idx) => {
            const badgeText = row.perfect_runs > 0 ? 'PERFECT' : row.quizzes_completed >= 3 ? 'REGULAR' : '';
            return (
              <div key={row.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '20px 0', borderBottom: `1px solid ${colors.borderLight}` }}>
                <div style={{ width: 28, fontFamily: fonts.heading, fontWeight: 600, fontSize: 18, color: colors.textFaint, textAlign: 'center' }}>{idx + 1}</div>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                  {initials(row.name)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>{row.name}</div>
                  <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
                    {row.quizzes_completed} {row.quizzes_completed === 1 ? 'quiz played' : 'quizzes played'}
                  </div>
                </div>
                {badgeText && (
                  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '5px 10px', borderRadius: 999, background: colors.badgeBg, color: 'oklch(0.4 0.14 250)', whiteSpace: 'nowrap' }}>{badgeText}</div>
                )}
                <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 22, width: 80, textAlign: 'right' }}>{row.points}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textMuted, fontSize: 15 }}>No scores yet — play a quiz to take the top spot.</div>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 24, margin: '72px 0 24px', color: colors.primary }}>Longest Streak</h2>
      {streakRows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {streakRows.map((row, idx) => (
            <div key={row.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div style={{ width: 28, fontFamily: fonts.heading, fontWeight: 600, fontSize: 18, color: colors.textFaint, textAlign: 'center' }}>{idx + 1}</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {initials(row.name)}
              </div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{row.name}</div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18 }}>{row.best_streak} {row.best_streak === 1 ? 'day' : 'days'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted, fontSize: 15 }}>No streaks yet — play a quiz today to start one.</div>
      )}

      <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 24, margin: '72px 0 24px', color: colors.primary }}>Transfer Chain Leaders</h2>
      {transferRows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {transferRows.map((row, idx) => (
            <div key={row.name + idx} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '16px 0', borderBottom: `1px solid ${colors.borderLight}` }}>
              <div style={{ width: 28, fontFamily: fonts.heading, fontWeight: 600, fontSize: 18, color: colors.textFaint, textAlign: 'center' }}>{idx + 1}</div>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                {initials(row.name)}
              </div>
              <div style={{ flex: 1, fontWeight: 600, fontSize: 15 }}>{row.name}</div>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18 }}>{row.chains_completed} {row.chains_completed === 1 ? 'chain' : 'chains'}</div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '40px 0', color: colors.textMuted, fontSize: 15 }}>No completed chains yet — finish a Transfer Chain to take the top spot.</div>
      )}
    </main>
  );
}
