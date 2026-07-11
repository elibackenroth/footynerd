import { colors, fonts, DIFFICULTY_LABEL } from '../lib/tokens';
import type { Quiz } from '../lib/types';
import type { ViewName } from '../lib/viewTypes';
import QuizImage from '../components/QuizImage';

const FEATURED_IDS = ['worldcup', 'legends', 'ballondor'];

export default function Home({
  quizzes,
  go,
  startQuiz,
  startMatchSetup,
  startWordlePicker,
  startTransferChain,
}: {
  quizzes: Quiz[];
  go: (v: ViewName) => void;
  startQuiz: (id: string) => void;
  startMatchSetup: () => void;
  startWordlePicker: () => void;
  startTransferChain: () => void;
}) {
  const featured = FEATURED_IDS.map((id) => quizzes.find((q) => q.id === id)).filter(Boolean) as Quiz[];

  return (
    <main style={{ flex: 1, width: '100%' }}>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '120px 48px 100px', textAlign: 'center' }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 64, letterSpacing: 0.5, margin: '0 0 20px', lineHeight: 1.05, color: colors.primary }}>
          Know your football?
        </h1>
        <p style={{ fontSize: 19, color: colors.textSecondary, margin: '0 0 40px', lineHeight: 1.5 }}>
          Soccer trivia across players, leagues, and national team history. Pass a quiz to earn points, and come back daily to build your streak.
        </p>
        <button
          onClick={() => go('quizzes')}
          style={{ background: colors.primary, color: 'white', border: 'none', padding: '16px 36px', fontSize: 16, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
        >
          Browse Quizzes
        </button>
      </div>

      <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 48px 80px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 20, textAlign: 'left' }}>
          <ModeCard
            eyebrow="Friend vs Friend"
            title="Start a Match Room"
            desc="Pick a quiz, play it, then send your friend the link to see who scores higher."
            buttonLabel="Start a Match Room"
            onClick={startMatchSetup}
          />
          <ModeCard
            eyebrow="Word Game"
            title="Football Wordle"
            desc="Guess the five-letter football word in six tries. Two puzzles to try."
            buttonLabel="Play Wordle"
            onClick={startWordlePicker}
          />
          <ModeCard
            eyebrow="Club Trivia"
            title="Transfer Chain"
            desc="9 rounds. Name the player who played for all three clubs shown."
            buttonLabel="Play Transfer Chain"
            onClick={startTransferChain}
          />
        </div>
      </div>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '0 48px 100px' }}>
        <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 28, margin: '0 0 40px', textAlign: 'center', color: colors.primary }}>
          Featured Quizzes
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 28, marginBottom: 40 }}>
          {featured.map((quiz) => (
            <div key={quiz.id} style={{ border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: '100%', height: 140 }}>
                <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
              </div>
              <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>
                  {DIFFICULTY_LABEL[quiz.difficulty]} · {quiz.points} pts
                </div>
                <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 22, margin: 0, lineHeight: 1.15, color: colors.primary }}>{quiz.title}</h3>
                <p style={{ fontSize: 14, color: colors.textMuted, margin: 0, lineHeight: 1.5, flex: 1 }}>{quiz.description}</p>
                <button
                  onClick={() => startQuiz(quiz.id)}
                  style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '10px 20px', fontSize: 13, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
                >
                  Start Quiz
                </button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => go('quizzes')}
            style={{ background: 'transparent', color: colors.primary, border: `1px solid ${colors.primary}`, padding: '12px 28px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
          >
            View All Quizzes
          </button>
        </div>
      </div>
    </main>
  );
}

function ModeCard({ eyebrow, title, desc, buttonLabel, onClick }: { eyebrow: string; title: string; desc: string; buttonLabel: string; onClick: () => void }) {
  return (
    <div style={{ background: colors.panelBg, border: `1px solid ${colors.panelBorder}`, borderRadius: 8, padding: '24px 24px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary, marginBottom: 6 }}>{eyebrow}</div>
        <h3 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 21, margin: '0 0 6px', color: colors.textBody }}>{title}</h3>
        <p style={{ fontSize: 14, color: colors.textMuted, margin: 0 }}>{desc}</p>
      </div>
      <button
        onClick={onClick}
        style={{ width: '100%', boxSizing: 'border-box', textAlign: 'center', background: colors.primary, color: 'white', border: 'none', padding: '14px 20px', fontSize: 14, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
