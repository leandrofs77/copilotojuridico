import { getCorsHeaders } from "../_shared/security.ts";
/**
 * Edge Function: external-storage-sync
 * 
 * Handles import/export/sync of files between external providers and Supabase Storage.
 * 
 * ACTIONS:
 *   - import: Downloads file from provider → uploads to Supabase Storage → creates document + analysis job
 *   - export: Downloads from Supabase Storage → uploads to provider → creates external_file_links
 *   - sync: Lists external folder, imports new files not yet linked
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


async function getValidToken(supabase: any, conn: any): Promise<string | null> {
  if (conn.token_expires_at && new Date(conn.token_expires_at) > new Date(Date.now() + 60000)) {
    return await decryptToken(conn.access_token_encrypted);
  }
  if (!conn.refresh_token_encrypted) return null;

  let tokenUrl: string, body: URLSearchParams;
  if (conn.provider === "google_drive") {
    const cid = Deno.env.get("GOOGLE_CLIENT_ID"), cs = Deno.env.get("GOOGLE_CLIENT_SECRET");
    if (!cid || !cs) return null;
    tokenUrl = "https://oauth2.googleapis.com/token";
    body = new URLSearchParams({ refresh_token: (await decryptToken(conn.refresh_token_encrypted)) || "", client_id: cid, client_secret: cs, grant_type: "refresh_token" });
  } else {
    const cid = Deno.env.get("MICROSOFT_CLIENT_ID"), cs = Deno.env.get("MICROSOFT_CLIENT_SECRET");
    if (!cid || !cs) return null;
    tokenUrl = "https://login.microsoftonline.com/common/oauth2/v2.0/token";
    body = new URLSearchParams({ refresh_token: conn.refresh_token_encrypted, client_id: cid, client_secret: cs, grant_type: "refresh_token", scope: "Files.ReadWrite.All Sites.ReadWrite.All User.Read offline_access" });
  }

  const res = await fetch(tokenUrl, { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
  const data = await res.json();
  if (data.error) return null;

  await supabase.from("external_storage_connections").update({
    access_token_encrypted: await encryptToken(data.access_token),
    refresh_token_encrypted: await encryptToken(data.refresh_token || await decryptToken(conn.refresh_token_encrypted)),
    token_expires_at: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : null,
  }).eq("id", conn.id);

  return data.access_token;
}

async function downloadFromProvider(token: string, provider: string, fileId: string, siteId?: string): Promise<{ data: ArrayBuffer; contentType: string } | null> {
  let url: string;
  if (provider === "google_drive") {
    url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
  } else if (provider === "onedrive") {
    url = `https://graph.microsoft.com/v1.0/me/drive/items/${fileId}/content`;
  } else if (provider === "sharepoint" && siteId) {
    url = `https://graph.microsoft.com/v1.0/sites/${siteId}/drive/items/${fileId}/content`;
  } else {
    return null;
  }

  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, redirect: "follow" });
  if (!res.ok) return null;
  return { data: await res.arrayBuffer(), contentType: res.headers.get("content-type") || "application/octet-stream" };
}

async function uploadToProvider(token: string, provider: string, folderId: string, fileName: string, fileData: ArrayBuffer, contentType: string, siteId?: string): Promise<{ fileId: string; webUrl: string } | null> {
  let url: string;
  if (provider === "google_drive") {
    // Multipart upload for Google Drive
    const metadata = JSON.stringify({ name: fileName, parents: [folderId] });
    const boundary = "boundary_vlx";
    const body = `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${contentType}\r\n\r\n`;
    const encoder = new TextEncoder();
    const prefix = encoder.encode(body);
    const suffix = encoder.encode(`\r\n--${boundary}--`);
    const combined = new Uint8Array(prefix.length + fileData.byteLength + suffix.length);
    combined.set(prefix, 0);
    combined.set(new Uint8Array(fileData), prefix.length);
    combined.set(suffix, prefix.length + fileData.byteLength);

    const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body: combined,
    });
    const data = await res.json();
    if (data.id) return { fileId: data.id, webUrl: data.webViewLink || "" };
    return null;
  } else {
    // OneDrive / SharePoint simple upload
    const basePath = provider === "sharepoint" && siteId ? `/sites/${siteId}/drive` : "/me/drive";
    url = `https://graph.microsoft.com/v1.0${basePath}/items/${folderId}:/${encodeURIComponent(fileName)}:/content`;
    const res = await fetch(url, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": contentType },
      body: fileData,
    });
    const data = await res.json();
    if (data.id) return { fileId: data.id, webUrl: data.webUrl || "" };
    return null;
  }
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { action, connection_id, case_id, files, document_id, folder_id, site_id } = body;

    const { data: conn } = await supabase.from("external_storage_connections").select("*").eq("id", connection_id).single();
    if (!conn || conn.user_id !== user.id) return new Response(JSON.stringify({ error: "not_found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const token = await getValidToken(supabase, conn);
    if (!token) return new Response(JSON.stringify({ error: "token_expired", message: "Token expirado. Reconecte o provedor." }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Tenant isolation: whenever a case_id is supplied, it must belong to the authenticated user.
    if (case_id) {
      const { data: ownedCase } = await supabase
        .from("cases")
        .select("id")
        .eq("id", case_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!ownedCase) {
        return new Response(JSON.stringify({ error: "case_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (action === "import") {
      // files: [{ id, name, mimeType, folderId, webUrl }]
      const results: any[] = [];

      for (const file of (files || [])) {
        // Check if already imported
        const { data: existing } = await supabase
          .from("external_file_links")
          .select("id")
          .eq("external_file_id", file.id)
          .eq("user_id", user.id)
          .limit(1);

        if (existing && existing.length > 0) {
          results.push({ name: file.name, status: "already_imported" });
          continue;
        }

        const downloaded = await downloadFromProvider(token, conn.provider, file.id, site_id);
        if (!downloaded) {
          results.push({ name: file.name, status: "download_failed" });
          continue;
        }

        const storagePath = `${user.id}/${case_id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(storagePath, downloaded.data, { contentType: downloaded.contentType });
        if (uploadErr) {
          results.push({ name: file.name, status: "upload_failed", error: uploadErr.message });
          continue;
        }

        const { data: doc, error: docErr } = await supabase.from("documents").insert({
          case_id,
          user_id: user.id,
          name: file.name,
          file_type: file.mimeType || downloaded.contentType,
          file_path: storagePath,
          storage_path: storagePath,
          mime_type: file.mimeType || downloaded.contentType,
          original_filename: file.name,
          file_size: downloaded.data.byteLength,
          processing_status: "pendente",
          analysis_status: "pending",
          queued_for_analysis: true,
          storage_mode: "supabase_primary",
          external_provider: conn.provider,
          external_file_id: file.id,
          external_folder_id: file.folderId || null,
          external_web_url: file.webUrl || null,
          source: conn.provider.replace("_", " "),
          created_by: user.id,
        }).select("id").single();

        if (docErr || !doc) {
          results.push({ name: file.name, status: "doc_create_failed", error: docErr?.message });
          continue;
        }

        await supabase.from("external_file_links").insert({
          user_id: user.id,
          document_id: doc.id,
          provider: conn.provider,
          external_file_id: file.id,
          external_file_name: file.name,
          external_folder_id: file.folderId || null,
          external_web_url: file.webUrl || null,
          sync_direction: "imported",
          last_synced_at: new Date().toISOString(),
        });

        await supabase.from("document_analysis_jobs").insert({
          document_id: doc.id,
          user_id: user.id,
          status: "pending",
          priority: 5,
        });

        results.push({ name: file.name, status: "imported", document_id: doc.id });
      }

      return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "export") {
      const targetFolderId = folder_id;
      if (!targetFolderId || !document_id) return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const { data: doc } = await supabase
        .from("documents")
        .select("*")
        .eq("id", document_id)
        .eq("user_id", user.id)
        .maybeSingle();

      if (!doc || !doc.storage_path) {
        return new Response(JSON.stringify({ error: "document_not_found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (doc.case_id) {
        const { data: ownedCase } = await supabase
          .from("cases")
          .select("id")
          .eq("id", doc.case_id)
          .eq("user_id", user.id)
          .maybeSingle();

        if (!ownedCase) {
          return new Response(JSON.stringify({ error: "document_not_found" }), {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      const { data: fileData } = await supabase.storage.from("documents").download(doc.storage_path);
      if (!fileData) return new Response(JSON.stringify({ error: "file_download_failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      const arrayBuffer = await fileData.arrayBuffer();
      const uploaded = await uploadToProvider(token, conn.provider, targetFolderId, doc.original_filename || doc.name, arrayBuffer, doc.mime_type || "application/octet-stream", site_id);
      if (!uploaded) return new Response(JSON.stringify({ error: "upload_to_provider_failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      await supabase.from("external_file_links").insert({
        user_id: user.id,
        document_id,
        provider: conn.provider,
        external_file_id: uploaded.fileId,
        external_file_name: doc.original_filename || doc.name,
        external_folder_id: targetFolderId,
        external_web_url: uploaded.webUrl,
        sync_direction: "exported",
        last_synced_at: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true, external_file_id: uploaded.fileId, web_url: uploaded.webUrl }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "sync") {
      // Sync: list folder, import new files
      if (!folder_id || !case_id) return new Response(JSON.stringify({ error: "missing_params" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

      // List files in folder
      let listUrl: string;
      if (conn.provider === "google_drive") {
        const q = `'${folder_id}' in parents and trashed = false and mimeType != 'application/vnd.google-apps.folder'`;
        listUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id,name,mimeType,size,webViewLink)&pageSize=100`;
      } else if (conn.provider === "sharepoint" && site_id) {
        listUrl = `https://graph.microsoft.com/v1.0/sites/${site_id}/drive/items/${folder_id}/children?$filter=file ne null&$select=id,name,file,size,webUrl&$top=100`;
      } else {
        listUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${folder_id}/children?$filter=file ne null&$select=id,name,file,size,webUrl&$top=100`;
      }

      const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${token}` } });
      const listData = await listRes.json();

      const externalFiles = conn.provider === "google_drive"
        ? (listData.files || []).map((f: any) => ({ id: f.id, name: f.name, mimeType: f.mimeType, webUrl: f.webViewLink, folderId: folder_id }))
        : (listData.value || []).map((f: any) => ({ id: f.id, name: f.name, mimeType: f.file?.mimeType, webUrl: f.webUrl, folderId: folder_id }));

      // Get already imported file IDs
      const { data: existingLinks } = await supabase
        .from("external_file_links")
        .select("external_file_id")
        .eq("user_id", user.id)
        .eq("provider", conn.provider);

      const importedIds = new Set((existingLinks || []).map((l: any) => l.external_file_id));
      const newFiles = externalFiles.filter((f: any) => !importedIds.has(f.id));

      if (newFiles.length === 0) {
        return new Response(JSON.stringify({ results: [], message: "Nenhum arquivo novo encontrado." }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Import new files (reuse import logic inline)
      const results: any[] = [];
      for (const file of newFiles) {
        const downloaded = await downloadFromProvider(token, conn.provider, file.id, site_id);
        if (!downloaded) { results.push({ name: file.name, status: "download_failed" }); continue; }

        const storagePath = `${user.id}/${case_id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from("documents").upload(storagePath, downloaded.data, { contentType: downloaded.contentType });
        if (uploadErr) { results.push({ name: file.name, status: "upload_failed" }); continue; }

        const { data: doc } = await supabase.from("documents").insert({
          case_id, user_id: user.id, name: file.name,
          file_type: file.mimeType || downloaded.contentType,
          file_path: storagePath, storage_path: storagePath,
          mime_type: file.mimeType || downloaded.contentType,
          original_filename: file.name, file_size: downloaded.data.byteLength,
          processing_status: "pendente", analysis_status: "pending",
          queued_for_analysis: true, storage_mode: "supabase_primary",
          external_provider: conn.provider, external_file_id: file.id,
          external_web_url: file.webUrl || null, source: conn.provider.replace("_", " "),
          created_by: user.id,
        }).select("id").single();

        if (!doc) { results.push({ name: file.name, status: "failed" }); continue; }

        await supabase.from("external_file_links").insert({
          user_id: user.id, document_id: doc.id, provider: conn.provider,
          external_file_id: file.id, external_file_name: file.name,
          external_folder_id: folder_id, external_web_url: file.webUrl || null,
          sync_direction: "imported", last_synced_at: new Date().toISOString(),
        });

        await supabase.from("document_analysis_jobs").insert({ document_id: doc.id, user_id: user.id, status: "pending", priority: 5 });
        results.push({ name: file.name, status: "imported", document_id: doc.id });
      }

      return new Response(JSON.stringify({ results, total_new: newFiles.length }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "invalid_action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: "internal_error", message: String(err) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
