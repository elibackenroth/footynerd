import type { CSSProperties } from 'react';

export default function QuizImage({ quizId, fallback, alt, style }: { quizId: string; fallback: string | null; alt: string; style?: CSSProperties }) {
  return (
    <img
      src={`/quiz-images/${quizId}.webp`}
      alt={alt}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', ...style }}
      onError={(e) => {
        const img = e.currentTarget;
        if (fallback && img.src !== fallback) img.src = fallback;
      }}
    />
  );
}
