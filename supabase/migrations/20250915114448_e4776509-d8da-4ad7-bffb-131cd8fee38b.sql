-- Update the update_daily_portions function to handle daily_offer_menus table
CREATE OR REPLACE FUNCTION public.update_daily_portions(table_name text, daily_id uuid, quantity_needed integer)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
    current_portions integer;
    affected_rows integer;
BEGIN
    -- This function provides race-safe portion updates
    -- It will only succeed if there are enough portions available
    
    IF table_name NOT IN ('daily_offers', 'daily_menus', 'daily_offer_menus') THEN
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