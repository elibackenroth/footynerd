import { colors, fonts, AVATAR_COLORS, initials } from '../lib/tokens';
import type { PointsLeaderboardRow } from '../lib/types';

const PODIUM_ORDER = [1, 0, 2];
const MEDAL_COLORS: Record<number, string> = { 1: 'oklch(0.45 0.19 255)', 2: 'oklch(0.58 0.15 248)', 3: 'oklch(0.7 0.09 240)' };

export default function Leaderboard({ pointsRows, myName, isMobile }: { pointsRows: PointsLeaderboardRow[]; myName: string | null; isMobile: boolean }) {
  const sorted = [...pointsRows].sort((a, b) => b.points - a.points);

  const lbTotalPlayers = sorted.length;
  const lbTopScore = sorted.length ? sorted[0].points : 0;
  const lbTotalQuizzes = sorted.reduce((sum, e) => sum + (e.quizzes_completed || 0), 0);
  const lbPerfectRuns = sorted.reduce((sum, e) => sum + (e.perfect_runs || 0), 0);

  const podiumRows = PODIUM_ORDER.filter((i) => sorted[i]).map((i) => {
    const row = sorted[i];
    const place = i + 1;
    const heights = isMobile ? { 1: 84, 2: 66, 3: 54 } : { 1: 132, 2: 104, 3: 84 };
    const podiumColor = MEDAL_COLORS[place];
    const isMe = !!myName && row.name === myName;
    const avatarSize = isMobile ? (place === 1 ? 52 : 42) : (place === 1 ? 76 : 60);
    return { row, place, podiumHeight: heights[place as 1 | 2 | 3], podiumColor, avatarSize, isMe };
  });

  const restRows = sorted.slice(3);
  const myRank = myName ? sorted.findIndex((r) => r.name === myName) + 1 : 0;
  const showMyRankCallout = myRank > 3;

  return (
    <main style={{ flex: 1, maxWidth: 860, margin: '0 auto', padding: isMobile ? '32px 20px 80px' : '48px 20px 100px', width: '100%' }}>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 30 : 44, margin: '0 0 8px', color: colors.primary }}>Leaderboard</h1>
      <p style={{ fontSize: 16, color: colors.textSecondary, margin: '0 0 32px' }}>Points earned across every quiz.</p>

      {sorted.length > 0 ? (
        <>
          {showMyRankCallout && (
            <div style={{ background: colors.primary, color: 'white', borderRadius: 10, padding: '14px 20px', marginBottom: 24, fontWeight: 600, fontSize: 15 }}>
              You're ranked #{myRank} with {sorted[myRank - 1].points} points
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 12, marginBottom: isMobile ? 28 : 48 }}>
            <StatTile value={lbTotalPlayers} label="Players" />
            <StatTile value={lbTopScore} label="Top Score" />
            <StatTile value={lbTotalQuizzes} label="Quizzes Played" />
            <StatTile value={lbPerfectRuns} label="Perfect Runs" />
          </div>

          {podiumRows.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: isMobile ? 8 : 16, marginBottom: isMobile ? 28 : 48 }}>
              {podiumRows.map(({ row, place, podiumHeight, podiumColor, avatarSize, isMe }) => (
                <div key={row.name + place} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 150 }}>
                  <div
                    style={{
                      width: avatarSize, height: avatarSize, borderRadius: '50%', background: podiumColor, color: 'white',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, marginBottom: 10,
                      boxShadow: `0 0 0 4px white, 0 0 0 6px ${podiumColor}`, overflow: 'hidden',
                    }}
                  >
                    {row.avatar_url ? (
                      <img src={row.avatar_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      initials(row.name)
                    )}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 15, textAlign: 'center', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {row.name}{isMe ? ' (You)' : ''}
                  </div>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, color: podiumColor, margin: '2px 0 10px' }}>{row.points}</div>
                  <div style={{ width: '100%', height: podiumHeight, background: `linear-gradient(180deg, ${podiumColor}, oklch(0.97 0.02 250))`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
                    <div style={{ fontFamily: fonts.heading, fontWeight: 800, fontSize: 28, color: 'white' }}>{place}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {restRows.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {restRows.map((row, idx) => {
                const rank = idx + 4;
                const isMe = !!myName && row.name === myName;
                const badgeText = row.perfect_runs > 0 ? 'PERFECT' : row.quizzes_completed >= 3 ? 'REGULAR' : '';
                return (
                  <div
                    key={row.name + rank}
                    style={{
                      display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 20, padding: isMobile ? '14px 10px' : '18px 0',
                      borderBottom: `1px solid ${colors.borderLight}`, background: isMe ? 'oklch(0.95 0.05 250)' : 'transparent', borderRadius: isMe ? 8 : 0,
                    }}
                  >
                    <div style={{ width: 28, flexShrink: 0, textAlign: 'center', fontFamily: fonts.heading, fontWeight: 700, fontSize: 16, color: colors.textFaint }}>{rank}</div>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, flexShrink: 0, overflow: 'hidden' }}>
                      {row.avatar_url ? (
                        <img src={row.avatar_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        initials(row.name)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.name}{isMe ? ' (You)' : ''}
                      </div>
                      <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {row.quizzes_completed} {row.quizzes_completed === 1 ? 'quiz played' : 'quizzes played'}
                      </div>
                    </div>
                    {badgeText && (
                      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '5px 10px', borderRadius: 999, background: colors.badgeBg, color: 'oklch(0.4 0.14 250)', whiteSpace: 'nowrap' }}>{badgeText}</div>
                    )}
                    <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 19, width: 70, flexShrink: 0, textAlign: 'right', color: colors.primary }}>{row.points}</div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 0', color: colors.textMuted, fontSize: 15 }}>No scores yet — play a quiz to take the top spot.</div>
      )}
    </main>
  );
}

function StatTile({ value, label }: { value: number; label: string }) {
  return (
    <div style={{ background: colors.panelBg, border: '1px solid oklch(0.9 0.03 250)', borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, color: colors.primary }}>{value}</div>
      <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{label}</div>
    </div>
  );
}
