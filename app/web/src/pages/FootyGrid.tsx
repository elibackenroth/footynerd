import { Fragment, useEffect, useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchFootygridPlayers, fetchFootygridGrids, fetchMyFootygridAttempts, saveFootygridAttempt } from '../lib/api';
import type { FootygridPlayer, FootygridGrid, FootygridAttempt, FootygridHeader } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import type { User } from '@supabase/supabase-js';

const MAX_LIVES = 9;

const FLAG_URLS: Record<string, string> = {
  germany: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Germany.svg?width=100',
  spain: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Spain.svg?width=100',
  brazil: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Brazil.svg?width=100',
  argentina: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Argentina.svg?width=100',
  france: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_France.svg?width=100',
  portugal: 'https://commons.wikimedia.org/wiki/Special:FilePath/Flag_of_Portugal.svg?width=100',
};

function HeaderBadge({ header, size }: { header: FootygridHeader; size: number }) {
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
        <img src={FLAG_URLS[header.key]} alt={header.label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );
  }
  return null;
}

export default function FootyGrid({ go, user, isMobile }: { go: (v: ViewName) => void; user: User | null; isMobile: boolean }) {
  const [players, setPlayers] = useState<FootygridPlayer[]>([]);
  const [grids, setGrids] = useState<FootygridGrid[]>([]);
  const [myAttempts, setMyAttempts] = useState<Record<string, FootygridAttempt>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalCell, setModalCell] = useState<{ rowKey: string; colKey: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    fetchFootygridPlayers().then(setPlayers);
    fetchFootygridGrids().then(setGrids);
    if (user) fetchMyFootygridAttempts(user.id).then(setMyAttempts);
  }, [user]);

  const selectedGrid = grids.find((g) => g.id === selectedId) || null;
  const progress: FootygridAttempt = (selectedId && myAttempts[selectedId]) || { grid_id: selectedId || '', answers: {}, lives: MAX_LIVES, status: 'playing' };
  const solvedCount = Object.keys(progress.answers).length;
  const showGrid = !!selectedGrid && progress.status === 'playing';
  const showResults = !!selectedGrid && progress.status !== 'playing';

  function persist(gridId: string, next: FootygridAttempt) {
    setMyAttempts((prev) => ({ ...prev, [gridId]: next }));
    if (user) saveFootygridAttempt(user.id, next).catch(() => {});
  }

  function selectGrid(id: string) {
    if (!myAttempts[id]) {
      persist(id, { grid_id: id, answers: {}, lives: MAX_LIVES, status: 'playing' });
    }
    setSelectedId(id);
    setModalCell(null);
    setSearchInput('');
  }

  function backToPicker() {
    setSelectedId(null);
    setModalCell(null);
    setSearchInput('');
  }

  function giveUp() {
    if (!selectedId) return;
    persist(selectedId, { ...progress, status: 'over' });
  }

  function openCell(rowKey: string, colKey: string) {
    if (progress.status !== 'playing') return;
    if (progress.answers[rowKey + '|' + colKey]) return;
    setModalCell({ rowKey, colKey });
    setSearchInput('');
  }

  function pickPlayer(playerId: string) {
    if (!selectedId || !selectedGrid || !modalCell) return;
    const key = modalCell.rowKey + '|' + modalCell.colKey;
    const accepted = selectedGrid.answers[key] || [];
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    let next: FootygridAttempt;
    if (accepted.includes(playerId)) {
      const answers = { ...progress.answers, [key]: { id: player.id, name: player.name, position: player.position } };
      const solved = Object.keys(answers).length;
      next = { ...progress, answers, status: solved >= 9 ? 'won' : 'playing' };
    } else {
      const lives = progress.lives - 1;
      next = { ...progress, lives, status: lives <= 0 ? 'over' : 'playing' };
    }
    persist(selectedId, next);
    setModalCell(null);
    setSearchInput('');
  }

  const searchQ = searchInput.trim().toLowerCase();
  const suggestions = searchQ.length > 0
    ? players.filter((p) => p.name.toLowerCase().includes(searchQ)).slice(0, 8)
    : [];

  const headerSize = isMobile ? 28 : 34;
  const cellMinHeight = isMobile ? 66 : 78;

  return (
    <main style={{ flex: 1, width: '100%', background: 'white', padding: isMobile ? '32px 16px 80px' : '48px 20px 100px' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 16 }}>← Back to Home</div>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 26 : 32, margin: '0 0 6px', color: colors.primary }}>FootyGrid</h1>

        {!selectedGrid && (
          <>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 24px' }}>A new grid every day. Pick a grid to play.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {grids.slice().reverse().map((g) => {
                const prog = myAttempts[g.id];
                const solved = prog ? Object.keys(prog.answers).length : 0;
                const statusText = !prog ? 'Not started' : (prog.status === 'won' ? `Solved ${solved}/9` : (prog.status === 'over' ? `Out of lives — ${solved}/9` : `${solved}/9 in progress`));
                return (
                  <div key={g.id} onClick={() => selectGrid(g.id)} style={{ border: `1px solid ${colors.panelBorder}`, background: colors.panelBg, borderRadius: 8, padding: '18px 20px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: colors.textBody }}>{g.date}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: colors.primary }}>{statusText}</div>
                    </div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{g.rows.map((r) => r.label).join(' · ')}</div>
                    <div style={{ fontSize: 13, color: colors.textMuted }}>{g.cols.map((c) => c.label).join(' · ')}</div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {showGrid && selectedGrid && (
          <>
            <div onClick={backToPicker} style={{ cursor: 'pointer', fontSize: 12, fontWeight: 600, color: colors.primary, marginBottom: 12 }}>← Choose a different day</div>
            <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 20px' }}>
              Name a player who fits both the row and the column. Lives left: {progress.lives} / {MAX_LIVES}. Solved: {solvedCount} / 9.
            </p>

            <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
              {Array.from({ length: MAX_LIVES }).map((_, i) => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < progress.lives ? colors.primary : 'oklch(0.88 0.01 250)' }} />
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} style={{ width: 18, height: 18, borderRadius: '50%', background: i < solvedCount ? colors.primary : 'oklch(0.88 0.01 250)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {i < solvedCount && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={3.5}><path d="M20 6L9 17l-5-5" /></svg>}
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: `${isMobile ? 56 : 88}px repeat(3, 1fr)`, gap: 6 }}>
              <div />
              {selectedGrid.cols.map((col) => (
                <div key={col.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.primary, background: 'oklch(0.95 0.03 250)', borderRadius: 6, padding: '8px 4px', minHeight: cellMinHeight }}>
                  <HeaderBadge header={col} size={headerSize} />
                  <div>{col.label}</div>
                </div>
              ))}
              {selectedGrid.rows.map((row) => (
                <Fragment key={row.key}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', fontSize: 11, fontWeight: 700, color: colors.primary, background: 'oklch(0.95 0.03 250)', borderRadius: 6, padding: '8px 4px', minHeight: cellMinHeight }}>
                    <HeaderBadge header={row} size={headerSize} />
                    <div>{row.label}</div>
                  </div>
                  {selectedGrid.cols.map((col) => {
                    const key = row.key + '|' + col.key;
                    const filled = progress.answers[key];
                    return (
                      <div
                        key={key}
                        onClick={() => openCell(row.key, col.key)}
                        style={{
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center',
                          minHeight: cellMinHeight, borderRadius: 6, cursor: 'pointer', padding: 4,
                          background: filled ? 'oklch(0.97 0.035 250)' : 'oklch(0.98 0.005 250)',
                          border: filled ? `1.5px solid ${colors.primary}` : '1.5px dashed oklch(0.85 0.01 250)',
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
          </>
        )}

        {showResults && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, margin: '0 0 10px', color: colors.primary }}>
              {progress.status === 'won' ? 'Perfect grid!' : 'Out of lives'}
            </h2>
            <p style={{ fontSize: 15, color: colors.textMuted, margin: '0 0 28px' }}>{solvedCount} of 9 cells solved.</p>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <div onClick={backToPicker} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.primary, textDecoration: 'underline' }}>Choose Another Day</div>
              <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Return to Home</div>
            </div>
          </div>
        )}
      </div>

      {modalCell && selectedGrid && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }} onClick={() => setModalCell(null)}>
          <div style={{ background: 'white', borderRadius: 8, padding: 24, width: '100%', maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 12 }}>
              {(selectedGrid.rows.find((r) => r.key === modalCell.rowKey) || { label: '' }).label} + {(selectedGrid.cols.find((c) => c.key === modalCell.colKey) || { label: '' }).label}
            </div>
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search a player..."
              autoFocus
              style={{ width: '100%', boxSizing: 'border-box', padding: '13px 16px', border: '1px solid oklch(0.85 0.01 250)', borderRadius: 6, fontSize: 15, fontFamily: fonts.body, marginBottom: 14, background: 'white', color: colors.textBody, outline: 'none' }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 280, overflowY: 'auto' }}>
              {suggestions.map((s) => (
                <div key={s.id} onClick={() => pickPlayer(s.id)} style={{ padding: '10px 12px', borderRadius: 6, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.97 0.02 250)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <span style={{ fontSize: 14, fontWeight: 600, color: colors.textBody }}>{s.name}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: colors.textMuted }}>{s.position}</span>
                </div>
              ))}
              {searchQ.length > 0 && suggestions.length === 0 && (
                <div style={{ fontSize: 13, color: colors.textMuted, padding: '10px 12px' }}>No players found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
