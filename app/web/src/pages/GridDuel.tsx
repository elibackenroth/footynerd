import { colors, fonts, initials } from '../lib/tokens';
import type { FootygridGrid } from '../lib/types';
import type { GridDuelFull } from '../lib/api';

function formatDuelTime(ms: number) {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

function duelRoundWinner(meE: { solved: number; time_ms: number; lives_used: number }, oppE: { solved: number; time_ms: number; lives_used: number }) {
  const meDone = meE.solved === 9, oppDone = oppE.solved === 9;
  if (meDone && oppDone) {
    if (meE.time_ms < oppE.time_ms) return 'me';
    if (oppE.time_ms < meE.time_ms) return 'opp';
    return 'tie';
  }
  if (meDone && !oppDone) return 'me';
  if (oppDone && !meDone) return 'opp';
  if (meE.solved > oppE.solved) return 'me';
  if (oppE.solved > meE.solved) return 'opp';
  if (meE.lives_used < oppE.lives_used) return 'me';
  if (oppE.lives_used < meE.lives_used) return 'opp';
  return 'tie';
}

export default function GridDuel({
  grids,
  gridDuel,
  identity,
  pickingRematch,
  setupGridId,
  nameDraft,
  linkCopied,
  onPickGrid,
  onNameDraftChange,
  onCreateRoom,
  onAcceptChallenge,
  onPlayTurn,
  onCopyLink,
  onStartRematchPick,
  onCreateNextRound,
  onLeave,
}: {
  grids: FootygridGrid[];
  gridDuel: GridDuelFull | null;
  identity: string | null;
  pickingRematch: boolean;
  setupGridId: string;
  nameDraft: string;
  linkCopied: boolean;
  onPickGrid: (id: string) => void;
  onNameDraftChange: (v: string) => void;
  onCreateRoom: () => void;
  onAcceptChallenge: () => void;
  onPlayTurn: () => void;
  onCopyLink: () => void;
  onStartRematchPick: () => void;
  onCreateNextRound: () => void;
  onLeave: () => void;
}) {
  const round = gridDuel ? gridDuel.rounds[gridDuel.rounds.length - 1] : null;
  const roundNumber = gridDuel ? gridDuel.rounds.length : 0;
  const roundHasTwo = !!(round && round.entries.length === 2);
  const roundHasOne = !!(round && round.entries.length === 1);
  const iPlayedThisRound = roundHasOne && round!.entries[0].name === identity;

  const isSetupView = !gridDuel;
  const isRematchPickView = !!gridDuel && pickingRematch;
  const isResultView = !!gridDuel && !pickingRematch && roundHasTwo;
  const isWaitingView = !!gridDuel && !pickingRematch && roundHasOne && iPlayedThisRound;
  const isTurnView = !!gridDuel && !pickingRematch && roundHasOne && !iPlayedThisRound;

  const roundGrid = round ? grids.find((g) => g.id === round.grid_id) : null;
  const shareLink = gridDuel ? `${window.location.origin}${window.location.pathname}?duel=${gridDuel.id}` : '';

  const myEntry = round ? round.entries.find((e) => e.name === identity) : null;

  return (
    <main style={{ flex: 1, maxWidth: 640, margin: '0 auto', padding: '72px 48px 120px', width: '100%' }}>
      <div onClick={onLeave} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: colors.textMuted, marginBottom: 8 }}>← Back to Home</div>
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primaryLight, marginBottom: 20 }}>Grid Duel</div>

      {isSetupView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, margin: '0 0 12px', color: colors.primary }}>Challenge a Friend to a Grid</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>
            Pick a FootyGrid puzzle and enter your name. You and your friend can each play whenever it suits you — whoever fills the grid faster wins the round (most cells filled breaks ties if neither finishes).
          </p>
          <GridChoices grids={grids} selected={setupGridId} onPick={onPickGrid} />
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 10 }}>Your name</div>
          <div style={{ display: 'flex', gap: 12, maxWidth: 420, marginBottom: 32 }}>
            <input value={nameDraft} onChange={(e) => onNameDraftChange(e.target.value)} placeholder="Your name" style={{ flex: 1, padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 15, fontFamily: fonts.body }} />
          </div>
          <button onClick={onCreateRoom} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play &amp; Create Room</button>
        </>
      )}

      {isRematchPickView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 38, margin: '0 0 12px', color: colors.primary }}>Pick the Next Grid</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Round {roundNumber + 1} — choose a grid, then play it.</p>
          <GridChoices grids={grids} selected={setupGridId} onPick={onPickGrid} />
          <button onClick={onCreateNextRound} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 32px', fontSize: 15, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}>Play This Round</button>
        </>
      )}

      {isTurnView && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, margin: '0 0 12px', color: colors.primary }}>{round!.entries[0].name} challenged you</h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Grid: <strong>{roundGrid?.date}</strong>. Play it now to see who fills more cells.</p>
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

      {isWaitingView && myEntry && (
        <>
          <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 36, margin: '0 0 12px', color: colors.primary }}>
            You solved {myEntry.solved}/9 in {formatDuelTime(myEntry.time_ms)}
          </h1>
          <p style={{ fontSize: 15, color: colors.textSecondary, margin: '0 0 32px' }}>Send this link to your friend so they can race <strong>{roundGrid?.date}</strong> at their own time and see who's faster.</p>
          <div style={{ display: 'flex', gap: 12, maxWidth: 520, marginBottom: 16 }}>
            <input value={shareLink} readOnly style={{ flex: 1, padding: '14px 16px', border: `1px solid ${colors.border}`, borderRadius: 4, fontSize: 13, fontFamily: fonts.body, color: colors.textSecondary }} />
            <button onClick={onCopyLink} style={{ background: colors.primary, color: 'white', border: 'none', padding: '14px 24px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: fonts.body }}>Copy Link</button>
          </div>
          {linkCopied && <div style={{ fontSize: 13, fontWeight: 600, color: colors.success }}>Link copied — waiting for your friend to play.</div>}
        </>
      )}

      {isResultView && round && (
        <GridDuelResult grids={grids} gridDuel={gridDuel!} round={round} identity={identity} onStartRematchPick={onStartRematchPick} onLeave={onLeave} />
      )}
    </main>
  );
}

