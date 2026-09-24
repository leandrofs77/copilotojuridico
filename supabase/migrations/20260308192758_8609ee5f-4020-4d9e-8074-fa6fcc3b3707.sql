
-- 1. Create account_licenses table
CREATE TABLE public.account_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID,
  license_type TEXT NOT NULL DEFAULT 'trial',
  license_status TEXT NOT NULL DEFAULT 'active',
  trial_ends_at TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  access_ends_at TIMESTAMPTZ,
  billing_provider TEXT,
  stripe_subscription_id TEXT,
  created_by_admin UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Unique constraint per user
ALTER TABLE public.account_licenses ADD CONSTRAINT account_licenses_user_id_key UNIQUE (user_id);

-- 3. Enable RLS
ALTER TABLE public.account_licenses ENABLE ROW LEVEL SECURITY;

-- 4. RLS: user can see own
CREATE POLICY "User can view own license"
  ON public.account_licenses FOR SELECT
  USING (auth.uid() = user_id);

-- 5. RLS: superadmin full access
CREATE POLICY "Superadmin can view all licenses"
  ON public.account_licenses FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can update all licenses"
  ON public.account_licenses FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can insert licenses"
  ON public.account_licenses FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()));

-- 6. Updated_at trigger
CREATE TRIGGER update_account_licenses_updated_at
  BEFORE UPDATE ON public.account_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Auto-create license for new users (trigger on account_access_control insert)
CREATE OR REPLACE FUNCTION public.handle_new_user_license()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_licenses (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_access_control_created_create_license
  AFTER INSERT ON public.account_access_control
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_license();

-- 8. Security definer function to check license validity
CREATE OR REPLACE FUNCTION public.check_license_valid(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.account_licenses
    WHERE user_id = _user_id
      AND license_status = 'active'
      AND (
        license_type IN ('partnership', 'lifetime', 'subscription')
        OR (license_type = 'trial' AND trial_ends_at > now())
        OR (license_type = 'manual' AND access_ends_at IS NOT NULL AND access_ends_at > now())
      )
  )
$$;
