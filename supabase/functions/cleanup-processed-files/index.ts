import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/security.ts";


const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

    // Find documents that are processed, flagged for deletion, not yet deleted, and have a storage path
    const { data: docs, error } = await supabase
      .from("documents")
      .select("id, storage_path, file_path, storage_mode, name")
      .eq("analysis_status", "completed")
      .eq("delete_from_supabase_after_processing", true)
      .is("supabase_deleted_at", null)
      .in("storage_mode", ["external_only", "temporary_supabase"])
      .not("storage_path", "is", null)
      .limit(50);

    if (error) throw error;

    if (!docs || docs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No files to clean up", cleaned: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let cleaned = 0;
    const errors: string[] = [];

    for (const doc of docs) {
      const path = doc.storage_path || doc.file_path;
      if (!path) continue;

      const { error: removeError } = await supabase.storage
        .from("documents")
        .remove([path]);

      if (removeError) {
        errors.push(`${doc.id}: ${removeError.message}`);
        continue;
      }

      await supabase
        .from("documents")
        .update({
          supabase_deleted_at: new Date().toISOString(),
          is_temp_copy: false,
        })
        .eq("id", doc.id);

      cleaned++;
    }

    return new Response(
      JSON.stringify({
        message: `Cleaned ${cleaned} files`,
        cleaned,
        total: docs.length,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Cleanup error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
