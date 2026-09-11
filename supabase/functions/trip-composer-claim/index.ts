import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { isValidAccessToken, sha256 } from "./claimUtils.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
});

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json({ error: "authentication_required" }, 401);

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
  if (!supabaseUrl || !anonKey) return json({ error: "claim_unconfigured" }, 503);

  try {
    const body = await req.json().catch(() => ({}));
    if (!isValidAccessToken(body?.access_token)) return json({ error: "invalid_access_token" }, 400);

    const client = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });

    const { data: { user }, error: userError } = await client.auth.getUser();
    if (userError || !user) return json({ error: "authentication_required" }, 401);

    const accessTokenHash = await sha256(body.access_token);
    const { data, error } = await client.rpc("claim_trip_session", { p_access_token_hash: accessTokenHash });

    if (error) {
      const message = String(error.message || "");
      if (message.includes("session_already_owned")) return json({ error: "session_already_owned" }, 409);
      if (message.includes("session_not_found")) return json({ error: "session_not_found" }, 404);
      if (message.includes("authentication_required")) return json({ error: "authentication_required" }, 401);
      console.error("[TRIP_COMPOSER_CLAIM_ERROR]", error.code, error.message);
      return json({ error: "claim_failed" }, 500);
    }

    const result = Array.isArray(data) ? data[0] : data;
    if (!result?.session_id) return json({ error: "claim_failed" }, 500);

    return json({ ok: true, session_id: result.session_id, status: result.claim_status });
  } catch (error) {
    console.error("[TRIP_COMPOSER_CLAIM_ERROR]", error instanceof Error ? error.message : "unknown_error");
    return json({ error: "claim_failed" }, 500);
  }
});
