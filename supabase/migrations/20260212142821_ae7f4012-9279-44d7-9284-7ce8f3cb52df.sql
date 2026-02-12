-- Update the trigger function to allow admins to manage past dates
CREATE OR REPLACE FUNCTION public.validate_daily_item_date()
RETURNS TRIGGER AS $$
BEGIN
    -- Allow admins to manage past dates
    IF is_date_in_past(NEW.date) AND NOT is_admin(auth.uid()) THEN
        RAISE EXCEPTION 'Cannot create daily items for past dates';
    END IF;
    
    -- Ensure remaining_portions is not negative
    IF NEW.remaining_portions IS NOT NULL AND NEW.remaining_portions < 0 THEN
        RAISE EXCEPTION 'Remaining portions cannot be negative';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;