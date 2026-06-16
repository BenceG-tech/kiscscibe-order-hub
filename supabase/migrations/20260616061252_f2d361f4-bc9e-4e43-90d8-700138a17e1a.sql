CREATE OR REPLACE FUNCTION public.get_customer_order_items(order_code text, customer_phone text)
RETURNS TABLE(
  id uuid,
  name_snapshot text,
  unit_price_huf integer,
  qty integer,
  line_total_huf integer,
  options jsonb
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    oi.id,
    oi.name_snapshot,
    oi.unit_price_huf,
    oi.qty,
    oi.line_total_huf,
    COALESCE(
      (
        SELECT jsonb_agg(to_jsonb(o.*))
        FROM public.order_item_options o
        WHERE o.order_item_id = oi.id
          AND o.option_type IS DISTINCT FROM 'daily_meta'
      ),
      '[]'::jsonb
    ) AS options
  FROM public.order_items oi
  JOIN public.orders ord ON ord.id = oi.order_id
  WHERE ord.code = order_code
    AND ord.phone = customer_phone;
$$;

GRANT EXECUTE ON FUNCTION public.get_customer_order_items(text, text) TO anon, authenticated;