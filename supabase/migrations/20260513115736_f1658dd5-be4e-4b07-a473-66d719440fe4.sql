
-- Lock down SECURITY DEFINER functions: revoke EXECUTE from PUBLIC, anon, authenticated by default,
-- then grant back only what frontend/auth flows need.

-- Internal/trigger/edge-only functions (revoke from anon+authenticated)
REVOKE EXECUTE ON FUNCTION public.gen_order_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_capacity_slot(date, time without time zone, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_daily_portions(text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pickup_time(timestamp with time zone) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_menu_composition(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_weekend(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_date_in_past(date) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.audit_changed_fields(jsonb, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_entity_label(jsonb, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_module_for_table(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_daily_item_date() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_date() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_invoice_test_exclusion() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invoice_on_order_complete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_notes_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Authenticated-only RPCs (revoke from anon)
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_admin_access() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_access() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(uuid) TO authenticated;

-- Public-facing RPCs explicitly granted (called from client/anon)
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(text, integer) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_data(date) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) TO anon, authenticated;
