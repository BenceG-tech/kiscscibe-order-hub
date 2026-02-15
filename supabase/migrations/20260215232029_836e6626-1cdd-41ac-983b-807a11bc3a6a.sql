
-- Update opening_hours to match confirmed schedule: H-P 7:00-16:00, Szo-V Zárva
UPDATE public.settings 
SET value_json = '{"mon_fri": "07:00-16:00", "sat": "closed", "sun": "closed"}'::jsonb
WHERE key = 'opening_hours';

-- Add restaurant_address if it doesn't exist
INSERT INTO public.settings (key, value_json)
VALUES ('restaurant_address', '{"zip": "1141", "city": "Budapest", "street": "Vezér u. 110.", "full": "1141 Budapest, Vezér u. 110."}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value_json = EXCLUDED.value_json;

-- Add public read policies for these settings keys
CREATE POLICY "Public can read opening hours"
ON public.settings
FOR SELECT
USING (key = 'opening_hours');

CREATE POLICY "Public can read restaurant address"
ON public.settings
FOR SELECT
USING (key = 'restaurant_address');

-- Update validate_pickup_time to match: H-P 7:00-16:00, Szo-V Zárva
CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    pickup_date date;
    pickup_time time;
    day_of_week integer;
BEGIN
    pickup_date := pickup_datetime::date;
    pickup_time := pickup_datetime::time;
    day_of_week := EXTRACT(DOW FROM pickup_date);
    
    -- Sunday (0) and Saturday (6) are closed
    IF day_of_week IN (0, 6) THEN
        RETURN false;
    END IF;
    
    -- Monday to Friday: 7:00 to 16:00
    IF day_of_week BETWEEN 1 AND 5 THEN
        IF pickup_time < '07:00'::time OR pickup_time >= '16:00'::time THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$function$;

-- Update is_weekend to also treat Saturday as closed day for ordering
CREATE OR REPLACE FUNCTION public.is_weekend(check_date date)
 RETURNS boolean
 LANGUAGE plpgsql
 IMMUTABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN EXTRACT(DOW FROM check_date) IN (0, 6);
END;
$function$;
