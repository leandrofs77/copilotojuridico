CREATE TABLE IF NOT EXISTS public.user_privacy_settings (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  external_ai_processing_enabled boolean NOT NULL DEFAULT false,
  consented_at timestamptz,
  consent_version text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.user_privacy_settings;
DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.user_privacy_settings;

CREATE POLICY "Users can view own privacy settings"
ON public.user_privacy_settings FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own privacy settings"
ON public.user_privacy_settings FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own privacy settings"
ON public.user_privacy_settings FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_user_privacy_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.external_ai_processing_enabled = true
     AND (OLD.external_ai_processing_enabled IS DISTINCT FROM true) THEN
    NEW.consented_at = now();
    NEW.consent_version = COALESCE(NEW.consent_version, '2026-09');
  ELSIF NEW.external_ai_processing_enabled = false THEN
    NEW.consented_at = NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER trg_touch_user_privacy_settings_updated_at
BEFORE UPDATE ON public.user_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_user_privacy_settings_updated_at();
