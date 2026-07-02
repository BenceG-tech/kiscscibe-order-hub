CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    local_ts timestamp;
    pickup_time_local time;
    day_of_week integer;
BEGIN
    local_ts := (pickup_datetime AT TIME ZONE 'Europe/Budapest');
    pickup_time_local := local_ts::time;
    day_of_week := EXTRACT(DOW FROM local_ts::date);

    IF day_of_week IN (0, 6) THEN
        RETURN false;
    END IF;

    IF pickup_time_local < '10:30'::time OR pickup_time_local > '15:00'::time THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;