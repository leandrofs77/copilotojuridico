import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


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

    const { case_id, query_text, legal_area } = await req.json();

    let searchQuery = query_text || "";
    let targetLegalArea = legal_area || null;
    let sourceCaseId = case_id;

    if (case_id && !query_text) {
      const { data: caseData } = await supabase
        .from("cases").select("title, description, legal_area, tags").eq("id", case_id).single();
      if (caseData) {
        searchQuery = `${caseData.title} ${caseData.description || ""} ${(caseData.tags || []).join(" ")}`;
        targetLegalArea = targetLegalArea || caseData.legal_area;
      }
    }

    if (!searchQuery.trim()) throw new Error("No search query available");

    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: searchResults, error: searchError } = await adminSupabase.rpc("search_knowledge", {
      _user_id: user.id,
      _query: searchQuery,
      _legal_area: targetLegalArea,
      _entry_type: null,
      _limit: 50,
    });

    if (searchError) throw new Error(`Search error: ${searchError.message}`);

    const caseScores: Record<string, { case_id: string; total_rank: number; entries: any[]; count: number }> = {};
    for (const r of (searchResults || [])) {
      if (r.case_id === sourceCaseId || !r.case_id) continue;
      if (!caseScores[r.case_id]) {
        caseScores[r.case_id] = { case_id: r.case_id, total_rank: 0, entries: [], count: 0 };
      }
      caseScores[r.case_id].total_rank += r.rank;
      caseScores[r.case_id].count += 1;
      caseScores[r.case_id].entries.push({
        title: r.title, entry_type: r.entry_type, rank: r.rank, outcome: r.outcome,
      });
    }

    const ranked = Object.values(caseScores)
      .sort((a, b) => b.total_rank - a.total_rank)
      .slice(0, 10);

    if (ranked.length === 0) {
      return new Response(JSON.stringify({ similar_cases: [], message: "Nenhum caso semelhante encontrado" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const caseIds = ranked.map(r => r.case_id);
    const { data: cases } = await supabase
      .from("cases").select("id, title, legal_area, status, tags").in("id", caseIds);
    const caseMap: Record<string, any> = {};
    for (const c of (cases || [])) caseMap[c.id] = c;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    let similarCases = ranked.map(r => ({
      case_id: r.case_id,
      title: caseMap[r.case_id]?.title || "Caso desconhecido",
      legal_area: caseMap[r.case_id]?.legal_area || null,
      status: caseMap[r.case_id]?.status || null,
      similarity_score: Math.min(r.total_rank / (ranked[0]?.total_rank || 1), 1),
      matching_entries: r.entries.slice(0, 5),
      reasons: [] as string[],
    }));

    if (LOVABLE_API_KEY && ranked.length > 0) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash-lite",
            messages: [
              {
                role: "system",
                content: "Você é um assistente jurídico. Dado um caso de referência e casos similares encontrados, forneça razões concisas de similaridade para cada caso."
              },
              {
                role: "user",
                content: `Caso de referência: ${searchQuery.slice(0, 500)}\n\nCasos similares:\n${similarCases.map((c, i) => `${i + 1}. ${c.title} (${c.legal_area || "N/A"}) - Entradas: ${c.matching_entries.map(e => e.title).join(", ")}`).join("\n")}`
              }
            ],
            tools: [{
              type: "function",
              function: {
                name: "provide_reasons",
                description: "Fornecer razões de similaridade para cada caso",
                parameters: {
                  type: "object",
                  properties: {
                    cases: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          index: { type: "number" },
                          reasons: { type: "array", items: { type: "string" } },
                        },
                        required: ["index", "reasons"],
                        additionalProperties: false
                      }
                    }
                  },
                  required: ["cases"],
                  additionalProperties: false
                }
              }
            }],
            tool_choice: { type: "function", function: { name: "provide_reasons" } },
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall) {
            const { cases: reasonCases } = JSON.parse(toolCall.function.arguments);
            for (const rc of (reasonCases || [])) {
              if (rc.index >= 0 && rc.index < similarCases.length) {
                similarCases[rc.index].reasons = rc.reasons || [];
              }
            }
          }

          await supabase.from("ai_usage_logs").insert({
            user_id: user.id,
            case_id: sourceCaseId,
            feature_name: "find_similar_cases",
            provider: "lovable_ai",
            model: "google/gemini-2.5-flash-lite",
            input_tokens: aiData.usage?.prompt_tokens || 0,
            output_tokens: aiData.usage?.completion_tokens || 0,
            estimated_cost: 0,
          });
        }
      } catch (aiErr) {
        console.error("AI refinement failed, returning raw results:", aiErr);
      }
    }

    if (sourceCaseId) {
      await adminSupabase.from("knowledge_similarity_links")
        .delete().eq("source_case_id", sourceCaseId).eq("user_id", user.id);

      const links = similarCases.map(sc => ({
        user_id: user.id,
        source_case_id: sourceCaseId,
        similar_case_id: sc.case_id,
        similarity_score: sc.similarity_score,
        similarity_reasons: sc.reasons,
        match_type: "text_search",
        status: "active",
      }));

      await adminSupabase.from("knowledge_similarity_links").insert(links);
    }

    return new Response(JSON.stringify({ similar_cases: similarCases }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("find-similar-cases error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
