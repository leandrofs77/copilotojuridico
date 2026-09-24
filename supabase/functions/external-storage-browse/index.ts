import { getCorsHeaders } from "../_shared/security.ts";
/**
 * Edge Function: external-storage-browse
 * 
 * Navigates folders and lists files from external storage providers.
 * Auto-refreshes tokens if expired.
 * 
 * Returns standardized format:
 *   { items: [{ id, name, type: "file"|"folder", mimeType, size, webUrl, modifiedAt }] }
 * 
 * SharePoint: Uses /sites/{siteId}/drive/... via Microsoft Graph (same token as OneDrive)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


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


async function refreshTokenIfNeeded(supabase: any, conn: any): Promise<string | null> {
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date(Date.now() + 60000)) {
    return await decryptToken(conn.access_token_encrypted);
  }
  // Token expired or about to expire, try refresh
  if (!conn.refresh_token_encrypted) return null;

  let tokenUrl: string, body: URLSearchParams;
  if (conn.provider === "google_drive") {
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;
    tokenUrl = "https://oauth2.googleapis.com/token";
    body = new URLSearchParams({ refresh_token: (await decryptToken(conn.refresh_token_encrypted)) || "", client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token" });
  } else {
    const clientId = Deno.env.get("MICROSOFT_CLIENT_ID");
    const clientSecret = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    if (!clientId || !clientSecret) return null;
    tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    body = new URLSearchParams({ refresh_token: conn.refresh_token_encrypted, client_id: clientId, client_secret: clientSecret, grant_type: "refresh_token", scope: "Files.ReadWrite.All Sites.ReadWrite.All User.Read offline_access" });
  }

  const res = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json();
  if (data.error) return null;

  const expiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null;
  await supabase.from("external_storage_connections").update({
    access_token_encrypted: await encryptToken(data.access_token),
    refresh_token_encrypted: await encryptToken(data.refresh_token || await decryptToken(conn.refresh_token_encrypted)),
    token_expires_at: expiresAt,
  }).eq("id", conn.id);

  return data.access_token;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabase = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { connection_id, folder_id, site_id } = await req.json();

    const { data: conn } = await supabase.from("external_storage_connections").select("*").eq("id", connection_id).single();
    if (!conn || conn.user_id !== user.id) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const accessToken = await refreshTokenIfNeeded(supabase, conn);
    if (!accessToken) return new Response(JSON.stringify({ error: "token_expired", message: "Token expirado. Reconecte o provedor." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    let items: any[] = [];

    if (conn.provider === "google_drive") {
      const q = folder_id ? `'${folder_id}' in parents and trashed = false` : "'root' in parents and trashed = false";
      const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,webViewLink,modifiedTime)&pageSize=100&orderBy=folder,name`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      items = (data.files || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.mimeType === "application/vnd.google-apps.folder" ? "folder" : "file",
        mimeType: f.mimeType,
        size: f.size ? parseInt(f.size) : null,
        webUrl: f.webViewLink,
        modifiedAt: f.modifiedTime,
      }));
    } else if (conn.provider === "onedrive") {
      const path = folder_id ? `/me/drive/items/${folder_id}/children` : "/me/drive/root/children";
      const url = `https://graph.microsoft.com/v1.0${path}?$select=id,name,file,folder,size,webUrl,lastModifiedDateTime&$top=100&$orderby=name`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      items = (data.value || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.folder ? "folder" : "file",
        mimeType: f.file?.mimeType || null,
        size: f.size || null,
        webUrl: f.webUrl,
        modifiedAt: f.lastModifiedDateTime,
      }));
    } else if (conn.provider === "sharepoint") {
      if (!site_id) return new Response(JSON.stringify({ error: "site_id_required", message: "Informe o site_id do SharePoint." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const path = folder_id ? `/sites/${site_id}/drive/items/${folder_id}/children` : `/sites/${site_id}/drive/root/children`;
      const url = `https://graph.microsoft.com/v1.0${path}?$select=id,name,file,folder,size,webUrl,lastModifiedDateTime&$top=100&$orderby=name`;
      const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
      const data = await res.json();
      items = (data.value || []).map((f: any) => ({
        id: f.id,
        name: f.name,
        type: f.folder ? "folder" : "file",
        mimeType: f.file?.mimeType || null,
        size: f.size || null,
        webUrl: f.webUrl,
        modifiedAt: f.lastModifiedDateTime,
      }));
    }

    return new Response(JSON.stringify({ items }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
