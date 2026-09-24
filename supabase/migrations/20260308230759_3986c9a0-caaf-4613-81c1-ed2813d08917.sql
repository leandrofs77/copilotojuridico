
-- =============================================
-- VirtuaLexis Phase 4 — New Tables
-- =============================================

-- 1. case_strategy_radar (VirtuaLexis Radar)
CREATE TABLE public.case_strategy_radar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  success_probability NUMERIC,
  risk_score NUMERIC,
  strategic_advantages JSONB DEFAULT '[]'::jsonb,
  strategic_weaknesses JSONB DEFAULT '[]'::jsonb,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  recommended_evidence JSONB DEFAULT '[]'::jsonb,
  strategic_summary TEXT,
  generated_by_ai BOOLEAN DEFAULT true,
  confidence_score NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_strategy_radar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own strategy radar" ON public.case_strategy_radar FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategy radar" ON public.case_strategy_radar FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own strategy radar" ON public.case_strategy_radar FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own strategy radar" ON public.case_strategy_radar FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_case_strategy_radar_updated_at BEFORE UPDATE ON public.case_strategy_radar FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. case_next_actions (VirtuaLexis Assistant)
CREATE TABLE public.case_next_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL DEFAULT 'strategic_action',
  action_description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium',
  impact_score NUMERIC,
  source TEXT DEFAULT 'ai',
  status TEXT NOT NULL DEFAULT 'pending',
  generated_by_ai BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_next_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own next actions" ON public.case_next_actions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own next actions" ON public.case_next_actions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own next actions" ON public.case_next_actions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own next actions" ON public.case_next_actions FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_case_next_actions_updated_at BEFORE UPDATE ON public.case_next_actions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. generated_legal_documents (VirtuaLexis Docs)
CREATE TABLE public.generated_legal_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'petition_initial',
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  generation_context JSONB DEFAULT '{}'::jsonb,
  generated_by_ai BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.generated_legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own generated docs" ON public.generated_legal_documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own generated docs" ON public.generated_legal_documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own generated docs" ON public.generated_legal_documents FOR DELETE USING (auth.uid() = user_id);

-- 4. case_process_monitoring (VirtuaLexis Monitor)
CREATE TABLE public.case_process_monitoring (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  court TEXT,
  process_number TEXT,
  last_checked_at TIMESTAMPTZ,
  last_event_date TIMESTAMPTZ,
  last_event_summary TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_process_monitoring ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own process monitoring" ON public.case_process_monitoring FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own process monitoring" ON public.case_process_monitoring FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own process monitoring" ON public.case_process_monitoring FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own process monitoring" ON public.case_process_monitoring FOR DELETE USING (auth.uid() = user_id);

-- 5. case_process_events (VirtuaLexis Monitor - Events)
CREATE TABLE public.case_process_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_date TIMESTAMPTZ,
  event_type TEXT,
  event_text TEXT,
  source TEXT DEFAULT 'manual',
  detected_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.case_process_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own process events" ON public.case_process_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own process events" ON public.case_process_events FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own process events" ON public.case_process_events FOR DELETE USING (auth.uid() = user_id);

-- 6. case_deadlines (VirtuaLexis Deadlines)
CREATE TABLE public.case_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  deadline_type TEXT NOT NULL DEFAULT 'procedural',
  deadline_date TIMESTAMPTZ NOT NULL,
  risk_level TEXT NOT NULL DEFAULT 'medium',
  responsible_user UUID,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_deadlines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own deadlines" ON public.case_deadlines FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deadlines" ON public.case_deadlines FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deadlines" ON public.case_deadlines FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deadlines" ON public.case_deadlines FOR DELETE USING (auth.uid() = user_id);

-- 7. client_notifications (Comunicação com Clientes)
CREATE TABLE public.client_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  client_id UUID,
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'update',
  sent_via TEXT DEFAULT 'email',
  sent_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.client_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own client notifications" ON public.client_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own client notifications" ON public.client_notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own client notifications" ON public.client_notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own client notifications" ON public.client_notifications FOR DELETE USING (auth.uid() = user_id);
