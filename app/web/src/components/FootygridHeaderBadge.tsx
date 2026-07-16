import type { FootygridHeader } from '../lib/types';

export default function FootygridHeaderBadge({ header, size }: { header: FootygridHeader; size: number }) {
  if (header.isClub) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', margin: '0 auto 4px', background: 'white' }}>
        <img src={`/club-logos/${header.key}.webp`} alt={header.label} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
      </div>
    );
  }
  if (header.isFlag) {
    return (
      <div style={{ width: size * 1.15, height: size * 0.8, borderRadius: 3, overflow: 'hidden', margin: '0 auto 4px' }}>
        <img src={`/flags/${header.key}.webp`} alt={header.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return null;
}
