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

    const { description, legal_area, intake_id, uploaded_documents } = await req.json();

    if (!description) throw new Error("Description is required");

    // Build document context for AI prompt
    let docsContext = "";
    if (uploaded_documents && uploaded_documents.length > 0) {
      const docList = uploaded_documents.map((d: any, i: number) => `${i + 1}. ${d.name} (${d.file_type}, ${(d.file_size / 1024).toFixed(0)} KB)`).join("\n");
      docsContext = `\n\nDocumentos anexados pelo advogado:\n${docList}\n\nConsidere a existência destes documentos na sua análise de viabilidade e recomendação.`;
    }

    const tools = [{
      type: "function",
      function: {
        name: "intake_analysis",
        description: "Retorna análise estruturada de triagem de caso jurídico.",
        parameters: {
          type: "object",
          properties: {
            viability_level: { type: "string", enum: ["alta", "media", "baixa", "muito_baixa"] },
            complexity_level: { type: "string", enum: ["simples", "moderada", "complexa", "muito_complexa"] },
            estimated_duration: { type: "string", description: "Ex: 6-12 meses" },
            success_probability: { type: "string", enum: ["alta", "media", "baixa", "muito_baixa"] },
            risk_factors: { type: "array", items: { type: "object", properties: { factor: { type: "string" }, severity: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["factor", "severity"], additionalProperties: false } },
            strengths: { type: "array", items: { type: "object", properties: { point: { type: "string" }, impact: { type: "string", enum: ["alto", "medio", "baixo"] } }, required: ["point", "impact"], additionalProperties: false } },
            recommendation: { type: "string", enum: ["aceitar", "aprofundar_analise", "recusar", "solicitar_documentos"] },
            analysis_summary: { type: "string", description: "Resumo de 2-3 parágrafos da análise" },
          },
          required: ["viability_level", "complexity_level", "estimated_duration", "success_probability", "risk_factors", "strengths", "recommendation", "analysis_summary"],
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
          { role: "system", content: `Você é um advogado sênior brasileiro especializado em triagem de casos. Analise a descrição do problema e a área do direito fornecida pelo advogado. Avalie rapidamente se vale a pena aceitar o caso, considerando viabilidade, complexidade, riscos, pontos fortes e probabilidade de êxito. Seja realista e objetivo. Use a ferramenta intake_analysis para retornar sua análise estruturada.` },
          { role: "user", content: `Área do Direito: ${legal_area || "Não especificada"}\n\nDescrição do problema:\n${description}${docsContext}` },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "intake_analysis" } },
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      if (res.status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded. Tente novamente em alguns instantes." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (res.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
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
      provider: "lovable-ai",
      model: "google/gemini-2.5-flash",
      feature_name: "case_intake_analyze",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    // Save or update intake
    const docsPayload = uploaded_documents && uploaded_documents.length > 0 ? uploaded_documents : [];

    if (intake_id) {
      await supabase.from("case_intake_analysis").update({
        ...analysis,
        uploaded_documents: docsPayload,
        status: "analyzed",
      }).eq("id", intake_id).eq("user_id", user.id);
    } else {
      const { data: inserted } = await supabase.from("case_intake_analysis").insert({
        user_id: user.id,
        description,
        legal_area: legal_area || null,
        uploaded_documents: docsPayload,
        ...analysis,
        status: "analyzed",
      }).select("id").single();

      return new Response(JSON.stringify({ ...analysis, id: inserted?.id, uploaded_documents: docsPayload }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ...analysis, uploaded_documents: docsPayload }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("case-intake-analyze error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
