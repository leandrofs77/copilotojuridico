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

    // Fetch case data + related
    const [caseRes, docsRes, eventsRes, partiesRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("documents").select("name, ai_classification, ai_summary, extracted_text").eq("case_id", case_id).eq("user_id", user.id).limit(10),
      supabase.from("extracted_events").select("title, event_date, event_category, description").eq("case_id", case_id).order("event_date").limit(20),
      supabase.from("case_parties").select("name, party_type").eq("case_id", case_id).limit(20),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");
    const caseData = caseRes.data;

    // Build context
    const docsSummary = (docsRes.data || []).map((d: any) => `- ${d.name}: ${d.ai_classification || "sem classificação"}`).join("\n");
    const eventsSummary = (eventsRes.data || []).map((e: any) => `- ${e.event_date}: ${e.title}`).join("\n");
    const partiesSummary = (partiesRes.data || []).map((p: any) => `- ${p.name} (${p.party_type})`).join("\n");

    // Extract some text for deeper analysis
    const docTexts = (docsRes.data || [])
      .filter((d: any) => d.extracted_text)
      .map((d: any) => d.extracted_text.slice(0, 3000))
      .join("\n---\n")
      .slice(0, 12000);

    const tools = [{
      type: "function",
      function: {
        name: "viability_analysis",
        description: "Retorna análise de viabilidade jurídica completa do caso.",
        parameters: {
          type: "object",
          properties: {
            viability_level: { type: "string", enum: ["alta", "media", "baixa", "muito_baixa"] },
            complexity_level: { type: "string", enum: ["simples", "moderada", "complexa", "muito_complexa"] },
            estimated_duration: { type: "string" },
            success_probability: { type: "string", enum: ["alta", "media", "baixa", "muito_baixa"] },
            risk_factors: { type: "array", items: { type: "object", properties: { factor: { type: "string" }, severity: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["factor", "severity"], additionalProperties: false } },
            strengths: { type: "array", items: { type: "object", properties: { point: { type: "string" }, impact: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "impact"], additionalProperties: false } },
            effort_estimation: { type: "string", description: "Estimativa de esforço para o escritório" },
            recommendation: { type: "string" },
            analysis_summary: { type: "string" },
          },
          required: ["viability_level", "complexity_level", "estimated_duration", "success_probability", "risk_factors", "strengths", "effort_estimation", "recommendation", "analysis_summary"],
          additionalProperties: false,
        },
      },
    }];

    const prompt = `Caso: ${caseData.title}
Área: ${caseData.legal_area || "N/A"}
Descrição: ${caseData.description || "N/A"}
Nº Processo: ${caseData.case_number || "N/A"}
Tribunal: ${caseData.court || "N/A"}

Partes:
${partiesSummary || "Nenhuma parte registrada"}

Documentos (${(docsRes.data || []).length}):
${docsSummary || "Nenhum documento"}

Timeline (${(eventsRes.data || []).length} eventos):
${eventsSummary || "Nenhum evento"}

${docTexts ? `Trechos dos documentos:\n${docTexts}` : ""}`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Você é um advogado sênior brasileiro. Analise profundamente o caso com todos os dados disponíveis (documentos, partes, timeline) e avalie a viabilidade jurídica. Considere complexidade processual, chances de êxito, riscos, pontos fortes, esforço necessário e duração estimada. Seja detalhado e realista." },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "viability_analysis" } },
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

    const analysis = JSON.parse(toolCall.function.arguments);

    // Log usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-2.5-flash",
      feature_name: "case_viability_analyze",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    // Save analysis
    await supabase.from("case_viability_analysis").insert({
      case_id,
      user_id: user.id,
      ...analysis,
    });

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("case-viability-analyze error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
