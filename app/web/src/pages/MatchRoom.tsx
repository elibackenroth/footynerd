import { colors, fonts, DIFFICULTY_LABEL, initials } from '../lib/tokens';
import type { Quiz } from '../lib/types';
import type { MatchFull } from '../lib/api';

function computeSeriesText(rows: { result: string }[]) {
  let w = 0, l = 0, t = 0;
  rows.forEach((r) => { if (r.result === 'W') w++; else if (r.result === 'L') l++; else t++; });
  return t ? `Series: ${w}-${l}-${t}` : `Series: ${w}-${l}`;
}

export default function MatchRoom({
  quizzes,
  match,
  identity,
  pickingRematch,
  setupQuizId,
  nameDraft,
  linkCopied,
  onPickQuiz,
  onNameDraftChange,
  onCreateRoom,
  onAcceptChallenge,
  onPlayTurn,
  onCopyLink,
  onStartRematchPick,
  onCreateNextRound,
  onLeave,
}: {
  quizzes: Quiz[];
  match: MatchFull | null;
  identity: string | null;
  pickingRematch: boolean;
  setupQuizId: string;
  nameDraft: string;
  linkCopied: boolean;
  onPickQuiz: (id: string) => void;
  onNameDraftChange: (v: string) => void;
  onCreateRoom: () => void;
  onAcceptChallenge: () => void;
  onPlayTurn: () => void;
  onCopyLink: () => void;
  onStartRematchPick: () => void;
  onCreateNextRound: () => void;
  onLeave: () => void;
}) {
  const round = match ? match.rounds[match.rounds.length - 1] : null;
  const roundNumber = match ? match.rounds.length : 0;
  const roundHasTwo = !!(round && round.entries.length === 2);
  const roundHasOne = !!(round && round.entries.length === 1);
  const iPlayedThisRound = roundHasOne && round!.entries[0].name === identity;

  const isSetupView = !match;
  const isRematchPickView = !!match && pickingRematch;
  const isResultView = !!match && !pickingRematch && roundHasTwo;
  const isWaitingView = !!match && !pickingRematch && roundHasOne && iPlayedThisRound;
  const isTurnView = !!match && !pickingRematch && roundHasOne && !iPlayedThisRound;

  const roundQuiz = round ? quizzes.find((q) => q.id === round.quiz_id) : null;
  const shareLink = match ? `${window.location.origin}${window.location.pathname}?match=${match.id}` : '';

  return (
    <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '72px 48px 120px', width: '100%' }}>
      <div onClick={onLeave} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>← Back to Home</div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryLight, marginBottom: 20 }}>Match Room</div>

      {isSetupView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, margin: '0 0 12px', color: colors.primary }}>Challenge a Friend</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Pick a quiz and enter your name. You'll play first, then get a link to send your friend.</p>
          <QuizChoices quizzes={quizzes} selected={setupQuizId} onPick={onPickQuiz} />
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 10 }}>Your name</div>
          <div style={{ display: 'flex', gap: 12, maxWidth: 420, marginBottom: 32 }}>
            <input value={nameDraft} onChange={(e) => onNameDraftChange(e.target.value)} placeholder="Your name" style={{ flex: 1, padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body }} />
          </div>
          <button onClick={onCreateRoom} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play &amp; Create Room</button>
        </>
      )}

      {isRematchPickView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, margin: '0 0 12px', color: colors.primary }}>Pick the Next Quiz</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Round {roundNumber + 1} — choose a quiz, then play it.</p>
          <QuizChoices quizzes={quizzes} selected={setupQuizId} onPick={onPickQuiz} />
          <button onClick={onCreateNextRound} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play This Round</button>
        </>
      )}

      {isTurnView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, margin: '0 0 12px', color: colors.primary }}>{round!.entries[0].name} challenged you</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Quiz: <strong>{roundQuiz?.title}</strong>. Play it now to see who scores higher.</p>
          {!identity ? (
            <>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 10 }}>Your name</div>
              <div style={{ display: 'flex', gap: 12, maxWidth: 420, marginBottom: 28 }}>
                <input value={nameDraft} onChange={(e) => onNameDraftChange(e.target.value)} placeholder="Your name" style={{ flex: 1, padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body }} />
              </div>
              <button onClick={onAcceptChallenge} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Accept &amp; Play</button>
            </>
          ) : (
            <button onClick={onPlayTurn} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play Now</button>
          )}
        </>
      )}

      {isWaitingView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, margin: '0 0 12px', color: colors.primary }}>
            You scored {round!.entries[0].score}/{round!.entries[0].total}
          </h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Send this link to your friend so they can play <strong>{roundQuiz?.title}</strong> and see how they compare.</p>
          <div style={{ display: 'flex', gap: 12, maxWidth: 520, marginBottom: 16 }}>
            <input value={shareLink} readOnly style={{ flex: 1, padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary }} />
            <button onClick={onCopyLink} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: fonts.body }}>Copy Link</button>
          </div>
          {linkCopied && <div style={{ fontSize: 13, fontWeight: 600, color: colors.success }}>Link copied — waiting for your friend to play.</div>}
        </>
      )}

      {isResultView && round && (
        <MatchResult quizzes={quizzes} match={match!} round={round} identity={identity} onStartRematchPick={onStartRematchPick} onLeave={onLeave} />
      )}
    </main>
  );
}

