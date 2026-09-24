
-- Table 1: case_evidence_simulation
CREATE TABLE public.case_evidence_simulation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  current_strength TEXT,
  potential_strength TEXT,
  estimated_success_probability TEXT,
  missing_critical_evidence JSONB DEFAULT '[]'::jsonb,
  missing_recommended_evidence JSONB DEFAULT '[]'::jsonb,
  evidence_impact_analysis JSONB DEFAULT '[]'::jsonb,
  simulation_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.case_evidence_simulation ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own evidence simulation" ON public.case_evidence_simulation FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evidence simulation" ON public.case_evidence_simulation FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence simulation" ON public.case_evidence_simulation FOR DELETE USING (auth.uid() = user_id);

-- Table 2: case_temporal_analysis
CREATE TABLE public.case_temporal_analysis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  possible_deadlines JSONB DEFAULT '[]'::jsonb,
  urgency_level TEXT,
  deadline_risk TEXT,
  limitation_risk TEXT,
  time_sensitivity_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.case_temporal_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own temporal analysis" ON public.case_temporal_analysis FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own temporal analysis" ON public.case_temporal_analysis FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own temporal analysis" ON public.case_temporal_analysis FOR DELETE USING (auth.uid() = user_id);

-- Table 3: case_context_signals
CREATE TABLE public.case_context_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'other',
  content TEXT NOT NULL,
  signal_analysis JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.case_context_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own context signals" ON public.case_context_signals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own context signals" ON public.case_context_signals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own context signals" ON public.case_context_signals FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can update own context signals" ON public.case_context_signals FOR UPDATE USING (auth.uid() = user_id);

-- Table 4: case_visual_diagnostics
CREATE TABLE public.case_visual_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID REFERENCES public.cases(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  evidence_score INTEGER DEFAULT 0,
  viability_score INTEGER DEFAULT 0,
  timing_score INTEGER DEFAULT 0,
  urgency_score INTEGER DEFAULT 0,
  conflict_intensity_score INTEGER DEFAULT 0,
  financial_score INTEGER DEFAULT 0,
  complexity_score INTEGER DEFAULT 0,
  overall_case_strength INTEGER DEFAULT 0,
  risk_level TEXT,
  visual_summary TEXT,
  recommended_actions JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.case_visual_diagnostics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own visual diagnostics" ON public.case_visual_diagnostics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own visual diagnostics" ON public.case_visual_diagnostics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own visual diagnostics" ON public.case_visual_diagnostics FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own visual diagnostics" ON public.case_visual_diagnostics FOR DELETE USING (auth.uid() = user_id);
