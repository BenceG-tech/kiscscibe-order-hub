
CREATE TABLE public.order_reservations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  resource_type text NOT NULL CHECK (resource_type IN ('daily_portions','capacity_slot')),
  resource_table text,
  resource_id uuid,
  slot_date date,
  slot_time time without time zone,
  qty integer NOT NULL CHECK (qty > 0),
  restored_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.order_reservations TO authenticated;
GRANT ALL ON public.order_reservations TO service_role;

ALTER TABLE public.order_reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin or staff can view reservations"
ON public.order_reservations FOR SELECT TO authenticated
USING (public.is_admin_or_staff(auth.uid()));

CREATE INDEX idx_order_reservations_order ON public.order_reservations(order_id);

-- one ledger row per (order, resource) so re-submitting the same reservation is a no-op
CREATE UNIQUE INDEX order_reservations_unique_resource
ON public.order_reservations (
  order_id,
  resource_type,
  COALESCE(resource_table, ''),
  COALESCE(resource_id, '00000000-0000-0000-0000-000000000000'::uuid),
  COALESCE(slot_date, '1970-01-01'::date),
  COALESCE(slot_time, '00:00:00'::time)
);

CREATE OR REPLACE FUNCTION public.restore_daily_portions(table_name text, daily_id uuid, quantity integer)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected integer := 0;
BEGIN
  IF table_name NOT IN ('daily_offers','daily_menus','daily_offer_menus') THEN
    RAISE EXCEPTION 'Invalid table name: %', table_name;
  END IF;

  IF table_name = 'daily_offers' THEN
    UPDATE daily_offers
      SET remaining_portions = LEAST(COALESCE(max_portions, remaining_portions + quantity),
                                     remaining_portions + quantity)
      WHERE id = daily_id;
  ELSIF table_name = 'daily_menus' THEN
    UPDATE daily_menus
      SET remaining_portions = LEAST(COALESCE(max_portions, remaining_portions + quantity),
                                     remaining_portions + quantity)
      WHERE id = daily_id;
  ELSE
    UPDATE daily_offer_menus
      SET remaining_portions = LEAST(COALESCE(max_portions, remaining_portions + quantity),
                                     remaining_portions + quantity)
      WHERE id = daily_id;
  END IF;

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected > 0;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_daily_portions(text, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.restore_daily_portions(text, uuid, integer) TO service_role;

CREATE OR REPLACE FUNCTION public.cancel_order_with_restore(p_order_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_ledger_count integer := 0;
  v_restored integer := 0;
  r RECORD;
  v_label text;
  v_type text;
  v_id uuid;
  v_table text;
  v_date date;
  v_time time;
BEGIN
  IF NOT public.is_admin_or_staff(auth.uid()) THEN
    RAISE EXCEPTION 'Nincs jogosultság a rendelés lemondásához';
  END IF;

  SELECT * INTO v_order FROM orders WHERE id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A rendelés nem található';
  END IF;

  IF v_order.status = 'cancelled' THEN
    RETURN jsonb_build_object('success', true, 'already_cancelled', true, 'restored', 0);
  END IF;

  SELECT count(*) INTO v_ledger_count FROM order_reservations WHERE order_id = p_order_id;

  -- Legacy orders: derive the ledger from stored order data before restoring.
  IF v_ledger_count = 0 THEN
    FOR r IN
      SELECT oio.label_snapshot AS label, oi.qty AS qty
      FROM order_items oi
      JOIN order_item_options oio ON oio.order_item_id = oi.id
      WHERE oi.order_id = p_order_id
        AND oio.label_snapshot LIKE 'daily_%'
    LOOP
      v_label := r.label;
      v_type := NULL;
      IF v_label LIKE 'daily_complete_menu_%' THEN
        v_table := 'daily_offer_menus';
        v_id := NULLIF(substring(v_label from 'daily_complete_menu_(.*)$'), '')::uuid;
      ELSIF v_label LIKE 'daily_offer_%' THEN
        v_table := 'daily_offers';
        v_id := NULLIF(substring(v_label from 'daily_offer_(.*)$'), '')::uuid;
      ELSIF v_label LIKE 'daily_menu_%' THEN
        v_table := 'daily_menus';
        v_id := NULLIF(substring(v_label from 'daily_menu_(.*)$'), '')::uuid;
      ELSE
        CONTINUE;
      END IF;

      IF v_id IS NULL THEN CONTINUE; END IF;

      INSERT INTO order_reservations (order_id, resource_type, resource_table, resource_id, qty)
      VALUES (p_order_id, 'daily_portions', v_table, v_id, GREATEST(r.qty, 1))
      ON CONFLICT DO NOTHING;
    END LOOP;

    IF v_order.pickup_time IS NOT NULL THEN
      v_date := (v_order.pickup_time AT TIME ZONE 'Europe/Budapest')::date;
      v_time := date_trunc('minute', (v_order.pickup_time AT TIME ZONE 'Europe/Budapest'))::time;
      IF EXISTS (SELECT 1 FROM capacity_slots WHERE date = v_date AND timeslot = v_time) THEN
        INSERT INTO order_reservations (order_id, resource_type, slot_date, slot_time, qty)
        VALUES (p_order_id, 'capacity_slot', v_date, v_time, 1)
        ON CONFLICT DO NOTHING;
      END IF;
    END IF;
  END IF;

  -- Restore every unrestored reservation exactly once.
  FOR r IN
    SELECT * FROM order_reservations
    WHERE order_id = p_order_id AND restored_at IS NULL
    ORDER BY created_at
    FOR UPDATE
  LOOP
    IF r.resource_type = 'daily_portions' AND r.resource_table IS NOT NULL AND r.resource_id IS NOT NULL THEN
      PERFORM public.restore_daily_portions(r.resource_table, r.resource_id, r.qty);
    ELSIF r.resource_type = 'capacity_slot' AND r.slot_date IS NOT NULL AND r.slot_time IS NOT NULL THEN
      UPDATE capacity_slots
        SET booked_orders = GREATEST(0, booked_orders - r.qty)
        WHERE date = r.slot_date AND timeslot = r.slot_time;
    ELSE
      CONTINUE;
    END IF;

    UPDATE order_reservations SET restored_at = now() WHERE id = r.id;
    v_restored := v_restored + 1;
  END LOOP;

  UPDATE orders SET status = 'cancelled' WHERE id = p_order_id;

  RETURN jsonb_build_object(
    'success', true,
    'already_cancelled', false,
    'previous_status', v_order.status,
    'restored', v_restored
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cancel_order_with_restore(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_order_with_restore(uuid) TO authenticated, service_role;
