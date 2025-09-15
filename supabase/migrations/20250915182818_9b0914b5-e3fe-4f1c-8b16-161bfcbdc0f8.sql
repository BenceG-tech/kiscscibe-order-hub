-- Add more timeslots for testing (next 2 days)
INSERT INTO capacity_slots (date, timeslot, max_orders, booked_orders)
SELECT 
  (CURRENT_DATE + INTERVAL '1 day')::date as date,
  slot_time,
  8 as max_orders,
  0 as booked_orders
FROM (
  VALUES 
    ('11:00:00'::time),
    ('11:30:00'::time), 
    ('12:00:00'::time),
    ('12:30:00'::time),
    ('13:00:00'::time),
    ('13:30:00'::time),
    ('14:00:00'::time)
) AS slots(slot_time)
ON CONFLICT (date, timeslot) DO NOTHING;

-- Add slots for day after tomorrow too
INSERT INTO capacity_slots (date, timeslot, max_orders, booked_orders)
SELECT 
  (CURRENT_DATE + INTERVAL '2 day')::date as date,
  slot_time,
  8 as max_orders,
  0 as booked_orders
FROM (
  VALUES 
    ('11:00:00'::time),
    ('11:30:00'::time), 
    ('12:00:00'::time),
    ('12:30:00'::time),
    ('13:00:00'::time),
    ('13:30:00'::time),
    ('14:00:00'::time)
) AS slots(slot_time)
ON CONFLICT (date, timeslot) DO NOTHING;