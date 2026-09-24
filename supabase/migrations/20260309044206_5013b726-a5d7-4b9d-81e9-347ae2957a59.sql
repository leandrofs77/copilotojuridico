
-- CMS pages table
CREATE TABLE public.cms_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_slug text UNIQUE NOT NULL,
  page_title text NOT NULL,
  page_category text NOT NULL DEFAULT 'landing',
  content jsonb DEFAULT '{}'::jsonb,
  html_content text DEFAULT '',
  updated_by uuid,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.cms_pages ENABLE ROW LEVEL SECURITY;

-- Public read for published pages (no auth needed)
CREATE POLICY "Anyone can read published cms pages"
  ON public.cms_pages FOR SELECT
  USING (published = true);

-- Superadmin full CRUD
CREATE POLICY "Superadmin can insert cms pages"
  ON public.cms_pages FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can update cms pages"
  ON public.cms_pages FOR UPDATE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can delete cms pages"
  ON public.cms_pages FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Superadmin can also read unpublished
CREATE POLICY "Superadmin can read all cms pages"
  ON public.cms_pages FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- CMS images table
CREATE TABLE public.cms_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  url text NOT NULL,
  storage_path text,
  alt_text text DEFAULT '',
  uploaded_by uuid,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.cms_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cms images"
  ON public.cms_images FOR SELECT
  USING (true);

CREATE POLICY "Superadmin can insert cms images"
  ON public.cms_images FOR INSERT
  TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can delete cms images"
  ON public.cms_images FOR DELETE
  TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Storage bucket for CMS images
INSERT INTO storage.buckets (id, name, public) VALUES ('cms-images', 'cms-images', true);

-- Storage policies
CREATE POLICY "Anyone can read cms images bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cms-images');

CREATE POLICY "Superadmin can upload cms images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cms-images' AND public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can delete cms images from bucket"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cms-images' AND public.is_superadmin(auth.uid()));

-- Seed initial page slugs
INSERT INTO public.cms_pages (page_slug, page_title, page_category) VALUES
  ('hero', 'Hero Section', 'landing'),
  ('problem', 'Problema', 'landing'),
  ('solution', 'Solução', 'landing'),
  ('before-after', 'Antes e Depois', 'landing'),
  ('technology', 'Tecnologia', 'landing'),
  ('how-it-works', 'Como Funciona', 'landing'),
  ('security', 'Segurança', 'landing'),
  ('pricing', 'Planos', 'landing'),
  ('about', 'Sobre', 'landing'),
  ('faq', 'FAQ', 'landing'),
  ('cta', 'CTA Final', 'landing'),
  ('privacy-policy', 'Política de Privacidade', 'legal'),
  ('terms-of-service', 'Termos de Serviço', 'legal'),
  ('saas-license', 'Licença SaaS', 'legal'),
  ('ai-disclaimer', 'Aviso de IA', 'legal');
