
-- Table: legal_writing_profiles
CREATE TABLE public.legal_writing_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_name TEXT NOT NULL,
  style_summary TEXT,
  tone TEXT,
  vocabulary_patterns JSONB DEFAULT '{}'::jsonb,
  structure_patterns JSONB DEFAULT '{}'::jsonb,
  argument_patterns JSONB DEFAULT '{}'::jsonb,
  signature_phrases JSONB DEFAULT '[]'::jsonb,
  sample_documents_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_writing_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own writing profiles" ON public.legal_writing_profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing profiles" ON public.legal_writing_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own writing profiles" ON public.legal_writing_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own writing profiles" ON public.legal_writing_profiles FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_legal_writing_profiles_updated_at
  BEFORE UPDATE ON public.legal_writing_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table: legal_writing_samples
CREATE TABLE public.legal_writing_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.legal_writing_profiles(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  extracted_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.legal_writing_samples ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own writing samples" ON public.legal_writing_samples FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own writing samples" ON public.legal_writing_samples FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own writing samples" ON public.legal_writing_samples FOR DELETE TO authenticated USING (auth.uid() = user_id);