function GridChoices({ grids, selected, onPick }: { grids: FootygridGrid[]; selected: string; onPick: (id: string) => void }) {
  return (
    <>
      <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted, marginBottom: 12 }}>Choose a grid</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px,1fr))', gap: 12, marginBottom: 32 }}>
        {grids.slice().reverse().map((g) => {
          const isSelected = selected === g.id;
          return (
            <div
              key={g.id}
              onClick={() => onPick(g.id)}
              style={{
                border: `1px solid ${isSelected ? colors.primary : 'oklch(0.9 0.01 250)'}`,
                background: isSelected ? 'oklch(0.95 0.05 250)' : 'white',
                borderRadius: 8, padding: 14, cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 14 }}>{g.date}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function GridDuelResult({
  grids,
  gridDuel,
  round,
  identity,
  onStartRematchPick,
  onLeave,
}: {
  grids: FootygridGrid[];
  gridDuel: GridDuelFull;
  round: GridDuelFull['rounds'][number];
  identity: string | null;
  onStartRematchPick: () => void;
  onLeave: () => void;
}) {
  const meEntry = round.entries.find((e) => e.name === identity) || round.entries[0];
  const oppEntry = round.entries.find((e) => e !== meEntry) || round.entries[1];
  const totalSolved = meEntry.solved + oppEntry.solved || 1;
  const mePct = Math.round((meEntry.solved / totalSolved) * 100);
  const oppPct = 100 - mePct;
  const outcome = duelRoundWinner(meEntry, oppEntry);
  const bothDone = meEntry.solved === 9 && oppEntry.solved === 9;
  const winnerText = outcome === 'tie' ? "It's a tie!" : outcome === 'me' ? (bothDone ? 'You win this round — faster time!' : 'You win this round!') : (bothDone ? `${oppEntry.name} wins this round — faster time!` : `${oppEntry.name} wins this round`);
  const roundGrid = grids.find((g) => g.id === round.grid_id);

  const historyRows = gridDuel.rounds
    .filter((r) => r.entries.length === 2)
    .map((r) => {
      const g2 = grids.find((g) => g.id === r.grid_id);
      const me2 = r.entries.find((e) => e.name === identity) || r.entries[0];
      const opp2 = r.entries.find((e) => e !== me2) || r.entries[1];
      const outcome2 = duelRoundWinner(me2, opp2);
      const result = outcome2 === 'me' ? 'W' : outcome2 === 'opp' ? 'L' : 'T';
      return { title: g2?.date ?? '', myScore: `${me2.solved}/9 · ${formatDuelTime(me2.time_ms)}`, oppScore: `${opp2.solved}/9 · ${formatDuelTime(opp2.time_ms)}`, result };
    });
  const wins = historyRows.filter((r) => r.result === 'W').length;
  const losses = historyRows.filter((r) => r.result === 'L').length;
  const seriesText = wins === losses ? `Series tied ${wins}-${losses}` : wins > losses ? `You lead the series ${wins}-${losses}` : `${oppEntry.name} leads the series ${losses}-${wins}`;

  return (
    <>
      <div style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.primaryLight, marginBottom: 6 }}>
        Round {gridDuel.rounds.length} · {roundGrid?.date}
      </div>
      <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 32, margin: '0 0 32px', color: colors.primary }}>{winnerText}</h1>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 28, marginBottom: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.primary, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, margin: '0 auto 10px' }}>{initials(meEntry.name)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{meEntry.name}</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, color: colors.primary }}>{meEntry.solved}/9</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>{formatDuelTime(meEntry.time_ms)} · {meEntry.lives_used} lives used</div>
        </div>
        <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, color: colors.textFaint }}>VS</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.matchOpponent, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 22, margin: '0 auto 10px' }}>{initials(oppEntry.name)}</div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{oppEntry.name}</div>
          <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 30, color: colors.matchOpponent }}>{oppEntry.solved}/9</div>
          <div style={{ fontSize: 12, color: colors.textMuted }}>{formatDuelTime(oppEntry.time_ms)} · {oppEntry.lives_used} lives used</div>
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
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 16 }}>{seriesText}</div>
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
