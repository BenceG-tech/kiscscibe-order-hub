
-- ============================================================
-- 1) abandoned_carts: scope UPDATE policy to session-id header
-- ============================================================
DROP POLICY IF EXISTS "Anyone can update by session" ON public.abandoned_carts;
DROP POLICY IF EXISTS "Anyone can insert abandoned cart" ON public.abandoned_carts;

CREATE POLICY "Insert abandoned cart for own session"
ON public.abandoned_carts
FOR INSERT
TO anon, authenticated
WITH CHECK (
  session_id IS NOT NULL
  AND session_id = COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
);

CREATE POLICY "Update abandoned cart for own session"
ON public.abandoned_carts
FOR UPDATE
TO anon, authenticated
USING (
  session_id IS NOT NULL
  AND session_id = COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
)
WITH CHECK (
  session_id IS NOT NULL
  AND session_id = COALESCE(
    current_setting('request.headers', true)::json->>'x-session-id',
    ''
  )
);

-- ============================================================
-- 2) order_attempts: explicit service-role-only write policies
-- ============================================================
CREATE POLICY "Service role can insert order attempts"
ON public.order_attempts
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update order attempts"
ON public.order_attempts
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

COMMENT ON TABLE public.order_attempts IS
'Writes restricted to service_role only (via edge functions). Anon/authenticated cannot INSERT/UPDATE.';

-- ============================================================
-- 3) SECURITY DEFINER functions: revoke PUBLIC EXECUTE, grant
--    only to roles that actually need to call each function.
-- ============================================================

-- Revoke default PUBLIC execute on every SECURITY DEFINER function in public.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure::text AS sig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prosecdef = true
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC, anon, authenticated', r.sig);
  END LOOP;
END $$;

-- Re-grant EXECUTE only where genuinely needed.

-- Role-check helpers used inside RLS policies evaluated for anon/authenticated:
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin(uuid)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_staff(uuid)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_staff(uuid)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_owner(uuid)           TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(uuid)      TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_weekend(date)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_date_in_past(date)    TO anon, authenticated;

-- Public-facing data lookups (called from anon checkout / order lookup pages):
GRANT EXECUTE ON FUNCTION public.get_customer_order(text, text)         TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text)  TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_order_items(text, text)   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_customer_orders(text)              TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_data(date)                   TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(text, integer)    TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_pickup_time(timestamptz)      TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_menu_composition(uuid)        TO anon, authenticated;

-- Authenticated-only (admin claim flow, template usage from admin UI):
GRANT EXECUTE ON FUNCTION public.claim_admin_access()             TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_template_usage(uuid)   TO authenticated;

-- Service-role-only (edge functions / cron):
GRANT EXECUTE ON FUNCTION public.update_daily_portions(text, uuid, integer)            TO service_role;
GRANT EXECUTE ON FUNCTION public.update_capacity_slot(date, time without time zone, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_order_tracking()                          TO service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_admin()                               TO service_role;
GRANT EXECUTE ON FUNCTION public.gen_order_code()                                      TO service_role;

-- Note: trigger functions (handle_new_user, audit_log_trigger,
-- create_invoice_on_order_complete, set_invoice_test_exclusion,
-- validate_order_date, validate_daily_item_date, update_updated_at_column,
-- update_admin_notes_updated_at, audit_*) execute as the trigger
-- owner; they need no client EXECUTE grants.

-- ============================================================
-- 4) Leaked password protection (Supabase Auth setting)
-- ============================================================
-- This is enabled in Auth dashboard, not via SQL. Documented for the user
-- in the response (Authentication > Providers > Email > Password protection).
