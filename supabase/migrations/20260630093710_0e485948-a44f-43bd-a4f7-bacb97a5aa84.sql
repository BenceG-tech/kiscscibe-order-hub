
ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS portion_size numeric,
  ADD COLUMN IF NOT EXISTS portion_unit text;

ALTER TABLE public.menu_items
  DROP CONSTRAINT IF EXISTS menu_items_portion_unit_check;

ALTER TABLE public.menu_items
  ADD CONSTRAINT menu_items_portion_unit_check
  CHECK (portion_unit IS NULL OR portion_unit IN ('dkg','db','g','ml'));

CREATE OR REPLACE FUNCTION public.get_daily_data(target_date date)
 RETURNS TABLE(offer_id uuid, offer_date date, offer_price_huf integer, offer_note text, offer_max_portions integer, offer_remaining_portions integer, menu_id uuid, menu_price_huf integer, menu_max_portions integer, menu_remaining_portions integer, items jsonb)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  offer_record RECORD;
  menu_record RECORD;
  items_json jsonb;
  is_priv boolean;
BEGIN
  is_priv := public.is_admin_or_staff(auth.uid());

  SELECT * INTO offer_record
  FROM daily_offers 
  WHERE date = target_date
    AND (is_priv OR is_published = true);

  IF offer_record.id IS NULL THEN
    RETURN;
  END IF;
  
  SELECT * INTO menu_record
  FROM daily_offer_menus 
  WHERE daily_offer_id = offer_record.id;
  
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', doi.id,
      'item_id', doi.item_id,
      'is_menu_part', doi.is_menu_part,
      'menu_role', doi.menu_role,
      'is_sold_out', doi.is_sold_out,
      'item_name', mi.name,
      'item_description', mi.description,
      'item_price_huf', mi.price_huf,
      'item_allergens', mi.allergens,
      'item_image_url', mi.image_url,
      'item_portion_size', mi.portion_size,
      'item_portion_unit', mi.portion_unit
    )
  ) INTO items_json
  FROM daily_offer_items doi
  LEFT JOIN menu_items mi ON doi.item_id = mi.id
  WHERE doi.daily_offer_id = offer_record.id;
  
  RETURN QUERY SELECT
    offer_record.id,
    offer_record.date,
    offer_record.price_huf,
    offer_record.note,
    offer_record.max_portions,
    offer_record.remaining_portions,
    menu_record.id,
    menu_record.menu_price_huf,
    menu_record.max_portions,
    menu_record.remaining_portions,
    COALESCE(items_json, '[]'::jsonb);
END;
$function$;
