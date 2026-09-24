
-- Add new columns to legal_knowledge_entries
ALTER TABLE public.legal_knowledge_entries
  ADD COLUMN IF NOT EXISTS is_manual BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS generated_by_ai BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS confidence_score NUMERIC,
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add updated_at trigger for legal_knowledge_entries
CREATE TRIGGER update_legal_knowledge_entries_updated_at
  BEFORE UPDATE ON public.legal_knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validate confidence_score 0-1
CREATE TRIGGER validate_knowledge_confidence_score
  BEFORE INSERT OR UPDATE ON public.legal_knowledge_entries
  FOR EACH ROW EXECUTE FUNCTION public.validate_confidence_score();

-- Add new columns to knowledge_similarity_links
ALTER TABLE public.knowledge_similarity_links
  ADD COLUMN IF NOT EXISTS match_type TEXT DEFAULT 'text_search',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Add UPDATE policy for knowledge_similarity_links
CREATE POLICY "Users can update own similarity links"
  ON public.knowledge_similarity_links FOR UPDATE
  TO authenticated USING (auth.uid() = user_id);

-- Add updated_at trigger for knowledge_similarity_links
CREATE TRIGGER update_knowledge_similarity_links_updated_at
  BEFORE UPDATE ON public.knowledge_similarity_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add embedding-ready columns to knowledge_search_index
ALTER TABLE public.knowledge_search_index
  ADD COLUMN IF NOT EXISTS embedding_model TEXT,
  ADD COLUMN IF NOT EXISTS embedding_generated_at TIMESTAMPTZ;
