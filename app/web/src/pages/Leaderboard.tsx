import { colors, fonts } from '../lib/tokens';
import type { PointsLeaderboardRow } from '../lib/types';
import LeaderboardRow from '../components/LeaderboardRow';

export default function Leaderboard({ pointsRows }: { pointsRows: PointsLeaderboardRow[] }) {
  return (
    <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '80px 48px 120px', width: '100%' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 44, margin: '0 0 12px', color: colors.primary }}>Leaderboard</h1>
      <p style={{ fontSize: 16, color: colors.textSecondary, margin: '0 0 56px' }}>Points earned across every quiz.</p>

      {pointsRows.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {pointsRows.map((row, idx) => {
            const badgeText = row.perfect_runs > 0 ? 'PERFECT' : row.quizzes_completed >= 3 ? 'REGULAR' : '';
            return (
              <LeaderboardRow
                key={row.name + idx}
                row={row}
                rank={idx + 1}
                size="full"
                subline={`${row.quizzes_completed} ${row.quizzes_completed === 1 ? 'quiz played' : 'quizzes played'}`}
                badgeText={badgeText || undefined}
              />
            );
          })}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textMuted, fontSize: 15 }}>No scores yet — play a quiz to take the top spot.</div>
      )}
    </main>
  );
}
