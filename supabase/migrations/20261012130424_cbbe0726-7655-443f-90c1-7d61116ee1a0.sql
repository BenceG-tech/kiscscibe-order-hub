ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS packaging_fee_huf integer NOT NULL DEFAULT 0;

INSERT INTO public.settings (key, value_json)
VALUES ('packaging_fees', '{"main_huf": 150, "menu_huf": 200}'::jsonb)
ON CONFLICT (key) DO NOTHING;

CREATE POLICY "Public can read packaging fees"
ON public.settings FOR SELECT
USING (key = 'packaging_fees'::text);

DROP FUNCTION IF EXISTS public.get_customer_order_secure(text, text);
CREATE FUNCTION public.get_customer_order_secure(order_code text, customer_phone text)
RETURNS TABLE(id uuid, code text, name text, phone text, total_huf integer, status text, payment_method text, pickup_time timestamp with time zone, created_at timestamp with time zone, notes text, packaging_fee_huf integer)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
    SELECT
        o.id,
        o.code,
        o.name,
        o.phone,
        o.total_huf,
        o.status,
        o.payment_method,
        o.pickup_time,
        o.created_at,
        o.notes,
        o.packaging_fee_huf
    FROM orders o
    WHERE o.code = order_code
    AND o.phone = customer_phone
    LIMIT 1;
$function$;

GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_customer_order_secure(text, text) TO authenticated;