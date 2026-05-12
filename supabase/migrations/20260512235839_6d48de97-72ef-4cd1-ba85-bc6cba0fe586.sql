
-- 1. Coupons: drop public read, add validation RPC
DROP POLICY IF EXISTS "Public can read active valid coupons" ON public.coupons;

CREATE OR REPLACE FUNCTION public.validate_coupon_code(p_code text, p_order_total integer)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  c record;
BEGIN
  SELECT * INTO c FROM public.coupons
   WHERE upper(code) = upper(trim(p_code))
     AND is_active = true
   LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Érvénytelen kupon kód');
  END IF;

  IF c.valid_until IS NOT NULL AND c.valid_until < now() THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ez a kupon lejárt');
  END IF;

  IF c.max_uses IS NOT NULL AND c.used_count >= c.max_uses THEN
    RETURN jsonb_build_object('success', false, 'message', 'Ez a kupon elfogyott');
  END IF;

  IF p_order_total < c.min_order_huf THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Minimum rendelési érték: ' || c.min_order_huf::text || ' Ft'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'code', c.code,
    'discount_type', c.discount_type,
    'discount_value', c.discount_value,
    'min_order_huf', c.min_order_huf
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.validate_coupon_code(text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_coupon_code(text, integer) TO anon, authenticated;

-- 2. Subscribers: use is_admin()
DROP POLICY IF EXISTS "Only admins can view subscribers" ON public.subscribers;
CREATE POLICY "Only admins can view subscribers" ON public.subscribers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 3. Push subscriptions: explicit admin read
CREATE POLICY "Admins can view push subscriptions" ON public.push_subscriptions
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4. Newsletter & ratings inserts - tighten WITH CHECK
DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON public.subscribers;
CREATE POLICY "Anyone can subscribe to newsletter" ON public.subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 320
    AND email LIKE '%_@_%.__%'
  );

DROP POLICY IF EXISTS "Anyone can insert order ratings" ON public.order_ratings;
CREATE POLICY "Anyone can insert order ratings" ON public.order_ratings
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    order_id IS NOT NULL
    AND rating BETWEEN 1 AND 5
  );

-- 5. Storage: remove broad listing policies on menu-images public bucket
DROP POLICY IF EXISTS "Menu images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public can view menu images" ON storage.objects;

-- 6. Lock down trigger / bootstrap SECURITY DEFINER functions from anon/auth API access
REVOKE EXECUTE ON FUNCTION public.audit_log_trigger() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_daily_item_date() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_order_date() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_invoice_on_order_complete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_admin() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.claim_admin_access() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.gen_order_code() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_user_role(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_capacity_slot(date, time, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_daily_portions(text, uuid, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.validate_menu_composition(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.increment_template_usage(uuid) FROM PUBLIC, anon;

-- 7. Realtime: restrict order broadcast subscriptions to admin/staff
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin/staff can read realtime messages" ON realtime.messages;
CREATE POLICY "Admin/staff can read realtime messages" ON realtime.messages
  FOR SELECT TO authenticated
  USING (public.is_admin_or_staff(auth.uid()));
