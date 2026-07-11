import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function evalWordleGuess(guess: string, answer: string) {
  const g = guess.split(""), a = answer.split("");
  const result = Array(5).fill("absent");
  const used = Array(5).fill(false);
  for (let i = 0; i < 5; i++) {
    if (g[i] === a[i]) { result[i] = "correct"; used[i] = true; }
  }
  for (let i = 0; i < 5; i++) {
    if (result[i] === "correct") continue;
    const idx = a.findIndex((ch, j) => ch === g[i] && !used[j]);
    if (idx > -1) { result[i] = "present"; used[idx] = true; }
  }
  return result;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { puzzleId, guess, priorGuesses } = await req.json();
    if (!puzzleId || typeof guess !== "string" || guess.length !== 5) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }
    const upperGuess = guess.toUpperCase();

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: puzzle, error: pErr } = await admin.from("wordle_puzzles").select("word").eq("id", puzzleId).single();
    if (pErr || !puzzle) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await admin.auth.getUser(token);
      user = data?.user ?? null;
    }

    if (user) {
      const { data: existing } = await admin
        .from("wordle_attempts")
        .select("guesses, status")
        .eq("user_id", user.id)
        .eq("puzzle_id", puzzleId)
        .single();
      if (existing && existing.status !== "playing") {
        return new Response(JSON.stringify({ locked: true, guesses: existing.guesses, status: existing.status }), {
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
    }

    const priorArr = Array.isArray(priorGuesses) ? priorGuesses : [];
    const result = evalWordleGuess(upperGuess, puzzle.word);
    const guessNumber = priorArr.length + 1;
    let status: "playing" | "won" | "lost" = "playing";
    if (upperGuess === puzzle.word) status = "won";
    else if (guessNumber >= 6) status = "lost";

    const guesses = [...priorArr, { word: upperGuess, result }];

    if (user && status !== "playing") {
      await admin.from("wordle_attempts").upsert(
        { user_id: user.id, puzzle_id: puzzleId, guesses, status },
        { onConflict: "user_id,puzzle_id" }
      );
    }

    return new Response(JSON.stringify({ locked: false, result, status, guesses }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
