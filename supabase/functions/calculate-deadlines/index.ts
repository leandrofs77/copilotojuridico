import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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
    const aiConsent = await hasExternalAiConsent(supabaseUser, user.id);
    if (!aiConsent) {
      return new Response(JSON.stringify({ error: "external_ai_consent_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { case_id } = await req.json();
    if (!case_id) throw new Error("case_id is required");

    // Fetch case and events
    const [caseRes, eventsRes, processEventsRes, temporalRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("extracted_events").select("title, event_date, event_category, description").eq("case_id", case_id).order("event_date", { ascending: false }).limit(20),
      supabase.from("case_process_events").select("event_date, event_type, event_text").eq("case_id", case_id).order("event_date", { ascending: false }).limit(10),
      supabase.from("case_temporal_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found");
    const c = caseRes.data;
    const temporal = temporalRes.data?.[0];

    const prompt = `CASO: ${c.title}
Área: ${c.legal_area || "N/A"} | Tribunal: ${c.court || "N/A"}
Data de hoje: ${new Date().toISOString().split("T")[0]}

EVENTOS DO CASO:
${(eventsRes.data || []).map((e: any) => `- ${e.event_date} [${e.event_category}] ${e.title}`).join("\n") || "Nenhum"}

MOVIMENTAÇÕES PROCESSUAIS:
${(processEventsRes.data || []).map((e: any) => `- ${e.event_date} [${e.event_type}] ${e.event_text}`).join("\n") || "Nenhuma"}

ANÁLISE TEMPORAL EXISTENTE:
${temporal ? `Urgência: ${temporal.urgency_level}, Prazos: ${JSON.stringify(temporal.possible_deadlines)}\n${temporal.time_sensitivity_analysis}` : "Não disponível"}`;

    const tools = [{
      type: "function",
      function: {
        name: "calculate_deadlines",
        description: "Calcula prazos processuais a partir dos eventos.",
        parameters: {
          type: "object",
          properties: {
            deadlines: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  deadline_type: { type: "string" },
                  deadline_date: { type: "string", description: "ISO 8601 date" },
                  risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
                },
                required: ["deadline_type", "deadline_date", "risk_level"],
                additionalProperties: false,
              },
            },
          },
          required: ["deadlines"],
          additionalProperties: false,
        },
      },
    }];

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é o VirtuaLexis Deadlines — central inteligente de prazos jurídicos. Com base nos eventos e movimentações do caso, calcule todos os prazos processuais aplicáveis.

Considere:
- Prazos do CPC (contestação, réplica, recursos, embargos)
- Prazos especiais por área jurídica
- Prazos de prescrição e decadência
- Datas de audiências e perícias
- Prazos para cumprimento de decisões

Para cada prazo, indique o tipo, data limite e nível de risco (low, medium, high, critical).
Use a data de hoje como referência. Retorne datas no formato ISO 8601.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "calculate_deadlines" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error ${res.status}`);
    }

    const aiResult = await res.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response");

    const { deadlines } = JSON.parse(toolCall.function.arguments);

    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id, case_id, provider: "lovable-ai", model: "google/gemini-3-flash-preview",
      feature_name: "calculate_deadlines",
      input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    const rows = (deadlines || []).map((d: any) => ({
      case_id, user_id: user.id,
      deadline_type: d.deadline_type,
      deadline_date: d.deadline_date,
      risk_level: d.risk_level,
      status: "pending",
    }));

    if (rows.length > 0) {
      await supabase.from("case_deadlines").insert(rows);
    }

    return new Response(JSON.stringify({ deadlines }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("calculate-deadlines error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
