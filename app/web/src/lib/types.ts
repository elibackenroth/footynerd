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
  label: string;
  hint: string;
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

export interface TransferLinkPublic {
  id: number;
  position: number;
  club_ids: string[];
}

export interface Profile {
  id: string;
  name: string;
  email: string | null;
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
}

export interface StreakLeaderboardRow {
  name: string;
  best_streak: number;
}

export interface TransferLeaderboardRow {
  name: string;
  chains_completed: number;
}
