
-- =============================================
-- FASE 1: Triagem + Viabilidade + Custo de IA
-- =============================================

-- 1. Tabela de Triagem Inteligente (pré-caso)
CREATE TABLE public.case_intake_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  description TEXT,
  legal_area TEXT,
  uploaded_documents JSONB DEFAULT '[]'::jsonb,
  viability_level TEXT,
  complexity_level TEXT,
  estimated_duration TEXT,
  success_probability TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  recommendation TEXT,
  analysis_summary TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  converted_case_id UUID REFERENCES public.cases(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_intake_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intakes" ON public.case_intake_analysis
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own intakes" ON public.case_intake_analysis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own intakes" ON public.case_intake_analysis
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 2. Tabela de Análise de Viabilidade (caso aceito)
CREATE TABLE public.case_viability_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  viability_level TEXT,
  complexity_level TEXT,
  estimated_duration TEXT,
  success_probability TEXT,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  strengths JSONB DEFAULT '[]'::jsonb,
  effort_estimation TEXT,
  recommendation TEXT,
  analysis_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_viability_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own viability" ON public.case_viability_analysis
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own viability" ON public.case_viability_analysis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- 3. Tabela de Logs de Uso de IA
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES public.cases(id),
  provider TEXT,
  model TEXT,
  feature_name TEXT,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  estimated_cost NUMERIC(12,6) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ai logs" ON public.ai_usage_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ai logs" ON public.ai_usage_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Superadmin can view all ai logs" ON public.ai_usage_logs
  FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));

-- 4. Adicionar colunas de cache em documents
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS analysis_cache_key TEXT;
