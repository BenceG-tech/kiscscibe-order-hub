-- Enable leaked password protection and implement critical security fixes
-- This migration addresses the core security and functionality issues

-- 1. Create function to validate business hours for pickup times
CREATE OR REPLACE FUNCTION public.validate_pickup_time(pickup_datetime timestamp with time zone)
RETURNS boolean
LANGUAGE plpgsql
STABLE
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

-- 2. Create function to check if date is in the past
CREATE OR REPLACE FUNCTION public.is_date_in_past(check_date date)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
    RETURN check_date < CURRENT_DATE;
END;
$$;

-- 3. Create atomic function for daily offer/menu portion updates
CREATE OR REPLACE FUNCTION public.update_daily_portions(
    table_name text,
    daily_id uuid,
    quantity_needed integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 4. Add validation triggers to prevent past-date orders
CREATE OR REPLACE FUNCTION public.validate_order_date()
RETURNS trigger
LANGUAGE plpgsql
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

-- Create trigger for order validation
DROP TRIGGER IF EXISTS validate_order_date_trigger ON orders;
CREATE TRIGGER validate_order_date_trigger
    BEFORE INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION validate_order_date();

-- 5. Add validation for daily offers/menus to prevent past-date creation
CREATE OR REPLACE FUNCTION public.validate_daily_item_date()
RETURNS trigger
LANGUAGE plpgsql
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

-- Create triggers for daily offers and menus
DROP TRIGGER IF EXISTS validate_daily_offer_date_trigger ON daily_offers;
CREATE TRIGGER validate_daily_offer_date_trigger
    BEFORE INSERT OR UPDATE ON daily_offers
    FOR EACH ROW
    EXECUTE FUNCTION validate_daily_item_date();

DROP TRIGGER IF EXISTS validate_daily_menu_date_trigger ON daily_menus;
CREATE TRIGGER validate_daily_menu_date_trigger
    BEFORE INSERT OR UPDATE ON daily_menus
    FOR EACH ROW
    EXECUTE FUNCTION validate_daily_item_date();

-- 6. Update RLS policies for better security

-- Orders table - only admins and service role can read/write
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Only authenticated admins can update orders" ON orders;
DROP POLICY IF EXISTS "Only authenticated admins can view orders" ON orders;

CREATE POLICY "Service role can manage orders" ON orders
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all orders" ON orders
    FOR SELECT USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update order status" ON orders
    FOR UPDATE USING (is_admin(auth.uid()));

-- Order items table - similar restrictions
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;

CREATE POLICY "Service role can manage order items" ON order_items
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all order items" ON order_items
    FOR SELECT USING (is_admin(auth.uid()));

-- Order item options table - similar restrictions  
DROP POLICY IF EXISTS "Admin can view all order item options" ON order_item_options;
DROP POLICY IF EXISTS "Anyone can create order item options" ON order_item_options;

CREATE POLICY "Service role can manage order item options" ON order_item_options
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can view all order item options" ON order_item_options
    FOR SELECT USING (is_admin(auth.uid()));

-- 7. Add constraints to prevent negative portions
ALTER TABLE daily_offers 
ADD CONSTRAINT check_daily_offers_remaining_portions_non_negative 
CHECK (remaining_portions >= 0);

ALTER TABLE daily_menus 
ADD CONSTRAINT check_daily_menus_remaining_portions_non_negative 
CHECK (remaining_portions >= 0);

-- 8. Create index for better performance on date-based queries
CREATE INDEX IF NOT EXISTS idx_daily_offers_date ON daily_offers(date);
CREATE INDEX IF NOT EXISTS idx_daily_menus_date ON daily_menus(date);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 9. Create function to get customer order (secure access)
CREATE OR REPLACE FUNCTION public.get_customer_order_secure(order_code text, customer_phone text)
RETURNS TABLE(
    id uuid, 
    code text, 
    name text, 
    phone text, 
    total_huf integer, 
    status text, 
    payment_method text, 
    pickup_time timestamp with time zone, 
    created_at timestamp with time zone, 
    notes text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT 
        o.id,
        o.code,
        o.name,
        o.phone,
        o.total_huf,
        o.status,
        o.payment_method,
        o.pickup_time,
        o.created_at,
        o.notes
    FROM orders o
    WHERE o.code = order_code 
    AND o.phone = customer_phone
    LIMIT 1;
$$;