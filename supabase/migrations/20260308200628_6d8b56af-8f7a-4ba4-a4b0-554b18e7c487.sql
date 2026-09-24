
CREATE TABLE public.case_evidence_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  evidence_type TEXT NOT NULL,
  description TEXT NOT NULL,
  importance_level TEXT NOT NULL DEFAULT 'media',
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_evidence_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own evidence checklist" ON public.case_evidence_checklist FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evidence checklist" ON public.case_evidence_checklist FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence checklist" ON public.case_evidence_checklist FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence checklist" ON public.case_evidence_checklist FOR DELETE USING (auth.uid() = user_id);
