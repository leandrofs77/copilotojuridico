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

    // Fetch case context in parallel
    const [caseRes, docsRes, eventsRes, partiesRes, viabilityRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("documents").select("name, ai_classification, ai_summary, extracted_text").eq("case_id", case_id).eq("user_id", user.id).limit(15),
      supabase.from("extracted_events").select("title, event_date, event_category, description").eq("case_id", case_id).order("event_date").limit(30),
      supabase.from("case_parties").select("name, party_type, observations").eq("case_id", case_id).limit(20),
      supabase.from("case_viability_analysis").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found or access denied");
    const caseData = caseRes.data;

    const partiesSummary = (partiesRes.data || []).map((p: any) => `- ${p.name} (${p.party_type})${p.observations ? `: ${p.observations}` : ""}`).join("\n");
    const eventsSummary = (eventsRes.data || []).map((e: any) => `- ${e.event_date} [${e.event_category}] ${e.title}${e.description ? ` — ${e.description}` : ""}`).join("\n");
    const docsSummary = (docsRes.data || []).map((d: any) => {
      let s = `- ${d.name}`;
      if (d.ai_classification) s += ` (${d.ai_classification})`;
      if (d.ai_summary) s += `\n  Resumo: ${(d.ai_summary as string).slice(0, 500)}`;
      return s;
    }).join("\n");

    const viabilityData = viabilityRes.data?.[0];
    const viabilitySummary = viabilityData
      ? `Viabilidade: ${viabilityData.viability_level}, Complexidade: ${viabilityData.complexity_level}\nResumo: ${viabilityData.analysis_summary || ""}`
      : "Não realizada";

    const tools = [{
      type: "function",
      function: {
        name: "evidence_checklist",
        description: "Retorna checklist estruturado de provas necessárias para o caso jurídico.",
        parameters: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  evidence_type: { type: "string", description: "Tipo da prova: documental, testemunhal, pericial, digital, outro" },
                  description: { type: "string", description: "Descrição detalhada da prova necessária" },
                  importance_level: { type: "string", enum: ["alta", "media", "baixa"], description: "Nível de importância" },
                },
                required: ["evidence_type", "description", "importance_level"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
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

DOCUMENTOS (${(docsRes.data || []).length}):
${docsSummary || "Nenhum"}`;

    const res = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um advogado estrategista brasileiro experiente. Analise o caso e gere um checklist completo e detalhado de provas necessárias para fortalecer a causa.

Para cada prova, identifique:
1. O tipo (documental, testemunhal, pericial, digital, outro)
2. Uma descrição clara e acionável do que deve ser obtido
3. O nível de importância (alta, media, baixa)

Considere:
- Provas que já existem nos documentos do caso (não repita essas)
- Provas que faltam e são essenciais para sustentar as teses
- Provas que podem antecipar contra-argumentos da parte adversa
- Provas periciais ou técnicas quando aplicável
- Depoimentos e testemunhos necessários

Gere entre 5 e 15 itens, priorizando os mais importantes. Seja específico e prático.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "evidence_checklist" } },
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

    const { items } = JSON.parse(toolCall.function.arguments);

    // Log AI usage
    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      case_id,
      provider: "lovable-ai",
      model: "google/gemini-2.5-flash",
      feature_name: "case_evidence_checklist",
      input_tokens: usage.prompt_tokens || 0,
      output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.0000005 + (usage.completion_tokens || 0) * 0.000002),
    });

    // Delete old checklist items for this case and insert new ones
    await supabase.from("case_evidence_checklist").delete().eq("case_id", case_id).eq("user_id", user.id);

    const rows = (items as any[]).map((item: any) => ({
      case_id,
      user_id: user.id,
      evidence_type: item.evidence_type,
      description: item.description,
      importance_level: item.importance_level,
      status: "pending",
    }));

    const { error: insertError } = await supabase.from("case_evidence_checklist").insert(rows);
    if (insertError) throw new Error(`Insert error: ${insertError.message}`);

    return new Response(JSON.stringify({ items: rows }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("case-evidence-checklist error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
