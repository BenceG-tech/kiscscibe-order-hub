
CREATE OR REPLACE FUNCTION public.validate_order_date()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    -- Only validate dates on INSERT (new orders), not on UPDATE (status changes)
    IF TG_OP = 'INSERT' THEN
        -- Prevent orders with pickup times in the past
        IF NEW.pickup_time IS NOT NULL AND NEW.pickup_time < NOW() THEN
            RAISE EXCEPTION 'Cannot place orders for past dates or times';
        END IF;
        
        -- Validate pickup time against business hours
        IF NEW.pickup_time IS NOT NULL AND NOT validate_pickup_time(NEW.pickup_time) THEN
            RAISE EXCEPTION 'Pickup time is outside business hours';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$function$;
