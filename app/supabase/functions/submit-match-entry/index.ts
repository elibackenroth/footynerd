import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { roundId, name, answers } = await req.json();
    if (!roundId || !name || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: round, error: roundErr } = await admin.from("match_rounds").select("id, quiz_id").eq("id", roundId).single();
    if (roundErr || !round) {
      return new Response(JSON.stringify({ error: "round_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { count } = await admin.from("match_entries").select("id", { count: "exact", head: true }).eq("round_id", roundId);
    if ((count ?? 0) >= 2) {
      return new Response(JSON.stringify({ error: "round_full" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: questions, error: qErr } = await admin
      .from("quiz_questions")
      .select("position, correct_index")
      .eq("quiz_id", round.quiz_id)
      .order("position", { ascending: true });
    if (qErr || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "questions_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const total = questions.length;
    let score = 0;
    for (const q of questions) {
      if (answers[q.position] === q.correct_index) score++;
    }

    const { error: insertErr } = await admin.from("match_entries").insert({ round_id: roundId, name, score, total });
    if (insertErr) {
      if (insertErr.code === "23505") {
        return new Response(JSON.stringify({ error: "already_played" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
      }
      throw insertErr;
    }

    return new Response(JSON.stringify({ score, total }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
