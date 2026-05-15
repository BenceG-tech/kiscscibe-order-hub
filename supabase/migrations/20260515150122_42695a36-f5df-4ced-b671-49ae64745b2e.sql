
-- 1) Fix privilege escalation on profiles.role
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile (no role change)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin(auth.uid()))
WITH CHECK (public.is_admin(auth.uid()));

-- 2) Lock down order_ratings inserts
DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.order_ratings;
DROP POLICY IF EXISTS "Public can insert ratings" ON public.order_ratings;
DROP POLICY IF EXISTS "Allow rating insert" ON public.order_ratings;
DROP POLICY IF EXISTS "Anyone can submit ratings" ON public.order_ratings;

CREATE POLICY "Only staff can insert ratings"
ON public.order_ratings
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_or_staff(auth.uid()));

-- 3) Revoke broad EXECUTE on SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_capacity_slot(date, time, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_daily_portions(text, uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invoice_on_order_complete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_daily_item_date() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_date() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.gen_order_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_order(text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_orders(text) FROM anon;
