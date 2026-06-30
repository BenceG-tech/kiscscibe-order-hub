
REVOKE EXECUTE ON FUNCTION public.get_daily_data(date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_daily_data(date) TO anon, authenticated, service_role;
