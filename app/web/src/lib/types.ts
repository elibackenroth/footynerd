export interface Quiz {
  id: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  title: string;
  description: string;
  image: string | null;
  image_credit: string | null;
  points: number;
}

export interface QuizQuestionPublic {
  id: number;
  quiz_id: string;
  position: number;
  question: string;
  options: string[];
  correct_index: number;
}

export interface QuizAttempt {
  id: number;
  user_id: string;
  quiz_id: string;
  score: number;
  total: number;
  points: number;
  passed: boolean;
  completed_at: string;
}

export interface WordlePuzzlePublic {
  id: string;
  date: string;
  category: string;
  hint: string;
  word: string;
}

export interface WordleGuess {
  word: string;
  result: ('correct' | 'present' | 'absent')[];
}

export interface WordleAttempt {
  id: number;
  user_id: string;
  puzzle_id: string;
  guesses: WordleGuess[];
  status: 'playing' | 'won' | 'lost';
  updated_at: string;
}

export interface TransferClub {
  id: string;
  name: string;
  short_name: string;
}

export interface TransferRound {
  clubs: string[];
  answers: string[];
  display: string;
}

export interface TransferDaily {
  id: string;
  date: string;
  rounds: TransferRound[];
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
  avatar_url: string | null;
  current_streak: number;
  longest_streak: number;
  last_played_date: string | null;
  transfer_points: number;
  created_at: string;
}

export interface MatchRound {
  id: number;
  match_id: string;
  round_number: number;
  quiz_id: string;
  created_at: string;
}

export interface MatchEntry {
  id: number;
  round_id: number;
  name: string;
  score: number;
  total: number;
  played_at: string;
}

export interface PointsLeaderboardRow {
  name: string;
  points: number;
  quizzes_completed: number;
  perfect_runs: number;
  avatar_url: string | null;
}

export interface FootygridPlayer {
  id: string;
  name: string;
  position: string;
  country: string;
  clubs: string[];
  trophies: string[];
}

export interface FootygridHeader {
  key: string;
  label: string;
  isClub?: boolean;
  isFlag?: boolean;
  slotId?: string;
}

export interface FootygridGrid {
  id: string;
  date: string;
  rows: FootygridHeader[];
  cols: FootygridHeader[];
}

export interface FootygridAnswerEntry {
  id: string;
  name: string;
  position: string;
}

export interface FootygridAttempt {
  grid_id: string;
  answers: Record<string, FootygridAnswerEntry>;
  lives: number;
  status: 'playing' | 'won' | 'over';
}
