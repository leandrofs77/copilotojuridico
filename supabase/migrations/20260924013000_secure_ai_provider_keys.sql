-- Secure AI provider key storage.
-- There are no production users yet, so legacy plaintext key rows are intentionally removed.

DELETE FROM public.ai_provider_keys;

ALTER TABLE public.ai_provider_keys
  ADD COLUMN IF NOT EXISTS key_hint TEXT;

DROP POLICY IF EXISTS "Users can view own provider keys" ON public.ai_provider_keys;
DROP POLICY IF EXISTS "Users can insert own provider keys" ON public.ai_provider_keys;
DROP POLICY IF EXISTS "Users can update own provider keys" ON public.ai_provider_keys;
DROP POLICY IF EXISTS "Users can delete own provider keys" ON public.ai_provider_keys;

-- Browser clients must not read or mutate encrypted credentials directly.
-- Server-side Edge Functions use the service role, which bypasses RLS.
ALTER TABLE public.ai_provider_keys ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS ai_provider_keys_user_provider_uidx
  ON public.ai_provider_keys (user_id, provider);
