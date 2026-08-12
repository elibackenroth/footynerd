import { useState } from 'react';
import { colors, fonts, CATEGORIES, DIFFICULTIES, SORTS, DIFFICULTY_LABEL, quizDateLabel } from '../lib/tokens';
import type { Quiz, QuizAttempt } from '../lib/types';
import QuizImage from '../components/QuizImage';

function SearchBox({ value, onChange, isMobile }: { value: string; onChange: (v: string) => void; isMobile: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 9 : 8, background: 'white', border: '1px solid oklch(0.88 0.02 250)', borderRadius: 999, padding: isMobile ? '0 16px' : '8px 12px', height: isMobile ? 46 : undefined }}>
      <svg width={isMobile ? 16 : 14} height={isMobile ? 16 : 14} viewBox="0 0 24 24" fill="none" stroke="oklch(0.6 0.02 250)" strokeWidth={2.2} style={{ flexShrink: 0 }}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.5-4.5" /></svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Find a quiz"
        style={{ flex: 1, minWidth: 0, background: 'transparent', border: 'none', outline: 'none', fontFamily: fonts.body, fontSize: isMobile ? 16 : 13, color: 'oklch(0.25 0.01 250)' }}
      />
      {value && (
        <div onClick={() => onChange('')} style={{ cursor: 'pointer', color: 'oklch(0.6 0.02 250)', fontSize: isMobile ? 19 : 15, lineHeight: 1, flexShrink: 0, padding: isMobile ? 6 : 0 }}>×</div>
      )}
    </div>
  );
}

function AsideLink({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'block', padding: '6px 10px', borderRadius: 3, fontSize: 12, fontWeight: active ? 700 : 500, cursor: 'pointer', textAlign: 'left',
        background: active ? 'oklch(0.95 0.03 250)' : 'transparent',
        color: active ? colors.primary : 'oklch(0.65 0.01 250)',
      }}
    >
      {label}
    </div>
  );
}

