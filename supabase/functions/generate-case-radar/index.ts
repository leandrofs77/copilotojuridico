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
    const [caseRes, docsRes, evidenceSimRes, temporalRes, visualRes, viabilityRes, knowledgeRes, similarRes, reportsRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("documents").select("name, ai_classification, ai_summary, ai_analysis").eq("case_id", case_id).eq("user_id", user.id).limit(20),
      supabase.from("case_evidence_simulation").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_temporal_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_visual_diagnostics").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_viability_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("legal_knowledge_entries").select("title, content, entry_type, outcome, legal_area, tags").eq("user_id", user.id).in("entry_type", ["thesis", "argument", "precedent"]).order("relevance_score", { ascending: false }).limit(10),
      supabase.from("knowledge_similarity_links").select("similarity_score, similarity_reasons, match_type").eq("source_case_id", case_id).order("similarity_score", { ascending: false }).limit(5),
      supabase.from("reports").select("title, summary").eq("case_id", case_id).order("created_at", { ascending: false }).limit(3),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");
    const c = caseRes.data;

    const evidenceSim = evidenceSimRes.data?.[0];
    const temporal = temporalRes.data?.[0];
    const visual = visualRes.data?.[0];
    const viability = viabilityRes.data?.[0];

    const prompt = `CASO: ${c.title}
Área: ${c.legal_area || "N/A"} | Status: ${c.status} | Tribunal: ${c.court || "N/A"}
Descrição: ${c.description || "N/A"}

DOCUMENTOS (${(docsRes.data || []).length}):
${(docsRes.data || []).map((d: any) => `- ${d.name}: ${d.ai_classification || ""} ${d.ai_summary || ""}`).join("\n")}

SIMULAÇÃO DE EVIDÊNCIAS:
${evidenceSim ? `Força atual: ${evidenceSim.current_strength}, Potencial: ${evidenceSim.potential_strength}, Prob. Êxito: ${evidenceSim.estimated_success_probability}\nResumo: ${evidenceSim.simulation_summary}` : "Não realizada"}

ANÁLISE TEMPORAL:
${temporal ? `Urgência: ${temporal.urgency_level}, Risco prescrição: ${temporal.limitation_risk}, Risco prazos: ${temporal.deadline_risk}\n${temporal.time_sensitivity_analysis}` : "Não realizada"}

DIAGNÓSTICO VISUAL:
${visual ? `Força geral: ${visual.overall_case_strength}/100, Evidências: ${visual.evidence_score}/100, Viabilidade: ${visual.viability_score}/100, Risco: ${visual.risk_level}\n${visual.visual_summary}` : "Não realizado"}

VIABILIDADE:
${viability ? `Nível: ${viability.viability_level}, Complexidade: ${viability.complexity_level}, Prob. Êxito: ${viability.success_probability}\n${viability.analysis_summary}` : "Não realizada"}

MEMÓRIA JURÍDICA (${(knowledgeRes.data || []).length} entradas relevantes):
${(knowledgeRes.data || []).map((k: any) => `- [${k.entry_type}] ${k.title} (resultado: ${k.outcome})`).join("\n") || "Nenhuma"}

CASOS SIMILARES:
${(similarRes.data || []).map((s: any) => `- Score: ${s.similarity_score}, Tipo: ${s.match_type}`).join("\n") || "Nenhum"}

RELATÓRIOS:
${(reportsRes.data || []).map((r: any) => `- ${r.title}: ${r.summary || ""}`).join("\n") || "Nenhum"}`;

    const tools = [{
      type: "function",
      function: {
        name: "generate_radar",
        description: "Gera radar estratégico completo do caso jurídico.",
        parameters: {
          type: "object",
          properties: {
            success_probability: { type: "number", description: "Probabilidade de êxito de 0 a 100" },
            risk_score: { type: "number", description: "Score de risco de 0 a 100" },
            strategic_advantages: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" }, detail: { type: "string" }, impact: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "detail", "impact"], additionalProperties: false },
            },
            strategic_weaknesses: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" }, detail: { type: "string" }, severity: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "detail", "severity"], additionalProperties: false },
            },
            recommended_actions: {
              type: "array",
              items: { type: "object", properties: { action: { type: "string" }, priority: { type: "string", enum: ["alta", "media", "baixa"] }, rationale: { type: "string" } }, required: ["action", "priority", "rationale"], additionalProperties: false },
            },
            recommended_evidence: {
              type: "array",
              items: { type: "object", properties: { evidence: { type: "string" }, importance: { type: "string", enum: ["critica", "importante", "desejavel"] }, how_to_obtain: { type: "string" } }, required: ["evidence", "importance", "how_to_obtain"], additionalProperties: false },
            },
            strategic_summary: { type: "string", description: "Resumo estratégico completo em 3-5 parágrafos" },
            confidence_score: { type: "number", description: "Confiança na análise de 0.0 a 1.0" },
          },
          required: ["success_probability", "risk_score", "strategic_advantages", "strategic_weaknesses", "recommended_actions", "recommended_evidence", "strategic_summary", "confidence_score"],
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
            content: `Você é o VirtuaLexis Radar — módulo de inteligência estratégica jurídica. Analise TODOS os dados disponíveis do caso (evidências, temporal, viabilidade, diagnóstico visual, memória jurídica, casos similares) e produza um radar estratégico completo.

Priorize dados da memória jurídica com outcome 'favorable'. Seja quantitativo, preciso e acionável. Use terminologia jurídica brasileira.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_radar" } },
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

    const radar = JSON.parse(toolCall.function.arguments);

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-3-flash-preview",
      feature_name: "generate_case_radar",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    // Save radar
    await supabase.from("case_strategy_radar").insert({
      case_id,
      user_id: user.id,
      ...radar,
    });

    return new Response(JSON.stringify(radar), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-case-radar error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
