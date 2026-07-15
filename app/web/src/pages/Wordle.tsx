import { useEffect, useState, useCallback } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchWordlePuzzles, fetchMyWordleAttempts, submitWordleGuess } from '../lib/api';
import type { WordlePuzzlePublic, WordleGuess } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import type { User } from '@supabase/supabase-js';

const WORDLE_COLOR: Record<string, string> = { correct: 'oklch(0.62 0.15 145)', present: 'oklch(0.75 0.14 85)', absent: 'oklch(0.5 0.01 250)' };
const KEY_ROWS = [['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'], ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'], ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫']];
const PRAISE = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!', 'Nice one!', 'Got it!'];

function maxGuessesFor(wordLength: number) {
  return Math.max(6, wordLength + 1);
}

function evalGuess(guess: string, answer: string): ('correct' | 'present' | 'absent')[] {
  const len = answer.length;
  const g = guess.split(''), a = answer.split('');
  const result: ('correct' | 'present' | 'absent')[] = Array(len).fill('absent');
  const used = Array(len).fill(false);
  for (let i = 0; i < len; i++) {
    if (g[i] === a[i]) { result[i] = 'correct'; used[i] = true; }
  }
  for (let i = 0; i < len; i++) {
    if (result[i] === 'correct') continue;
    const idx = a.findIndex((ch, j) => ch === g[i] && !used[j]);
    if (idx > -1) { result[i] = 'present'; used[idx] = true; }
  }
  return result;
}

