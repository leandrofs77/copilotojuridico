import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";


const ALLOWED_PROVIDERS = new Set(["openai", "google", "perplexity"]);

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("AI_PROVIDER_KEY_ENCRYPTION_KEY");
  if (!secret) throw new Error("AI_PROVIDER_KEY_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt"]);
}

async function encryptSecret(value: string): Promise<string> {
  const key = await getCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value))
  );
  const packed = new Uint8Array(iv.length + ciphertext.length);
  packed.set(iv, 0);
  packed.set(ciphertext, iv.length);
  return "v1:" + btoa(String.fromCharCode(...packed));
}

function hint(value: string): string {
  const trimmed = value.trim();
  const last4 = trimmed.slice(-4);
  return last4 ? `••••${last4}` : "••••";
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: authData, error: authError } = await authClient.auth.getUser();
    const user = authData.user;
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceRole);
    const body = await req.json().catch(() => ({}));
    const action = body.action;

    if (action === "list") {
      const { data, error } = await admin
        .from("ai_provider_keys")
        .select("id, provider, key_hint, is_default, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return new Response(JSON.stringify({ keys: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "upsert") {
      const provider = String(body.provider || "").trim().toLowerCase();
      const apiKey = String(body.api_key || "").trim();
      const isDefault = body.is_default === true;

      if (!ALLOWED_PROVIDERS.has(provider)) {
        return new Response(JSON.stringify({ error: "invalid_provider" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (apiKey.length < 8 || apiKey.length > 1000) {
        return new Response(JSON.stringify({ error: "invalid_api_key" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encrypted = await encryptSecret(apiKey);

      if (isDefault) {
        await admin
          .from("ai_provider_keys")
          .update({ is_default: false })
          .eq("user_id", user.id);
      }

      const { data, error } = await admin
        .from("ai_provider_keys")
        .upsert({
          user_id: user.id,
          provider,
          api_key_encrypted: encrypted,
          key_hint: hint(apiKey),
          is_default: isDefault,
        }, { onConflict: "user_id,provider" })
        .select("id, provider, key_hint, is_default, created_at")
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ key: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "delete") {
      const id = String(body.id || "");
      const { error } = await admin
        .from("ai_provider_keys")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "invalid_action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("ai-provider-keys error:", error);
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
