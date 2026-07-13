-- Fix: update_daily_portions must accept 'daily_offer_menus' table too.
-- Previously all complete-menu orders (leves + főétel csomag) silently failed
-- with "Invalid table name: daily_offer_menus" because this branch was missing.

CREATE OR REPLACE FUNCTION public.update_daily_portions(
    table_name text,
    daily_id uuid,
    quantity_needed integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    current_portions integer;
    affected_rows integer;
BEGIN
    IF table_name NOT IN ('daily_offers', 'daily_menus', 'daily_offer_menus') THEN
        RAISE EXCEPTION 'Invalid table name: %', table_name;
    END IF;

    IF table_name = 'daily_offers' THEN
        SELECT remaining_portions INTO current_portions
        FROM daily_offers
        WHERE id = daily_id
        FOR UPDATE;

        IF current_portions IS NULL THEN
            RAISE EXCEPTION 'Daily offer not found';
        END IF;

        IF current_portions < quantity_needed THEN
            RAISE EXCEPTION 'Insufficient portions available (requested: %, available: %)', quantity_needed, current_portions;
        END IF;

        UPDATE daily_offers
        SET remaining_portions = remaining_portions - quantity_needed
        WHERE id = daily_id AND remaining_portions >= quantity_needed;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;

    ELSIF table_name = 'daily_menus' THEN
        SELECT remaining_portions INTO current_portions
        FROM daily_menus
        WHERE id = daily_id
        FOR UPDATE;

        IF current_portions IS NULL THEN
            RAISE EXCEPTION 'Daily menu not found';
        END IF;

        IF current_portions < quantity_needed THEN
            RAISE EXCEPTION 'Insufficient portions available (requested: %, available: %)', quantity_needed, current_portions;
        END IF;

        UPDATE daily_menus
        SET remaining_portions = remaining_portions - quantity_needed
        WHERE id = daily_id AND remaining_portions >= quantity_needed;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;

    ELSIF table_name = 'daily_offer_menus' THEN
        SELECT remaining_portions INTO current_portions
        FROM daily_offer_menus
        WHERE id = daily_id
        FOR UPDATE;

        IF current_portions IS NULL THEN
            RAISE EXCEPTION 'Daily offer menu not found';
        END IF;

        IF current_portions < quantity_needed THEN
            RAISE EXCEPTION 'Insufficient portions available (requested: %, available: %)', quantity_needed, current_portions;
        END IF;

        UPDATE daily_offer_menus
        SET remaining_portions = remaining_portions - quantity_needed
        WHERE id = daily_id AND remaining_portions >= quantity_needed;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
    END IF;

    RETURN affected_rows > 0;
END;
$function$;

-- Update validate_pickup_time to reflect the real opening window:
--   Mon–Fri 07:00–16:00 (breakfast + lunch), weekends closed.
-- The edge function keeps the finer-grained rule (breakfast items → 07:00–10:00,
-- lunch items → 10:30–16:00), but the DB-level guard just needs to allow the
-- full daily window instead of the previous lunch-only 10:30–15:00.
CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

    IF pickup_time_local < '07:00'::time OR pickup_time_local > '16:00'::time THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$function$;