function QuizChoices({ quizzes, selected, onPick }: { quizzes: Quiz[]; selected: string; onPick: (id: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px,1fr))', gap: 12, marginBottom: 32 }}>
      {quizzes.map((q) => {
        const isSelected = selected === q.id;
        return (
          <div
            key={q.id}
            onClick={() => onPick(q.id)}
            style={{
              border: isSelected ? `2px solid ${colors.primary}` : `1px solid oklch(0.9 0.01 250)`,
              background: isSelected ? colors.panelBg : 'white',
              borderRadius: 4, padding: '14px 16px', cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{q.title}</div>
            <div style={{ fontSize: 12, color: colors.textMuted }}>{DIFFICULTY_LABEL[q.difficulty]} · {q.points} pts</div>
          </div>
        );
      })}
    </div>
  );
}

function MatchResult({
  quizzes,
  match,
  round,
  identity,
  onStartRematchPick,
  onLeave,
}: {
  quizzes: Quiz[];
  match: MatchFull;
  round: MatchFull['rounds'][number];
  identity: string | null;
  onStartRematchPick: () => void;
  onLeave: () => void;
}) {
  const meEntry = round.entries.find((e) => e.name === identity) || round.entries[0];
  const oppEntry = round.entries.find((e) => e !== meEntry) || round.entries[1];
  const totalCorrect = meEntry.score + oppEntry.score || 1;
  const mePct = Math.round((meEntry.score / totalCorrect) * 100);
  const oppPct = 100 - mePct;
  const winnerText = meEntry.score > oppEntry.score ? 'You win this round!' : oppEntry.score > meEntry.score ? `${oppEntry.name} wins this round` : "It's a tie!";
  const roundQuiz = quizzes.find((q) => q.id === round.quiz_id);

  const historyRows = match.rounds
    .filter((r) => r.entries.length === 2)
    .map((r) => {
      const q2 = quizzes.find((q) => q.id === r.quiz_id);
      const me2 = r.entries.find((e) => e.name === identity) || r.entries[0];
      const opp2 = r.entries.find((e) => e !== me2) || r.entries[1];
      const result = me2.score > opp2.score ? 'W' : me2.score < opp2.score ? 'L' : 'T';
      return { title: q2?.title ?? '', myScore: me2.score, oppScore: opp2.score, result };
    });

  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.primaryLight, marginBottom: 6 }}>
        Round {match.rounds.length} · {roundQuiz?.title}
      </div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, margin: '0 0 32px', color: colors.primary }}>{winnerText}</h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, margin: '0 auto 10px' }}>{initials(identity)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{identity || 'You'}</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, color: colors.primary }}>{meEntry.score}/{meEntry.total}</div>
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, color: colors.textFaint }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.matchOpponent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, margin: '0 auto 10px' }}>{initials(oppEntry.name)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{oppEntry.name}</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, color: colors.matchOpponent }}>{oppEntry.score}/{oppEntry.total}</div>
        </div>
      </div>

      <div style={{ height: 14, borderRadius: 7, background: 'oklch(0.93 0.01 250)', overflow: 'hidden', display: 'flex', marginBottom: 8 }}>
        <div style={{ height: '100%', background: colors.primary, width: `${mePct}%` }} />
        <div style={{ height: '100%', background: colors.matchOpponent, width: `${oppPct}%` }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: colors.textMuted, marginBottom: 40 }}>
        <span>{mePct}%</span>
        <span>{oppPct}%</span>
      </div>

      <div style={{ borderTop: `1px solid ${colors.borderLight}`, paddingTop: 28, marginBottom: 32 }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{computeSeriesText(historyRows)}</div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {historyRows.map((row, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid oklch(0.95 0.01 250)', fontSize: 14 }}>
              <div style={{ fontWeight: 600 }}>{row.title}</div>
              <div style={{ color: colors.textMuted }}>{row.myScore} – {row.oppScore}</div>
              <div style={{ fontWeight: 700 }}>{row.result}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        <button onClick={onStartRematchPick} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play Next Round</button>
        <div onClick={onLeave} style={{ alignSelf: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 600, color: colors.textBody, textDecoration: 'underline' }}>Done</div>
      </div>
    </>
  );
}
