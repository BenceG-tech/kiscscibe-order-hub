-- Fix admin RLS policies that were permanently disabled (USING false)
DROP POLICY IF EXISTS "Admin can manage menu categories" ON public.menu_categories;
CREATE POLICY "Admin can manage menu categories"
  ON public.menu_categories
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage modifiers" ON public.item_modifiers;
CREATE POLICY "Admin can manage modifiers"
  ON public.item_modifiers
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Admin can manage modifier options" ON public.item_modifier_options;
CREATE POLICY "Admin can manage modifier options"
  ON public.item_modifier_options
  FOR ALL
  TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

-- Revoke EXECUTE from anon/authenticated for SECURITY DEFINER functions that
-- should only be called by edge functions running with the service role.
REVOKE EXECUTE ON FUNCTION public.create_invoice_on_order_complete() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_daily_item_date() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_date() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.gen_order_code() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_capacity_slot(date, time without time zone, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_daily_portions(text, uuid, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_coupon_code(text, integer) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_invoice_test_exclusion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_notes_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_weekend(date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_date_in_past(date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pickup_time(timestamp with time zone) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_menu_composition(uuid) FROM anon, authenticated;
