CREATE OR REPLACE FUNCTION public.touch_user_privacy_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();

  IF NEW.external_ai_processing_enabled = true THEN
    IF TG_OP = 'INSERT'
       OR OLD.external_ai_processing_enabled IS DISTINCT FROM true THEN
      NEW.consented_at = now();
      NEW.consent_version = COALESCE(NEW.consent_version, '2026-09');
    END IF;
  ELSE
    NEW.consented_at = NULL;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_user_privacy_settings_updated_at ON public.user_privacy_settings;
CREATE TRIGGER trg_touch_user_privacy_settings_updated_at
BEFORE INSERT OR UPDATE ON public.user_privacy_settings
FOR EACH ROW
EXECUTE FUNCTION public.touch_user_privacy_settings_updated_at();
