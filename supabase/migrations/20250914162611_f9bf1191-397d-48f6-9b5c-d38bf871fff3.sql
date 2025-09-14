-- Fix security warnings - Set proper search_path for all functions
-- This addresses the function search path mutable warnings

-- Fix validate_pickup_time function
CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    pickup_date date;
    pickup_time time;
    day_of_week integer;
BEGIN
    -- Extract date, time and day of week
    pickup_date := pickup_datetime::date;
    pickup_time := pickup_datetime::time;
    day_of_week := EXTRACT(DOW FROM pickup_date);
    
    -- Check if it's weekend (Sunday = 0, Saturday = 6)
    IF day_of_week = 0 THEN -- Sunday
        RETURN false; -- Closed on Sunday
    END IF;
    
    -- Check opening hours
    IF day_of_week BETWEEN 1 AND 5 THEN -- Monday to Friday
        -- 7:00 to 15:00
        IF pickup_time < '07:00'::time OR pickup_time >= '15:00'::time THEN
            RETURN false;
        END IF;
    ELSIF day_of_week = 6 THEN -- Saturday
        -- 8:00 to 14:00
        IF pickup_time < '08:00'::time OR pickup_time >= '14:00'::time THEN
            RETURN false;
        END IF;
    END IF;
    
    RETURN true;
END;
$$;

-- Fix is_date_in_past function
CREATE OR REPLACE FUNCTION public.is_date_in_past(check_date date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN check_date < CURRENT_DATE;
END;
$$;

-- Fix update_daily_portions function
CREATE OR REPLACE FUNCTION public.update_daily_portions(
    table_name text,
    daily_id uuid,
    quantity_needed integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_portions integer;
    affected_rows integer;
BEGIN
    -- This function provides race-safe portion updates
    -- It will only succeed if there are enough portions available
    
    IF table_name NOT IN ('daily_offers', 'daily_menus') THEN
        RAISE EXCEPTION 'Invalid table name: %', table_name;
    END IF;
    
    -- Use FOR UPDATE to lock the row and prevent race conditions
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
    END IF;
    
    RETURN affected_rows > 0;
END;
$$;

-- Fix validate_order_date function
CREATE OR REPLACE FUNCTION public.validate_order_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prevent orders with pickup times in the past
    IF NEW.pickup_time IS NOT NULL AND NEW.pickup_time < NOW() THEN
        RAISE EXCEPTION 'Cannot place orders for past dates or times';
    END IF;
    
    -- Validate pickup time against business hours
    IF NEW.pickup_time IS NOT NULL AND NOT validate_pickup_time(NEW.pickup_time) THEN
        RAISE EXCEPTION 'Pickup time is outside business hours';
    END IF;
    
    RETURN NEW;
END;
$$;

-- Fix validate_daily_item_date function
CREATE OR REPLACE FUNCTION public.validate_daily_item_date()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Prevent creating daily items for past dates
    IF is_date_in_past(NEW.date) THEN
        RAISE EXCEPTION 'Cannot create daily items for past dates';
    END IF;
    
    -- Ensure remaining_portions is not negative
    IF NEW.remaining_portions < 0 THEN
        RAISE EXCEPTION 'Remaining portions cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$;