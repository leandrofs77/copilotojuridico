
-- Table 1: external_storage_connections
CREATE TABLE public.external_storage_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider TEXT NOT NULL,
  provider_account_email TEXT,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_storage_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own connections" ON public.external_storage_connections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own connections" ON public.external_storage_connections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own connections" ON public.external_storage_connections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own connections" ON public.external_storage_connections FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_external_storage_connections_updated_at
  BEFORE UPDATE ON public.external_storage_connections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table 2: external_storage_folders
CREATE TABLE public.external_storage_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  connection_id UUID NOT NULL REFERENCES public.external_storage_connections(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  folder_name TEXT,
  folder_id TEXT,
  folder_path TEXT,
  usage_type TEXT NOT NULL DEFAULT 'import',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_storage_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own folders" ON public.external_storage_folders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own folders" ON public.external_storage_folders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own folders" ON public.external_storage_folders FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own folders" ON public.external_storage_folders FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Table 3: external_file_links
CREATE TABLE public.external_file_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  external_file_id TEXT,
  external_file_name TEXT,
  external_folder_id TEXT,
  external_web_url TEXT,
  sync_direction TEXT NOT NULL DEFAULT 'imported',
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.external_file_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own file links" ON public.external_file_links FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own file links" ON public.external_file_links FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own file links" ON public.external_file_links FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own file links" ON public.external_file_links FOR DELETE TO authenticated USING (auth.uid() = user_id);
