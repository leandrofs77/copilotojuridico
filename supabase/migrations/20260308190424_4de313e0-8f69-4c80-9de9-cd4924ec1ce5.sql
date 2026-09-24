
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS storage_mode TEXT DEFAULT 'supabase_primary',
  ADD COLUMN IF NOT EXISTS external_provider TEXT,
  ADD COLUMN IF NOT EXISTS external_file_id TEXT,
  ADD COLUMN IF NOT EXISTS external_folder_id TEXT,
  ADD COLUMN IF NOT EXISTS external_web_url TEXT,
  ADD COLUMN IF NOT EXISTS is_temp_copy BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS delete_from_supabase_after_processing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS supabase_deleted_at TIMESTAMPTZ;
