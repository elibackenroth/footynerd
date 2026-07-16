import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GridHeader {
  key: string;
  isClub?: boolean;
  isFlag?: boolean;
}

interface GridPlayer {
  id: string;
  country: string;
  clubs: string[];
  trophies: string[];
}

function defFits(player: GridPlayer | undefined, def: GridHeader | undefined): boolean {
  if (!player || !def) return false;
  if (def.isClub) return (player.clubs || []).includes(def.key);
  if (def.isFlag) return player.country === def.key;
  return (player.trophies || []).includes(def.key);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const { roundId, name, answers, livesUsed, timeMs } = await req.json();
    if (!roundId || !name || typeof answers !== "object" || answers === null) {
      return new Response(JSON.stringify({ error: "bad_request" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: round, error: roundErr } = await admin.from("gridduel_rounds").select("id, grid_id").eq("id", roundId).single();
    if (roundErr || !round) {
      return new Response(JSON.stringify({ error: "round_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { count } = await admin.from("gridduel_entries").select("id", { count: "exact", head: true }).eq("round_id", roundId);
    if ((count ?? 0) >= 2) {
      return new Response(JSON.stringify({ error: "round_full" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const { data: grid, error: gridErr } = await admin.from("footygrid_grids").select("rows, cols").eq("id", round.grid_id).single();
    if (gridErr || !grid) {
      return new Response(JSON.stringify({ error: "grid_not_found" }), { status: 404, headers: { ...cors, "Content-Type": "application/json" } });
    }

    const answerMap = answers as Record<string, string>;
    const uniqueIds = [...new Set(Object.values(answerMap))];
    const { data: players } = uniqueIds.length
      ? await admin.from("footygrid_players").select("id, country, clubs, trophies").in("id", uniqueIds)
      : { data: [] as GridPlayer[] };
    const playerById: Record<string, GridPlayer> = {};
    (players || []).forEach((p: GridPlayer) => { playerById[p.id] = p; });

    let solved = 0;
    for (const row of grid.rows as GridHeader[]) {
      for (const col of grid.cols as GridHeader[]) {
        const playerId = answerMap[row.key + "|" + col.key];
        if (!playerId) continue;
        const player = playerById[playerId];
        if (player && defFits(player, row) && defFits(player, col)) solved++;
      }
    }

    const livesUsedNum = Math.max(0, Math.min(9, Number(livesUsed) || 0));
    const timeMsNum = Math.max(0, Number(timeMs) || 0);

    const { error: insertErr } = await admin.from("gridduel_entries").insert({
      round_id: roundId, name, solved, lives_used: livesUsedNum, time_ms: timeMsNum,
    });
    if (insertErr) {
      if (insertErr.code === "23505") {
        return new Response(JSON.stringify({ error: "already_played" }), { status: 409, headers: { ...cors, "Content-Type": "application/json" } });
      }
      throw insertErr;
    }

    return new Response(JSON.stringify({ solved, total: 9 }), { headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});
