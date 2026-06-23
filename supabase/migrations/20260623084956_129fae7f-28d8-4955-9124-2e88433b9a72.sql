
-- Failed order submission attempts
CREATE TABLE public.order_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text,
  customer_phone text,
  customer_email text,
  cart_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_huf integer,
  error_message text,
  error_code text,
  payment_method text,
  pickup_date date,
  pickup_time_slot text,
  user_agent text,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.order_attempts TO authenticated;
GRANT ALL ON public.order_attempts TO service_role;

ALTER TABLE public.order_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin/staff can view order attempts"
ON public.order_attempts FOR SELECT
TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can delete order attempts"
ON public.order_attempts FOR DELETE
TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

CREATE INDEX idx_order_attempts_created ON public.order_attempts (created_at DESC);


-- Abandoned carts tracked during checkout
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL UNIQUE,
  customer_name text,
  customer_phone text,
  customer_email text,
  cart_snapshot jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_huf integer DEFAULT 0,
  step text DEFAULT 'cart',
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.abandoned_carts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.abandoned_carts TO authenticated;
GRANT ALL ON public.abandoned_carts TO service_role;

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Anyone (anon) may insert/update their own session row (we trust the random session_id)
CREATE POLICY "Anyone can insert abandoned cart"
ON public.abandoned_carts FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can update by session"
ON public.abandoned_carts FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Admin/staff can view abandoned carts"
ON public.abandoned_carts FOR SELECT
TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

CREATE POLICY "Admin/staff can delete abandoned carts"
ON public.abandoned_carts FOR DELETE
TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

CREATE INDEX idx_abandoned_carts_activity ON public.abandoned_carts (last_activity_at DESC);
CREATE INDEX idx_abandoned_carts_converted ON public.abandoned_carts (converted_order_id);

-- Auto-cleanup function (older than 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_order_tracking()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.order_attempts WHERE created_at < now() - interval '30 days';
  DELETE FROM public.abandoned_carts WHERE last_activity_at < now() - interval '30 days';
END;
$$;

-- Schedule via pg_cron if available
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.schedule(
      'cleanup-order-tracking',
      '0 3 * * *',
      $cron$SELECT public.cleanup_old_order_tracking();$cron$
    );
  END IF;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
