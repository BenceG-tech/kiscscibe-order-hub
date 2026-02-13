
-- =============================================
-- 1. WASTE TRACKING TABLE
-- =============================================
CREATE TABLE public.daily_waste_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  item_name text NOT NULL,
  planned_portions integer,
  sold_portions integer,
  wasted_portions integer NOT NULL DEFAULT 0,
  notes text,
  logged_by uuid,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.daily_waste_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to waste log" ON public.daily_waste_log FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Staff can insert waste log" ON public.daily_waste_log FOR INSERT WITH CHECK (is_admin_or_staff(auth.uid()));
CREATE POLICY "Staff can view waste log" ON public.daily_waste_log FOR SELECT USING (is_admin_or_staff(auth.uid()));

-- =============================================
-- 2. COUPONS TABLE
-- =============================================
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value integer NOT NULL CHECK (discount_value > 0),
  min_order_huf integer NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamp with time zone NOT NULL DEFAULT now(),
  valid_until timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access to coupons" ON public.coupons FOR ALL USING (is_admin(auth.uid()));
CREATE POLICY "Public can read active valid coupons" ON public.coupons FOR SELECT USING (is_active = true);

-- =============================================
-- 3. COUPON USAGES TABLE
-- =============================================
CREATE TABLE public.coupon_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  discount_huf integer NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.coupon_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can view coupon usages" ON public.coupon_usages FOR SELECT USING (is_admin(auth.uid()));
CREATE POLICY "Service role can manage coupon usages" ON public.coupon_usages FOR ALL USING (auth.role() = 'service_role'::text);

-- =============================================
-- 4. ORDERS TABLE: ADD COUPON COLUMNS
-- =============================================
ALTER TABLE public.orders ADD COLUMN coupon_code text;
ALTER TABLE public.orders ADD COLUMN discount_huf integer NOT NULL DEFAULT 0;
