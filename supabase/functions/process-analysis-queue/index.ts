import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Helpers ──────────────────────────────────────────────

async function updateJobPhase(jobId: string, phase: string) {
  await supabase
    .from("document_analysis_jobs")
    .update({ analysis_phase: phase })
    .eq("id", jobId);
}

async function callAI(
  messages: { role: string; content: string }[],
  model: string,
  tools?: any[],
  toolChoice?: any
) {
  const body: any = { model, messages };
  if (tools) body.tools = tools;
  if (toolChoice) body.tool_choice = toolChoice;

  const res = await fetch(AI_GATEWAY, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI gateway ${res.status}: ${text}`);
  }
  return await res.json();
}

async function hasUserApiKey(userId: string, provider: string) {
  const { data } = await supabase
    .from("ai_provider_keys")
    .select("id")
    .eq("user_id", userId)
    .eq("provider", provider)
    .limit(1)
    .maybeSingle();
  return !!data?.id;
}

// ── Pipeline Phases ──────────────────────────────────────

async function phase1_extractText(
  jobId: string,
  doc: any
): Promise<string> {
  await updateJobPhase(jobId, "extraction");

  if (doc.extracted_text && doc.extracted_text.trim().length > 0) {
    return doc.extracted_text;
  }

  // Download file from storage
  let fileContent = "";
  if (doc.storage_path || doc.file_path) {
    const path = doc.storage_path || doc.file_path;
    const { data: fileData, error } = await supabase.storage
      .from("documents")
      .download(path);

    if (error) throw new Error(`Storage download error: ${error.message}`);

    // For text-based files, read directly. For PDFs/images, send to AI for extraction.
    const mimeType = doc.mime_type || doc.file_type || "";
    if (
      mimeType.includes("text") ||
      mimeType.includes("txt") ||
      mimeType.includes("csv")
    ) {
      fileContent = await fileData.text();
    } else {
      // Convert to base64 and ask AI to extract text
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(
        String.fromCharCode(...new Uint8Array(arrayBuffer))
      );

      const aiRes = await callAI(
        [
          {
            role: "system",
            content:
              "Você é um assistente especializado em extração de texto de documentos jurídicos. Extraia todo o texto legível do documento fornecido, mantendo a estrutura e formatação original o máximo possível. Responda APENAS com o texto extraído, sem comentários adicionais.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Extraia todo o texto deste documento chamado "${doc.name}".`,
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType || "application/octet-stream"};base64,${base64}`,
                },
              },
            ] as any,
          },
        ],
        "google/gemini-2.5-flash"
      );
      fileContent =
        aiRes.choices?.[0]?.message?.content || "Não foi possível extrair texto.";
    }
  }

  if (fileContent) {
    await supabase
      .from("documents")
      .update({ extracted_text: fileContent })
      .eq("id", doc.id);
  }

  return fileContent;
}

async function phase2_classify(
  jobId: string,
  docId: string,
  text: string
): Promise<string> {
  await updateJobPhase(jobId, "classification");

  const truncated = text.slice(0, 8000);
  const aiRes = await callAI(
    [
      {
        role: "system",
        content: `Você é um especialista jurídico brasileiro. Analise o texto e retorne uma classificação estruturada em formato JSON com os campos:
- tipo_documento: (petição inicial, contestação, sentença, acórdão, contrato, procuração, laudo pericial, outro)
- area_juridica: (civil, penal, trabalhista, tributário, administrativo, constitucional, empresarial, família, outro)
- partes_principais: lista de nomes das partes envolvidas
- resumo: resumo de 2-3 frases do documento
Responda APENAS com o JSON válido.`,
      },
      {
        role: "user",
        content: `Classifique este documento jurídico:\n\n${truncated}`,
      },
    ],
    "google/gemini-2.5-flash"
  );

  const classification =
    aiRes.choices?.[0]?.message?.content || "{}";

  await supabase
    .from("documents")
    .update({ ai_classification: classification })
    .eq("id", docId);

  return classification;
}

async function phase3_extractEvents(
  jobId: string,
  doc: any,
  text: string
): Promise<void> {
  await updateJobPhase(jobId, "events");

  const truncated = text.slice(0, 10000);
  const tools = [
    {
      type: "function",
      function: {
        name: "register_events",
        description:
          "Registra eventos jurídicos extraídos do documento com datas.",
        parameters: {
          type: "object",
          properties: {
            events: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Título curto do evento",
                  },
                  description: {
                    type: "string",
                    description: "Descrição detalhada",
                  },
                  event_date: {
                    type: "string",
                    description: "Data no formato YYYY-MM-DD",
                  },
                  event_category: {
                    type: "string",
                    enum: [
                      "fato",
                      "decisao",
                      "prazo",
                      "audiencia",
                      "pericia",
                      "outro",
                    ],
                  },
                  relevance: {
                    type: "string",
                    enum: ["alta", "media", "baixa"],
                  },
                },
                required: ["title", "event_date", "event_category"],
                additionalProperties: false,
              },
            },
          },
          required: ["events"],
          additionalProperties: false,
        },
      },
    },
  ];

  const aiRes = await callAI(
    [
      {
        role: "system",
        content:
          "Você é um assistente jurídico especializado em análise de documentos legais brasileiros. Extraia TODOS os eventos com datas mencionados no texto. Inclua fatos, decisões judiciais, prazos, audiências e perícias. Use a ferramenta register_events para retornar os resultados.",
      },
      {
        role: "user",
        content: `Extraia todos os eventos jurídicos com datas do seguinte documento:\n\n${truncated}`,
      },
    ],
    "google/gemini-2.5-flash",
    tools,
    { type: "function", function: { name: "register_events" } }
  );

  // Parse tool call response
  const toolCall = aiRes.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return;

  let eventsData: any;
  try {
    eventsData = JSON.parse(toolCall.function.arguments);
  } catch {
    return;
  }

  const eventsToInsert = (eventsData.events || [])
    .filter((e: any) => e.title && e.event_date)
    .map((e: any) => ({
      case_id: doc.case_id,
      user_id: doc.user_id,
      title: e.title,
      description: e.description || null,
      event_date: e.event_date,
      event_category: e.event_category || "outro",
      relevance: e.relevance || "media",
      source_type: "ia",
      source_document_id: doc.id,
      is_manual: false,
      confidence: "medio",
      evidence_type: "documental",
    }));

  if (eventsToInsert.length > 0) {
    await supabase.from("extracted_events").insert(eventsToInsert);
  }
}

async function phase4_jurisprudence(
  jobId: string,
  docId: string,
  text: string,
  classification: string
): Promise<string> {
  await updateJobPhase(jobId, "jurisprudence");

  const truncated = text.slice(0, 6000);
  const aiRes = await callAI(
    [
      {
        role: "system",
        content: `Você é um pesquisador jurídico brasileiro especializado. Com base no documento e sua classificação, identifique:
1. Teses jurídicas aplicáveis
2. Possíveis precedentes e jurisprudência relevante (cite tribunais quando possível)
3. Pontos fortes e fracos da argumentação
4. Recomendações estratégicas

Formate sua resposta de forma estruturada e profissional.`,
      },
      {
        role: "user",
        content: `Classificação do documento: ${classification}\n\nTexto do documento:\n${truncated}`,
      },
    ],
    "google/gemini-2.5-flash"
  );

  const analysis =
    aiRes.choices?.[0]?.message?.content || "Análise não disponível.";

  await supabase
    .from("documents")
    .update({ ai_analysis: analysis })
    .eq("id", docId);

  return analysis;
}

async function phase5_report(
  jobId: string,
  doc: any,
  text: string,
  classification: string,
  analysis: string
): Promise<void> {
  await updateJobPhase(jobId, "report");

  // Fetch user's active writing style profile
  let styleInstruction = "";
  const { data: styleProfile } = await supabase
    .from("legal_writing_profiles")
    .select("*")
    .eq("user_id", doc.user_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (styleProfile?.style_summary) {
    // Fetch up to 3 real samples for few-shot prompting
    const { data: samples } = await supabase
      .from("legal_writing_samples")
      .select("extracted_text")
      .eq("profile_id", styleProfile.id)
      .limit(3);

    const sampleTexts = (samples || [])
      .map((s: any, i: number) => `--- Exemplo ${i + 1} ---\n${(s.extracted_text || "").slice(0, 2000)}`)
      .join("\n\n");

    styleInstruction = `
IMPORTANTE: Use o seguinte perfil de estilo jurídico do advogado ao redigir o documento:
- Tom: ${styleProfile.tone || "formal"}
- Estilo: ${styleProfile.style_summary}
- Vocabulário preferido: ${JSON.stringify((styleProfile.vocabulary_patterns as any)?.frequent_terms || [])}
- Conectivos preferidos: ${JSON.stringify((styleProfile.vocabulary_patterns as any)?.connectives || [])}
- Estilo de citação: ${(styleProfile.vocabulary_patterns as any)?.legal_citations_style || "padrão"}
- Estrutura típica: ${JSON.stringify((styleProfile.structure_patterns as any)?.document_sections || [])}
- Estilo argumentativo: ${(styleProfile.argument_patterns as any)?.argumentation_style || ""}
- Frases características: ${JSON.stringify(styleProfile.signature_phrases || [])}

${sampleTexts ? `Exemplos reais do estilo do advogado (use como referência):\n\n${sampleTexts}` : ""}
`;
  }

  const truncated = text.slice(0, 6000);
  const aiRes = await callAI(
    [
      {
        role: "system",
        content: `Você é um advogado sênior brasileiro especializado em gerar dossiês jurídicos completos. Gere um relatório profissional estruturado com as seguintes seções:

## 1. Resumo Executivo
Breve resumo do documento e seu contexto.

## 2. Cronologia dos Fatos
Lista ordenada dos principais eventos e datas.

## 3. Análise Jurídica
Pontos jurídicos relevantes, teses aplicáveis e fundamentação legal.

## 4. Jurisprudência
Precedentes e decisões relevantes identificadas.

## 5. Conclusão e Recomendações
Pontos de atenção e próximos passos sugeridos.

Seja preciso, profissional e detalhado.${styleInstruction}`,
      },
      {
        role: "user",
        content: `Gere o dossiê jurídico completo.

Classificação: ${classification}

Análise jurisprudencial: ${analysis}

Texto do documento: ${truncated}`,
      },
    ],
    "google/gemini-2.5-flash"
  );

  const reportContent =
    aiRes.choices?.[0]?.message?.content || "Relatório não disponível.";

  // Parse classification for title
  let docType = "Documento";
  try {
    const cls = JSON.parse(classification);
    docType = cls.tipo_documento || "Documento";
  } catch {}

  await supabase.from("reports").insert({
    case_id: doc.case_id,
    user_id: doc.user_id,
    title: `Dossiê — ${doc.name}`,
    content_text: reportContent,
    summary: `Dossiê jurídico gerado automaticamente para o documento "${doc.name}" (${docType}).`,
    report_type: "dossie",
    status: "gerado",
    generated_by_ai: true,
    created_by: doc.user_id,
  });
}

// ── Main Handler ─────────────────────────────────────────

async function processJob(job: any) {
  const jobId = job.id;

  try {
    // Mark as processing
    await supabase
      .from("document_analysis_jobs")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        analysis_phase: "starting",
      })
      .eq("id", jobId);

    // Get document
    const { data: doc, error: docError } = await supabase
      .from("documents")
      .select("*")
      .eq("id", job.document_id)
      .single();

    if (docError || !doc) throw new Error("Document not found");

    // Verify ownership
    if (doc.user_id !== job.user_id) throw new Error("User mismatch");

    const aiConsent = await hasExternalAiConsent(supabase, job.user_id);
    if (!aiConsent) {
      await supabase
        .from("document_analysis_jobs")
        .update({
          status: "error",
          error: "external_ai_consent_required",
          analysis_phase: "blocked",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);

      await supabase
        .from("documents")
        .update({ analysis_status: "error" })
        .eq("id", doc.id)
        .eq("user_id", job.user_id);

      return;
    }

    // Update document status
    await supabase
      .from("documents")
      .update({
        analysis_status: "processing",
        analysis_started_at: new Date().toISOString(),
      })
      .eq("id", doc.id);

    // Determine provider
    const userHasGoogleKey = await hasUserApiKey(job.user_id, "google");
    const providerUsed = userHasGoogleKey ? "google (configured user key)" : "lovable-ai";

    // Phase 1: Extract text
    const text = await phase1_extractText(jobId, doc);
    if (!text || text.trim().length === 0) {
      throw new Error("Could not extract text from document");
    }

    // Phase 2: Classification
    const classification = await phase2_classify(jobId, doc.id, text);

    // Phase 3: Extract events
    await phase3_extractEvents(jobId, doc, text);

    // Phase 4: Jurisprudence research
    const analysis = await phase4_jurisprudence(
      jobId,
      doc.id,
      text,
      classification
    );

    // Phase 5: Generate report
    await phase5_report(jobId, doc, text, classification, analysis);

    // Finalize
    const now = new Date().toISOString();
    await supabase
      .from("documents")
      .update({
        analysis_status: "completed",
        analysis_completed_at: now,
        ai_provider_used: providerUsed,
      })
      .eq("id", doc.id);

    await supabase
      .from("document_analysis_jobs")
      .update({
        status: "completed",
        completed_at: now,
        analysis_phase: "done",
        result: { phases_completed: 5, provider: providerUsed },
      })
      .eq("id", jobId);

    // Phase 6: Cleanup binary if flagged for deletion
    const storageMode = doc.storage_mode || "supabase_primary";
    const shouldDelete = doc.delete_from_supabase_after_processing === true;
    const deletableModes = ["external_only", "temporary_supabase"];

    if (shouldDelete && deletableModes.includes(storageMode) && (doc.storage_path || doc.file_path)) {
      try {
        const path = doc.storage_path || doc.file_path;
        await supabase.storage.from("documents").remove([path]);
        await supabase
          .from("documents")
          .update({
            supabase_deleted_at: now,
            is_temp_copy: false,
          })
          .eq("id", doc.id);
        console.log(`Cleaned up binary for doc ${doc.id}`);
      } catch (cleanupErr: any) {
        console.error(`Cleanup failed for doc ${doc.id}:`, cleanupErr.message);
        // Non-fatal: analysis is complete, cleanup can be retried later
      }
    }

    // Activity log
    await supabase.from("activity_logs").insert({
      user_id: job.user_id,
      action: "document_processed",
      entity_type: "document",
      entity_id: doc.id,
      case_id: doc.case_id,
      metadata: {
        title: doc.name,
        provider: providerUsed,
        phases: 5,
        storage_cleaned: shouldDelete && deletableModes.includes(storageMode),
      },
    });
  } catch (err: any) {
    console.error(`Job ${jobId} failed:`, err.message);
    const attempts = (job.attempts || 0) + 1;
    const isFinal = attempts >= 3;

    await supabase
      .from("document_analysis_jobs")
      .update({
        status: isFinal ? "error" : "pending",
        attempts,
        error: err.message,
        analysis_phase: isFinal ? "failed" : job.analysis_phase,
      })
      .eq("id", jobId);

    if (isFinal) {
      await supabase
        .from("documents")
        .update({ analysis_status: "error" })
        .eq("id", job.document_id);
    }
  }
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const workerSecret = Deno.env.get("INTERNAL_WORKER_SECRET");
    const providedSecret = req.headers.get("x-internal-worker-secret");
    if (!workerSecret || !providedSecret || providedSecret !== workerSecret) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch pending jobs
    const { data: jobs, error } = await supabase
      .from("document_analysis_jobs")
      .select("*")
      .eq("status", "pending")
      .order("priority", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(3);

    if (error) throw error;
    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending jobs", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process each job sequentially
    for (const job of jobs) {
      await processJob(job);
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${jobs.length} jobs`,
        processed: jobs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Worker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
