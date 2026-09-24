import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";
import { hasExternalAiConsent } from "../_shared/ai-consent.ts";


serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const startTime = Date.now();
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!LOVABLE_API_KEY) {
    return new Response(JSON.stringify({ error: "LOVABLE_API_KEY is not configured" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.slice("Bearer ".length);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    const user = authData.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiConsent = await hasExternalAiConsent(supabase, user.id);
    if (!aiConsent) {
      return new Response(JSON.stringify({ error: "external_ai_consent_required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { tool_name, messages } = await req.json();

    // 1. Load settings
    const { data: settings } = await supabase.from("ai_settings").select("*").limit(1).single();
    const enableFallback = settings?.enable_fallback ?? true;
    const enableLogging = settings?.enable_logging ?? true;
    const maxTokens = settings?.max_tokens_default ?? 4096;
    const temperature = settings?.temperature_default ?? 0.7;

    // 2. Load prompt if tool_name provided
    let systemPrompt = "";
    let promptId: string | null = null;
    let preferredModel: string | null = null;
    let promptTemp: number | null = null;
    let promptTokens: number | null = null;

    if (tool_name) {
      const { data: prompt } = await supabase
        .from("ai_prompts")
        .select("*")
        .eq("tool_name", tool_name)
        .eq("active", true)
        .order("version", { ascending: false })
        .limit(1)
        .single();

      if (prompt) {
        systemPrompt = prompt.prompt_content;
        promptId = prompt.id;
        preferredModel = prompt.model_preferred;
        promptTemp = prompt.temperature;
        promptTokens = prompt.max_tokens;
      }
    }

    // 3. Load models ordered by priority
    const { data: models } = await supabase
      .from("ai_models")
      .select("*")
      .eq("active", true)
      .order("priority", { ascending: true });

    if (!models || models.length === 0) {
      throw new Error("No active AI models found");
    }

    // 4. Build ordered model list: preferred first, then by priority
    const orderedModels = [...models];
    if (preferredModel) {
      const idx = orderedModels.findIndex((m: any) => m.model_name === preferredModel);
      if (idx > 0) {
        const [preferred] = orderedModels.splice(idx, 1);
        orderedModels.unshift(preferred);
      }
    }

    // 5. Attempt execution with fallback
    const finalMessages = [
      ...(systemPrompt ? [{ role: "system", content: systemPrompt }] : []),
      ...(messages || []),
    ];

    let lastError: string | null = null;
    let result: any = null;
    let modelUsed = "";

    for (const model of orderedModels) {
      try {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.model_name,
            messages: finalMessages,
            max_tokens: promptTokens ?? maxTokens,
            temperature: promptTemp ?? temperature,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          lastError = `${model.model_name}: ${response.status} - ${errText}`;
          console.error("Radar: model failed:", lastError);
          if (!enableFallback) break;
          continue;
        }

        result = await response.json();
        modelUsed = model.model_name;
        break;
      } catch (err: any) {
        lastError = `${model.model_name}: ${err.message}`;
        console.error("Radar: model exception:", lastError);
        if (!enableFallback) break;
        continue;
      }
    }

    const executionTime = Date.now() - startTime;
    const tokensInput = result?.usage?.prompt_tokens ?? 0;
    const tokensOutput = result?.usage?.completion_tokens ?? 0;

    // 6. Log execution
    if (enableLogging) {
      await supabase.from("ai_execution_logs").insert({
        user_id: user.id,
        tool_name: tool_name || "radar-direct",
        model_used: modelUsed || "none",
        prompt_id: promptId,
        execution_time_ms: executionTime,
        tokens_input: tokensInput,
        tokens_output: tokensOutput,
        estimated_cost: ((tokensInput + tokensOutput) / 1000) * 0.1,
        status: result ? "success" : "error",
        error_message: result ? null : lastError,
      });
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "All models failed", details: lastError }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      ...result,
      _radar: { model_used: modelUsed, execution_time_ms: executionTime, tokens_input: tokensInput, tokens_output: tokensOutput },
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-radar-router error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
