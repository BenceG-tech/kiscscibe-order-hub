-- Create RPC function for unified daily offers and menu data
CREATE OR REPLACE FUNCTION get_daily_data(target_date date)
RETURNS TABLE(
  -- Daily offer basic info
  offer_id uuid,
  offer_date date,
  offer_price_huf integer,
  offer_note text,
  offer_max_portions integer,
  offer_remaining_portions integer,
  
  -- Menu info (if exists)
  menu_id uuid,
  menu_price_huf integer,
  menu_max_portions integer,
  menu_remaining_portions integer,
  
  -- All items for this date
  items jsonb
) 
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  offer_record RECORD;
  menu_record RECORD;
  items_json jsonb;
BEGIN
  -- Get daily offer info
  SELECT * INTO offer_record
  FROM daily_offers 
  WHERE date = target_date;
  
  -- Get menu info if exists
  SELECT * INTO menu_record
  FROM daily_offer_menus 
  WHERE daily_offer_id = offer_record.id;
  
  -- Get all items with menu marking
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', doi.id,
      'item_id', doi.item_id,
      'is_menu_part', doi.is_menu_part,
      'menu_role', doi.menu_role,
      'item_name', mi.name,
      'item_description', mi.description,
      'item_price_huf', mi.price_huf,
      'item_allergens', mi.allergens,
      'item_image_url', mi.image_url
    )
  ) INTO items_json
  FROM daily_offer_items doi
  LEFT JOIN menu_items mi ON doi.item_id = mi.id
  WHERE doi.daily_offer_id = offer_record.id;
  
  -- Return the combined data
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
$$;