CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    pickup_time time;
    day_of_week integer;
BEGIN
    pickup_time := pickup_datetime::time;
    day_of_week := EXTRACT(DOW FROM pickup_datetime::date);

    -- Sunday (0) and Saturday (6) are closed
    IF day_of_week IN (0, 6) THEN
        RETURN false;
    END IF;

    -- Monday to Friday: 10:30 to 15:00
    IF pickup_time < '10:30'::time OR pickup_time > '15:00'::time THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$function$;

-- Delete future, unbooked early capacity slots (< 10:30)
DELETE FROM public.capacity_slots
WHERE date >= CURRENT_DATE
  AND timeslot < '10:30'::time
  AND booked_orders = 0;