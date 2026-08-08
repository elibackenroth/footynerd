import { useState } from 'react';
import { colors } from '../lib/tokens';
import { DAILY_KIND_META, DAILY_DOT_COLOR, isFutureDaily, relativeDayLabel } from '../lib/daily';
import type { DailyKind, DailyDotState } from '../lib/daily';

export default function DailyPicker({
  currentKind,
  currentDate,
  axisDates,
  hasItem,
  statusText,
  dotState,
  onNavigate,
}: {
  currentKind: DailyKind;
  currentDate: string;
  axisDates: string[];
  hasItem: (kind: DailyKind, date: string) => boolean;
  statusText: (kind: DailyKind, date: string) => string;
  dotState: (kind: DailyKind, date: string) => DailyDotState;
  onNavigate: (kind: DailyKind, date: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);

  const openDate = (date: string) => {
    if (hasItem(currentKind, date)) { onNavigate(currentKind, date); return; }
    const fallback = DAILY_KIND_META.find((m) => hasItem(m.kind, date));
    if (fallback) onNavigate(fallback.kind, date);
  };

  const todayAxisDate = axisDates.filter((d) => !isFutureDaily(d)).slice(-1)[0] || axisDates[axisDates.length - 1];
  const showTodayLink = currentDate !== todayAxisDate;

  return (
    <div>
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <div
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: '100%', boxSizing: 'border-box', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            gap: 8, padding: '10px 12px', borderRadius: 8, background: 'white', cursor: 'pointer', userSelect: 'none',
            border: `1px solid ${menuOpen ? colors.primary : 'oklch(0.88 0.01 250)'}`,
            boxShadow: menuOpen ? '0 0 0 3px oklch(0.93 0.05 250)' : 'none',
          }}
        >
          <div style={{ lineHeight: 1.3 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'oklch(0.22 0.01 250)' }}>{currentDate}</div>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)' }}>{relativeDayLabel(currentDate)}</div>
          </div>
          <div style={{ flexShrink: 0, fontSize: 10, color: 'oklch(0.5 0.01 250)', transform: menuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }}>▾</div>
        </div>
        {menuOpen && (
          <>
            <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
            <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 41, background: 'white', border: '1px solid oklch(0.88 0.01 250)', borderRadius: 8, boxShadow: '0 12px 28px rgba(20,20,40,0.14)', maxHeight: 288, overflowY: 'auto', padding: '4px 0' }}>
              {axisDates.slice().reverse().map((date) => {
                const locked = isFutureDaily(date);
                const selected = date === currentDate;
                return (
                  <div
                    key={date}
                    onClick={() => { if (locked) return; setMenuOpen(false); openDate(date); }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                      padding: '9px 12px', cursor: locked ? 'default' : 'pointer',
                      background: selected ? 'oklch(0.95 0.03 250)' : 'transparent',
                      opacity: locked ? 0.55 : 1,
                    }}
                  >
                    <div style={{ lineHeight: 1.25 }}>
                      <div style={{ fontSize: 13, fontWeight: selected ? 700 : 600, color: 'oklch(0.22 0.01 250)' }}>{date}</div>
                      <div style={{ fontSize: 11, fontWeight: 600, color: locked ? 'oklch(0.62 0.01 250)' : 'oklch(0.55 0.01 250)' }}>{relativeDayLabel(date)}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      {DAILY_KIND_META.map((m) => {
                        const st = dotState(m.kind, date);
                        return (
                          <div
                            key={m.kind}
                            style={{ width: 7, height: 7, borderRadius: 999, boxSizing: 'border-box', background: DAILY_DOT_COLOR[st], border: st === 'none' ? '1px dashed oklch(0.85 0.01 250)' : 'none' }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {DAILY_KIND_META.map((m) => {
          const item = hasItem(m.kind, currentDate);
          const locked = isFutureDaily(currentDate);
          const active = m.kind === currentKind;
          const clickable = item && !active && !locked;
          const status = !item ? 'No puzzle this day' : (locked ? 'Unlocks tomorrow' : statusText(m.kind, currentDate));
          return (
            <div
              key={m.kind}
              onClick={() => clickable && onNavigate(m.kind, currentDate)}
              style={{
                display: 'flex', alignItems: 'center', gap: 11,
                border: `1px solid ${active ? colors.primary : 'oklch(0.9 0.01 250)'}`,
                background: active ? 'oklch(0.93 0.05 250)' : 'white',
                borderRadius: 8, padding: '9px 11px',
                cursor: clickable ? 'pointer' : 'default',
                opacity: item ? 1 : 0.5,
              }}
            >
              <div style={{ width: 62, height: 44, flexShrink: 0, borderRadius: 6, overflow: 'hidden', background: 'oklch(0.95 0.01 250)' }}>
                <img src={m.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'oklch(0.22 0.01 250)' }}>{m.name}</div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 2, color: (item && !locked) ? colors.primary : 'oklch(0.62 0.01 250)' }}>{status}</div>
              </div>
            </div>
          );
        })}
      </div>
      {showTodayLink && todayAxisDate && (
        <div onClick={() => openDate(todayAxisDate)} style={{ marginTop: 12, textAlign: 'center', fontSize: 12, fontWeight: 700, color: colors.primary, cursor: 'pointer' }}>Jump to today</div>
      )}
    </div>
  );
}
