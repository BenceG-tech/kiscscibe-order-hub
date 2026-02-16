
-- 1. Customer Loyalty table
CREATE TABLE public.customer_loyalty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  email text,
  order_count integer NOT NULL DEFAULT 0,
  total_spent_huf integer NOT NULL DEFAULT 0,
  current_tier text NOT NULL DEFAULT 'bronze',
  last_order_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(phone)
);

ALTER TABLE public.customer_loyalty ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to customer_loyalty"
ON public.customer_loyalty FOR ALL
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admin can view customer_loyalty"
ON public.customer_loyalty FOR SELECT
USING (is_admin(auth.uid()));

-- 2. Loyalty Rewards table
CREATE TABLE public.loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  reward_type text NOT NULL,
  reward_value integer NOT NULL,
  coupon_code text,
  is_claimed boolean DEFAULT false,
  triggered_at_order_count integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.loyalty_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to loyalty_rewards"
ON public.loyalty_rewards FOR ALL
USING (auth.role() = 'service_role'::text);

CREATE POLICY "Admin can view loyalty_rewards"
ON public.loyalty_rewards FOR SELECT
USING (is_admin(auth.uid()));

-- 3. Order Ratings table
CREATE TABLE public.order_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL UNIQUE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert order ratings"
ON public.order_ratings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admin can view order ratings"
ON public.order_ratings FOR SELECT
USING (is_admin(auth.uid()));

-- 4. Push Subscriptions table
CREATE TABLE public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phone text NOT NULL,
  endpoint text NOT NULL UNIQUE,
  keys_json jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access to push_subscriptions"
ON public.push_subscriptions FOR ALL
USING (auth.role() = 'service_role'::text);

-- 5. RPC: get_customer_orders
CREATE OR REPLACE FUNCTION public.get_customer_orders(customer_phone text)
RETURNS TABLE(
  id uuid,
  code text,
  total_huf integer,
  status text,
  created_at timestamptz,
  pickup_time timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT o.id, o.code, o.total_huf, o.status, o.created_at, o.pickup_time
  FROM public.orders o
  WHERE o.phone = customer_phone
  ORDER BY o.created_at DESC
  LIMIT 20;
$$;
