import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { quizId, questionIndex, selectedIndex } = await req.json();
    if (!quizId || typeof questionIndex !== "number" || typeof selectedIndex !== "number") {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: question, error } = await admin
      .from("quiz_questions")
      .select("correct_index")
      .eq("quiz_id", quizId)
      .eq("position", questionIndex)
      .single();

    if (error || !question) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const correctIndex = question.correct_index;
    return new Response(JSON.stringify({ correct: selectedIndex === correctIndex, correctIndex }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
