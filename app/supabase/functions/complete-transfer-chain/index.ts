import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TRANSFER_POINTS_PER_CHAIN = 10;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { score } = await req.json();
    if (typeof score !== "number") {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const authHeader = req.headers.get("Authorization");
    let user = null;
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await admin.auth.getUser(token);
      user = data?.user ?? null;
    }

    if (!user) {
      return new Response(JSON.stringify({ persisted: false }), { headers: { ...cors, "Content-Type": "application/json" } });
    }

    await admin.from("transfer_chain_attempts").insert({ user_id: user.id, score });

    const { data: profile } = await admin.from("profiles").select("transfer_points").eq("id", user.id).single();
    const transferPoints = (profile?.transfer_points ?? 0) + TRANSFER_POINTS_PER_CHAIN;
    await admin.from("profiles").update({ transfer_points: transferPoints }).eq("id", user.id);

    return new Response(JSON.stringify({ persisted: true, transferPoints }), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
