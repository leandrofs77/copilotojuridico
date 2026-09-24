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

    // Fetch all case context in parallel
    const [caseRes, docsRes, eventsRes, partiesRes, viabilityRes, strategicRes, checklistRes, signalsRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("documents").select("name, ai_classification, ai_summary, extracted_text").eq("case_id", case_id).eq("user_id", user.id).limit(15),
      supabase.from("extracted_events").select("title, event_date, event_category, description").eq("case_id", case_id).order("event_date").limit(30),
      supabase.from("case_parties").select("name, party_type, observations").eq("case_id", case_id).limit(20),
      supabase.from("case_viability_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_strategic_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_evidence_checklist").select("evidence_type, description, importance_level, status").eq("case_id", case_id),
      supabase.from("case_context_signals").select("source_type, content").eq("case_id", case_id).eq("user_id", user.id),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");
    const caseData = caseRes.data;

    const partiesSummary = (partiesRes.data || []).map((p: any) => `- ${p.name} (${p.party_type})${p.observations ? `: ${p.observations}` : ""}`).join("\n");
    const eventsSummary = (eventsRes.data || []).map((e: any) => `- ${e.event_date} [${e.event_category}] ${e.title}${e.description ? ` — ${e.description}` : ""}`).join("\n");
    const docsSummary = (docsRes.data || []).map((d: any) => {
      let s = `- ${d.name}`;
      if (d.ai_classification) s += ` (${d.ai_classification})`;
      if (d.ai_summary) s += `\n  Resumo: ${(d.ai_summary as string).slice(0, 400)}`;
      return s;
    }).join("\n");

    const viabilityData = viabilityRes.data?.[0];
    const viabilitySummary = viabilityData
      ? `Viabilidade: ${viabilityData.viability_level}, Complexidade: ${viabilityData.complexity_level}, Prob. Êxito: ${viabilityData.success_probability}\nResumo: ${viabilityData.analysis_summary || ""}\nRecomendação: ${viabilityData.recommendation || ""}`
      : "Não realizada";

    const strategicData = strategicRes.data?.[0];
    const strategicSummary = strategicData
      ? `Prob. Êxito: ${strategicData.success_probability}\nTeses: ${JSON.stringify(strategicData.possible_theses || [])}\nRiscos: ${JSON.stringify(strategicData.risk_factors || [])}\nRecomendações: ${strategicData.strategic_recommendations || ""}`
      : "Não realizada";

    const checklistSummary = (checklistRes.data || []).map((c: any) => `- [${c.status}] ${c.evidence_type}: ${c.description} (${c.importance_level})`).join("\n");

    const signalsSummary = (signalsRes.data || []).map((s: any) => `--- ${s.source_type} ---\n${(s.content as string).slice(0, 1000)}`).join("\n\n");

    const tools = [{
      type: "function",
      function: {
        name: "case_strength_analysis",
        description: "Retorna análise completa de força probatória, situação temporal e intensidade do conflito.",
        parameters: {
          type: "object",
          properties: {
            evidence_simulation: {
              type: "object",
              properties: {
                current_strength: { type: "string", description: "Força probatória atual: fraca, moderada, forte, muito_forte" },
                potential_strength: { type: "string", description: "Força probatória potencial se provas faltantes forem obtidas" },
                success_probability: { type: "string", description: "Probabilidade qualitativa de êxito: muito_baixa, baixa, moderada, alta, muito_alta" },
                missing_critical: { type: "array", items: { type: "object", properties: { evidence: { type: "string" }, impact: { type: "string" } }, required: ["evidence", "impact"], additionalProperties: false } },
                missing_recommended: { type: "array", items: { type: "object", properties: { evidence: { type: "string" }, impact: { type: "string" } }, required: ["evidence", "impact"], additionalProperties: false } },
                impact_analysis: { type: "array", items: { type: "object", properties: { evidence: { type: "string" }, current_status: { type: "string" }, potential_impact: { type: "string" } }, required: ["evidence", "current_status", "potential_impact"], additionalProperties: false } },
                summary: { type: "string" },
              },
              required: ["current_strength", "potential_strength", "success_probability", "missing_critical", "missing_recommended", "impact_analysis", "summary"],
              additionalProperties: false,
            },
            temporal_analysis: {
              type: "object",
              properties: {
                deadlines: { type: "array", items: { type: "object", properties: { deadline: { type: "string" }, type: { type: "string" }, risk: { type: "string" } }, required: ["deadline", "type", "risk"], additionalProperties: false } },
                urgency_level: { type: "string", description: "low, moderate, high, critical" },
                deadline_risk: { type: "string", description: "none, moderate, high, expired" },
                limitation_risk: { type: "string", description: "Risco de prescrição/decadência: none, moderate, high, critical" },
                time_analysis: { type: "string" },
              },
              required: ["deadlines", "urgency_level", "deadline_risk", "limitation_risk", "time_analysis"],
              additionalProperties: false,
            },
            conflict_analysis: {
              type: "object",
              properties: {
                conflict_intensity: { type: "string", description: "baixa, moderada, alta, extrema" },
                client_urgency: { type: "string", description: "baixa, moderada, alta, extrema" },
                emotional_pressure: { type: "string", description: "baixa, moderada, alta, extrema" },
                conflict_summary: { type: "string" },
              },
              required: ["conflict_intensity", "client_urgency", "emotional_pressure", "conflict_summary"],
              additionalProperties: false,
            },
          },
          required: ["evidence_simulation", "temporal_analysis", "conflict_analysis"],
          additionalProperties: false,
        },
      },
    }];

    const prompt = `CASO: ${caseData.title}
Área: ${caseData.legal_area || "N/A"}
Nº Processo: ${caseData.case_number || "N/A"}
Tribunal: ${caseData.court || "N/A"}
Status: ${caseData.status}
Descrição: ${caseData.description || "N/A"}

PARTES ENVOLVIDAS:
${partiesSummary || "Nenhuma"}

EVENTOS (${(eventsRes.data || []).length}):
${eventsSummary || "Nenhum"}

ANÁLISE DE VIABILIDADE:
${viabilitySummary}

ANÁLISE ESTRATÉGICA:
${strategicSummary}

CHECKLIST DE PROVAS:
${checklistSummary || "Nenhum"}

DOCUMENTOS (${(docsRes.data || []).length}):
${docsSummary || "Nenhum"}

SINAIS DE CONTEXTO (emails, mensagens, etc.):
${signalsSummary || "Nenhum sinal adicional fornecido"}`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um advogado estrategista brasileiro altamente experiente. Analise o caso fornecido em três dimensões:

1. FORÇA PROBATÓRIA: Avalie a força das provas atuais, identifique provas críticas e recomendadas que faltam, e o impacto de cada prova na probabilidade de êxito. Classifique a força como: fraca, moderada, forte, muito_forte.

2. ANÁLISE TEMPORAL: Avalie prazos relevantes, risco de prescrição/decadência, urgência processual. Considere a área jurídica para determinar prazos típicos. Classifique urgência como: low, moderate, high, critical. Deadline risk como: none, moderate, high, expired.

3. INTENSIDADE DO CONFLITO: Analise sinais contextuais (mensagens, emails, relatos) para determinar o tom emocional, tensão entre as partes, urgência do cliente e possível escalada. Classifique como: baixa, moderada, alta, extrema.

Se não houver dados suficientes para alguma dimensão, faça inferências razoáveis com base na área jurídica e descrição do caso, indicando a incerteza no resumo.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "case_strength_analysis" } },
      }),
    });

    if (!res.ok) {
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const errText = await res.text();
      throw new Error(`AI error ${res.status}: ${errText}`);
    }

    const aiResult = await res.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call response from AI");

    const analysis = JSON.parse(toolCall.function.arguments);
    const { evidence_simulation, temporal_analysis, conflict_analysis } = analysis;

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-2.5-flash",
      feature_name: "case_evidence_simulator",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.0000005 + (usage.completion_tokens || 0) * 0.000002),
    });

    // Upsert evidence simulation (delete old, insert new)
    await supabase.from("case_evidence_simulation").delete().eq("case_id", case_id).eq("user_id", user.id);
    const { error: simErr } = await supabase.from("case_evidence_simulation").insert({
      case_id,
      user_id: user.id,
      current_strength: evidence_simulation.current_strength,
      potential_strength: evidence_simulation.potential_strength,
      estimated_success_probability: evidence_simulation.success_probability,
      missing_critical_evidence: evidence_simulation.missing_critical,
      missing_recommended_evidence: evidence_simulation.missing_recommended,
      evidence_impact_analysis: evidence_simulation.impact_analysis,
      simulation_summary: evidence_simulation.summary,
    });
    if (simErr) console.error("Evidence simulation insert error:", simErr);

    // Upsert temporal analysis
    await supabase.from("case_temporal_analysis").delete().eq("case_id", case_id).eq("user_id", user.id);
    const { error: tempErr } = await supabase.from("case_temporal_analysis").insert({
      case_id,
      user_id: user.id,
      possible_deadlines: temporal_analysis.deadlines,
      urgency_level: temporal_analysis.urgency_level,
      deadline_risk: temporal_analysis.deadline_risk,
      limitation_risk: temporal_analysis.limitation_risk,
      time_sensitivity_analysis: temporal_analysis.time_analysis,
    });
    if (tempErr) console.error("Temporal analysis insert error:", tempErr);

    return new Response(JSON.stringify({
      evidence_simulation,
      temporal_analysis,
      conflict_analysis,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("case-evidence-simulator error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
