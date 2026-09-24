import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

async function getProviderKeyCryptoKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("AI_PROVIDER_KEY_ENCRYPTION_KEY");
  if (!secret) throw new Error("AI_PROVIDER_KEY_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["decrypt"]);
}

async function decryptProviderKey(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith("v1:")) {
    throw new Error("Legacy plaintext AI provider key rejected");
  }
  const key = await getProviderKeyCryptoKey();
  const packed = Uint8Array.from(atob(value.slice(3)), c => c.charCodeAt(0));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const aiConsent = await hasExternalAiConsent(supabase, userId);
    if (!aiConsent) {
      return new Response(JSON.stringify({ error: "external_ai_consent_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profile_id, document_ids } = await req.json();

    if (!profile_id || !document_ids?.length) {
      return new Response(
        JSON.stringify({ error: "profile_id and document_ids required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify profile ownership
    const { data: profile, error: profileErr } = await supabase
      .from("legal_writing_profiles")
      .select("*")
      .eq("id", profile_id)
      .eq("user_id", userId)
      .single();

    if (profileErr || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch documents and extract texts
    const texts: string[] = [];
    for (const docId of document_ids) {
      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", docId)
        .eq("user_id", userId)
        .single();

      if (!doc) continue;

      let text = doc.extracted_text || "";
      if (!text && (doc.storage_path || doc.file_path)) {
        const path = doc.storage_path || doc.file_path;
        const { data: fileData } = await supabase.storage
          .from("documents")
          .download(path);
        if (fileData) {
          const mimeType = doc.mime_type || "";
          if (mimeType.includes("text") || mimeType.includes("txt")) {
            text = await fileData.text();
          }
        }
      }

      if (text.trim()) {
        texts.push(text);

        // Check if sample already exists
        const { data: existing } = await supabase
          .from("legal_writing_samples")
          .select("id")
          .eq("profile_id", profile_id)
          .eq("document_id", docId)
          .limit(1);

        if (!existing?.length) {
          await supabase.from("legal_writing_samples").insert({
            profile_id,
            document_id: docId,
            user_id: userId,
            extracted_text: text.slice(0, 50000),
          });
        }
      }
    }

    if (texts.length === 0) {
      return new Response(
        JSON.stringify({ error: "No text could be extracted from documents" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine API key
    const { data: userKey } = await supabase
      .from("ai_provider_keys")
      .select("api_key_encrypted")
      .eq("user_id", userId)
      .eq("provider", "google")
      .limit(1)
      .single();

    const userApiKey = await decryptProviderKey(userKey?.api_key_encrypted || null);
    const apiKey = userApiKey || LOVABLE_API_KEY;

    // Combine texts for analysis (max ~30k chars)
    const combinedTexts = texts
      .map((t, i) => `--- DOCUMENTO ${i + 1} ---\n${t.slice(0, 10000)}`)
      .join("\n\n");

    // Call AI with tool calling for structured output
    const tools = [
      {
        type: "function",
        function: {
          name: "save_style_profile",
          description:
            "Salva o perfil de estilo jurídico analisado a partir dos documentos.",
          parameters: {
            type: "object",
            properties: {
              tone: {
                type: "string",
                description:
                  "Tom geral da escrita (ex: formal técnico, formal moderado, assertivo)",
              },
              style_summary: {
                type: "string",
                description:
                  "Resumo de 3-5 frases descrevendo o estilo de escrita do advogado",
              },
              vocabulary_patterns: {
                type: "object",
                properties: {
                  frequent_terms: {
                    type: "array",
                    items: { type: "string" },
                    description: "Termos jurídicos mais usados",
                  },
                  connectives: {
                    type: "array",
                    items: { type: "string" },
                    description: "Conectivos e expressões de transição preferidos",
                  },
                  legal_citations_style: {
                    type: "string",
                    description:
                      "Forma como cita jurisprudência e legislação",
                  },
                },
                required: [
                  "frequent_terms",
                  "connectives",
                  "legal_citations_style",
                ],
                additionalProperties: false,
              },
              structure_patterns: {
                type: "object",
                properties: {
                  document_sections: {
                    type: "array",
                    items: { type: "string" },
                    description: "Seções típicas dos documentos",
                  },
                  avg_paragraph_length: {
                    type: "number",
                    description: "Comprimento médio de parágrafos em palavras",
                  },
                  avg_sentence_length: {
                    type: "number",
                    description: "Comprimento médio de frases em palavras",
                  },
                },
                required: [
                  "document_sections",
                  "avg_paragraph_length",
                  "avg_sentence_length",
                ],
                additionalProperties: false,
              },
              argument_patterns: {
                type: "object",
                properties: {
                  argumentation_style: {
                    type: "string",
                    description:
                      "Estilo de argumentação (dedutivo, indutivo, narrativo, etc.)",
                  },
                  typical_patterns: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "Padrões argumentativos recorrentes",
                  },
                },
                required: ["argumentation_style", "typical_patterns"],
                additionalProperties: false,
              },
              signature_phrases: {
                type: "array",
                items: { type: "string" },
                description:
                  "Frases ou expressões características do advogado",
              },
            },
            required: [
              "tone",
              "style_summary",
              "vocabulary_patterns",
              "structure_patterns",
              "argument_patterns",
              "signature_phrases",
            ],
            additionalProperties: false,
          },
        },
      },
    ];

    const aiRes = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um linguista computacional especializado em análise estilística de textos jurídicos brasileiros. Analise os documentos fornecidos e identifique com precisão:
1. Tom geral da escrita
2. Vocabulário recorrente (termos jurídicos, conectivos, estilo de citação)
3. Estrutura típica dos documentos (seções, comprimento de parágrafos e frases)
4. Padrões argumentativos (estilo, padrões recorrentes)
5. Frases de assinatura (expressões características do autor)

Use a ferramenta save_style_profile para retornar os resultados de forma estruturada.`,
          },
          {
            role: "user",
            content: `Analise o estilo de escrita jurídica dos seguintes ${texts.length} documentos:\n\n${combinedTexts}`,
          },
        ],
        tools,
        tool_choice: {
          type: "function",
          function: { name: "save_style_profile" },
        },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI error:", aiRes.status, errText);
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded, try again later" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI gateway error: ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured style data");
    }

    let styleData: any;
    try {
      styleData = JSON.parse(toolCall.function.arguments);
    } catch {
      throw new Error("Failed to parse AI style response");
    }

    // Update profile
    await supabase
      .from("legal_writing_profiles")
      .update({
        tone: styleData.tone,
        style_summary: styleData.style_summary,
        vocabulary_patterns: styleData.vocabulary_patterns,
        structure_patterns: styleData.structure_patterns,
        argument_patterns: styleData.argument_patterns,
        signature_phrases: styleData.signature_phrases,
        sample_documents_count: texts.length,
      })
      .eq("id", profile_id);

    return new Response(
      JSON.stringify({
        success: true,
        profile_id,
        documents_analyzed: texts.length,
        style: styleData,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("analyze-writing-style error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
