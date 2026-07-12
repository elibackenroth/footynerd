import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PASS_THRESHOLD = 4;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysBetween(a: string, b: string) {
  return Math.round((new Date(b + "T00:00:00Z").getTime() - new Date(a + "T00:00:00Z").getTime()) / 86400000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { quizId, answers } = await req.json();
    if (!quizId || !Array.isArray(answers)) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: quiz, error: quizErr } = await admin.from("quizzes").select("id, points").eq("id", quizId).single();
    if (quizErr || !quiz) {
      return new Response(JSON.stringify({ error: "quiz_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: questions, error: qErr } = await admin
      .from("quiz_questions")
      .select("position, correct_index")
      .eq("quiz_id", quizId)
      .order("position", { ascending: true });
    if (qErr || !questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "questions_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const total = questions.length;
    let score = 0;
    for (const q of questions) {
      if (answers[q.position] === q.correct_index) score++;
    }
    const passed = score >= PASS_THRESHOLD;
    const points = passed ? quiz.points : 0;

    // resolve the signed-in user, if any
    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await admin.auth.getUser(token);
      user = data?.user ?? null;
    }

    if (!user) {
      return new Response(JSON.stringify({ score, total, passed, points, persisted: false }), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { error: insertErr } = await admin.from("quiz_attempts").insert({
      user_id: user.id,
      quiz_id: quizId,
      score,
      total,
      points,
      passed,
    });

    if (insertErr) {
      if (insertErr.code === "23505") {
        const { data: existing } = await admin
          .from("quiz_attempts")
          .select("score, total, points, passed")
          .eq("user_id", user.id)
          .eq("quiz_id", quizId)
          .single();
        return new Response(JSON.stringify({ error: "already_attempted", attempt: existing }), {
          status: 409,
          headers: { ...cors, "Content-Type": "application/json" },
        });
      }
      throw insertErr;
    }

    // update streak on the profile
    const { data: profile } = await admin
      .from("profiles")
      .select("current_streak, longest_streak, last_played_date")
      .eq("id", user.id)
      .single();

    const today = todayStr();
    let streak = profile?.current_streak ?? 0;
    const last = profile?.last_played_date as string | null;
    if (last === today) {
      // already played today, streak unchanged
    } else if (last && daysBetween(last, today) === 1) {
      streak = streak + 1;
    } else {
      streak = 1;
    }
    const longest = Math.max(profile?.longest_streak ?? 0, streak);

    await admin
      .from("profiles")
      .update({ current_streak: streak, longest_streak: longest, last_played_date: today })
      .eq("id", user.id);

    return new Response(JSON.stringify({ score, total, passed, points, persisted: true, streak }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
