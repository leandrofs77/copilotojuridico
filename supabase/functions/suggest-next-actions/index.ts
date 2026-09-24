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

    const [caseRes, radarRes, evidenceSimRes, temporalRes, visualRes, knowledgeRes, docsRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("case_strategy_radar").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_evidence_simulation").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_temporal_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_visual_diagnostics").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("legal_knowledge_entries").select("title, content, entry_type, outcome").eq("user_id", user.id).in("entry_type", ["thesis", "argument", "precedent"]).limit(10),
      supabase.from("documents").select("name, ai_classification, ai_summary").eq("case_id", case_id).limit(15),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found");
    const c = caseRes.data;
    const radar = radarRes.data?.[0];
    const evidenceSim = evidenceSimRes.data?.[0];
    const temporal = temporalRes.data?.[0];

    const prompt = `CASO: ${c.title} | Área: ${c.legal_area || "N/A"} | Status: ${c.status}
Descrição: ${c.description || "N/A"}

RADAR ESTRATÉGICO:
${radar ? `Prob. Êxito: ${radar.success_probability}%, Risco: ${radar.risk_score}%\n${radar.strategic_summary}` : "Não disponível"}

EVIDÊNCIAS:
${evidenceSim ? `Força: ${evidenceSim.current_strength}, Prob: ${evidenceSim.estimated_success_probability}` : "N/A"}

TEMPORAL:
${temporal ? `Urgência: ${temporal.urgency_level}, Prescrição: ${temporal.limitation_risk}` : "N/A"}

DOCUMENTOS: ${(docsRes.data || []).map((d: any) => d.name).join(", ") || "Nenhum"}`;

    const tools = [{
      type: "function",
      function: {
        name: "suggest_actions",
        description: "Sugere próximas ações prioritárias para o caso.",
        parameters: {
          type: "object",
          properties: {
            actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action_type: { type: "string", enum: ["legal_document", "collect_evidence", "research_jurisprudence", "procedural_step", "client_request", "strategic_action"] },
                  action_description: { type: "string" },
                  priority: { type: "string", enum: ["high", "medium", "low"] },
                  impact_score: { type: "number", description: "Impacto de 0 a 100" },
                },
                required: ["action_type", "action_description", "priority", "impact_score"],
                additionalProperties: false,
              },
            },
          },
          required: ["actions"],
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
            content: `Você é o VirtuaLexis Assistant — assistente jurídico autônomo. Com base nos dados do caso, radar estratégico e análises existentes, sugira 5-8 ações concretas e prioritárias.

Tipos de ação:
- legal_document: elaborar peça processual
- collect_evidence: coletar prova específica
- research_jurisprudence: pesquisar jurisprudência
- procedural_step: providência processual
- client_request: solicitar informação ao cliente
- strategic_action: ação estratégica geral

Seja específico e acionável. Priorize ações com maior impacto no resultado do caso.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "suggest_actions" } },
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

    const { actions } = JSON.parse(toolCall.function.arguments);

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id, case_id, provider: "lovable-ai", model: "google/gemini-3-flash-preview",
      feature_name: "suggest_next_actions",
      input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    // Insert actions
    const rows = (actions || []).map((a: any) => ({
      case_id, user_id: user.id,
      action_type: a.action_type,
      action_description: a.action_description,
      priority: a.priority,
      impact_score: a.impact_score,
      source: "ai",
      status: "pending",
      generated_by_ai: true,
    }));

    if (rows.length > 0) {
      await supabase.from("case_next_actions").insert(rows);
    }

    return new Response(JSON.stringify({ actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("suggest-next-actions error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
