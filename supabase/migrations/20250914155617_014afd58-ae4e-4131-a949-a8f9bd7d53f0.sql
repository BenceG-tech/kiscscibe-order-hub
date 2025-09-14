-- Fix the is_weekend function to have proper search path
CREATE OR REPLACE FUNCTION is_weekend(check_date date) 
RETURNS boolean 
LANGUAGE plpgsql 
IMMUTABLE 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXTRACT(DOW FROM check_date) IN (0, 6); -- 0 = Sunday, 6 = Saturday
END;
$$;