export default function Quizzes({
  quizzes,
  attempts,
  questionCounts,
  activeCategory,
  setCategory,
  activeDifficulty,
  setDifficulty,
  activeSort,
  setSort,
  quizQuery,
  setQuizQuery,
  startQuiz,
  quizzesPassedCount,
  totalPoints,
  accountStreak,
  isMobile,
  isTablet,
}: {
  quizzes: Quiz[];
  attempts: Record<string, QuizAttempt>;
  questionCounts: Record<string, number>;
  activeCategory: string;
  setCategory: (id: string) => void;
  activeDifficulty: string;
  setDifficulty: (id: string) => void;
  activeSort: string;
  setSort: (id: string) => void;
  quizQuery: string;
  setQuizQuery: (v: string) => void;
  startQuiz: (id: string) => void;
  quizzesPassedCount: number;
  totalPoints: number;
  accountStreak: number;
  isMobile: boolean;
  isTablet: boolean;
}) {
  const [filtersSheetOpen, setFiltersSheetOpen] = useState(false);
  const [quizPage, setQuizPage] = useState(0);
  const [quizPageKey, setQuizPageKey] = useState('');

  const quizQueryNorm = quizQuery.trim().toLowerCase();

  const filteredBase = quizzes
    .map((q, idx) => ({ q, idx }))
    .filter(({ q }) => (activeCategory === 'mega' ? !!q.is_mega : !q.is_mega && (activeCategory === 'all' || q.category === activeCategory)))
    .filter(({ q }) => activeDifficulty === 'all' || q.difficulty === activeDifficulty)
    .filter(({ q }) => {
      if (!quizQueryNorm) return true;
      const questionText = ''; // question text isn't loaded on this page; title/description/difficulty already cover most searches
      const haystack = (q.title + ' ' + q.description + ' ' + DIFFICULTY_LABEL[q.difficulty] + ' ' + questionText).toLowerCase();
      return quizQueryNorm.split(/\s+/).every((term) => haystack.includes(term));
    });

  const titleMatchRank = (q: Quiz) => {
    const t = q.title.toLowerCase();
    if (t.startsWith(quizQueryNorm)) return 0;
    if (t.includes(quizQueryNorm)) return 1;
    if (q.description.toLowerCase().includes(quizQueryNorm)) return 2;
    return 3;
  };

  const filtered = filteredBase
    .slice()
    .sort((a, b) => {
      if (quizQueryNorm) return titleMatchRank(a.q) - titleMatchRank(b.q) || a.q.title.localeCompare(b.q.title);
      return a.q.date < b.q.date ? 1 : a.q.date > b.q.date ? -1 : b.idx - a.idx;
    })
    .map(({ q }) => q);

  const pageKey = [activeCategory, activeDifficulty, activeSort, quizQuery].join('|');
  const quizPageSize = isMobile ? 10 : (isTablet ? 12 : 15);
  const quizPageCount = Math.max(1, Math.ceil(filtered.length / quizPageSize));
  const quizPageIndex = Math.min(quizPageKey === pageKey ? quizPage : 0, quizPageCount - 1);
  if (quizPageKey !== pageKey) {
    // reset to page 0 whenever filters/search/sort change
    setQuizPageKey(pageKey);
    setQuizPage(0);
  }
  const quizPageStart = quizPageIndex * quizPageSize;
  const pagedQuizzes = filtered.slice(quizPageStart, quizPageStart + quizPageSize);
  const showQuizPager = filtered.length > quizPageSize;
  const quizPagerRangeText = filtered.length
    ? `Showing ${quizPageStart + 1}–${Math.min(quizPageStart + quizPageSize, filtered.length)} of ${filtered.length}`
    : '';
  const goToPage = (i: number) => { setQuizPage(i); setQuizPageKey(pageKey); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  const pagerPages = Array.from({ length: quizPageCount }, (_, i) => i).filter(
    (i) => i === 0 || i === quizPageCount - 1 || Math.abs(i - quizPageIndex) <= 1
  );

  const quizzesTotalCount = quizzes.filter((q) => !q.is_mega).length;
  const quizzesProgressPct = Math.round((quizzesPassedCount / Math.max(1, quizzesTotalCount)) * 100) + '%';
  const activeFilterCount = (activeCategory !== 'all' ? 1 : 0) + (activeDifficulty !== 'all' ? 1 : 0);
  const hasActiveFilters = activeFilterCount > 0;

  const filterListDesktop = (
    <>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textFaint, marginBottom: 10 }}>Category</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
        {CATEGORIES.map((c) => <AsideLink key={c.id} active={activeCategory === c.id} label={c.label} onClick={() => setCategory(c.id)} />)}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textFaint, marginBottom: 10 }}>Difficulty</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 24 }}>
        {DIFFICULTIES.map((d) => <AsideLink key={d.id} active={activeDifficulty === d.id} label={d.label} onClick={() => setDifficulty(d.id)} />)}
      </div>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textFaint, marginBottom: 10 }}>Order</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {SORTS.map((s) => <AsideLink key={s.id} active={activeSort === s.id} label={s.label} onClick={() => setSort(s.id)} />)}
      </div>
    </>
  );

  return (
    <main style={{ flex: 1, display: 'flex', flexDirection: isMobile ? 'column' : 'row', maxWidth: 1160, margin: '0 auto', width: '100%', position: 'relative', overflowX: 'hidden', boxSizing: 'border-box' }}>
      {!isMobile && (
        <aside style={{ width: 190, flexShrink: 0, padding: '80px 0 120px 48px' }}>
          <div style={{ marginBottom: 28 }}>
            <SearchBox value={quizQuery} onChange={setQuizQuery} isMobile={false} />
          </div>
          {filterListDesktop}
        </aside>
      )}

      <div style={isMobile ? { flex: 1, minWidth: 0, padding: '24px 20px 80px', maxWidth: 960 } : { flex: 1, minWidth: 0, padding: '80px 48px 120px', maxWidth: 960 }}>
        <h1 style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: isMobile ? 26 : 34, letterSpacing: 0.4, margin: '0 0 20px', lineHeight: 1.15, color: colors.primary }}>
          Test your ball knowledge.
        </h1>

        <div
          style={
            isMobile
              ? { border: '1px solid oklch(0.9 0.01 250)', borderRadius: 6, background: 'oklch(0.985 0.005 250)', padding: '14px 16px', marginBottom: 22 }
              : { borderTop: '1px solid oklch(0.91 0.01 250)', borderBottom: '1px solid oklch(0.91 0.01 250)', padding: '14px 2px', marginBottom: 30 }
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, lineHeight: 1, color: colors.primary }}>{totalPoints}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted }}>Points</div>
            </div>
            <div style={{ width: 1, height: 14, background: 'oklch(0.9 0.01 250)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, lineHeight: 1, color: colors.primary }}>{quizzesPassedCount} / {quizzesTotalCount}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted }}>Passed</div>
            </div>
            <div style={{ width: 1, height: 14, background: 'oklch(0.9 0.01 250)' }} />
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
              <div style={{ fontFamily: fonts.heading, fontWeight: 700, fontSize: 20, lineHeight: 1, color: colors.primary }}>{accountStreak}</div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.4, textTransform: 'uppercase', color: colors.textMuted }}>Day streak</div>
            </div>
            <div style={{ flex: 1, minWidth: 80 }} />
            <div style={{ width: 120, height: 4, borderRadius: 2, background: 'oklch(0.92 0.01 250)', overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, background: 'oklch(0.5 0.16 250)', width: quizzesProgressPct, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>

        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 18 }}>
            <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.textMuted }}>{filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'}</div>
          </div>
        )}

        {isMobile && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
            <SearchBox value={quizQuery} onChange={setQuizQuery} isMobile />
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                onClick={() => setFiltersSheetOpen(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, height: 46, padding: '0 18px', borderRadius: 999, fontSize: 14, fontWeight: 600, cursor: 'pointer', flexShrink: 0,
                  background: hasActiveFilters ? colors.primary : 'white', color: hasActiveFilters ? 'white' : 'oklch(0.35 0.01 250)',
                  border: `1px solid ${hasActiveFilters ? colors.primary : 'oklch(0.88 0.02 250)'}`,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={hasActiveFilters ? 'white' : 'oklch(0.5 0.02 250)'} strokeWidth={2.2} strokeLinecap="round"><line x1="3" y1="7" x2="21" y2="7" /><line x1="6" y1="12" x2="18" y2="12" /><line x1="10" y1="17" x2="14" y2="17" /></svg>
                <span>Filters</span>
                {hasActiveFilters && (
                  <span style={{ minWidth: 21, height: 21, padding: '0 6px', borderRadius: 999, background: 'white', color: colors.primary, fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{activeFilterCount}</span>
                )}
              </div>
              <div style={{ flex: 1 }} />
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 0.3, textTransform: 'uppercase', color: colors.textMuted, whiteSpace: 'nowrap' }}>{filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'}</div>
            </div>
          </div>
        )}

        <div
          style={
            isMobile
              ? { display: 'grid', gridTemplateColumns: '1fr', gap: 18 }
              : { display: 'grid', gridTemplateColumns: isTablet ? 'repeat(2, 1fr)' : 'repeat(auto-fit, minmax(260px, 1fr))', gap: isTablet ? 20 : 28 }
          }
        >
          {pagedQuizzes.map((quiz) => {
            const attempt = attempts[quiz.id];
            const questionCount = questionCounts[quiz.id];
            return (
              <div
                key={quiz.id}
                style={{
                  border: `1px solid ${colors.border}`, borderRadius: 4, overflow: 'hidden', height: 404, display: 'flex', flexDirection: 'column',
                  ...(isMobile ? { width: '100%', height: 'auto' } : {}),
                }}
              >
                <div style={{ width: '100%', height: 150, position: 'relative', filter: attempt ? 'grayscale(0.45) saturate(0.7) brightness(0.97)' : 'none' }}>
                  <QuizImage quizId={quiz.id} fallback={quiz.image} alt={quiz.title} />
                </div>
                <div style={{ padding: '20px 22px 22px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: 'uppercase', color: colors.primary }}>
                      {DIFFICULTY_LABEL[quiz.difficulty]} · {quiz.points} pts
                    </div>
                    {questionCount != null && (
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'oklch(0.5 0.15 250)', background: 'oklch(0.95 0.04 250)', padding: '3px 10px', borderRadius: 999, flexShrink: 0 }}>{questionCount} Qs</div>
                    )}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'oklch(0.62 0.01 250)' }}>{quizDateLabel(quiz.date)}</div>
                  <h2 style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 20, margin: 0, lineHeight: 1.15, minHeight: 46, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', color: colors.primary }}>{quiz.title}</h2>
                  <p style={{ fontSize: 13, color: colors.textMuted, margin: 0, lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{quiz.description}</p>
                  <div style={{ flex: 1 }} />
                  {!attempt ? (
                    <button
                      onClick={() => startQuiz(quiz.id)}
                      style={{ alignSelf: 'flex-start', background: colors.primary, color: 'white', border: 'none', padding: '11px 22px', fontSize: 13.5, fontWeight: 600, borderRadius: 4, cursor: 'pointer', fontFamily: fonts.body }}
                    >
                      Start Quiz
                    </button>
                  ) : (
                    <div style={{ alignSelf: 'flex-start', fontSize: 13, fontWeight: 700, letterSpacing: 0.3, color: attempt.passed ? colors.success : colors.danger }}>
                      {attempt.passed ? 'Passed' : 'Failed'} · {attempt.score}/{attempt.total} · no retakes
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {showQuizPager && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginTop: 32, paddingTop: 22, borderTop: '1px solid oklch(0.92 0.01 250)' }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.textMuted }}>{quizPagerRangeText}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <div
                onClick={() => quizPageIndex > 0 && goToPage(quizPageIndex - 1)}
                style={{ padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${quizPageIndex > 0 ? 'oklch(0.86 0.03 250)' : 'oklch(0.93 0.01 250)'}`, background: 'white', color: quizPageIndex > 0 ? colors.primary : 'oklch(0.78 0.01 250)', cursor: quizPageIndex > 0 ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
              >
                ← Previous
              </div>
              {pagerPages.map((i) => (
                <div
                  key={i}
                  onClick={() => goToPage(i)}
                  style={{
                    minWidth: 38, height: 38, padding: '0 10px', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    border: `1px solid ${i === quizPageIndex ? colors.primary : 'oklch(0.9 0.01 250)'}`,
                    background: i === quizPageIndex ? colors.primary : 'white',
                    color: i === quizPageIndex ? 'white' : 'oklch(0.4 0.01 250)',
                  }}
                >
                  {i + 1}
                </div>
              ))}
              <div
                onClick={() => quizPageIndex < quizPageCount - 1 && goToPage(quizPageIndex + 1)}
                style={{ padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${quizPageIndex < quizPageCount - 1 ? 'oklch(0.86 0.03 250)' : 'oklch(0.93 0.01 250)'}`, background: 'white', color: quizPageIndex < quizPageCount - 1 ? colors.primary : 'oklch(0.78 0.01 250)', cursor: quizPageIndex < quizPageCount - 1 ? 'pointer' : 'default', whiteSpace: 'nowrap' }}
              >
                Next →
              </div>
            </div>
          </div>
        )}
      </div>

      {isMobile && filtersSheetOpen && (
        <>
          <div onClick={() => setFiltersSheetOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(20,20,40,0.45)' }} />
          <div style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 71, background: 'white', borderRadius: '20px 20px 0 0', boxShadow: '0 -14px 44px rgba(20,20,40,0.24)', maxHeight: '84vh', overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 20px 20px' }}>
            <div style={{ position: 'sticky', top: 0, background: 'white', padding: '10px 0 12px', zIndex: 2 }}>
              <div style={{ width: 40, height: 4, borderRadius: 2, background: 'oklch(0.9 0.01 250)', margin: '0 auto 12px' }} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div style={{ fontFamily: fonts.heading, fontWeight: 600, fontSize: 21, color: colors.primary }}>Filters</div>
                <div onClick={() => setFiltersSheetOpen(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'oklch(0.96 0.01 250)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, lineHeight: 1, color: 'oklch(0.45 0.01 250)', cursor: 'pointer' }}>×</div>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', margin: '22px 0 12px' }}>Category</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {CATEGORIES.map((c) => (
                <div key={c.id} onClick={() => setCategory(c.id)} style={{ padding: '9px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid oklch(0.9 0.01 250)', background: activeCategory === c.id ? colors.primary : 'white', color: activeCategory === c.id ? 'white' : 'oklch(0.45 0.02 250)', borderColor: activeCategory === c.id ? colors.primary : 'oklch(0.9 0.01 250)' }}>{c.label}</div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', margin: '22px 0 12px' }}>Difficulty</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {DIFFICULTIES.map((d) => (
                <div key={d.id} onClick={() => setDifficulty(d.id)} style={{ padding: '9px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid oklch(0.9 0.01 250)', background: activeDifficulty === d.id ? colors.primary : 'white', color: activeDifficulty === d.id ? 'white' : 'oklch(0.45 0.02 250)', borderColor: activeDifficulty === d.id ? colors.primary : 'oklch(0.9 0.01 250)' }}>{d.label}</div>
              ))}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: 'uppercase', color: 'oklch(0.6 0.01 250)', margin: '22px 0 12px' }}>Order</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 9 }}>
              {SORTS.map((s) => (
                <div key={s.id} onClick={() => setSort(s.id)} style={{ padding: '9px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', border: '1px solid oklch(0.9 0.01 250)', background: activeSort === s.id ? colors.primary : 'white', color: activeSort === s.id ? 'white' : 'oklch(0.45 0.02 250)', borderColor: activeSort === s.id ? colors.primary : 'oklch(0.9 0.01 250)' }}>{s.label}</div>
              ))}
            </div>
            <div style={{ position: 'sticky', bottom: 0, background: 'white', padding: '16px 0 4px', marginTop: 24, display: 'flex', gap: 10, borderTop: '1px solid oklch(0.93 0.01 250)' }}>
              <button onClick={() => { setCategory('all'); setDifficulty('all'); setQuizQuery(''); }} style={{ background: 'white', color: 'oklch(0.4 0.01 250)', border: '1px solid oklch(0.88 0.02 250)', height: 52, padding: '0 20px', fontSize: 15, fontWeight: 600, borderRadius: 12, cursor: 'pointer', fontFamily: fonts.body, flexShrink: 0 }}>Clear</button>
              <button onClick={() => setFiltersSheetOpen(false)} style={{ flex: 1, background: colors.primary, color: 'white', border: 'none', height: 52, fontSize: 15, fontWeight: 600, borderRadius: 12, cursor: 'pointer', fontFamily: fonts.body }}>Show {filtered.length} {filtered.length === 1 ? 'quiz' : 'quizzes'}</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
