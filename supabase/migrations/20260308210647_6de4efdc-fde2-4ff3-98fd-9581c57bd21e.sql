
-- Table 1: legal_knowledge_entries
CREATE TABLE public.legal_knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_id UUID,
  entry_type TEXT NOT NULL DEFAULT 'argument',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  legal_area TEXT,
  tags TEXT[] DEFAULT '{}',
  outcome TEXT DEFAULT 'unknown',
  relevance_score NUMERIC DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  search_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.legal_knowledge_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own knowledge entries" ON public.legal_knowledge_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own knowledge entries" ON public.legal_knowledge_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own knowledge entries" ON public.legal_knowledge_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own knowledge entries" ON public.legal_knowledge_entries FOR DELETE USING (auth.uid() = user_id);

-- Table 2: knowledge_similarity_links
CREATE TABLE public.knowledge_similarity_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  source_case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  similar_case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  similarity_score NUMERIC DEFAULT 0,
  similarity_reasons JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_similarity_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own similarity links" ON public.knowledge_similarity_links FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own similarity links" ON public.knowledge_similarity_links FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own similarity links" ON public.knowledge_similarity_links FOR DELETE USING (auth.uid() = user_id);

-- Table 3: knowledge_search_index
CREATE TABLE public.knowledge_search_index (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES public.legal_knowledge_entries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  search_vector tsvector,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.knowledge_search_index ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can select own search index" ON public.knowledge_search_index FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own search index" ON public.knowledge_search_index FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own search index" ON public.knowledge_search_index FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own search index" ON public.knowledge_search_index FOR DELETE USING (auth.uid() = user_id);

-- GIN index for full-text search
CREATE INDEX idx_knowledge_search_vector ON public.knowledge_search_index USING GIN (search_vector);

-- Index on entry_type and legal_area for filtering
CREATE INDEX idx_knowledge_entries_type ON public.legal_knowledge_entries (entry_type);
CREATE INDEX idx_knowledge_entries_legal_area ON public.legal_knowledge_entries (legal_area);
CREATE INDEX idx_knowledge_entries_case_id ON public.legal_knowledge_entries (case_id);
CREATE INDEX idx_knowledge_entries_user_id ON public.legal_knowledge_entries (user_id);

-- Trigger function: auto-populate search index on insert/update
CREATE OR REPLACE FUNCTION public.update_knowledge_search_index()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  _tags_text TEXT;
  _vector tsvector;
BEGIN
  _tags_text := COALESCE(array_to_string(NEW.tags, ' '), '');
  _vector := to_tsvector('portuguese', COALESCE(NEW.title, '') || ' ' || COALESCE(NEW.content, '') || ' ' || _tags_text || ' ' || COALESCE(NEW.legal_area, ''));

  INSERT INTO public.knowledge_search_index (entry_id, user_id, search_vector)
  VALUES (NEW.id, NEW.user_id, _vector)
  ON CONFLICT (entry_id) DO UPDATE SET search_vector = EXCLUDED.search_vector;

  RETURN NEW;
END;
$$;

-- Add unique constraint on entry_id for upsert
ALTER TABLE public.knowledge_search_index ADD CONSTRAINT knowledge_search_index_entry_id_unique UNIQUE (entry_id);

CREATE TRIGGER trg_update_knowledge_search_index
AFTER INSERT OR UPDATE ON public.legal_knowledge_entries
FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_search_index();

-- Search function for full-text queries
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
    AND si.search_vector @@ plainto_tsquery('portuguese', _query)
    AND (_legal_area IS NULL OR e.legal_area = _legal_area)
    AND (_entry_type IS NULL OR e.entry_type = _entry_type)
  ORDER BY rank DESC
  LIMIT _limit;
$$;
