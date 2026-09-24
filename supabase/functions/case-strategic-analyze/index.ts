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
    const [caseRes, docsRes, eventsRes, partiesRes, viabilityRes, reportsRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("documents").select("name, ai_classification, ai_summary, ai_analysis, extracted_text").eq("case_id", case_id).eq("user_id", user.id).limit(15),
      supabase.from("extracted_events").select("title, event_date, event_category, description, relevance").eq("case_id", case_id).order("event_date").limit(30),
      supabase.from("case_parties").select("name, party_type, observations").eq("case_id", case_id).limit(20),
      supabase.from("case_viability_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("reports").select("title, summary, content_text").eq("case_id", case_id).order("created_at", { ascending: false }).limit(3),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");
    const caseData = caseRes.data;

    // Build rich context
    const partiesSummary = (partiesRes.data || []).map((p: any) => `- ${p.name} (${p.party_type})${p.observations ? `: ${p.observations}` : ""}`).join("\n");
    const eventsSummary = (eventsRes.data || []).map((e: any) => `- ${e.event_date} [${e.event_category}] ${e.title}${e.description ? ` — ${e.description}` : ""}`).join("\n");
    const docsSummary = (docsRes.data || []).map((d: any) => {
      let s = `- ${d.name}`;
      if (d.ai_classification) s += `\n  Classificação: ${d.ai_classification}`;
      if (d.ai_analysis) s += `\n  Análise: ${(d.ai_analysis as string).slice(0, 1500)}`;
      return s;
    }).join("\n\n");

    const viabilityData = viabilityRes.data?.[0];
    const viabilitySummary = viabilityData
      ? `Viabilidade: ${viabilityData.viability_level}, Complexidade: ${viabilityData.complexity_level}, Prob. Êxito: ${viabilityData.success_probability}\nRecomendação: ${viabilityData.recommendation}\nResumo: ${viabilityData.analysis_summary}`
      : "Não realizada";

    const reportsSummary = (reportsRes.data || []).map((r: any) => `- ${r.title}: ${(r.summary || r.content_text || "").slice(0, 1000)}`).join("\n\n");

    // Extract key document texts for deeper analysis
    const docTexts = (docsRes.data || [])
      .filter((d: any) => d.extracted_text)
      .map((d: any) => `[${d.name}]\n${(d.extracted_text as string).slice(0, 4000)}`)
      .join("\n---\n")
      .slice(0, 20000);

    const tools = [{
      type: "function",
      function: {
        name: "strategic_analysis",
        description: "Retorna análise estratégica completa do caso jurídico.",
        parameters: {
          type: "object",
          properties: {
            strengths: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" }, detail: { type: "string" }, impact: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "detail", "impact"], additionalProperties: false },
              description: "Pontos fortes do caso",
            },
            weaknesses: {
              type: "array",
              items: { type: "object", properties: { point: { type: "string" }, detail: { type: "string" }, severity: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "detail", "severity"], additionalProperties: false },
              description: "Pontos fracos e vulnerabilidades",
            },
            possible_theses: {
              type: "array",
              items: { type: "object", properties: { thesis: { type: "string" }, legal_basis: { type: "string" }, viability: { type: "string", enum: ["alta", "media", "baixa"] }, notes: { type: "string" } }, required: ["thesis", "legal_basis", "viability"], additionalProperties: false },
              description: "Teses jurídicas possíveis com fundamento legal",
            },
            risk_factors: {
              type: "array",
              items: { type: "object", properties: { risk: { type: "string" }, probability: { type: "string", enum: ["alta", "media", "baixa"] }, mitigation: { type: "string" } }, required: ["risk", "probability", "mitigation"], additionalProperties: false },
              description: "Riscos identificados com mitigações",
            },
            counterarguments: {
              type: "array",
              items: { type: "object", properties: { argument: { type: "string" }, likely_origin: { type: "string" }, response_strategy: { type: "string" } }, required: ["argument", "likely_origin", "response_strategy"], additionalProperties: false },
              description: "Contra-argumentos previsíveis da parte adversa",
            },
            jurisprudence_summary: { type: "string", description: "Resumo de jurisprudência e precedentes relevantes" },
            success_probability: { type: "string", enum: ["alta", "media", "baixa", "muito_baixa"], description: "Probabilidade qualitativa de êxito" },
            strategic_recommendations: { type: "string", description: "Recomendações estratégicas detalhadas para condução do caso" },
          },
          required: ["strengths", "weaknesses", "possible_theses", "risk_factors", "counterarguments", "jurisprudence_summary", "success_probability", "strategic_recommendations"],
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
Observações: ${caseData.observations || "N/A"}

PARTES ENVOLVIDAS:
${partiesSummary || "Nenhuma"}

LINHA DO TEMPO (${(eventsRes.data || []).length} eventos):
${eventsSummary || "Nenhum evento"}

ANÁLISE DE VIABILIDADE:
${viabilitySummary}

DOCUMENTOS ANALISADOS (${(docsRes.data || []).length}):
${docsSummary || "Nenhum documento"}

RELATÓRIOS EXISTENTES:
${reportsSummary || "Nenhum"}

TRECHOS DOS DOCUMENTOS:
${docTexts || "Sem textos extraídos"}`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-pro",
        messages: [
          {
            role: "system",
            content: `Você é um estrategista jurídico sênior brasileiro com vasta experiência em litígios. Analise TODOS os dados do caso (documentos, eventos, partes, viabilidade, relatórios) e produza uma análise estratégica completa e profunda.

Sua análise deve:
1. Identificar todos os pontos fortes e fracos do caso com detalhamento
2. Propor teses jurídicas viáveis com fundamentação legal específica (artigos, leis, princípios)
3. Antecipar contra-argumentos da parte adversa e propor estratégias de resposta
4. Mapear riscos com probabilidade e propostas de mitigação
5. Identificar jurisprudência e precedentes relevantes
6. Avaliar probabilidade qualitativa de êxito
7. Fornecer recomendações estratégicas detalhadas e acionáveis

Seja extremamente detalhado, realista e profissional. Use terminologia jurídica precisa.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "strategic_analysis" } },
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

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-2.5-pro",
      feature_name: "case_strategic_analyze",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.0000025 + (usage.completion_tokens || 0) * 0.00001),
    });

    // Save analysis
    await supabase.from("case_strategic_analysis").insert({
      case_id,
      user_id: user.id,
      ...analysis,
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("case-strategic-analyze error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
