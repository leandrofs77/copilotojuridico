
-- Table: account_access_control
CREATE TABLE public.account_access_control (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  office_name TEXT,
  plan_name TEXT,
  billing_status TEXT DEFAULT 'trial',
  access_status TEXT DEFAULT 'pending',
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  pause_reason TEXT,
  cancellation_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.account_access_control ENABLE ROW LEVEL SECURITY;

-- RLS: users see own record
CREATE POLICY "Users can view own access control"
  ON public.account_access_control FOR SELECT
  USING (auth.uid() = user_id);

-- RLS: superadmin can view all
CREATE POLICY "Superadmin can view all access control"
  ON public.account_access_control FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: superadmin can update all
CREATE POLICY "Superadmin can update all access control"
  ON public.account_access_control FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: system can insert (via trigger)
CREATE POLICY "System can insert access control"
  ON public.account_access_control FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Table: admin_action_logs
CREATE TABLE public.admin_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL,
  target_user_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.admin_action_logs ENABLE ROW LEVEL SECURITY;

-- RLS: only superadmin can view logs
CREATE POLICY "Superadmin can view admin logs"
  ON public.admin_action_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- RLS: only superadmin can insert logs
CREATE POLICY "Superadmin can insert admin logs"
  ON public.admin_action_logs FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger: auto-create access control record for new users
CREATE OR REPLACE FUNCTION public.handle_new_user_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.account_access_control (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_access
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_access();

-- Trigger: update updated_at on account_access_control
CREATE TRIGGER update_account_access_updated_at
  BEFORE UPDATE ON public.account_access_control
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Security definer function to check access status without RLS recursion
CREATE OR REPLACE FUNCTION public.get_access_status(_user_id UUID)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT access_status FROM public.account_access_control WHERE user_id = _user_id LIMIT 1
$$;
