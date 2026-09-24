
-- =============================================
-- 1. NEW ENUMS
-- =============================================
CREATE TYPE public.document_status AS ENUM ('pendente', 'processando', 'processado', 'erro');
CREATE TYPE public.report_status AS ENUM ('rascunho', 'gerado', 'revisado', 'finalizado');
CREATE TYPE public.report_type AS ENUM ('completo', 'resumido', 'cronologia', 'dossie');
CREATE TYPE public.event_source_type AS ENUM ('manual', 'documento', 'ia', 'importacao');
CREATE TYPE public.event_category AS ENUM ('fato', 'decisao', 'prazo', 'audiencia', 'pericia', 'outro');
CREATE TYPE public.activity_action AS ENUM ('case_created', 'case_updated', 'case_archived', 'case_deleted', 'document_uploaded', 'document_deleted', 'event_created', 'event_updated', 'event_deleted', 'report_generated', 'login');

-- =============================================
-- 2. ALTER documents
-- =============================================
ALTER TABLE public.documents
  ADD COLUMN storage_path TEXT,
  ADD COLUMN original_filename TEXT,
  ADD COLUMN processing_status public.document_status NOT NULL DEFAULT 'pendente',
  ADD COLUMN uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Rename classification -> ai_classification
ALTER TABLE public.documents ADD COLUMN ai_classification TEXT;
UPDATE public.documents SET ai_classification = classification;
ALTER TABLE public.documents DROP COLUMN classification;

-- =============================================
-- 3. ALTER extracted_events
-- =============================================
ALTER TABLE public.extracted_events
  ADD COLUMN source_type public.event_source_type NOT NULL DEFAULT 'manual',
  ADD COLUMN source_document_id UUID REFERENCES public.documents(id),
  ADD COLUMN is_manual BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN confidence_score NUMERIC(3,2),
  ADD COLUMN event_category public.event_category NOT NULL DEFAULT 'outro',
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Validation trigger for confidence_score
CREATE OR REPLACE FUNCTION public.validate_confidence_score()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.confidence_score IS NOT NULL AND (NEW.confidence_score < 0 OR NEW.confidence_score > 1) THEN
    RAISE EXCEPTION 'confidence_score must be between 0 and 1';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_confidence_score
  BEFORE INSERT OR UPDATE ON public.extracted_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_confidence_score();

-- =============================================
-- 4. ALTER reports
-- =============================================
ALTER TABLE public.reports
  ADD COLUMN report_type public.report_type NOT NULL DEFAULT 'completo',
  ADD COLUMN content_json JSONB DEFAULT '{}',
  ADD COLUMN content_text TEXT,
  ADD COLUMN status public.report_status NOT NULL DEFAULT 'rascunho',
  ADD COLUMN generated_by_ai BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- Migrate existing content -> content_json
UPDATE public.reports SET content_json = content WHERE content IS NOT NULL;
ALTER TABLE public.reports DROP COLUMN content;

-- =============================================
-- 5. ALTER cases
-- =============================================
ALTER TABLE public.cases
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- =============================================
-- 6. ALTER case_parties
-- =============================================
ALTER TABLE public.case_parties
  ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ADD COLUMN created_by UUID REFERENCES auth.users(id),
  ADD COLUMN updated_by UUID REFERENCES auth.users(id);

-- =============================================
-- 7. CREATE activity_logs
-- =============================================
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action public.activity_action NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  case_id UUID REFERENCES public.cases(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own activity logs"
  ON public.activity_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own activity logs"
  ON public.activity_logs FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_activity_logs_user_id ON public.activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON public.activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_case_id ON public.activity_logs(case_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- =============================================
-- 8. TRIGGERS updated_at
-- =============================================
CREATE TRIGGER trg_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_documents_updated_at
  BEFORE UPDATE ON public.documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_extracted_events_updated_at
  BEFORE UPDATE ON public.extracted_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER trg_case_parties_updated_at
  BEFORE UPDATE ON public.case_parties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
