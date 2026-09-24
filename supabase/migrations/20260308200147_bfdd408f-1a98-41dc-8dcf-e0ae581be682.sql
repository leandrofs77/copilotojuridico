
CREATE TABLE public.case_strategic_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  strengths JSONB DEFAULT '[]'::jsonb,
  weaknesses JSONB DEFAULT '[]'::jsonb,
  possible_theses JSONB DEFAULT '[]'::jsonb,
  risk_factors JSONB DEFAULT '[]'::jsonb,
  counterarguments JSONB DEFAULT '[]'::jsonb,
  jurisprudence_summary TEXT,
  success_probability TEXT,
  strategic_recommendations TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_strategic_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own strategic analysis" ON public.case_strategic_analysis
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own strategic analysis" ON public.case_strategic_analysis
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_case_strategic_analysis_updated_at
  BEFORE UPDATE ON public.case_strategic_analysis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
