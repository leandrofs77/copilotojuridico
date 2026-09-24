import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DOC_TYPE_LABELS: Record<string, string> = {
  petition_initial: "Petição Inicial",
  contestacao: "Contestação",
  manifestacao: "Manifestação",
  recurso: "Recurso",
  memoriais: "Memoriais",
  notificacao: "Notificação Extrajudicial",
  contrato: "Contrato",
  parecer: "Parecer Jurídico",
};

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

    const { case_id, document_type, instructions } = await req.json();
    if (!case_id || !document_type) throw new Error("case_id and document_type are required");

    const [caseRes, radarRes, evidenceSimRes, knowledgeRes, docsRes, writingRes, partiesRes] = await Promise.all([
      supabase.from("cases").select("*").eq("id", case_id).eq("user_id", user.id).single(),
      supabase.from("case_strategy_radar").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("case_evidence_simulation").select("*").eq("case_id", case_id).order("created_at", { ascending: false }).limit(1),
      supabase.from("legal_knowledge_entries").select("title, content, entry_type, outcome").eq("user_id", user.id).in("entry_type", ["thesis", "argument", "precedent"]).eq("outcome", "favorable").limit(5),
      supabase.from("documents").select("name, ai_summary, extracted_text").eq("case_id", case_id).limit(10),
      supabase.from("legal_writing_profiles").select("*").eq("user_id", user.id).order("updated_at", { ascending: false }).limit(1),
      supabase.from("case_parties").select("name, party_type, document_number").eq("case_id", case_id).limit(10),
    ]);

    if (caseRes.error || !caseRes.data) throw new Error("Case not found");
    const c = caseRes.data;
    const radar = radarRes.data?.[0];
    const writing = writingRes.data?.[0];
    const docTypeLabel = DOC_TYPE_LABELS[document_type] || document_type;

    const partiesSummary = (partiesRes.data || []).map((p: any) => `${p.name} (${p.party_type})${p.document_number ? ` - Doc: ${p.document_number}` : ""}`).join("\n");

    const writingStyle = writing ? `
ESTILO DE REDAÇÃO DO ESCRITÓRIO:
Tom: ${writing.tone || "formal"}
Resumo: ${writing.style_summary || "N/A"}
Frases assinatura: ${JSON.stringify(writing.signature_phrases || [])}
Padrões de argumentação: ${JSON.stringify(writing.argument_patterns || {})}` : "";

    const prompt = `Gere uma ${docTypeLabel} para o caso abaixo.

CASO: ${c.title}
Área: ${c.legal_area || "N/A"} | Tribunal: ${c.court || "N/A"} | Nº: ${c.case_number || "N/A"}
Descrição: ${c.description || "N/A"}

PARTES:
${partiesSummary || "Não informadas"}

RADAR ESTRATÉGICO:
${radar ? radar.strategic_summary : "Não disponível"}

EVIDÊNCIAS:
${(docsRes.data || []).map((d: any) => `- ${d.name}: ${d.ai_summary || ""}`).join("\n") || "Nenhum documento"}

MEMÓRIA JURÍDICA FAVORÁVEL:
${(knowledgeRes.data || []).map((k: any) => `- [${k.entry_type}] ${k.title}: ${k.content?.slice(0, 500)}`).join("\n") || "Nenhuma"}
${writingStyle}
${instructions ? `\nINSTRUÇÕES ADICIONAIS: ${instructions}` : ""}`;

    const tools = [{
      type: "function",
      function: {
        name: "generate_document",
        description: "Gera documento jurídico completo.",
        parameters: {
          type: "object",
          properties: {
            title: { type: "string", description: "Título do documento" },
            content: { type: "string", description: "Conteúdo completo do documento jurídico em formato texto" },
          },
          required: ["title", "content"],
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
            content: `Você é o VirtuaLexis Docs — módulo de geração contextual de documentos jurídicos. Gere uma ${docTypeLabel} profissional, completa e pronta para uso.

Requisitos:
- Formato e estrutura adequados ao tipo de peça (${docTypeLabel})
- Linguagem jurídica formal brasileira
- Fundamentação legal com artigos e leis específicas
- Se houver estilo de redação do escritório, adapte o tom e vocabulário
- Inclua todas as seções necessárias para o tipo de documento
- Use dados reais do caso (partes, fatos, evidências)

O documento deve estar pronto para revisão final pelo advogado.`,
          },
          { role: "user", content: prompt },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "generate_document" } },
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

    const doc = JSON.parse(toolCall.function.arguments);

    const usage = aiResult.usage || {};
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id, case_id, provider: "lovable-ai", model: "google/gemini-3-flash-preview",
      feature_name: "generate_legal_document",
      input_tokens: usage.prompt_tokens || 0, output_tokens: usage.completion_tokens || 0,
      estimated_cost: ((usage.prompt_tokens || 0) * 0.000001 + (usage.completion_tokens || 0) * 0.000004),
    });

    await supabase.from("generated_legal_documents").insert({
      case_id, user_id: user.id,
      document_type,
      title: doc.title,
      content: doc.content,
      generation_context: { instructions, radar_available: !!radar, writing_profile: !!writing },
      generated_by_ai: true,
    });

    return new Response(JSON.stringify(doc), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-legal-document error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
