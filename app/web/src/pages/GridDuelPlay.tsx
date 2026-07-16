import { Fragment, useEffect, useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { footygridPlayerFits } from '../lib/footygrid';
import type { FootygridGrid, FootygridPlayer } from '../lib/types';
import HeaderBadge from '../components/FootygridHeaderBadge';

const MAX_LIVES = 9;

function formatDuelTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export default function GridDuelPlay({
  grid,
  players,
  isMobile,
  onFinish,
}: {
  grid: FootygridGrid;
  players: FootygridPlayer[];
  isMobile: boolean;
  onFinish: (result: { answers: Record<string, { id: string; name: string; position: string }>; livesUsed: number; timeMs: number }) => void;
}) {
  const [answers, setAnswers] = useState<Record<string, { id: string; name: string; position: string }>>({});
  const [lives, setLives] = useState(MAX_LIVES);
  const [modalCell, setModalCell] = useState<{ rowKey: string; colKey: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [startTime] = useState(() => Date.now());
  const [, forceTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const solvedCount = Object.keys(answers).length;
  const elapsedMs = Date.now() - startTime;

  function finish(finalAnswers: typeof answers, finalLives: number) {
    onFinish({ answers: finalAnswers, livesUsed: MAX_LIVES - Math.max(finalLives, 0), timeMs: Date.now() - startTime });
  }

  function openCell(rowKey: string, colKey: string) {
    if (lives <= 0) return;
    if (answers[rowKey + '|' + colKey]) return;
    setModalCell({ rowKey, colKey });
    setSearchInput('');
  }

  function pickPlayer(playerId: string) {
    if (!modalCell) return;
    const rowDef = grid.rows.find((r) => r.key === modalCell.rowKey);
    const colDef = grid.cols.find((c) => c.key === modalCell.colKey);
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    const key = modalCell.rowKey + '|' + modalCell.colKey;
    if (footygridPlayerFits(player, rowDef, colDef)) {
      const next = { ...answers, [key]: { id: player.id, name: player.name, position: player.position } };
      setAnswers(next);
      setModalCell(null);
      setSearchInput('');
      if (Object.keys(next).length >= 9) setTimeout(() => finish(next, lives), 10);
    } else {
      const nextLives = lives - 1;
      setLives(nextLives);
      setModalCell(null);
      setSearchInput('');
      if (nextLives <= 0) setTimeout(() => finish(answers, nextLives), 10);
    }
  }

  function giveUp() {
    finish(answers, lives);
  }

  const searchQ = searchInput.trim().toLowerCase();
  const suggestions = searchQ.length > 0 ? players.filter((p) => p.name.toLowerCase().includes(searchQ)).slice(0, 8) : [];

  const headerSize = isMobile ? 28 : 34;
  const cellMinHeight = isMobile ? 66 : 78;

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryLight }}>Grid Duel</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 999, padding: '5px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={colors.primary} strokeWidth={2.2}><circle cx="12" cy="13" r="8" /><path d="M12 9v4l3 2" /><path d="M9 2h6" /></svg>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 15, color: colors.primary }}>{formatDuelTime(elapsedMs)}</div>
        </div>
      </div>
      <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 20px' }}>
        Name a player who fits both the row and the column. Lives left: {Math.max(lives, 0)} / {MAX_LIVES}. Solved: {solvedCount} / 9.
      </p>

      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {Array.from({ length: MAX_LIVES }).map((_, i) => (
          <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < lives ? colors.primary : 'oklch(0.88 0.01 250)' }} />
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: `${isMobile ? 60 : 88}px repeat(3, 1fr)`, gap: 6 }}>
        <div />
        {grid.cols.map((col) => (
          <div key={col.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.primary, background: 'oklch(0.95 0.03 250)', borderRadius: 6, padding: '8px 4px', minHeight: cellMinHeight }}>
            <HeaderBadge header={col} size={headerSize} />
            <div>{col.label}</div>
          </div>
        ))}
        {grid.rows.map((row) => (
          <Fragment key={row.key}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.primary, background: 'oklch(0.95 0.03 250)', borderRadius: 6, padding: '8px 4px', minHeight: cellMinHeight }}>
              <HeaderBadge header={row} size={headerSize} />
              <div>{row.label}</div>
            </div>
            {grid.cols.map((col) => {
              const key = row.key + '|' + col.key;
              const filled = answers[key];
              return (
                <div
                  key={key}
                  onClick={() => openCell(row.key, col.key)}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                    minHeight: cellMinHeight, borderRadius: 6, cursor: filled ? 'default' : 'pointer', padding: 4,
                    background: filled ? 'oklch(0.97 0.05 145)' : 'oklch(0.98 0.01 250)',
                    border: filled ? '1px solid oklch(0.5 0.14 145)' : '1px solid oklch(0.9 0.01 250)',
                  }}
                >
                  {filled ? (
                    <>
                      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 0.5, color: colors.primary, marginBottom: 3 }}>{filled.position}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.textBody, lineHeight: 1.15, padding: '0 3px' }}>{filled.name}</div>
                    </>
                  ) : (
                    <div style={{ fontSize: 22, color: 'oklch(0.5 0.03 260)', fontWeight: 300 }}>+</div>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      <div style={{ textAlign: 'center', marginTop: 28 }}>
        <div onClick={giveUp} style={{ display: 'inline-block', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, textDecoration: 'underline' }}>Give Up</div>
      </div>

      {modalCell && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModalCell(null)}>
          <div style={{ background: 'white', borderRadius: 10, padding: 24, maxWidth: 420, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 18, margin: 0, color: colors.primary }}>Who fits?</h2>
              <div onClick={() => setModalCell(null)} style={{ cursor: 'pointer', color: colors.textMuted, fontSize: 20, lineHeight: 1 }}>×</div>
            </div>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search a player…"
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', border: '1px solid oklch(0.85 0.02 250)', borderRadius: 6, fontSize: 14, fontFamily: fonts.body, marginBottom: 10 }}
            />
            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
              {suggestions.map((s) => (
                <div key={s.id} onClick={() => pickPlayer(s.id)} style={{ padding: '10px 12px', fontSize: 14, cursor: 'pointer', borderBottom: '1px solid oklch(0.94 0.01 250)' }}>{s.name}</div>
              ))}
              {searchQ.length > 0 && suggestions.length === 0 && (
                <div style={{ fontSize: 13, color: colors.textMuted, padding: '10px 12px' }}>No players found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
