-- 1) Idempotency key column on orders + partial unique index (last 60s dedup)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS idempotency_key text;
CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_unique ON public.orders(idempotency_key) WHERE idempotency_key IS NOT NULL;

-- 2) Atomic coupon increment RPC — safe against race condition
CREATE OR REPLACE FUNCTION public.atomic_coupon_increment(_coupon_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_count integer;
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE id = _coupon_id
    AND is_active = true
    AND (max_uses IS NULL OR used_count < max_uses)
    AND (valid_until IS NULL OR valid_until > now());
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.atomic_coupon_increment(uuid) TO authenticated, anon, service_role;

-- 3) Fix validate_order_date: add 5-minute grace window to avoid rejecting orders
--    for a pickup slot that just became "past" due to processing delay.
CREATE OR REPLACE FUNCTION public.validate_order_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 5 minute grace: allow pickup times slightly in the past to survive
        -- edge function processing latency + clock skew.
        IF NEW.pickup_time IS NOT NULL AND NEW.pickup_time < (NOW() - INTERVAL '5 minutes') THEN
            RAISE EXCEPTION 'Cannot place orders for past dates or times';
        END IF;
        IF NEW.pickup_time IS NOT NULL AND NOT validate_pickup_time(NEW.pickup_time) THEN
            RAISE EXCEPTION 'Pickup time is outside business hours';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;