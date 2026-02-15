
-- 1. Race-safe atomic capacity slot update (mirrors update_daily_portions pattern)
CREATE OR REPLACE FUNCTION public.update_capacity_slot(
  slot_date date,
  slot_time time,
  qty integer DEFAULT 1
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_booked integer;
  max_cap integer;
  affected_rows integer;
BEGIN
  -- Lock the row to prevent race conditions
  SELECT booked_orders, max_orders INTO current_booked, max_cap
  FROM capacity_slots
  WHERE date = slot_date AND timeslot = slot_time
  FOR UPDATE;

  -- If slot doesn't exist, return false (caller should create it first)
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  IF current_booked + qty > max_cap THEN
    RAISE EXCEPTION 'Az időpont közben betelt (foglalt: %, max: %)', current_booked, max_cap;
  END IF;

  UPDATE capacity_slots
  SET booked_orders = booked_orders + qty
  WHERE date = slot_date AND timeslot = slot_time;

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RETURN affected_rows > 0;
END;
$$;
