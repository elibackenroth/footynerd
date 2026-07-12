import { supabase } from './supabaseClient';
import type {
  Quiz,
  QuizQuestionPublic,
  QuizAttempt,
  WordlePuzzlePublic,
  WordleGuess,
  TransferClub,
  TransferLinkPublic,
  Profile,
  MatchEntry,
  PointsLeaderboardRow,
} from './types';

// ---------- quizzes ----------

export async function fetchQuizzes(): Promise<Quiz[]> {
  const { data, error } = await supabase.from('quizzes').select('*');
  if (error) throw error;
  return data as Quiz[];
}

export async function fetchQuizQuestions(quizId: string): Promise<QuizQuestionPublic[]> {
  const { data, error } = await supabase
    .from('quiz_questions_public')
    .select('*')
    .eq('quiz_id', quizId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data as QuizQuestionPublic[];
}

export async function fetchMyAttempts(userId: string): Promise<Record<string, QuizAttempt>> {
  const { data, error } = await supabase.from('quiz_attempts').select('*').eq('user_id', userId);
  if (error) throw error;
  const map: Record<string, QuizAttempt> = {};
  (data as QuizAttempt[]).forEach((a) => { map[a.quiz_id] = a; });
  return map;
}

export async function checkQuizAnswer(quizId: string, questionIndex: number, selectedIndex: number) {
  const { data, error } = await supabase.functions.invoke('check-quiz-answer', {
    body: { quizId, questionIndex, selectedIndex },
  });
  if (error) throw error;
  return data as { correct: boolean; correctIndex: number };
}

export async function completeQuiz(quizId: string, answers: number[]) {
  const { data, error } = await supabase.functions.invoke('complete-quiz', {
    body: { quizId, answers },
  });
  if (error) throw error;
  return data as { score: number; total: number; passed: boolean; points: number; persisted: boolean; streak?: number; error?: string; attempt?: QuizAttempt };
}

// ---------- profile ----------

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();
  if (error) return null;
  return data as Profile;
}

export async function updateProfile(userId: string, fields: Partial<Pick<Profile, 'name' | 'email'>>) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', userId);
  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${userId}/avatar.${ext}`;
  const { error: uploadErr } = await supabase.storage.from('avatars').upload(path, file, { upsert: true });
  if (uploadErr) throw uploadErr;
  const { data } = supabase.storage.from('avatars').getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;
  const { error: updateErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', userId);
  if (updateErr) throw updateErr;
  return url;
}

export async function removeAvatar(userId: string) {
  const { data: list } = await supabase.storage.from('avatars').list(userId);
  if (list && list.length > 0) {
    await supabase.storage.from('avatars').remove(list.map((f) => `${userId}/${f.name}`));
  }
  const { error } = await supabase.from('profiles').update({ avatar_url: null }).eq('id', userId);
  if (error) throw error;
}

// ---------- leaderboard ----------

export async function fetchPointsLeaderboard(): Promise<PointsLeaderboardRow[]> {
  const { data, error } = await supabase.rpc('get_points_leaderboard');
  if (error) throw error;
  return data as PointsLeaderboardRow[];
}

// ---------- wordle ----------

export async function fetchWordlePuzzles(): Promise<WordlePuzzlePublic[]> {
  const { data, error } = await supabase.from('wordle_puzzles_public').select('*');
  if (error) throw error;
  return data as WordlePuzzlePublic[];
}

export async function fetchMyWordleAttempts(userId: string): Promise<Record<string, { guesses: WordleGuess[]; status: string }>> {
  const { data, error } = await supabase.from('wordle_attempts').select('*').eq('user_id', userId);
  if (error) throw error;
  const map: Record<string, { guesses: WordleGuess[]; status: string }> = {};
  (data as { puzzle_id: string; guesses: WordleGuess[]; status: string }[]).forEach((a) => {
    map[a.puzzle_id] = { guesses: a.guesses, status: a.status };
  });
  return map;
}

export async function submitWordleGuess(puzzleId: string, guess: string, priorGuesses: WordleGuess[]) {
  const { data, error } = await supabase.functions.invoke('wordle-guess', {
    body: { puzzleId, guess, priorGuesses },
  });
  if (error) throw error;
  return data as { locked: boolean; result?: string[]; status: string; guesses: WordleGuess[] };
}

// ---------- transfer chain ----------

export async function fetchTransferClubs(): Promise<TransferClub[]> {
  const { data, error } = await supabase.from('transfer_clubs').select('*');
  if (error) throw error;
  return data as TransferClub[];
}

export async function fetchTransferLinks(): Promise<TransferLinkPublic[]> {
  const { data, error } = await supabase.from('transfer_links_public').select('*').order('position', { ascending: true });
  if (error) throw error;
  return data as TransferLinkPublic[];
}

export async function checkTransferAnswer(position: number, guess: string) {
  const { data, error } = await supabase.functions.invoke('transfer-check', { body: { position, guess } });
  if (error) throw error;
  return data as { correct: boolean; display: string };
}

export async function completeTransferChain(score: number) {
  const { data, error } = await supabase.functions.invoke('complete-transfer-chain', { body: { score } });
  if (error) throw error;
  return data as { persisted: boolean; transferPoints?: number };
}

// ---------- match room ----------

function genMatchId() {
  return Math.random().toString(36).slice(2, 8);
}

export async function createMatch(quizId: string): Promise<{ matchId: string; roundId: number }> {
  const matchId = genMatchId();
  const { error: matchErr } = await supabase.from('matches').insert({ id: matchId });
  if (matchErr) throw matchErr;
  const { data: round, error: roundErr } = await supabase
    .from('match_rounds')
    .insert({ match_id: matchId, round_number: 1, quiz_id: quizId })
    .select()
    .single();
  if (roundErr) throw roundErr;
  return { matchId, roundId: round.id };
}

export async function createNextRound(matchId: string, roundNumber: number, quizId: string): Promise<{ roundId: number }> {
  const { data: round, error } = await supabase
    .from('match_rounds')
    .insert({ match_id: matchId, round_number: roundNumber, quiz_id: quizId })
    .select()
    .single();
  if (error) throw error;
  return { roundId: round.id };
}

export async function submitMatchEntry(roundId: number, name: string, answers: number[]) {
  const { data, error } = await supabase.functions.invoke('submit-match-entry', {
    body: { roundId, name, answers },
  });
  if (error) throw error;
  return data as { score: number; total: number; error?: string };
}

export interface MatchFull {
  id: string;
  rounds: { id: number; round_number: number; quiz_id: string; entries: MatchEntry[] }[];
}

export async function fetchMatch(matchId: string): Promise<MatchFull | null> {
  const { data: rounds, error } = await supabase
    .from('match_rounds')
    .select('*, match_entries(*)')
    .eq('match_id', matchId)
    .order('round_number', { ascending: true });
  if (error || !rounds) return null;
  return {
    id: matchId,
    rounds: rounds.map((r: any) => ({
      id: r.id,
      round_number: r.round_number,
      quiz_id: r.quiz_id,
      entries: r.match_entries as MatchEntry[],
    })),
  };
}

// ---------- leads ----------

export async function submitLead(email: string, source: string) {
  const { error } = await supabase.from('leads').insert({ email, source });
  if (error) throw error;
}
