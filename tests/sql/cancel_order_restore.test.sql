-- Regression test for cancel_order_with_restore().
-- Run as a privileged DB role; the block asserts and cleans up after itself.
-- Cases:
--   T1 new -> cancelled restores portions + capacity slot (ledger present)
--   T2 repeated cancel is a no-op (no double restore)
--   T3 cancelling from a non-new status (ready) still restores exactly once
--   T4 legacy order without ledger: reservations derived from items + pickup_time
--   T5 repeated cancel of a legacy order does not double-restore
DO $$
DECLARE
  v_offer uuid;
  v_order uuid;
  v_order2 uuid;
  v_order3 uuid;
  v_item uuid;
  v_date date := (date_trunc('week', (now() AT TIME ZONE 'Europe/Budapest')::date) + interval '63 days')::date;
  v_time time := '12:00:00';
  v_pickup timestamptz;
  v_res jsonb;
  v_rem int;
  v_booked int;
  v_status text;
  v_admin uuid;
BEGIN
  SELECT user_id INTO v_admin FROM user_roles WHERE role = 'admin' LIMIT 1;
  PERFORM set_config('request.jwt.claims',
    json_build_object('sub', v_admin, 'role', 'authenticated')::text, true);
  v_pickup := (v_date::text || ' ' || v_time::text)::timestamp AT TIME ZONE 'Europe/Budapest';

  INSERT INTO daily_offers (date, price_huf, note, max_portions, remaining_portions)
  VALUES (v_date, 2200, 'TEST_CANCEL', 10, 8) RETURNING id INTO v_offer;

  INSERT INTO capacity_slots (date, timeslot, max_orders, booked_orders, buffer_minutes)
  VALUES (v_date, v_time, 8, 3, 0);

  -- T1
  INSERT INTO orders (code, name, phone, total_huf, payment_method, status, pickup_time)
  VALUES ('TST001', 'TEST', '+36000000000', 4400, 'cash', 'new', v_pickup) RETURNING id INTO v_order;
  INSERT INTO order_reservations (order_id, resource_type, resource_table, resource_id, qty)
  VALUES (v_order, 'daily_portions', 'daily_offers', v_offer, 2);
  INSERT INTO order_reservations (order_id, resource_type, slot_date, slot_time, qty)
  VALUES (v_order, 'capacity_slot', v_date, v_time, 1);

  v_res := cancel_order_with_restore(v_order);
  SELECT remaining_portions INTO v_rem FROM daily_offers WHERE id = v_offer;
  SELECT booked_orders INTO v_booked FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  SELECT status INTO v_status FROM orders WHERE id = v_order;
  IF v_rem <> 10 OR v_booked <> 2 OR v_status <> 'cancelled' OR (v_res->>'restored')::int <> 2 THEN
    RAISE EXCEPTION 'T1 FAILED rem=% booked=% status=% res=%', v_rem, v_booked, v_status, v_res;
  END IF;

  -- T2
  v_res := cancel_order_with_restore(v_order);
  SELECT remaining_portions INTO v_rem FROM daily_offers WHERE id = v_offer;
  SELECT booked_orders INTO v_booked FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  IF v_rem <> 10 OR v_booked <> 2 OR (v_res->>'already_cancelled')::boolean IS NOT TRUE THEN
    RAISE EXCEPTION 'T2 FAILED rem=% booked=% res=%', v_rem, v_booked, v_res;
  END IF;

  -- T3
  UPDATE daily_offers SET remaining_portions = 7 WHERE id = v_offer;
  UPDATE capacity_slots SET booked_orders = 4 WHERE date = v_date AND timeslot = v_time;
  INSERT INTO orders (code, name, phone, total_huf, payment_method, status, pickup_time)
  VALUES ('TST002', 'TEST', '+36000000000', 6600, 'cash', 'ready', v_pickup) RETURNING id INTO v_order2;
  INSERT INTO order_reservations (order_id, resource_type, resource_table, resource_id, qty)
  VALUES (v_order2, 'daily_portions', 'daily_offers', v_offer, 3);
  INSERT INTO order_reservations (order_id, resource_type, slot_date, slot_time, qty)
  VALUES (v_order2, 'capacity_slot', v_date, v_time, 1);

  v_res := cancel_order_with_restore(v_order2);
  SELECT remaining_portions INTO v_rem FROM daily_offers WHERE id = v_offer;
  SELECT booked_orders INTO v_booked FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  IF v_rem <> 10 OR v_booked <> 3 OR (v_res->>'previous_status') <> 'ready' THEN
    RAISE EXCEPTION 'T3 FAILED rem=% booked=% res=%', v_rem, v_booked, v_res;
  END IF;

  -- T4 (legacy)
  UPDATE daily_offers SET remaining_portions = 9 WHERE id = v_offer;
  UPDATE capacity_slots SET booked_orders = 4 WHERE date = v_date AND timeslot = v_time;
  INSERT INTO orders (code, name, phone, total_huf, payment_method, status, pickup_time)
  VALUES ('TST003', 'TEST', '+36000000000', 2200, 'cash', 'new', v_pickup) RETURNING id INTO v_order3;
  INSERT INTO order_items (order_id, item_id, name_snapshot, unit_price_huf, qty, line_total_huf)
  VALUES (v_order3, NULL, 'TEST napi', 2200, 1, 2200) RETURNING id INTO v_item;
  INSERT INTO order_item_options (order_item_id, label_snapshot, price_delta_huf)
  VALUES (v_item, 'daily_offer_' || v_offer::text, 0);

  v_res := cancel_order_with_restore(v_order3);
  SELECT remaining_portions INTO v_rem FROM daily_offers WHERE id = v_offer;
  SELECT booked_orders INTO v_booked FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  IF v_rem <> 10 OR v_booked <> 3 OR (v_res->>'restored')::int <> 2 THEN
    RAISE EXCEPTION 'T4 FAILED rem=% booked=% res=%', v_rem, v_booked, v_res;
  END IF;

  -- T5
  v_res := cancel_order_with_restore(v_order3);
  SELECT remaining_portions INTO v_rem FROM daily_offers WHERE id = v_offer;
  SELECT booked_orders INTO v_booked FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  IF v_rem <> 10 OR v_booked <> 3 THEN
    RAISE EXCEPTION 'T5 FAILED rem=% booked=%', v_rem, v_booked;
  END IF;

  RAISE NOTICE 'ALL TESTS PASSED';

  DELETE FROM order_item_options WHERE order_item_id = v_item;
  DELETE FROM order_items WHERE order_id IN (v_order, v_order2, v_order3);
  DELETE FROM order_reservations WHERE order_id IN (v_order, v_order2, v_order3);
  DELETE FROM orders WHERE id IN (v_order, v_order2, v_order3);
  DELETE FROM capacity_slots WHERE date = v_date AND timeslot = v_time;
  DELETE FROM daily_offers WHERE id = v_offer;
END $$;
