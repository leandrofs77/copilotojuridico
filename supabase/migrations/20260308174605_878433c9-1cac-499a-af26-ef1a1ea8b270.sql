-- =====================================================
-- MIGRAÇÃO CONSOLIDADA: Atlas Jurídico
-- =====================================================

-- 1. RECRIAR RLS POLICIES COM TO authenticated

-- 1.1 CASES
DROP POLICY IF EXISTS "Users can view own cases" ON cases;
DROP POLICY IF EXISTS "Users can insert own cases" ON cases;
DROP POLICY IF EXISTS "Users can update own cases" ON cases;
DROP POLICY IF EXISTS "Users can delete own cases" ON cases;

CREATE POLICY "Users can view own cases" ON cases FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own cases" ON cases FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own cases" ON cases FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own cases" ON cases FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 1.2 DOCUMENTS
DROP POLICY IF EXISTS "Users can view own documents" ON documents;
DROP POLICY IF EXISTS "Users can insert own documents" ON documents;
DROP POLICY IF EXISTS "Users can update own documents" ON documents;
DROP POLICY IF EXISTS "Users can delete own documents" ON documents;

CREATE POLICY "Users can view own documents" ON documents FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 1.3 EXTRACTED_EVENTS
DROP POLICY IF EXISTS "Users can view own events" ON extracted_events;
DROP POLICY IF EXISTS "Users can insert own events" ON extracted_events;
DROP POLICY IF EXISTS "Users can update own events" ON extracted_events;
DROP POLICY IF EXISTS "Users can delete own events" ON extracted_events;

CREATE POLICY "Users can view own events" ON extracted_events FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own events" ON extracted_events FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own events" ON extracted_events FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own events" ON extracted_events FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 1.4 REPORTS
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can insert own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Users can delete own reports" ON reports;

CREATE POLICY "Users can view own reports" ON reports FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON reports FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON reports FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 1.5 CASE_PARTIES
DROP POLICY IF EXISTS "Users can view own case parties" ON case_parties;
DROP POLICY IF EXISTS "Users can insert own case parties" ON case_parties;
DROP POLICY IF EXISTS "Users can update own case parties" ON case_parties;
DROP POLICY IF EXISTS "Users can delete own case parties" ON case_parties;

CREATE POLICY "Users can view own case parties" ON case_parties FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own case parties" ON case_parties FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own case parties" ON case_parties FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own case parties" ON case_parties FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 1.6 PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can view own profile" ON profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- 1.7 USER_ROLES
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;

CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- 2. CRIAR ÍNDICES DE PERFORMANCE

CREATE INDEX IF NOT EXISTS idx_extracted_events_user_id ON extracted_events(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status);

-- 3. CAMPOS DE IA NA TABELA DOCUMENTS

ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_status TEXT DEFAULT 'pending';
ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_started_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_completed_at TIMESTAMPTZ;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS analysis_version TEXT;
ALTER TABLE documents ADD COLUMN IF NOT EXISTS queued_for_analysis BOOLEAN DEFAULT false;

-- 4. TABELA DOCUMENT_ANALYSIS_JOBS

CREATE TABLE IF NOT EXISTS document_analysis_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  status TEXT DEFAULT 'pending',
  attempts INTEGER DEFAULT 0,
  priority INTEGER DEFAULT 5,
  payload JSONB DEFAULT '{}',
  result JSONB DEFAULT '{}',
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

ALTER TABLE document_analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_document_analysis_jobs_document_id ON document_analysis_jobs(document_id);
CREATE INDEX IF NOT EXISTS idx_document_analysis_jobs_status ON document_analysis_jobs(status);
CREATE INDEX IF NOT EXISTS idx_document_analysis_jobs_priority ON document_analysis_jobs(priority);

CREATE POLICY "Users can view own analysis jobs" ON document_analysis_jobs 
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own analysis jobs" ON document_analysis_jobs 
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);