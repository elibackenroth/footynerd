import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DIACRITICS_RE = new RegExp("[\\u0300-\\u036f]", "g");

function normalizeAnswer(s: string) {
  return (s || "")
    .normalize("NFD").replace(DIACRITICS_RE, "")
    .toUpperCase().replace(/[^A-Z]/g, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { position, guess } = await req.json();
    if (typeof position !== "number" || typeof guess !== "string") {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link, error } = await admin.from("transfer_links").select("answers, display").eq("position", position).single();
    if (error || !link) {
      return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const normalizedGuess = normalizeAnswer(guess);
    const correct = (link.answers as string[]).some((a) => normalizeAnswer(a) === normalizedGuess);

    return new Response(JSON.stringify({ correct, display: link.display }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
