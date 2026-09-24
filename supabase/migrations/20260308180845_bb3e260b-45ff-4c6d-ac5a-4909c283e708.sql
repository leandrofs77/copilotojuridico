ALTER TYPE public.activity_action ADD VALUE IF NOT EXISTS 'document_processed';
ALTER TABLE public.document_analysis_jobs ADD COLUMN IF NOT EXISTS analysis_phase TEXT;