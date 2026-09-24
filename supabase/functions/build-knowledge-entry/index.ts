import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


const PIPELINE_VERSION = "1.1.0";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new Error("Unauthorized");

    const aiConsent = await hasExternalAiConsent(supabase, user.id);
    if (!aiConsent) {
      return new Response(JSON.stringify({ error: "external_ai_consent_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { case_id, source_type, source_id } = await req.json();
    if (!case_id) throw new Error("case_id is required");

    const { data: caseData, error: caseError } = await supabase
      .from("cases").select("*").eq("id", case_id).single();
    if (caseError || !caseData) throw new Error("Case not found");

    const sources = source_type ? [source_type] : [
      "viability_analysis", "strategic_analysis", "document", "report", "evidence_checklist"
    ];

    let contextParts: string[] = [];
    contextParts.push(`Caso: ${caseData.title}\nDescrição: ${caseData.description || "N/A"}\nÁrea Jurídica: ${caseData.legal_area || "N/A"}\nTags: ${(caseData.tags || []).join(", ")}`);

    const generatedFrom: string[] = [];

    for (const src of sources) {
      if (src === "viability_analysis") {
        const { data } = await supabase.from("case_viability_analysis")
          .select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1);
        if (data?.[0]) {
          generatedFrom.push("viability_analysis");
          contextParts.push(`\n--- Análise de Viabilidade ---\nResumo: ${data[0].analysis_summary || "N/A"}\nProbabilidade: ${data[0].success_probability || "N/A"}\nViabilidade: ${data[0].viability_level || "N/A"}\nRecomendação: ${data[0].recommendation || "N/A"}\nForças: ${JSON.stringify(data[0].strengths)}\nRiscos: ${JSON.stringify(data[0].risk_factors)}`);
        }
      }
      if (src === "strategic_analysis") {
        const { data } = await supabase.from("case_strategic_analysis")
          .select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1);
        if (data?.[0]) {
          generatedFrom.push("strategic_analysis");
          contextParts.push(`\n--- Análise Estratégica ---\nTeses: ${JSON.stringify(data[0].possible_theses)}\nForças: ${JSON.stringify(data[0].strengths)}\nFraquezas: ${JSON.stringify(data[0].weaknesses)}\nContra-argumentos: ${JSON.stringify(data[0].counterarguments)}\nJurisprudência: ${data[0].jurisprudence_summary || "N/A"}\nRecomendações: ${data[0].strategic_recommendations || "N/A"}`);
        }
      }
      if (src === "document") {
        const { data } = await supabase.from("documents")
          .select("name, ai_summary, ai_classification, ai_analysis")
          .eq("case_id", case_id).not("ai_summary", "is", null).limit(10);
        if (data?.length) {
          generatedFrom.push("documents");
          contextParts.push(`\n--- Documentos Analisados (${data.length}) ---\n` +
            data.map(d => `${d.name}: ${d.ai_summary || ""} | Classificação: ${d.ai_classification || "N/A"}`).join("\n"));
        }
      }
      if (src === "report") {
        const { data } = await supabase.from("reports")
          .select("title, summary, content_text").eq("case_id", case_id).limit(5);
        if (data?.length) {
          generatedFrom.push("reports");
          contextParts.push(`\n--- Relatórios (${data.length}) ---\n` +
            data.map(r => `${r.title}: ${r.summary || r.content_text?.slice(0, 500) || "N/A"}`).join("\n"));
        }
      }
      if (src === "evidence_checklist") {
        const { data } = await supabase.from("case_evidence_checklist")
          .select("*").eq("case_id", case_id);
        if (data?.length) {
          generatedFrom.push("evidence_checklist");
          contextParts.push(`\n--- Checklist de Provas (${data.length}) ---\n` +
            data.map(e => `[${e.status}] ${e.evidence_type}: ${e.description} (importância: ${e.importance_level})`).join("\n"));
        }
      }
    }

    const fullContext = contextParts.join("\n");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um assistente jurídico especializado em extrair conhecimento estruturado de casos. Analise o material fornecido e extraia blocos de conhecimento úteis para reutilização futura. Cada bloco deve ser autônomo e reutilizável. Atribua um confidence_score de 0 a 1 indicando sua confiança na qualidade e utilidade do bloco.`
          },
          { role: "user", content: fullContext }
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_knowledge",
            description: "Extrair blocos de conhecimento estruturados do caso jurídico",
            parameters: {
              type: "object",
              properties: {
                entries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      entry_type: { type: "string", enum: ["thesis", "argument", "precedent", "strategy", "risk", "outcome", "lesson_learned"] },
                      title: { type: "string", description: "Título curto e descritivo" },
                      content: { type: "string", description: "Conteúdo completo do bloco de conhecimento" },
                      tags: { type: "array", items: { type: "string" }, description: "Tags relevantes para busca" },
                      relevance_score: { type: "number", description: "Score de relevância de 0 a 1" },
                      confidence_score: { type: "number", description: "Confiança na qualidade desta entrada, de 0 a 1" },
                    },
                    required: ["entry_type", "title", "content", "tags", "relevance_score", "confidence_score"],
                    additionalProperties: false
                  }
                }
              },
              required: ["entries"],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: "function", function: { name: "extract_knowledge" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Payment required" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`AI error: ${status}`);
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in AI response");

    const { entries } = JSON.parse(toolCall.function.arguments);
    if (!entries?.length) {
      return new Response(JSON.stringify({ entries: [], message: "Nenhum conhecimento extraído" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date().toISOString();
    const insertData = entries.map((e: any) => ({
      user_id: user.id,
      case_id,
      source_type: source_type || "all",
      source_id: source_id || null,
      entry_type: e.entry_type,
      title: e.title,
      content: e.content,
      legal_area: caseData.legal_area,
      tags: e.tags || [],
      outcome: "pending",
      relevance_score: e.relevance_score || 0,
      confidence_score: e.confidence_score ?? null,
      is_manual: false,
      generated_by_ai: true,
      is_favorite: false,
      is_archived: false,
      metadata: {
        pipeline_version: PIPELINE_VERSION,
        edge_function: "build-knowledge-entry",
        generated_from: generatedFrom,
        analysis_date: now,
        legal_context: caseData.legal_area || null,
        confidence_level: (e.confidence_score ?? 0) >= 0.7 ? "high" : (e.confidence_score ?? 0) >= 0.4 ? "medium" : "low",
      },
      search_text: `${e.title} ${e.content} ${(e.tags || []).join(" ")}`,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("legal_knowledge_entries").insert(insertData).select();
    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      feature_name: "build_knowledge_entry",
      provider: "lovable_ai",
      model: "google/gemini-2.5-flash",
      input_tokens: aiData.usage?.prompt_tokens || 0,
      output_tokens: aiData.usage?.completion_tokens || 0,
      estimated_cost: 0,
    });

    return new Response(JSON.stringify({ entries: inserted, count: inserted?.length || 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("build-knowledge-entry error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
