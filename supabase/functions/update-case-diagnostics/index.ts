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

    // Fetch all available data
    const [caseRes, viabilityRes, simulationRes, temporalRes, strategicRes, signalsRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("case_viability_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_evidence_simulation").select("*").eq("case_id", case_id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_temporal_analysis").select("*").eq("case_id", case_id).eq("user_id", user.id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_strategic_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_context_signals").select("source_type, content, signal_analysis").eq("case_id", case_id).eq("user_id", user.id),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");

    const caseData = caseRes.data;
    const viability = viabilityRes.data?.[0];
    const simulation = simulationRes.data?.[0];
    const temporal = temporalRes.data?.[0];
    const strategic = strategicRes.data?.[0];
    const signals = signalsRes.data || [];

    const contextSummary = `CASO: ${caseData.title} | Área: ${caseData.legal_area || "N/A"} | Status: ${caseData.status}
Descrição: ${caseData.description || "N/A"}

VIABILIDADE: ${viability ? `Nível: ${viability.viability_level}, Complexidade: ${viability.complexity_level}, Êxito: ${viability.success_probability}, Resumo: ${viability.analysis_summary || ""}` : "Não disponível"}

SIMULAÇÃO PROBATÓRIA: ${simulation ? `Força atual: ${simulation.current_strength}, Potencial: ${simulation.potential_strength}, Prob. êxito: ${simulation.estimated_success_probability}, Provas críticas faltantes: ${JSON.stringify(simulation.missing_critical_evidence || [])}, Resumo: ${simulation.simulation_summary || ""}` : "Não disponível"}

ANÁLISE TEMPORAL: ${temporal ? `Urgência: ${temporal.urgency_level}, Risco prazo: ${temporal.deadline_risk}, Risco prescrição: ${temporal.limitation_risk}, Análise: ${temporal.time_sensitivity_analysis || ""}` : "Não disponível"}

ANÁLISE ESTRATÉGICA: ${strategic ? `Prob. êxito: ${strategic.success_probability}, Recomendações: ${strategic.strategic_recommendations || ""}` : "Não disponível"}

SINAIS DE CONTEXTO: ${signals.length > 0 ? signals.map((s: any) => `[${s.source_type}] ${(s.content as string).slice(0, 300)}`).join("\n") : "Nenhum"}`;

    const tools = [{
      type: "function",
      function: {
        name: "case_diagnostics",
        description: "Retorna scores consolidados de 0 a 100 para cada dimensão do caso e resumo executivo.",
        parameters: {
          type: "object",
          properties: {
            evidence_score: { type: "integer", description: "Score de força probatória 0-100" },
            viability_score: { type: "integer", description: "Score de viabilidade 0-100" },
            timing_score: { type: "integer", description: "Score temporal (100=sem risco, 0=prazo expirado) 0-100" },
            urgency_score: { type: "integer", description: "Score de urgência (100=muito urgente) 0-100" },
            conflict_intensity_score: { type: "integer", description: "Score de intensidade do conflito 0-100" },
            financial_score: { type: "integer", description: "Score de atratividade financeira 0-100" },
            complexity_score: { type: "integer", description: "Score de complexidade (100=muito complexo) 0-100" },
            overall_case_strength: { type: "integer", description: "Força geral do caso 0-100" },
            risk_level: { type: "string", description: "baixo, moderado, alto, critico" },
            visual_summary: { type: "string", description: "Resumo executivo de 3-5 frases sobre o panorama geral do caso" },
            recommended_actions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  action: { type: "string" },
                  priority: { type: "string", description: "alta, media, baixa" },
                  category: { type: "string", description: "prova, prazo, estrategia, financeiro, conflito" },
                },
                required: ["action", "priority", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["evidence_score", "viability_score", "timing_score", "urgency_score", "conflict_intensity_score", "financial_score", "complexity_score", "overall_case_strength", "risk_level", "visual_summary", "recommended_actions"],
          additionalProperties: false,
        },
      },
    }];

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um sistema de diagnóstico jurídico que consolida todas as análises disponíveis de um caso em scores numéricos de 0 a 100. Gere scores realistas baseados nos dados disponíveis. Se algum módulo não tiver dados, faça inferências conservadoras baseadas na descrição do caso e área jurídica. O overall_case_strength é uma média ponderada considerando que força probatória e viabilidade têm mais peso. Gere 3-8 ações recomendadas priorizadas.`,
          },
          { role: "user", content: contextSummary },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "case_diagnostics" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await res.text();
      throw new Error(`AI error ${res.status}: ${errText}`);
    }

    const aiResult = await res.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response from AI");

    const diagnostics = JSON.parse(toolCall.function.arguments);

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-2.5-flash",
      feature_name: "update_case_diagnostics",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.0000005 + (usage.completion_tokens || 0) * 0.000002),
    });

    // Upsert diagnostics
    await supabase.from("case_visual_diagnostics").delete().eq("case_id", case_id).eq("user_id", user.id);
    const { error: insertErr } = await supabase.from("case_visual_diagnostics").insert({
      case_id,
      user_id: user.id,
      ...diagnostics,
    });
    if (insertErr) console.error("Diagnostics insert error:", insertErr);

    return new Response(JSON.stringify(diagnostics), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("update-case-diagnostics error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
