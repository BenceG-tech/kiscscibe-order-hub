CREATE OR REPLACE FUNCTION public.sync_daily_offer_menu_internal(p_offer_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_offer public.daily_offers%ROWTYPE; v_soups integer; v_mains integer;
BEGIN
 SELECT * INTO v_offer FROM public.daily_offers WHERE id=p_offer_id FOR UPDATE;
 IF NOT FOUND THEN RETURN; END IF;
 SELECT count(*) FILTER (WHERE menu_role='leves'),count(*) FILTER (WHERE menu_role='főétel') INTO v_soups,v_mains FROM public.daily_offer_items WHERE daily_offer_id=p_offer_id AND is_menu_part;
 IF v_soups=1 AND v_mains=1 THEN
 INSERT INTO public.daily_offer_menus(daily_offer_id,menu_price_huf,max_portions,remaining_portions)
 VALUES(p_offer_id,COALESCE(v_offer.price_huf,2200),COALESCE(v_offer.max_portions,30),LEAST(COALESCE(v_offer.remaining_portions,v_offer.max_portions,30),COALESCE(v_offer.max_portions,30)))
 ON CONFLICT(daily_offer_id) DO NOTHING;
 END IF;
END; $$;
REVOKE ALL ON FUNCTION public.sync_daily_offer_menu_internal(uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.sync_daily_offer_menu_internal(uuid) TO service_role;
CREATE OR REPLACE FUNCTION public.sync_daily_offer_menu_trigger()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF TG_OP='DELETE' THEN PERFORM public.sync_daily_offer_menu_internal(OLD.daily_offer_id); RETURN OLD; END IF;
 IF TG_OP='UPDATE' AND OLD.daily_offer_id IS DISTINCT FROM NEW.daily_offer_id THEN
 PERFORM public.sync_daily_offer_menu_internal(OLD.daily_offer_id);
 END IF;
 PERFORM public.sync_daily_offer_menu_internal(NEW.daily_offer_id);
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.sync_daily_offer_menu_trigger() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER sync_daily_offer_menu_after_items AFTER INSERT OR DELETE OR UPDATE OF is_menu_part,menu_role,daily_offer_id ON public.daily_offer_items FOR EACH ROW EXECUTE FUNCTION public.sync_daily_offer_menu_trigger();
CREATE OR REPLACE FUNCTION public.guard_daily_offer_menu_reservation()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN
 IF NEW.remaining_portions < OLD.remaining_portions AND NOT public.validate_menu_composition(NEW.daily_offer_id) THEN
 RAISE EXCEPTION 'A napi menü kijelölése nem teljes: pontosan egy leves és egy főétel szükséges.';
 END IF;
 RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.guard_daily_offer_menu_reservation() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER guard_daily_offer_menu_reservation BEFORE UPDATE OF remaining_portions ON public.daily_offer_menus FOR EACH ROW EXECUTE FUNCTION public.guard_daily_offer_menu_reservation();
CREATE OR REPLACE FUNCTION public.get_daily_data(target_date date)
RETURNS TABLE(offer_id uuid,offer_date date,offer_price_huf integer,offer_note text,offer_max_portions integer,offer_remaining_portions integer,menu_id uuid,menu_price_huf integer,menu_max_portions integer,menu_remaining_portions integer,items jsonb)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE offer_record RECORD; menu_record RECORD; items_json jsonb; is_priv boolean;
BEGIN
 is_priv := public.is_admin_or_staff(auth.uid());
 SELECT * INTO offer_record FROM public.daily_offers WHERE date=target_date AND (is_priv OR is_published=true);
 IF offer_record.id IS NULL THEN RETURN; END IF;
 SELECT * INTO menu_record FROM public.daily_offer_menus WHERE daily_offer_id=offer_record.id AND public.validate_menu_composition(offer_record.id);
 SELECT jsonb_agg(jsonb_build_object('id',doi.id,'item_id',doi.item_id,'is_menu_part',doi.is_menu_part,'menu_role',doi.menu_role,'is_sold_out',doi.is_sold_out,'item_name',mi.name,'item_description',mi.description,'item_price_huf',mi.price_huf,'item_allergens',mi.allergens,'item_image_url',mi.image_url,'item_portion_size',mi.portion_size,'item_portion_unit',mi.portion_unit)) INTO items_json FROM public.daily_offer_items doi LEFT JOIN public.menu_items mi ON doi.item_id=mi.id WHERE doi.daily_offer_id=offer_record.id;
 RETURN QUERY SELECT offer_record.id,offer_record.date,offer_record.price_huf,offer_record.note,offer_record.max_portions,offer_record.remaining_portions,menu_record.id,menu_record.menu_price_huf,menu_record.max_portions,menu_record.remaining_portions,COALESCE(items_json,'[]'::jsonb);
END; $$;