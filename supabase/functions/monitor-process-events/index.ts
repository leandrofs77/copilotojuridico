import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabaseUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") || SUPABASE_SERVICE_ROLE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { monitoring_id } = await req.json();
    if (!monitoring_id) throw new Error("monitoring_id is required");

    // Fetch monitoring record
    const { data: monitoring, error: monErr } = await supabase
      .from("case_process_monitoring")
      .select("*")
      .eq("id", monitoring_id)
      .eq("user_id", user.id)
      .single();

    if (monErr || !monitoring) throw new Error("Monitoring record not found");

    // NOTE: This is a stub for future tribunal API integration.
    // Currently simulates a check and returns the current state.
    // When tribunal APIs become available, replace this block with actual API calls.

    const now = new Date().toISOString();

    // Update last_checked_at
    await supabase.from("case_process_monitoring").update({
      last_checked_at: now,
    }).eq("id", monitoring_id);

    // Fetch existing events for this case
    const { data: events } = await supabase
      .from("case_process_events")
      .select("*")
      .eq("case_id", monitoring.case_id)
      .eq("user_id", user.id)
      .order("event_date", { ascending: false })
      .limit(20);

    return new Response(JSON.stringify({
      status: "checked",
      message: "Monitoramento atualizado. Integração com APIs de tribunais será disponibilizada em breve.",
      last_checked_at: now,
      events_count: (events || []).length,
      events: events || [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("monitor-process-events error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
