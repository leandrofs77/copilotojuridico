
-- Table: ai_provider_keys
CREATE TABLE public.ai_provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own provider keys"
  ON public.ai_provider_keys FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own provider keys"
  ON public.ai_provider_keys FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own provider keys"
  ON public.ai_provider_keys FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own provider keys"
  ON public.ai_provider_keys FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- New column on documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS ai_provider_used TEXT;
