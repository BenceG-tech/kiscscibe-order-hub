-- DO NOT APPLY until the current preview has been published.
-- See ./README.md for the required ordering.
--
-- Removes phone-only order enumeration: get_customer_orders(text) returns every
-- order for a phone number, so knowing a phone number alone was enough to list
-- a customer's whole order history. The app now uses
-- get_customer_order_secure(order_code, customer_phone), which requires both.

REVOKE EXECUTE ON FUNCTION public.get_customer_orders(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_customer_orders(text) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_customer_orders(text) FROM PUBLIC;
