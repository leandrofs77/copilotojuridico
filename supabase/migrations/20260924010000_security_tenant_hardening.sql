-- Security hardening for tenant isolation and SECURITY DEFINER functions

CREATE OR REPLACE FUNCTION public.enforce_case_tenant_integrity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  case_owner uuid;
BEGIN
  IF NEW.case_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT c.user_id
    INTO case_owner
  FROM public.cases c
  WHERE c.id = NEW.case_id;

  IF case_owner IS NULL THEN
    RAISE EXCEPTION 'Referenced case does not exist';
  END IF;

  IF NEW.user_id IS DISTINCT FROM case_owner THEN
    RAISE EXCEPTION 'Cross tenant case reference denied';
  END IF;

  IF COALESCE(auth.role(), '') <> 'service_role'
     AND auth.uid() IS DISTINCT FROM NEW.user_id THEN
    RAISE EXCEPTION 'Tenant ownership denied';
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.enforce_case_tenant_integrity() FROM PUBLIC;

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT DISTINCT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.columns u
      ON u.table_schema = c.table_schema
     AND u.table_name = c.table_name
     AND u.column_name = 'user_id'
    WHERE c.table_schema = 'public'
      AND c.column_name = 'case_id'
      AND c.table_name <> 'cases'
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_enforce_case_tenant_integrity ON public.%I', r.table_name);
    EXECUTE format(
      'CREATE TRIGGER trg_enforce_case_tenant_integrity BEFORE INSERT OR UPDATE OF case_id, user_id ON public.%I FOR EACH ROW EXECUTE FUNCTION public.enforce_case_tenant_integrity()',
      r.table_name
    );
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_knowledge(
  _user_id UUID,
  _query TEXT,
  _legal_area TEXT DEFAULT NULL,
  _entry_type TEXT DEFAULT NULL,
  _limit INT DEFAULT 20
)
RETURNS TABLE (
  entry_id UUID,
  title TEXT,
  content TEXT,
  entry_type TEXT,
  legal_area TEXT,
  case_id UUID,
  tags TEXT[],
  outcome TEXT,
  relevance_score NUMERIC,
  rank REAL
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    e.id AS entry_id,
    e.title,
    e.content,
    e.entry_type,
    e.legal_area,
    e.case_id,
    e.tags,
    e.outcome,
    e.relevance_score,
    ts_rank_cd(si.search_vector, plainto_tsquery('portuguese', _query)) AS rank
  FROM public.legal_knowledge_entries e
  JOIN public.knowledge_search_index si ON si.entry_id = e.id
  WHERE e.user_id = _user_id
    AND (
      _user_id = auth.uid()
      OR COALESCE(auth.role(), '') = 'service_role'
      OR public.is_superadmin(auth.uid())
    )
    AND si.search_vector @@ plainto_tsquery('portuguese', _query)
    AND (_legal_area IS NULL OR e.legal_area = _legal_area)
    AND (_entry_type IS NULL OR e.entry_type = _entry_type)
  ORDER BY rank DESC
  LIMIT LEAST(GREATEST(_limit, 1), 100);
$$;

REVOKE ALL ON FUNCTION public.search_knowledge(UUID, TEXT, TEXT, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_knowledge(UUID, TEXT, TEXT, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_knowledge(UUID, TEXT, TEXT, TEXT, INT) TO service_role;

CREATE OR REPLACE FUNCTION public.get_access_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_status
  FROM public.account_access_control
  WHERE user_id = _user_id
    AND (
      _user_id = auth.uid()
      OR COALESCE(auth.role(), '') = 'service_role'
      OR public.is_superadmin(auth.uid())
    )
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.check_license_valid(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.account_licenses
    WHERE user_id = _user_id
      AND (
        _user_id = auth.uid()
        OR COALESCE(auth.role(), '') = 'service_role'
        OR public.is_superadmin(auth.uid())
      )
      AND license_status = 'active'
      AND (
        license_type IN ('partnership', 'lifetime', 'subscription')
        OR (license_type = 'trial' AND trial_ends_at > now())
        OR (license_type = 'manual' AND access_ends_at IS NOT NULL AND access_ends_at > now())
      )
  )
$$;

REVOKE ALL ON FUNCTION public.get_access_status(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.check_license_valid(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_access_status(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.check_license_valid(UUID) TO authenticated, service_role;
