import { useEffect, useState, useCallback } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchWordlePuzzles, fetchMyWordleAttempts, submitWordleGuess } from '../lib/api';
import type { WordlePuzzlePublic, WordleGuess } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import type { User } from '@supabase/supabase-js';

const WORDLE_COLOR: Record<string, string> = { correct: 'oklch(0.62 0.15 145)', present: 'oklch(0.75 0.14 85)', absent: 'oklch(0.5 0.01 250)' };
const KEY_ROWS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']];
const PRAISE = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];

export default function Wordle({ go, user }: { go: (v: ViewName) => void; user: User | null }) {
  const [puzzles, setPuzzles] = useState<WordlePuzzlePublic[]>([]);
  const [myAttempts, setMyAttempts] = useState<Record<string, { guesses: WordleGuess[]; status: string }>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [guesses, setGuesses] = useState<WordleGuess[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [status, setStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchWordlePuzzles().then(setPuzzles);
    if (user) fetchMyWordleAttempts(user.id).then(setMyAttempts);
  }, [user]);

  function startPuzzle(id: string) {
    const prior = myAttempts[id];
    if (prior) {
      setActiveId(id);
      setGuesses(prior.guesses);
      setCurrentGuess('');
      setStatus(prior.status as any);
      setMessage(prior.status === 'won' ? 'You already solved this one.' : 'You already used all your guesses.');
      return;
    }
    setActiveId(id);
    setGuesses([]);
    setCurrentGuess('');
    setStatus('playing');
    setMessage('');
  }

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || !activeId || submitting) return;
    if (currentGuess.length < 5) { setMessage('Not enough letters'); return; }
    setSubmitting(true);
    try {
      const res = await submitWordleGuess(activeId, currentGuess, guesses);
      if (res.locked) {
        setGuesses(res.guesses);
        setStatus(res.status as any);
        setMessage(res.status === 'won' ? 'You already solved this one.' : 'You already used all your guesses.');
      } else {
        setGuesses(res.guesses);
        setStatus(res.status as any);
        setCurrentGuess('');
        if (res.status === 'won') setMessage(PRAISE[res.guesses.length - 1] || 'Solved!');
        else if (res.status === 'lost') setMessage('Out of guesses.');
        else setMessage('');
      }
      if (user && res.status !== 'playing') {
        fetchMyWordleAttempts(user.id).then(setMyAttempts);
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeId, currentGuess, guesses, status, submitting, user]);

  useEffect(() => {
    if (!activeId || status !== 'playing') return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') { submitGuess(); return; }
      if (e.key === 'Backspace') { setCurrentGuess((g) => g.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrentGuess((g) => (g.length < 5 ? g + e.key.toUpperCase() : g));
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [activeId, status, submitGuess]);

  const activePuzzle = puzzles.find((p) => p.id === activeId);

  const letterStatus: Record<string, string> = {};
  guesses.forEach((g) => {
    g.word.split('').forEach((ch, idx) => {
      const s = g.result[idx];
      const rank: Record<string, number> = { correct: 3, present: 2, absent: 1 };
      if (!letterStatus[ch] || rank[s] > rank[letterStatus[ch]]) letterStatus[ch] = s;
    });
  });

  return (
    <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '72px 48px 120px', width: '100%' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>← Back to Home</div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.wordleAccent, marginBottom: 20 }}>Football Wordle</div>

      {!activeId ? (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, margin: '0 0 12px', color: colors.primary }}>Choose a Puzzle</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Two five-letter football words. Six guesses each.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 16 }}>
            {puzzles.map((w) => {
              const prior = myAttempts[w.id];
              const statusText = prior ? (prior.status === 'won' ? `Solved in ${prior.guesses.length}/6` : `Not solved — try again`) : 'Not attempted';
              return (
                <div key={w.id} onClick={() => startPuzzle(w.id)} style={{ border: '1px solid oklch(0.88 0.06 95)', background: 'oklch(0.98 0.02 95)', borderRadius: 6, padding: 22, cursor: 'pointer' }}>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{w.label}</div>
                  <div style={{ fontSize: 13, color: colors.textMuted, marginBottom: 10 }}>{w.hint}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: colors.wordleAccent, letterSpacing: 0.3 }}>{statusText}</div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 28, margin: 0, color: colors.primary }}>{activePuzzle?.label}</h1>
            <div style={{ fontSize: 13, color: colors.textMuted }}>Guess {Math.min(guesses.length + (status === 'playing' ? 1 : 0), 6)} of 6</div>
          </div>
          <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 28px' }}>{activePuzzle?.hint}</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginBottom: 24 }}>
            {Array.from({ length: 6 }).map((_, i) => {
              let cells: { letter: string; bg: string; border: string; color: string }[];
              if (i < guesses.length) {
                const g = guesses[i];
                cells = g.word.split('').map((ch, idx) => ({ letter: ch, bg: WORDLE_COLOR[g.result[idx]], border: WORDLE_COLOR[g.result[idx]], color: 'white' }));
              } else if (i === guesses.length && status === 'playing') {
                const chars = currentGuess.split('');
                cells = Array.from({ length: 5 }).map((_, idx) => ({ letter: chars[idx] || '', bg: 'white', color: 'oklch(0.2 0.01 250)', border: chars[idx] ? 'oklch(0.5 0.01 250)' : 'oklch(0.88 0.01 250)' }));
              } else {
                cells = Array.from({ length: 5 }).map(() => ({ letter: '', bg: 'white', color: 'oklch(0.2 0.01 250)', border: 'oklch(0.9 0.01 250)' }));
              }
              return (
                <div key={i} style={{ display: 'flex', gap: 8 }}>
                  {cells.map((c, idx) => (
                    <div key={idx} style={{ width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, fontFamily: fonts.heading, borderRadius: 4, textTransform: 'uppercase', background: c.bg, color: c.color, border: `2px solid ${c.border}` }}>
                      {c.letter}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          <div style={{ minHeight: 24, textAlign: 'center', marginBottom: 16 }}>
            {message && (
              <div style={{ fontSize: 14, fontWeight: 700, color: status === 'won' ? colors.success : status === 'lost' ? colors.danger : colors.textSecondary }}>{message}</div>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginBottom: 24 }}>
            {KEY_ROWS.map((row, ri) => (
              <div key={ri} style={{ display: 'flex', gap: 6 }}>
                {row.map((k) => {
                  const isWide = k === 'ENTER' || k === '⌫';
                  let bg = 'oklch(0.88 0.01 250)', color = 'oklch(0.22 0.01 250)';
                  if (k.length === 1 && letterStatus[k]) { bg = WORDLE_COLOR[letterStatus[k]]; color = 'white'; }
                  return (
                    <div
                      key={k}
                      onClick={() => {
                        if (status !== 'playing') return;
                        if (k === 'ENTER') submitGuess();
                        else if (k === '⌫') setCurrentGuess((g) => g.slice(0, -1));
                        else setCurrentGuess((g) => (g.length < 5 ? g + k : g));
                      }}
                      style={{ minWidth: isWide ? 54 : 34, height: 46, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: isWide ? 11 : 13, fontWeight: 700, cursor: 'pointer', fontFamily: fonts.body, userSelect: 'none', background: bg, color }}
                    >
                      {k}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {status !== 'playing' && (
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
              <button onClick={() => setActiveId(null)} style={{ background: colors.wordleAccent, color: 'white', border: 'none', padding: '14px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play the Other Wordle</button>
              <div onClick={() => go('home')} style={{ alignSelf: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Done</div>
            </div>
          )}
        </>
      )}
    </main>
  );
}
