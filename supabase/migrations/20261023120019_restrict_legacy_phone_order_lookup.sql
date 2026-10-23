-- The legacy lookup discloses order codes using only a phone number.
-- Customer views use the separate code + phone RPCs; this function is unused.
-- Preserve service_role access and all code + phone customer lookup functions.
REVOKE EXECUTE ON FUNCTION public.get_customer_orders(text)
  FROM PUBLIC, anon, authenticated;
