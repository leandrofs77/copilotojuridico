
-- Partners table
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  partner_level TEXT NOT NULL DEFAULT 'bronze',
  referral_code_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own partner record" ON public.partners FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmin can view all partners" ON public.partners FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert partners" ON public.partners FOR INSERT WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update partners" ON public.partners FOR UPDATE USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can delete partners" ON public.partners FOR DELETE USING (is_superadmin(auth.uid()));

CREATE TRIGGER update_partners_updated_at BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Referral codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  code TEXT UNIQUE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own referral codes" ON public.referral_codes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "User can insert own referral codes" ON public.referral_codes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Superadmin can view all referral codes" ON public.referral_codes FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert referral codes" ON public.referral_codes FOR INSERT WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update referral codes" ON public.referral_codes FOR UPDATE USING (is_superadmin(auth.uid()));

-- Referrals table
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL,
  referred_user_id UUID NOT NULL,
  subscription_id UUID,
  commission_value NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own referrals as referrer" ON public.referrals FOR SELECT USING (auth.uid() = referrer_user_id);
CREATE POLICY "Superadmin can view all referrals" ON public.referrals FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert referrals" ON public.referrals FOR INSERT WITH CHECK (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can update referrals" ON public.referrals FOR UPDATE USING (is_superadmin(auth.uid()));
CREATE POLICY "System can insert referrals" ON public.referrals FOR INSERT WITH CHECK (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

-- Partner rewards table
CREATE TABLE public.partner_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  reward_type TEXT NOT NULL,
  reward_value NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own rewards" ON public.partner_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Superadmin can view all rewards" ON public.partner_rewards FOR SELECT USING (is_superadmin(auth.uid()));
CREATE POLICY "Superadmin can insert rewards" ON public.partner_rewards FOR INSERT WITH CHECK (is_superadmin(auth.uid()));

-- Link partners.referral_code_id to referral_codes
ALTER TABLE public.partners ADD CONSTRAINT partners_referral_code_id_fkey FOREIGN KEY (referral_code_id) REFERENCES public.referral_codes(id);

-- Trigger: auto-create referral on new user signup if referral_code in metadata
CREATE OR REPLACE FUNCTION public.handle_referral_on_signup()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = 'public'
AS $function$
DECLARE
  _code TEXT;
  _referrer_user_id UUID;
BEGIN
  _code := NEW.raw_user_meta_data ->> 'referral_code';
  IF _code IS NOT NULL AND _code != '' THEN
    SELECT user_id INTO _referrer_user_id
    FROM public.referral_codes
    WHERE code = _code AND active = true
    LIMIT 1;
    
    IF _referrer_user_id IS NOT NULL THEN
      INSERT INTO public.referrals (referrer_user_id, referred_user_id, status)
      VALUES (_referrer_user_id, NEW.id, 'pending')
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER on_auth_user_created_referral
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_referral_on_signup();
