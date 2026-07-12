import { colors, fonts, AVATAR_COLORS, initials } from '../lib/tokens';
import type { PointsLeaderboardRow } from '../lib/types';

const MEDAL_COLORS: Record<number, string> = { 0: 'oklch(0.72 0.16 85)', 1: 'oklch(0.72 0.01 250)', 2: 'oklch(0.58 0.12 50)' };

export default function LeaderboardRow({ row, rank, size, subline, badgeText }: { row: PointsLeaderboardRow; rank: number; size: 'compact' | 'full'; subline?: string; badgeText?: string }) {
  const idx = rank - 1;
  const medalColor = MEDAL_COLORS[idx] ?? null;
  const avatarColor = medalColor || AVATAR_COLORS[idx % AVATAR_COLORS.length];
  const avatarSize = size === 'full' ? 44 : 36;
  const rankFontSize = size === 'full' ? (medalColor ? 19 : 18) : 15;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: size === 'full' ? 20 : 16, padding: size === 'full' ? '20px 0' : '14px 0', borderBottom: `1px solid ${colors.borderLight}` }}>
      <div style={{ width: 22, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
        <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: rankFontSize, color: medalColor || colors.textFaint }}>{rank}</div>
        {medalColor && <div style={{ fontSize: size === 'full' ? 12 : 10, color: medalColor }}>★</div>}
      </div>
      <div
        style={{
          width: avatarSize, height: avatarSize, borderRadius: '50%', background: avatarColor, color: 'white',
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: size === 'full' ? 15 : 13,
          flexShrink: 0, boxShadow: medalColor ? `0 0 0 3px ${medalColor}` : 'none', overflow: 'hidden',
        }}
      >
        {row.avatar_url ? (
          <img src={row.avatar_url} alt={row.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          initials(row.name)
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: size === 'full' ? 16 : 15 }}>{row.name}</div>
        {subline && <div style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>{subline}</div>}
      </div>
      {badgeText && (
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.4, padding: '5px 10px', borderRadius: 999, background: colors.badgeBg, color: 'oklch(0.4 0.14 250)', whiteSpace: 'nowrap' }}>{badgeText}</div>
      )}
      <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: size === 'full' ? 22 : 18, width: size === 'full' ? 80 : undefined, textAlign: 'right' }}>{row.points}</div>
    </div>
  );
}
