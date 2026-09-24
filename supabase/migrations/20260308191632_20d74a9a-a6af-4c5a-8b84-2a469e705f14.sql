
-- Security definer function for superadmin check
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'superadmin'
  )
$$;

-- Drop old admin-based policies
DROP POLICY IF EXISTS "Superadmin can view all access control" ON public.account_access_control;
DROP POLICY IF EXISTS "Superadmin can update all access control" ON public.account_access_control;
DROP POLICY IF EXISTS "Superadmin can view admin logs" ON public.admin_action_logs;
DROP POLICY IF EXISTS "Superadmin can insert admin logs" ON public.admin_action_logs;

-- Recreate with superadmin
CREATE POLICY "Superadmin can view all access control"
  ON public.account_access_control FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can update all access control"
  ON public.account_access_control FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can view admin logs"
  ON public.admin_action_logs FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Superadmin can insert admin logs"
  ON public.admin_action_logs FOR INSERT
  WITH CHECK (public.is_superadmin(auth.uid()));
