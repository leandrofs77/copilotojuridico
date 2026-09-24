
-- ============================================
-- AI PROMPTS TABLE
-- ============================================
CREATE TABLE public.ai_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  tool_name text NOT NULL,
  prompt_content text NOT NULL DEFAULT '',
  model_preferred text,
  temperature numeric DEFAULT 0.7,
  max_tokens integer DEFAULT 4096,
  active boolean DEFAULT true,
  version integer DEFAULT 1,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select ai_prompts" ON public.ai_prompts FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert ai_prompts" ON public.ai_prompts FOR INSERT TO authenticated WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update ai_prompts" ON public.ai_prompts FOR UPDATE TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can delete ai_prompts" ON public.ai_prompts FOR DELETE TO authenticated USING (is_superadmin(auth.uid()));

-- Edge functions can read prompts (service role bypasses RLS, but also allow authenticated reads for radar)
CREATE POLICY "Authenticated can read active prompts" ON public.ai_prompts FOR SELECT TO authenticated USING (active = true);

CREATE TRIGGER update_ai_prompts_updated_at BEFORE UPDATE ON public.ai_prompts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AI EXECUTION LOGS TABLE
-- ============================================
CREATE TABLE public.ai_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tool_name text,
  model_used text,
  prompt_id uuid REFERENCES public.ai_prompts(id) ON DELETE SET NULL,
  execution_time_ms integer,
  tokens_input integer DEFAULT 0,
  tokens_output integer DEFAULT 0,
  estimated_cost numeric DEFAULT 0,
  status text DEFAULT 'success',
  error_message text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select all execution logs" ON public.ai_execution_logs FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Users can select own execution logs" ON public.ai_execution_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Authenticated can insert execution logs" ON public.ai_execution_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ============================================
-- AI SETTINGS TABLE (singleton)
-- ============================================
CREATE TABLE public.ai_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  default_model text DEFAULT 'google/gemini-3-flash-preview',
  fallback_model text DEFAULT 'google/gemini-2.5-flash',
  max_tokens_default integer DEFAULT 4096,
  temperature_default numeric DEFAULT 0.7,
  enable_logging boolean DEFAULT true,
  enable_fallback boolean DEFAULT true,
  cost_alert_threshold numeric DEFAULT 50.00,
  updated_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update ai_settings" ON public.ai_settings FOR UPDATE TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert ai_settings" ON public.ai_settings FOR INSERT TO authenticated WITH CHECK (is_superadmin(auth.uid()));
-- Allow authenticated to read settings for radar router
CREATE POLICY "Authenticated can read ai_settings" ON public.ai_settings FOR SELECT TO authenticated USING (true);

CREATE TRIGGER update_ai_settings_updated_at BEFORE UPDATE ON public.ai_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AI MODELS TABLE (for Radar)
-- ============================================
CREATE TABLE public.ai_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model_name text NOT NULL,
  display_name text,
  priority integer DEFAULT 10,
  cost_per_1k_tokens numeric DEFAULT 0,
  avg_response_time integer DEFAULT 0,
  success_rate numeric DEFAULT 100,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin can select ai_models" ON public.ai_models FOR SELECT TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert ai_models" ON public.ai_models FOR INSERT TO authenticated WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update ai_models" ON public.ai_models FOR UPDATE TO authenticated USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can delete ai_models" ON public.ai_models FOR DELETE TO authenticated USING (is_superadmin(auth.uid()));
-- Allow authenticated to read active models for radar router
CREATE POLICY "Authenticated can read active models" ON public.ai_models FOR SELECT TO authenticated USING (active = true);

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON public.ai_models FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA
-- ============================================

-- Default settings
INSERT INTO public.ai_settings (default_model, fallback_model, max_tokens_default, temperature_default, enable_logging, enable_fallback, cost_alert_threshold)
VALUES ('google/gemini-3-flash-preview', 'google/gemini-2.5-flash', 4096, 0.7, true, true, 50.00);

-- AI Models
INSERT INTO public.ai_models (provider, model_name, display_name, priority, cost_per_1k_tokens, avg_response_time, success_rate, active) VALUES
('Google', 'google/gemini-3-flash-preview', 'Gemini 3 Flash Preview', 1, 0.10, 1500, 99.5, true),
('Google', 'google/gemini-2.5-flash', 'Gemini 2.5 Flash', 2, 0.08, 1200, 99.0, true),
('Google', 'google/gemini-2.5-pro', 'Gemini 2.5 Pro', 3, 0.25, 3000, 98.5, true),
('OpenAI', 'openai/gpt-5', 'GPT-5', 4, 0.30, 2500, 98.0, true),
('OpenAI', 'openai/gpt-5-mini', 'GPT-5 Mini', 5, 0.15, 1800, 98.5, true),
('OpenAI', 'openai/gpt-5-nano', 'GPT-5 Nano', 6, 0.05, 800, 97.0, true);

-- Sample prompts
INSERT INTO public.ai_prompts (name, description, tool_name, prompt_content, model_preferred, temperature, max_tokens, active, version) VALUES
('Análise de Documento Jurídico', 'Analisa documentos jurídicos extraindo informações relevantes', 'analyze-document', 'Você é um assistente jurídico especializado. Analise o documento a seguir e extraia: partes envolvidas, datas importantes, obrigações, riscos e resumo executivo.', 'google/gemini-3-flash-preview', 0.3, 4096, true, 1),
('Extração de Eventos', 'Extrai eventos cronológicos de documentos processuais', 'extract-events', 'Analise o texto a seguir e extraia todos os eventos cronológicos relevantes. Para cada evento, forneça: data, descrição, tipo de evento e relevância.', 'google/gemini-2.5-flash', 0.2, 2048, true, 1),
('Detecção de Contradições', 'Identifica contradições entre documentos ou depoimentos', 'detect-contradictions', 'Compare os textos fornecidos e identifique quaisquer contradições, inconsistências ou divergências significativas. Liste cada contradição com referência aos trechos relevantes.', 'google/gemini-2.5-pro', 0.3, 4096, true, 1),
('Geração de Relatório Jurídico', 'Gera relatórios estruturados sobre casos', 'generate-report', 'Com base nos dados do caso fornecidos, gere um relatório jurídico estruturado contendo: síntese do caso, análise de riscos, recomendações estratégicas e próximos passos.', 'google/gemini-3-flash-preview', 0.5, 8192, true, 1),
('Resumo Automático de Processo', 'Gera resumo executivo de processos judiciais', 'summarize-process', 'Elabore um resumo executivo do processo judicial descrito. Inclua: objeto da ação, partes, pedidos, fundamentos jurídicos e status atual.', 'google/gemini-2.5-flash', 0.3, 2048, true, 1);