export default function Wordle({ go, user, isMobile }: { go: (v: ViewName) => void; user: User | null; isMobile: boolean }) {
  const [puzzles, setPuzzles] = useState<WordlePuzzlePublic[]>([]);
  const [myAttempts, setMyAttempts] = useState<Record<string, { guesses: WordleGuess[]; status: string }>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [autoSelected, setAutoSelected] = useState(false);
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

  useEffect(() => {
    if (puzzles.length > 0 && !autoSelected) {
      setAutoSelected(true);
      startPuzzle(puzzles[puzzles.length - 1].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzles, autoSelected]);

  const activePuzzle = puzzles.find((p) => p.id === activeId);
  const wordLength = activePuzzle ? activePuzzle.word.length : 5;
  const maxGuesses = maxGuessesFor(wordLength);

  const submitGuess = useCallback(async () => {
    if (status !== 'playing' || !activeId || submitting) return;
    const answer = puzzles.find((p) => p.id === activeId)?.word;
    if (!answer) return;
    if (currentGuess.length < answer.length) { setMessage('Not enough letters'); return; }
    const guessWord = currentGuess;
    const priorGuesses = guesses;
    const newGuesses = [...priorGuesses, { word: guessWord, result: evalGuess(guessWord, answer) }];
    const newStatus: 'playing' | 'won' | 'lost' = guessWord === answer ? 'won' : newGuesses.length >= maxGuessesFor(answer.length) ? 'lost' : 'playing';

    setGuesses(newGuesses);
    setStatus(newStatus);
    setCurrentGuess('');
    if (newStatus === 'won') setMessage(PRAISE[Math.min(newGuesses.length - 1, PRAISE.length - 1)]);
    else if (newStatus === 'lost') setMessage('Out of guesses — the word was ' + answer);
    else setMessage('');

    setSubmitting(true);
    try {
      await submitWordleGuess(activeId, guessWord, priorGuesses);
      if (user && newStatus !== 'playing') {
        fetchMyWordleAttempts(user.id).then(setMyAttempts);
      }
    } finally {
      setSubmitting(false);
    }
  }, [activeId, currentGuess, guesses, status, submitting, user, puzzles]);

  useEffect(() => {
    if (!activeId || status !== 'playing') return;
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'Enter') { submitGuess(); return; }
      if (submitting) return;
      if (e.key === 'Backspace') { setCurrentGuess((g) => g.slice(0, -1)); return; }
      if (/^[a-zA-Z]$/.test(e.key)) {
        setCurrentGuess((g) => (g.length < wordLength ? g + e.key.toUpperCase() : g));
      }
    }
    window.addEventListener('keydown', onKeydown);
    return () => window.removeEventListener('keydown', onKeydown);
  }, [activeId, status, submitGuess, wordLength]);

  const tileSize = Math.max(28, Math.min(52, Math.floor(((isMobile ? 300 : 400) - 8 * (wordLength - 1)) / wordLength)));

  const letterStatus: Record<string, string> = {};
  guesses.forEach((g) => {
    g.word.split('').forEach((ch, idx) => {
      const s = g.result[idx];
      const rank: Record<string, number> = { correct: 3, present: 2, absent: 1 };
      if (!letterStatus[ch] || rank[s] > rank[letterStatus[ch]]) letterStatus[ch] = s;
    });
  });

  const isPlayView = !!activePuzzle && status === 'playing';
  const isResultView = !!activePuzzle && status !== 'playing';

  const renderBoard = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', marginBottom: 24 }}>
      {Array.from({ length: maxGuesses }).map((_, i) => {
        let cells: { letter: string; bg: string; border: string; color: string }[];
        if (i < guesses.length) {
          const g = guesses[i];
          cells = g.word.split('').map((ch, idx) => ({ letter: ch, bg: WORDLE_COLOR[g.result[idx]], border: WORDLE_COLOR[g.result[idx]], color: 'white' }));
        } else if (i === guesses.length && status === 'playing') {
          const chars = currentGuess.split('');
          cells = Array.from({ length: wordLength }).map((_, idx) => ({ letter: chars[idx] || '', bg: 'white', color: 'oklch(0.2 0.01 250)', border: chars[idx] ? 'oklch(0.5 0.01 250)' : 'oklch(0.88 0.01 250)' }));
        } else {
          cells = Array.from({ length: wordLength }).map(() => ({ letter: '', bg: 'white', color: 'oklch(0.2 0.01 250)', border: 'oklch(0.9 0.01 250)' }));
        }
        return (
          <div key={i} style={{ display: 'flex', gap: 8 }}>
            {cells.map((c, idx) => (
              <div key={idx} style={{ width: tileSize, height: tileSize, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(tileSize * 0.46), fontWeight: 700, fontFamily: fonts.heading, borderRadius: 4, textTransform: 'uppercase', background: c.bg, color: c.color, border: `2px solid ${c.border}` }}>
                {c.letter}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );

  return (
    <main style={{ flex: 1, maxWidth: 1000, margin: '0 auto', padding: isMobile ? '32px 20px 100px' : '72px 48px 120px', width: '100%' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 16 }}>← Back to Home</div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, margin: '0 0 24px', color: colors.primary }}>Football Wordle</h1>

      <div style={{ display: 'flex', gap: 40, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 320 }}>
          {isPlayView && activePuzzle && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: colors.primary }}>{activePuzzle.date} — {activePuzzle.category}</div>
                <div style={{ fontSize: 13, color: colors.textMuted }}>Guess {Math.min(guesses.length + 1, maxGuesses)} of {maxGuesses}</div>
              </div>
              <p style={{ fontSize: 14, color: colors.textMuted, margin: '0 0 28px' }}>{activePuzzle.hint}</p>

              {renderBoard()}

              <div style={{ minHeight: 24, textAlign: 'center', marginBottom: 16 }}>
                {message && (
                  <div style={{ fontSize: 14, fontWeight: 700, color: colors.textSecondary }}>{message}</div>
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
                            else if (submitting) return;
                            else if (k === '⌫') setCurrentGuess((g) => g.slice(0, -1));
                            else setCurrentGuess((g) => (g.length < wordLength ? g + k : g));
                          }}
                          style={{ minWidth: isWide ? 54 : 34, height: 46, padding: '0 8px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4, fontSize: isWide ? 11 : 13, fontWeight: 700, cursor: submitting ? 'default' : 'pointer', fontFamily: fonts.body, userSelect: 'none', background: bg, color, opacity: submitting && k !== 'ENTER' ? 0.5 : 1 }}
                        >
                          {k}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {isResultView && (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              {renderBoard()}
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, color: status === 'won' ? colors.success : colors.danger }}>{message}</div>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
                <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Return to Home</div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: isMobile ? '100%' : 260, flexShrink: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 10 }}>Other Days</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {puzzles.slice().reverse().map((w) => {
              const prior = myAttempts[w.id];
              const wMaxGuesses = maxGuessesFor(w.word.length);
              const statusText = !prior ? 'Not started' : (prior.status === 'won' ? `Solved in ${prior.guesses.length}/${wMaxGuesses}` : 'Not solved');
              const active = w.id === activeId;
              return (
                <div
                  key={w.id}
                  onClick={() => startPuzzle(w.id)}
                  style={{ border: `1px solid ${active ? colors.primary : 'oklch(0.9 0.01 250)'}`, background: active ? 'oklch(0.93 0.05 250)' : 'white', borderRadius: 8, padding: '12px 14px', cursor: 'pointer' }}
                >
                  <div style={{ fontWeight: 700, fontSize: 14, color: colors.textBody }}>{w.date}</div>
                  <div style={{ fontSize: 12, color: colors.textMuted }}>{w.category} · {w.word.length} letters</div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: colors.primary, marginTop: 2 }}>{statusText}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}
