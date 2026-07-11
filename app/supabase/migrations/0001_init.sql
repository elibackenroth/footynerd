-- FootyNerd schema: profiles, quizzes, attempts, wordle, match rooms, transfer chain, leads.
-- Answer keys (quiz_questions.correct_index, wordle_puzzles.word, transfer_links.answers/display)
-- are never exposed to anon/authenticated roles directly -- only via public *_public views
-- (which omit the secret column) or via edge functions running with the service role.

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  email text,
  current_streak int not null default 0,
  longest_streak int not null default 0,
  last_played_date date,
  transfer_points int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- quizzes ----------
create table public.quizzes (
  id text primary key,
  category text not null,
  difficulty text not null,
  title text not null,
  description text not null,
  image text,
  image_credit text,
  points int not null
);
alter table public.quizzes enable row level security;
create policy "quizzes_public_read" on public.quizzes for select using (true);

create table public.quiz_questions (
  id serial primary key,
  quiz_id text not null references public.quizzes(id) on delete cascade,
  position int not null,
  question text not null,
  options jsonb not null,
  correct_index int not null,
  unique(quiz_id, position)
);
alter table public.quiz_questions enable row level security;
-- deliberately no select/insert policies: only service_role (edge functions) can touch this table

create view public.quiz_questions_public
with (security_invoker = true) as
  select id, quiz_id, position, question, options from public.quiz_questions;
grant select on public.quiz_questions_public to anon, authenticated;

create table public.quiz_attempts (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  quiz_id text not null references public.quizzes(id),
  score int not null,
  total int not null,
  points int not null,
  passed boolean not null,
  completed_at timestamptz not null default now(),
  unique(user_id, quiz_id)
);
alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_select_own" on public.quiz_attempts for select using (auth.uid() = user_id);
-- no insert policy: rows are only written by the complete-quiz edge function (service role),
-- which is what actually enforces "no retakes" via the unique constraint.

-- ---------- wordle ----------
create table public.wordle_puzzles (
  id text primary key,
  word text not null,
  label text not null,
  hint text not null
);
alter table public.wordle_puzzles enable row level security;

create view public.wordle_puzzles_public
with (security_invoker = true) as
  select id, label, hint from public.wordle_puzzles;
grant select on public.wordle_puzzles_public to anon, authenticated;

create table public.wordle_attempts (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  puzzle_id text not null references public.wordle_puzzles(id),
  guesses jsonb not null default '[]',
  status text not null default 'playing',
  updated_at timestamptz not null default now(),
  unique(user_id, puzzle_id)
);
alter table public.wordle_attempts enable row level security;
create policy "wordle_attempts_select_own" on public.wordle_attempts for select using (auth.uid() = user_id);
-- writes only via the wordle-guess edge function

-- ---------- match room (guest-friendly, no auth required) ----------
create table public.matches (
  id text primary key,
  created_at timestamptz not null default now()
);
alter table public.matches enable row level security;
create policy "matches_public_select" on public.matches for select using (true);
create policy "matches_public_insert" on public.matches for insert with check (true);

create table public.match_rounds (
  id serial primary key,
  match_id text not null references public.matches(id) on delete cascade,
  round_number int not null,
  quiz_id text not null references public.quizzes(id),
  created_at timestamptz not null default now(),
  unique(match_id, round_number)
);
alter table public.match_rounds enable row level security;
create policy "match_rounds_public_select" on public.match_rounds for select using (true);
create policy "match_rounds_public_insert" on public.match_rounds for insert with check (true);

create table public.match_entries (
  id serial primary key,
  round_id int not null references public.match_rounds(id) on delete cascade,
  name text not null,
  score int not null,
  total int not null,
  played_at timestamptz not null default now(),
  unique(round_id, name)
);
alter table public.match_entries enable row level security;
create policy "match_entries_public_select" on public.match_entries for select using (true);
-- writes only via the submit-match-entry edge function (needs authoritative scoring)

-- ---------- transfer chain ----------
create table public.transfer_clubs (
  id text primary key,
  name text not null,
  short_name text not null
);
alter table public.transfer_clubs enable row level security;
create policy "transfer_clubs_public_read" on public.transfer_clubs for select using (true);

create table public.transfer_links (
  id serial primary key,
  position int not null unique,
  club_ids text[] not null,
  answers text[] not null,
  display text not null
);
alter table public.transfer_links enable row level security;

create view public.transfer_links_public
with (security_invoker = true) as
  select id, position, club_ids from public.transfer_links;
grant select on public.transfer_links_public to anon, authenticated;

create table public.transfer_chain_attempts (
  id serial primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  score int not null,
  completed_at timestamptz not null default now()
);
alter table public.transfer_chain_attempts enable row level security;
create policy "transfer_chain_attempts_select_own" on public.transfer_chain_attempts for select using (auth.uid() = user_id);
-- writes only via the complete-transfer-chain edge function

-- ---------- leads (footer subscribe + email gate) ----------
create table public.leads (
  id serial primary key,
  email text not null,
  source text not null,
  created_at timestamptz not null default now()
);
alter table public.leads enable row level security;
create policy "leads_public_insert" on public.leads for insert with check (true);

-- ---------- leaderboard functions (aggregate without exposing profiles/emails directly) ----------
create or replace function public.get_points_leaderboard()
returns table(name text, points bigint, quizzes_completed bigint, perfect_runs bigint)
language sql security definer set search_path = public as $$
  select p.name,
    coalesce(sum(qa.points), 0) as points,
    count(qa.id) filter (where qa.passed) as quizzes_completed,
    count(qa.id) filter (where qa.passed and qa.score = qa.total) as perfect_runs
  from public.profiles p
  join public.quiz_attempts qa on qa.user_id = p.id
  group by p.id, p.name
  having coalesce(sum(qa.points), 0) > 0
  order by points desc;
$$;
grant execute on function public.get_points_leaderboard() to anon, authenticated;

create or replace function public.get_streak_leaderboard()
returns table(name text, best_streak int)
language sql security definer set search_path = public as $$
  select name, longest_streak as best_streak from public.profiles
  where longest_streak > 0
  order by longest_streak desc;
$$;
grant execute on function public.get_streak_leaderboard() to anon, authenticated;

create or replace function public.get_transfer_leaderboard()
returns table(name text, chains_completed bigint)
language sql security definer set search_path = public as $$
  select p.name, count(t.id) as chains_completed
  from public.profiles p
  join public.transfer_chain_attempts t on t.user_id = p.id
  group by p.id, p.name
  order by chains_completed desc;
$$;
grant execute on function public.get_transfer_leaderboard() to anon, authenticated;
