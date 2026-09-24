import { getCorsHeaders } from "../_shared/security.ts";
/**
 * Edge Function: external-storage-auth
 * 
 * Manages OAuth flows for external storage providers (Google Drive, OneDrive, SharePoint).
 * 
 * === DOCUMENTATION ===
 * 
 * REDIRECT URIs (configure in provider consoles):
 *   - Google Cloud Console: https://<your-domain>/settings/storage
 *   - Azure AD (Microsoft): https://<your-domain>/settings/storage
 *   For preview: https://id-preview--a132812d-43d2-4ccf-997e-28f2e7b17e70.lovable.app/settings/storage
 * 
 * SCOPES:
 *   - Google Drive: 
 *       https://www.googleapis.com/auth/drive.file
 *       https://www.googleapis.com/auth/drive.readonly
 *       https://www.googleapis.com/auth/userinfo.email
 *   - Microsoft (OneDrive + SharePoint):
 *       Files.ReadWrite.All
 *       Sites.ReadWrite.All
 *       User.Read
 *       offline_access
 * 
 * REQUIRED SECRETS (not yet configured):
 *   - GOOGLE_CLIENT_ID
 *   - GOOGLE_CLIENT_SECRET
 *   - MICROSOFT_CLIENT_ID
 *   - MICROSOFT_CLIENT_SECRET
 * 
 * BEHAVIOR WITHOUT CREDENTIALS:
 *   Returns { error: "provider_not_configured", message: "..." } with status 400
 * 
 * BEHAVIOR WITH EXPIRED TOKENS:
 *   The "refresh" action attempts automatic token renewal.
 *   If refresh fails, returns { error: "token_refresh_failed" } so frontend can prompt re-auth.
 * 
 * SHAREPOINT:
 *   Uses same Microsoft OAuth as OneDrive. SharePoint is accessed via Microsoft Graph
 *   using /sites/{siteId}/drive/... instead of /me/drive/...
 *   Same access_token works for both OneDrive and SharePoint.
 * 
 * ACTIONS:
 *   - get_auth_url: Returns the OAuth authorization URL for the provider
 *   - authorize: Exchanges authorization code for tokens
 *   - refresh: Refreshes an expired access token
 *   - disconnect: Deactivates a connection
 *   - status: Returns connection status for current user
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
const MICROSOFT_TOKEN_URL = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
const MICROSOFT_USERINFO_URL = "https://graph.microsoft.com/v1.0/me";

const GOOGLE_SCOPES = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/userinfo.email";
const MICROSOFT_SCOPES = "Files.ReadWrite.All Sites.ReadWrite.All User.Read offline_access";

function getEnvOrNull(name: string): string | null {
  try {
    return Deno.env.get(name) || null;
  } catch {
    return null;
  }
}

async function getTokenCryptoKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("OAUTH_TOKEN_ENCRYPTION_KEY");
  if (!secret) throw new Error("OAUTH_TOKEN_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return await crypto.subtle.importKey("raw", digest, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptToken(value: string | null): Promise<string | null> {
  if (!value) return null;
  const key = await getTokenCryptoKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(value)));
  const packed = new Uint8Array(iv.length + encrypted.length);
  packed.set(iv, 0);
  packed.set(encrypted, iv.length);
  return "v1:" + btoa(String.fromCharCode(...packed));
}

async function decryptToken(value: string | null): Promise<string | null> {
  if (!value) return null;
  if (!value.startsWith("v1:")) return value;
  const key = await getTokenCryptoKey();
  const packed = Uint8Array.from(atob(value.slice(3)), c => c.charCodeAt(0));
  const iv = packed.slice(0, 12);
  const ciphertext = packed.slice(12);
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plain);
}

function base64UrlEncode(input: Uint8Array): string {
  return btoa(String.fromCharCode(...input))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - normalized.length % 4) % 4);
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

async function getStateKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("OAUTH_STATE_SECRET");
  if (!secret) throw new Error("OAUTH_STATE_SECRET is not configured");
  return await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function createOAuthState(userId: string, provider: string, redirectUri: string): Promise<string> {
  const payload = new TextEncoder().encode(JSON.stringify({
    user_id: userId,
    provider,
    redirect_uri: redirectUri,
    exp: Date.now() + 10 * 60 * 1000,
  }));
  const key = await getStateKey();
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", key, payload));
  return base64UrlEncode(payload) + "." + base64UrlEncode(signature);
}

async function verifyOAuthState(state: string, userId: string, provider: string, redirectUri: string): Promise<boolean> {
  const parts = state.split(".");
  if (parts.length !== 2) return false;
  const payload = base64UrlDecode(parts[0]);
  const signature = base64UrlDecode(parts[1]);
  const key = await getStateKey();
  const valid = await crypto.subtle.verify("HMAC", key, signature, payload);
  if (!valid) return false;
  const parsed = JSON.parse(new TextDecoder().decode(payload));
  return parsed.user_id === userId
    && parsed.provider === provider
    && parsed.redirect_uri === redirectUri
    && typeof parsed.exp === "number"
    && parsed.exp > Date.now();
}

function isAllowedRedirectUri(uri: string): boolean {
  const allowed = (Deno.env.get("OAUTH_ALLOWED_REDIRECT_URIS") || "")
    .split(",")
    .map(v => v.trim())
    .filter(Boolean);
  return allowed.includes(uri);
}


Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: userError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userError || !user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action, provider, code, redirect_uri, connection_id, state } = body;

    if ((action === "get_auth_url" || action === "authorize") && !isAllowedRedirectUri(redirect_uri)) {
      return new Response(JSON.stringify({ error: "invalid_redirect_uri" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check provider credentials
    const isGoogle = provider === "google_drive";
    const isMicrosoft = provider === "onedrive" || provider === "sharepoint";

    if (action === "get_auth_url") {
      if (isGoogle) {
        const clientId = getEnvOrNull("GOOGLE_CLIENT_ID");
        if (!clientId) return new Response(JSON.stringify({ error: "provider_not_configured", message: "Google Drive ainda não está configurado. Configure GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const oauthState = await createOAuthState(user.id, provider, redirect_uri);
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(GOOGLE_SCOPES)}&access_type=offline&prompt=consent&state=${encodeURIComponent(oauthState)}`;
        return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (isMicrosoft) {
        const clientId = getEnvOrNull("MICROSOFT_CLIENT_ID");
        if (!clientId) return new Response(JSON.stringify({ error: "provider_not_configured", message: "Microsoft (OneDrive/SharePoint) ainda não está configurado. Configure MICROSOFT_CLIENT_ID e MICROSOFT_CLIENT_SECRET." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const oauthState = await createOAuthState(user.id, provider, redirect_uri);
        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect_uri)}&response_type=code&scope=${encodeURIComponent(MICROSOFT_SCOPES)}&response_mode=query&state=${encodeURIComponent(oauthState)}`;
        return new Response(JSON.stringify({ url }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      return new Response(JSON.stringify({ error: "invalid_provider" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "authorize") {
      if (!state || !(await verifyOAuthState(state, user.id, provider, redirect_uri))) {
        return new Response(JSON.stringify({ error: "invalid_oauth_state" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      let tokenData: any;
      let email: string | null = null;

      if (isGoogle) {
        const clientId = getEnvOrNull("GOOGLE_CLIENT_ID");
        const clientSecret = getEnvOrNull("GOOGLE_CLIENT_SECRET");
        if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "provider_not_configured", message: "Credenciais Google não configuradas." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri, grant_type: "authorization_code" }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) return new Response(JSON.stringify({ error: "oauth_failed", detail: tokenData.error_description || tokenData.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const userRes = await fetch(GOOGLE_USERINFO_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userInfo = await userRes.json();
        email = userInfo.email || null;
      } else if (isMicrosoft) {
        const clientId = getEnvOrNull("MICROSOFT_CLIENT_ID");
        const clientSecret = getEnvOrNull("MICROSOFT_CLIENT_SECRET");
        if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "provider_not_configured", message: "Credenciais Microsoft não configuradas." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const tokenRes = await fetch(MICROSOFT_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ code, client_id: clientId, client_secret: clientSecret, redirect_uri, grant_type: "authorization_code", scope: MICROSOFT_SCOPES }),
        });
        tokenData = await tokenRes.json();
        if (tokenData.error) return new Response(JSON.stringify({ error: "oauth_failed", detail: tokenData.error_description || tokenData.error }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

        const userRes = await fetch(MICROSOFT_USERINFO_URL, { headers: { Authorization: `Bearer ${tokenData.access_token}` } });
        const userInfo = await userRes.json();
        email = userInfo.mail || userInfo.userPrincipalName || null;
      } else {
        return new Response(JSON.stringify({ error: "invalid_provider" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;

      // Upsert connection
      const { data: existing } = await supabase
        .from("external_storage_connections")
        .select("id")
        .eq("user_id", user.id)
        .eq("provider", provider)
        .limit(1);

      let connectionId: string;
      if (existing && existing.length > 0) {
        connectionId = existing[0].id;
        await supabase.from("external_storage_connections").update({
          access_token_encrypted: await encryptToken(tokenData.access_token),
          refresh_token_encrypted: await encryptToken(tokenData.refresh_token || null),
          token_expires_at: expiresAt,
          provider_account_email: email,
          is_active: true,
        }).eq("id", connectionId);
      } else {
        const { data: newConn } = await supabase.from("external_storage_connections").insert({
          user_id: user.id,
          provider,
          access_token_encrypted: await encryptToken(tokenData.access_token),
          refresh_token_encrypted: await encryptToken(tokenData.refresh_token || null),
          token_expires_at: expiresAt,
          provider_account_email: email,
          is_active: true,
        }).select("id").single();
        connectionId = newConn!.id;
      }

      return new Response(JSON.stringify({ success: true, connection_id: connectionId, email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "refresh") {
      const { data: conn } = await supabase.from("external_storage_connections").select("*").eq("id", connection_id).single();
      if (!conn || conn.user_id !== user.id) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (!conn.refresh_token_encrypted) return new Response(JSON.stringify({ error: "no_refresh_token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      let tokenData: any;
      if (conn.provider === "google_drive") {
        const clientId = getEnvOrNull("GOOGLE_CLIENT_ID");
        const clientSecret = getEnvOrNull("GOOGLE_CLIENT_SECRET");
        if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "provider_not_configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const refreshToken = await decryptToken(conn.refresh_token_encrypted);
        const res = await fetch(GOOGLE_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ refresh_token: refreshToken || "", client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" }),
        });
        tokenData = await res.json();
      } else {
        const clientId = getEnvOrNull("MICROSOFT_CLIENT_ID");
        const clientSecret = getEnvOrNull("MICROSOFT_CLIENT_SECRET");
        if (!clientId || !clientSecret) return new Response(JSON.stringify({ error: "provider_not_configured" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        const refreshToken = await decryptToken(conn.refresh_token_encrypted);
        const res = await fetch(MICROSOFT_TOKEN_URL, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({ refresh_token: refreshToken || "", client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", scope: MICROSOFT_SCOPES }),
        });
        tokenData = await res.json();
      }

      if (tokenData.error) return new Response(JSON.stringify({ error: "token_refresh_failed", detail: tokenData.error_description }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const expiresAt = tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000).toISOString() : null;
      await supabase.from("external_storage_connections").update({
        access_token_encrypted: await encryptToken(tokenData.access_token),
        refresh_token_encrypted: await encryptToken(tokenData.refresh_token || await decryptToken(conn.refresh_token_encrypted)),
        token_expires_at: expiresAt,
      }).eq("id", connection_id);

      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "disconnect") {
      await supabase.from("external_storage_connections").update({ is_active: false }).eq("id", connection_id).eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "delete") {
      await supabase.from("external_storage_connections").delete().eq("id", connection_id).eq("user_id", user.id);
      return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "status") {
      const { data: connections } = await supabase
        .from("external_storage_connections")
        .select("id, provider, provider_account_email, is_active, token_expires_at, created_at")
        .eq("user_id", user.id)
        .order("created_at");

      const providers = {
        google_drive: { configured: !!getEnvOrNull("GOOGLE_CLIENT_ID") },
        onedrive: { configured: !!getEnvOrNull("MICROSOFT_CLIENT_ID") },
        sharepoint: { configured: !!getEnvOrNull("MICROSOFT_CLIENT_ID") },
      };

      return new Response(JSON.stringify({ connections: connections || [], providers }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
