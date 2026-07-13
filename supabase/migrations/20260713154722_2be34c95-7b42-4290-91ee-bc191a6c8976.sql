
-- Drop redundant permissive "publicly readable" policies that override published-only scope
DROP POLICY IF EXISTS "Daily offers are publicly readable" ON public.daily_offers;
DROP POLICY IF EXISTS "Daily offer items are publicly readable" ON public.daily_offer_items;
DROP POLICY IF EXISTS "Daily offer menus are publicly readable" ON public.daily_offer_menus;

-- Lock down SECURITY DEFINER function execution
-- Revoke broad EXECUTE, then re-grant only to roles that legitimately need it.
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Publicly callable (anon + authenticated) — used by unauthenticated site flows
GRANT EXECUTE ON FUNCTION public.get_customer_order(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order_items(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_data(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(text, integer) TO anon, authenticated;

-- Authenticated-only RPCs used by client after login
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(uuid) TO authenticated;
