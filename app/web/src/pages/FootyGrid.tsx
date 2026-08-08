import { Fragment, useEffect, useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchMyFootygridAttempts, saveFootygridAttempt } from '../lib/api';
import { footygridPlayerFits } from '../lib/footygrid';
import { todaysDaily, buildDailyAxis } from '../lib/daily';
import type { DailyKind } from '../lib/daily';
import type { FootygridPlayer, FootygridGrid, FootygridAttempt, WordlePuzzlePublic, WordleGuess, TransferDaily, Quiz, QuizAttempt } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import type { User } from '@supabase/supabase-js';
import HeaderBadge from '../components/FootygridHeaderBadge';
import DailyPicker from '../components/DailyPicker';
import RecommendedQuizzes from '../components/RecommendedQuizzes';

const MAX_LIVES = 9;

export default function FootyGrid({
  go, user, isMobile, players, grids,
  wordlePuzzles, wordleAttempts, transferDailies, doneTransferDays,
  quizzes, attempts, questionCounts, startQuiz,
  jumpDate, clearJumpDate, goDaily, onProgressChange,
}: {
  go: (v: ViewName) => void;
  user: User | null;
  isMobile: boolean;
  players: FootygridPlayer[];
  grids: FootygridGrid[];
  wordlePuzzles: WordlePuzzlePublic[];
  wordleAttempts: Record<string, { guesses: WordleGuess[]; status: string }>;
  transferDailies: TransferDaily[];
  doneTransferDays: Record<string, { score: number; total: number }>;
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  startQuiz: (id: string) => void;
  jumpDate: string | null;
  clearJumpDate: () => void;
  goDaily: (view: ViewName, date: string) => void;
  onProgressChange: () => void;
}) {
  const [myAttempts, setMyAttempts] = useState<Record<string, FootygridAttempt>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalCell, setModalCell] = useState<{ rowKey: string; colKey: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [autoSelected, setAutoSelected] = useState(false);

  useEffect(() => {
    if (user) fetchMyFootygridAttempts(user.id).then(setMyAttempts);
  }, [user]);

  useEffect(() => {
    if (grids.length > 0 && !autoSelected) {
      setAutoSelected(true);
      if (jumpDate) {
        const match = grids.find((g) => g.date === jumpDate);
        clearJumpDate();
        if (match) { selectGrid(match.id); return; }
      }
      const today = todaysDaily(grids);
      if (today) selectGrid(today.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grids, autoSelected]);

  const selectedGrid = grids.find((g) => g.id === selectedId) || null;
  const progress: FootygridAttempt = (selectedId && myAttempts[selectedId]) || { grid_id: selectedId || '', answers: {}, lives: MAX_LIVES, status: 'playing' };
  const solvedCount = Object.keys(progress.answers).length;
  const showGrid = !!selectedGrid && progress.status === 'playing';
  const showResults = !!selectedGrid && progress.status !== 'playing';

  function persist(gridId: string, next: FootygridAttempt) {
    setMyAttempts((prev) => ({ ...prev, [gridId]: next }));
    if (user) saveFootygridAttempt(user.id, next).catch(() => {});
    if (next.status !== 'playing') onProgressChange();
  }

  function selectGrid(id: string) {
    if (!myAttempts[id]) {
      persist(id, { grid_id: id, answers: {}, lives: MAX_LIVES, status: 'playing' });
    }
    setSelectedId(id);
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
    const rowDef = selectedGrid.rows.find((r) => r.key === modalCell.rowKey);
    const colDef = selectedGrid.cols.find((c) => c.key === modalCell.colKey);
    const player = players.find((p) => p.id === playerId);
    if (!player) return;
    let next: FootygridAttempt;
    if (footygridPlayerFits(player, rowDef, colDef)) {
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

  const dailyCurrentDate = selectedGrid ? selectedGrid.date : (todaysDaily(grids)?.date || '');
  const axisDates = buildDailyAxis([wordlePuzzles.map((p) => p.date), transferDailies.map((d) => d.date), grids.map((g) => g.date)]);

  function hasItem(kind: DailyKind, date: string) {
    if (kind === 'wordle') return wordlePuzzles.some((p) => p.date === date);
    if (kind === 'transfer') return transferDailies.some((d) => d.date === date);
    return grids.some((g) => g.date === date);
  }

  function wordleStatusText(date: string) {
    const p = wordlePuzzles.find((x) => x.date === date);
    if (!p) return 'No puzzle this day';
    const prog = wordleAttempts[p.id];
    if (!prog || (prog.status !== 'won' && prog.status !== 'lost' && prog.guesses.length === 0)) return 'Not started';
    if (prog.status === 'won') return `Solved in ${prog.guesses.length}/${Math.max(6, p.word.length + 1)}`;
    if (prog.status === 'lost') return 'Not solved';
    return `${prog.guesses.length} guesses in`;
  }

  function transferStatusText(date: string) {
    const d = transferDailies.find((x) => x.date === date);
    if (!d) return 'No puzzle this day';
    const prog = doneTransferDays[d.id];
    return prog ? `${prog.score}/${prog.total} solved` : 'Not started';
  }

  function footygridStatusText(date: string) {
    const g = grids.find((x) => x.date === date);
    if (!g) return 'No puzzle this day';
    const prog = myAttempts[g.id];
    const solved = prog ? Object.keys(prog.answers).length : 0;
    if (!prog || (prog.status === 'playing' && solved === 0)) return 'Not started';
    if (prog.status === 'won') return `Solved ${solved}/9`;
    if (prog.status === 'over') return `Out of lives · ${solved}/9`;
    return `${solved}/9 filled`;
  }

  function statusText(kind: DailyKind, date: string) {
    if (kind === 'wordle') return wordleStatusText(date);
    if (kind === 'transfer') return transferStatusText(date);
    return footygridStatusText(date);
  }

  function dotState(kind: DailyKind, date: string): 'done' | 'progress' | 'todo' | 'none' | 'locked' {
    if (!hasItem(kind, date)) return 'none';
    if (new Date(date) > new Date()) return 'locked';
    const st = statusText(kind, date);
    if (st === 'Not started') return 'todo';
    if (st.startsWith('Solved') || st === 'Not solved' || st.startsWith('Out of lives')) return 'done';
    return 'progress';
  }

  function handleDailyNavigate(kind: DailyKind, date: string) {
    if (kind === 'footygrid') {
      const match = grids.find((g) => g.date === date);
      if (match) selectGrid(match.id);
    } else if (kind === 'wordle') {
      goDaily('wordle', date);
    } else {
      goDaily('transferchain', date);
    }
  }

  return (
    <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', width: '100%', padding: isMobile ? '24px 16px 80px' : '72px 48px 120px' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 16 }}>← Back to Home</div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 26 : 32, margin: '0 0 24px', color: colors.primary }}>FootyGrid</h1>

      <div style={isMobile ? { display: 'flex', flexDirection: 'column', gap: 28, alignItems: 'stretch' } : { display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 340, maxWidth: 480 }}>
          {showGrid && selectedGrid && (
            <>
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

              <div style={{ display: 'grid', gridTemplateColumns: `${isMobile ? 60 : 88}px repeat(3, 1fr)`, gap: 6 }}>
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
                            background: filled ? 'oklch(0.965 0.006 60)' : 'oklch(0.98 0.005 250)',
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

          {showResults && selectedGrid && (
            <div style={{ textAlign: 'center', padding: '24px 0', maxWidth: 560, margin: '0 auto' }}>
              <h2 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, margin: '0 0 20px', color: colors.primary }}>
                {progress.status === 'won' ? 'Perfect grid!' : 'Out of lives'}
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, maxWidth: 380, margin: '0 auto 28px' }}>
                <div style={{ background: 'oklch(0.97 0.01 250)', borderRadius: 8, padding: '16px 8px' }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, color: colors.primary }}>{solvedCount}/9</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted, marginTop: 4 }}>Cells Solved</div>
                </div>
                <div style={{ background: 'oklch(0.97 0.01 250)', borderRadius: 8, padding: '16px 8px' }}>
                  <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 26, color: colors.primary }}>{MAX_LIVES - progress.lives}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted, marginTop: 4 }}>Lives Used</div>
                </div>
              </div>

              <div style={{ textAlign: 'left', border: `1px solid ${colors.borderLight}`, borderRadius: 10, overflow: 'hidden', marginBottom: 32 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, padding: '12px 16px', background: 'oklch(0.98 0.01 250)', borderBottom: `1px solid ${colors.borderLight}` }}>Your Grid</div>
                {selectedGrid.rows.flatMap((row) =>
                  selectedGrid.cols.map((col) => {
                    const key = row.key + '|' + col.key;
                    const player = progress.answers[key];
                    return (
                      <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '10px 16px', borderBottom: `1px solid ${colors.borderLight}` }}>
                        <div style={{ fontSize: 12, color: colors.textMuted }}>{row.label} × {col.label}</div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: player ? colors.textBody : colors.textFaint }}>{player ? player.name : 'Not solved'}</div>
                      </div>
                    );
                  })
                )}
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={() => go('quizzes')}
                  style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 26px', fontSize: 14, fontWeight: 700, borderRadius: 999, cursor: 'pointer', fontFamily: fonts.body }}
                >
                  Play a Different Quiz
                </button>
                <div onClick={() => go('home')} style={{ alignSelf: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: 'oklch(0.4 0.01 250)', textDecoration: 'underline' }}>Return to Home</div>
              </div>
            </div>
          )}
        </div>

        {dailyCurrentDate && (
          <div style={{ width: isMobile ? '100%' : 250, flexShrink: 0 }}>
            <DailyPicker
              currentKind="footygrid"
              currentDate={dailyCurrentDate}
              axisDates={axisDates}
              hasItem={hasItem}
              statusText={statusText}
              dotState={dotState}
              onNavigate={handleDailyNavigate}
            />
          </div>
        )}
      </div>

      <RecommendedQuizzes quizzes={quizzes} attempts={attempts} questionCounts={questionCounts} startQuiz={startQuiz} goQuizzes={() => go('quizzes')} />

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
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'oklch(0.965 0.006 60)')}
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
