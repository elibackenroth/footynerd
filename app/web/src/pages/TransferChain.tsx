import { useEffect, useState } from 'react';
import { colors, fonts } from '../lib/tokens';
import { fetchTransferClubs, fetchTransferLinks, checkTransferAnswer, completeTransferChain } from '../lib/api';
import type { TransferClub, TransferLinkPublic } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';

function ClubBadge({ club, size, ring }: { club: TransferClub | undefined; size: number; ring?: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = club && !broken;
  return (
    <div
      style={{
        width: size, height: size, borderRadius: size > 60 ? 8 : '50%', overflow: 'hidden',
        border: ring ? `2px solid ${ring}` : `1px solid ${colors.border}`,
        background: colors.panelBg, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: fonts.heading, fontWeight: 700, color: colors.primary, fontSize: size > 60 ? 22 : 14,
      }}
    >
      {showImage ? (
        <img
          src={`/club-logos/${club!.id}.webp`}
          alt={club!.name}
          style={{ width: '100%', height: '100%', objectFit: 'contain', padding: size > 60 ? 12 : 6 }}
          onError={() => setBroken(true)}
        />
      ) : (
        club ? club.short_name.split(' ').map((w) => w[0]).slice(0, 2).join('') : '?'
      )}
    </div>
  );
}

export default function TransferChain({ go }: { go: (v: ViewName) => void }) {
  const [clubs, setClubs] = useState<TransferClub[]>([]);
  const [links, setLinks] = useState<TransferLinkPublic[]>([]);
  const [step, setStep] = useState(0);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState<'playing' | 'correct' | 'wrong' | 'finished'>('playing');
  const [score, setScore] = useState(0);
  const [answerReveal, setAnswerReveal] = useState('');
  const [pointsAwardedText, setPointsAwardedText] = useState('');
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetchTransferClubs().then(setClubs);
    fetchTransferLinks().then(setLinks);
  }, []);

  const clubById = (id: string) => clubs.find((c) => c.id === id);
  const currentLink = links[Math.min(step, links.length - 1)];
  const notFinished = status !== 'finished';

  async function submit() {
    if (status !== 'playing' || !input.trim() || !currentLink || checking) return;
    setChecking(true);
    try {
      const res = await checkTransferAnswer(currentLink.position, input);
      setAnswerReveal(res.display);
      setStatus(res.correct ? 'correct' : 'wrong');
      if (res.correct) setScore((s) => s + 1);
    } finally {
      setChecking(false);
    }
  }

  async function next() {
    const nextStep = step + 1;
    if (nextStep >= links.length) {
      const res = await completeTransferChain(score);
      setPointsAwardedText(res.persisted ? '+10 points earned for completing the chain' : 'Sign in to save your Transfer Chain points');
      setStep(nextStep);
      setStatus('finished');
    } else {
      setStep(nextStep);
      setInput('');
      setStatus('playing');
    }
  }

  function playAgain() {
    setStep(0);
    setInput('');
    setStatus('playing');
    setScore(0);
    setAnswerReveal('');
    setPointsAwardedText('');
  }

  const finalMessage =
    score === links.length ? 'Perfect chain — you know your transfers.' : score >= links.length * 0.6 ? 'Solid work tracing the chain.' : 'A tough chain — give it another run.';

  return (
    <main style={{ flex: 1, maxWidth: 760, margin: '0 auto', padding: '72px 48px 120px', width: '100%' }}>
      <div onClick={() => go('home')} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>← Back to Home</div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary, marginBottom: 20 }}>Transfer Chain</div>

      {notFinished && (
        <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 8px' }}>
          Type the surname of a player who has played for all three clubs shown — no accents needed. Round {step + 1} of {links.length}.
        </p>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', margin: '28px 0 40px', padding: 20, background: 'oklch(0.97 0.005 250)', borderRadius: 8 }}>
        {clubs.map((c) => {
          const inRound = notFinished && currentLink?.club_ids.includes(c.id);
          return (
            <div key={c.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, width: 64 }}>
              <ClubBadge club={c} size={52} ring={inRound ? colors.primary : 'oklch(0.9 0.01 250)'} />
              <div style={{ fontSize: 9, fontWeight: 600, textAlign: 'center', lineHeight: 1.2, color: colors.textMuted }}>{c.short_name}</div>
            </div>
          );
        })}
      </div>

      {notFinished && currentLink && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20, marginBottom: 32, flexWrap: 'wrap' }}>
            {currentLink.club_ids.map((id) => {
              const c = clubById(id);
              return (
                <div key={id} style={{ textAlign: 'center' }}>
                  <div style={{ marginBottom: 10 }}><ClubBadge club={c} size={110} /></div>
                  <div style={{ fontWeight: 700, fontSize: 14 }}>{c?.short_name}</div>
                </div>
              );
            })}
          </div>

          <div style={{ maxWidth: 360, margin: '0 auto' }}>
            {status === 'playing' ? (
              <>
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
                  placeholder="Player surname"
                  disabled={checking}
                  style={{ width: '100%', padding: '14px 16px', border: '1px solid oklch(0.85 0.01 250)', borderRadius: 4, fontSize: 15, fontFamily: fonts.body, textAlign: 'center', marginBottom: 16, opacity: checking ? 0.6 : 1 }}
                />
                <button onClick={submit} disabled={checking} style={{ width: '100%', background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: checking ? 'default' : 'pointer', fontFamily: fonts.body, opacity: checking ? 0.7 : 1 }}>{checking ? 'Checking...' : 'Submit'}</button>
              </>
            ) : (
              <>
                <div style={{ textAlign: 'center', fontSize: 16, fontWeight: 700, marginBottom: 8, color: status === 'correct' ? colors.success : colors.danger }}>
                  {status === 'correct' ? 'Correct!' : 'Not quite.'}
                </div>
                <div style={{ textAlign: 'center', fontSize: 14, color: colors.textMuted, marginBottom: 20 }}>Answer: {answerReveal}</div>
                <button onClick={next} style={{ width: '100%', background: colors.textBody, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>
                  {step + 1 >= links.length ? 'See Final Score' : 'Next Round'}
                </button>
              </>
            )}
          </div>
        </>
      )}

      {!notFinished && (
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, margin: '0 0 12px', color: colors.primary }}>{score} / {links.length} rounds solved</h1>
          <p style={{ fontSize: 14, color: colors.success, fontWeight: 600, margin: '0 0 12px' }}>{pointsAwardedText}</p>
          <p style={{ fontSize: 15, color: colors.textMuted, margin: '0 0 32px' }}>{finalMessage}</p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <button onClick={playAgain} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play Again</button>
            <div onClick={() => go('home')} style={{ alignSelf: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Done</div>
          </div>
        </div>
      )}
    </main>
  );
}
