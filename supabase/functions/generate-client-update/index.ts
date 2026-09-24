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

    const { event_id, case_id } = await req.json();
    if (!case_id) throw new Error("case_id is required");

    // Fetch case and event context
    const [caseRes, eventRes] = await Promise.all([
      supabase.from("cases").select("title, legal_area, court, case_number").eq("id", case_id).eq("user_id", user.id).single(),
      event_id
        ? supabase
            .from("case_process_events")
            .select("*")
            .eq("id", event_id)
            .eq("case_id", case_id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found");
    const c = caseRes.data;
    const event = eventRes?.data;

    const prompt = `Gere uma mensagem simples e clara para informar o cliente sobre a movimentação do caso.

CASO: ${c.title}
Área: ${c.legal_area || "N/A"} | Tribunal: ${c.court || "N/A"} | Nº: ${c.case_number || "N/A"}

${event ? `MOVIMENTAÇÃO:
Data: ${event.event_date}
Tipo: ${event.event_type}
Descrição: ${event.event_text}` : "Atualização geral do caso."}`;

    const tools = [{
      type: "function",
      function: {
        name: "generate_update",
        description: "Gera mensagem de atualização para o cliente.",
        parameters: {
          type: "object",
          properties: {
            message: { type: "string", description: "Mensagem clara e simples para o cliente" },
            message_type: { type: "string", enum: ["update", "deadline_alert", "hearing_notice", "decision_notice"] },
          },
          required: ["message", "message_type"],
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
            content: `Você gera mensagens de atualização para clientes de escritórios de advocacia. A mensagem deve ser:
- Clara e sem jargão jurídico excessivo
- Respeitosa e profissional
- Breve (2-4 parágrafos)
- Informativa sobre o que aconteceu e próximos passos
- Em português brasileiro`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_update" } },
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

    const update = JSON.parse(toolCall.function.arguments);

    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id, case_id, provider: "lovable-ai", model: "google/gemini-3-flash-preview",
      feature_name: "generate_client_update",
      input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    await supabase.from("client_notifications").insert({
      case_id, user_id: user.id,
      message: update.message,
      message_type: update.message_type,
      status: "draft",
    });

    return new Response(JSON.stringify(update), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-client-update error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
