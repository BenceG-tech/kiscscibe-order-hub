
REVOKE EXECUTE ON FUNCTION public.audit_changed_fields(jsonb, jsonb) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_entity_label(jsonb, text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.audit_module_for_table(text) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_invoice_test_exclusion() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_admin_notes_updated_at() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_weekend(date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_date_in_past(date) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_pickup_time(timestamptz) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_menu_composition(uuid) FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_owner(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_staff(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_admin_or_staff(uuid) FROM anon;
