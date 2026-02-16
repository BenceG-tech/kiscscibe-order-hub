import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface OrderModifier {
  label_snapshot: string;
  price_delta_huf: number;
}

interface OrderSide {
  id: string;
  name: string;
  price_huf: number;
}

interface OrderItem {
  item_id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  modifiers: OrderModifier[];
  sides: OrderSide[];
  // Daily item specific fields
  daily_type?: 'offer' | 'menu';
  daily_date?: string;
  daily_id?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email: string;
  notes?: string;
}

interface OrderRequest {
  customer: CustomerInfo;
  payment_method: string;
  pickup_time?: string | null;
  pickup_date?: string | null;
  pickup_time_slot?: string | null;
  items: OrderItem[];
  coupon_code?: string | null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting order submission...`);

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      customer,
      payment_method,
      pickup_time,
      pickup_date,
      pickup_time_slot,
      items,
      coupon_code
    }: OrderRequest = await req.json();

    console.log(`[${requestId}] Processing order for:`, customer.name, 'with', items.length, 'items');

    // Validate required fields
    if (!customer.name || !customer.phone || !customer.email) {
      throw new Error('Hiányzó kötelező adatok');
    }

    if (!items || items.length === 0) {
      throw new Error('Üres kosár');
    }

    // Begin transaction by getting current menu item prices for validation
    const regularItems = items.filter(item => !item.daily_type);
    const dailyItems = items.filter(item => item.daily_type);

    let calculatedTotal = 0;
    const validatedItems: any[] = [];

    // Validate side dish requirements for regular items
    for (const item of regularItems) {
      const { data: sideConfigs, error: sideError } = await supabase
        .from('menu_item_sides')
        .select('is_required, min_select, max_select')
        .eq('main_item_id', item.item_id);

      if (sideError) {
        console.error('Error checking side requirements:', sideError);
        continue;
      }

      if (sideConfigs && sideConfigs.length > 0) {
        const config = sideConfigs[0];
        const itemSides = item.sides || [];
        if (config.is_required && itemSides.length < config.min_select) {
          throw new Error(`${item.name_snapshot} - köret választása kötelező. Legalább ${config.min_select} köretet kell választani.`);
        }
        
        if (itemSides.length > config.max_select) {
          throw new Error(`${item.name_snapshot} - túl sok köret választva. Maximum ${config.max_select} köretet lehet választani.`);
        }
      }
    }

    // Handle regular menu items
    if (regularItems.length > 0) {
      const menuItemIds = regularItems.map(item => item.item_id);
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('id, name, price_huf, is_active')
        .in('id', menuItemIds);

      if (menuError) {
        console.error('Menu items fetch error:', menuError);
        throw new Error('Hiba az étlap betöltése során');
      }

      // Validate regular items
      for (const item of regularItems) {
        const menuItem = menuItems?.find(m => m.id === item.item_id);
        if (!menuItem) {
          throw new Error(`Étel nem található: ${item.name_snapshot}`);
        }
        
        if (!menuItem.is_active) {
          throw new Error(`Étel már nem elérhető: ${menuItem.name}`);
        }

        // Use current price from database (not client-submitted price)
        const currentPrice = menuItem.price_huf;
        
        // Server-side validation of modifier prices (don't trust client)
        let modifiersTotal = 0;
        if (item.modifiers && item.modifiers.length > 0) {
          const { data: modOptions } = await supabase
            .from('item_modifier_options')
            .select('label, price_delta_huf')
            .eq('modifier_id', item.item_id);
          
          const modPriceMap = new Map((modOptions || []).map(m => [m.label, m.price_delta_huf]));
          
          for (const mod of item.modifiers) {
            const serverPrice = modPriceMap.get(mod.label_snapshot);
            modifiersTotal += serverPrice !== undefined ? serverPrice : mod.price_delta_huf;
          }
        }
        
        // Server-side validation of side prices (don't trust client)
        let sidesTotal = 0;
        if (item.sides && item.sides.length > 0) {
          const sideIds = item.sides.map(s => s.id);
          const { data: sideItems } = await supabase
            .from('menu_items')
            .select('id, price_huf')
            .in('id', sideIds);
          
          const sidePriceMap = new Map((sideItems || []).map(s => [s.id, s.price_huf]));
          
          for (const side of item.sides) {
            const serverPrice = sidePriceMap.get(side.id);
            sidesTotal += serverPrice !== undefined ? serverPrice : side.price_huf;
          }
        }
        
        const lineTotal = (currentPrice + modifiersTotal + sidesTotal) * item.qty;
        
        calculatedTotal += lineTotal;
        
        validatedItems.push({
          ...item,
          unit_price_huf: currentPrice, // Use server-side price
          line_total_huf: lineTotal
        });
      }
    }

    // Handle daily items (offers and menus)
    if (dailyItems.length > 0) {
      for (const item of dailyItems) {
        let dailyItemData = null;
        let tableName = '';
        
        if (item.daily_type === 'offer') {
          tableName = 'daily_offers';
        } else if (item.daily_type === 'menu') {
          tableName = 'daily_menus';
        } else if (item.daily_type === 'complete_menu') {
          tableName = 'daily_offer_menus';
        } else {
          throw new Error(`Ismeretlen napi tétel típus: ${item.daily_type}`);
        }

        // Fetch and validate daily item depending on its table
        let currentPrice = 0;
        let remainingPortions = 0;
        let itemDateStr = '';

        if (tableName === 'daily_offer_menus') {
          // First fetch menu record
          const { data: dom, error: domError } = await supabase
            .from('daily_offer_menus')
            .select('id, menu_price_huf, remaining_portions, daily_offer_id')
            .eq('id', item.daily_id)
            .maybeSingle();

          if (domError || !dom) {
            throw new Error(`Napi menü nem található: ${item.name_snapshot}`);
          }

          // Fetch date from parent daily_offers
          const { data: offer, error: offerError } = await supabase
            .from('daily_offers')
            .select('date')
            .eq('id', dom.daily_offer_id)
            .maybeSingle();

          if (offerError || !offer) {
            throw new Error('A napi ajánlat dátuma nem található');
          }

          currentPrice = dom.menu_price_huf;
          remainingPortions = dom.remaining_portions;
          itemDateStr = offer.date as unknown as string;
        } else {
          // daily_offers or daily_menus have price_huf and date columns directly
          const { data: dailyData, error: dailyError } = await supabase
            .from(tableName)
            .select('id, price_huf, remaining_portions, date')
            .eq('id', item.daily_id)
            .maybeSingle();

          if (dailyError || !dailyData) {
            throw new Error(`Napi tétel nem található: ${item.name_snapshot}`);
          }

          currentPrice = (dailyData as any).price_huf;
          remainingPortions = (dailyData as any).remaining_portions;
          itemDateStr = (dailyData as any).date;
        }

        // Check if ordering is still allowed - prevent past dates
        const itemDate = new Date(itemDateStr + 'T00:00:00.000Z');
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (itemDate < today) {
          throw new Error(`Múltbeli dátumra nem lehet rendelni: ${itemDateStr}`);
        }

        if (remainingPortions < item.qty) {
          throw new Error(`Nincs elég adag: ${item.name_snapshot} (maradt: ${remainingPortions})`);
        }

        const lineTotal = currentPrice * item.qty;
        calculatedTotal += lineTotal;

        validatedItems.push({
          ...item,
          unit_price_huf: currentPrice,
          line_total_huf: lineTotal
        });

        // Use race-safe atomic portion update function
        const { data: updateSuccess, error: updateError } = await supabase
          .rpc('update_daily_portions', {
            table_name: tableName,
            daily_id: item.daily_id,
            quantity_needed: item.qty
          });

        if (updateError || !updateSuccess) {
          console.error('Failed to update daily item portions:', updateError);
          throw new Error(updateError?.message || 'Hiba a készlet frissítése során - nincs elég adag');
        }
      }
    }

    // Apply coupon discount if provided
    let discountHuf = 0;
    let appliedCouponCode: string | null = null;

    if (coupon_code) {
      const { data: coupon, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', coupon_code.toUpperCase().trim())
        .eq('is_active', true)
        .maybeSingle();

      if (couponError || !coupon) {
        throw new Error('Érvénytelen kupon kód');
      }

      if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
        throw new Error('Ez a kupon lejárt');
      }

      if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
        throw new Error('Ez a kupon elfogyott');
      }

      if (calculatedTotal < coupon.min_order_huf) {
        throw new Error(`Minimum rendelési érték: ${coupon.min_order_huf} Ft`);
      }

      if (coupon.discount_type === 'percentage') {
        discountHuf = Math.round(calculatedTotal * coupon.discount_value / 100);
      } else {
        discountHuf = Math.min(coupon.discount_value, calculatedTotal);
      }

      appliedCouponCode = coupon.code;
      calculatedTotal -= discountHuf;

      // Increment usage count
      await supabase
        .from('coupons')
        .update({ used_count: coupon.used_count + 1 })
        .eq('id', coupon.id);

      console.log(`Coupon ${coupon.code} applied: -${discountHuf} Ft`);
    }

    console.log('Server-calculated total:', calculatedTotal);

    // Generate order code
    const { data: orderCodeData, error: codeError } = await supabase
      .rpc('gen_order_code');

    if (codeError) {
      console.error('Order code generation error:', codeError);
      throw new Error('Rendeléskód generálási hiba');
    }

    const orderCode = orderCodeData;
    console.log('Generated order code:', orderCode);

    // Handle capacity slot update if pickup_time is specified
    let date: string;
    let time: string;
    
    // Helper function to normalize time string to HH:MM:SS format
    const normalizeTimeString = (timeStr: string): string => {
      if (timeStr.includes(':')) {
        const parts = timeStr.split(':');
        if (parts.length === 2) {
          return `${parts[0]}:${parts[1]}:00`; // Add seconds
        } else if (parts.length === 3) {
          return timeStr; // Already has seconds
        }
      }
      return timeStr;
    };
    
    if (pickup_date && pickup_time_slot) {
      // New format: use date and time strings directly
      date = pickup_date;
      time = normalizeTimeString(pickup_time_slot);
      console.log('Updating capacity for (new format):', date, time);
    } else if (pickup_time) {
      // Legacy format: parse ISO string
      const pickupDate = new Date(pickup_time);
      date = pickupDate.toISOString().split('T')[0];
      time = normalizeTimeString(pickupDate.toTimeString().split(' ')[0].slice(0, 5)); // HH:MM format
      console.log('Updating capacity for (legacy format):', date, time);
    }
    
    if (date && time) {

      // Validate daily items match pickup date
      const dailyItems = validatedItems.filter(item => item.daily_date);
      if (dailyItems.length > 0) {
        const uniqueDailyDates = [...new Set(dailyItems.map(item => item.daily_date))];
        
        // Check for multiple daily dates
        if (uniqueDailyDates.length > 1) {
          throw new Error('Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre');
        }
        
        // Check daily item date matches pickup date
        const dailyDate = uniqueDailyDates[0];
        if (dailyDate !== date) {
          throw new Error(`A napi ajánlat/menü csak ${dailyDate} dátumra rendelhető, de ${date} dátumra próbálta leadni`);
        }
      }

      // Atomically update capacity slot or create if it doesn't exist
      let { data: capacityData, error: capacityError } = await supabase
        .from('capacity_slots')
        .select('max_orders, booked_orders')
        .eq('date', date)
        .eq('timeslot', time)
        .single();

      // If capacity slot doesn't exist, try to create it
      if (capacityError && capacityError.code === 'PGRST116') {
        console.log('Capacity slot not found, creating fallback slot for:', date, time);
        
        // Validate business hours before creating
        const slotDate = new Date(date + 'T00:00:00'); // Local date parsing
        const dayOfWeek = slotDate.getDay();
        const [hours, minutes] = time.split(':').map(Number);
        
        console.log(`Validating business hours: date=${date}, time=${time}, dayOfWeek=${dayOfWeek}, hours=${hours}`);
        
        // Business hours: H-P 7:00-16:00, Szo-V Zárva
        // Check if it's weekend (Saturday=6 or Sunday=0) - closed
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          console.error(`Rejected: Weekend is closed (dayOfWeek=${dayOfWeek})`);
          throw new Error('Hétvégén zárva tartunk');
        }
        
        // Check business hours: Monday-Friday 7:00-16:00
        let isValidTime = false;
        if (dayOfWeek >= 1 && dayOfWeek <= 5) {
          isValidTime = hours >= 7 && hours < 16;
          console.log(`Weekday hours check: ${hours} >= 7 && ${hours} < 16 = ${isValidTime}`);
        }
        
        if (!isValidTime) {
          console.error(`[${requestId}] Rejected: Invalid business hours for dayOfWeek=${dayOfWeek}, hours=${hours}`);
          throw new Error('A kiválasztott időpont nyitvatartási időn kívül esik');
        }
        
        console.log('Business hours validation passed');
        
        // Create the capacity slot
        const { data: newCapacityData, error: createError } = await supabase
          .from('capacity_slots')
          .insert({
            date,
            timeslot: time, // Already normalized to HH:MM:SS
            max_orders: 8,
            booked_orders: 0
          })
          .select('max_orders, booked_orders')
          .single();
        
        if (createError) {
          console.error('Capacity slot creation error:', createError);
          throw new Error('Hiba az időpont létrehozásakor');
        }
        
        capacityData = newCapacityData;
      } else if (capacityError) {
        console.error('Capacity check error:', capacityError);
        throw new Error('Időpont nem elérhető');
      }

      // Race-safe atomic capacity slot update
      const { data: slotUpdateSuccess, error: slotUpdateError } = await supabase
        .rpc('update_capacity_slot', {
          slot_date: date,
          slot_time: time,
          qty: 1
        });

      if (slotUpdateError) {
        console.error('Capacity update error:', slotUpdateError);
        throw new Error(slotUpdateError.message || 'Hiba az időpont foglalása során');
      }
      
      if (!slotUpdateSuccess) {
        // Slot didn't exist - this shouldn't happen since we just created/fetched it
        throw new Error('Az időpont nem elérhető');
      }
    }

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        code: orderCode,
        name: customer.name,
        phone: customer.phone,
        email: customer.email || null,
        total_huf: calculatedTotal,
        status: 'new',
        payment_method,
        pickup_time: pickup_time || (date && time ? new Date(`${date}T${time.slice(0, 5)}`).toISOString() : null),
        notes: customer.notes || null,
        coupon_code: appliedCouponCode,
        discount_huf: discountHuf,
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw new Error('Rendelés mentési hiba');
    }

    const orderId = orderData.id;
    console.log('Created order:', orderId);

    // Record coupon usage
    if (appliedCouponCode && discountHuf > 0) {
      const { data: couponData } = await supabase
        .from('coupons')
        .select('id')
        .eq('code', appliedCouponCode)
        .single();

      if (couponData) {
        await supabase.from('coupon_usages').insert({
          coupon_id: couponData.id,
          order_id: orderId,
          discount_huf: discountHuf,
        });
      }
    }

    // Insert order items
    for (const item of validatedItems) {
      // For regular items, use existing item_id mapping
      const { data: orderItemData, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          item_id: item.daily_type ? null : item.item_id, // null for daily items
          name_snapshot: item.name_snapshot,
          qty: item.qty,
          unit_price_huf: item.unit_price_huf,
          line_total_huf: item.line_total_huf
        })
        .select('id')
        .single();

      if (itemError) {
        console.error('Order item insert error:', itemError);
        throw new Error('Rendelési tétel mentési hiba');
      }

      // Store daily item metadata if applicable
      if (item.daily_type && item.daily_id) {
        const { error: dailyError } = await supabase
          .from('order_item_options')
          .insert({
            order_item_id: orderItemData.id,
            label_snapshot: `daily_${item.daily_type}_${item.daily_id}`,
            price_delta_huf: 0,
            option_type: 'daily_meta'
          });
        
        if (dailyError) {
          console.error('Daily item metadata insert error:', dailyError);
          // Don't fail the whole order for metadata errors
        }
      }

      // Insert modifiers and sides for this item (only for regular items)
      if (!item.daily_type) {
        for (const modifier of item.modifiers) {
          const { error: modError } = await supabase
            .from('order_item_options')
            .insert({
              order_item_id: orderItemData.id,
              label_snapshot: modifier.label_snapshot,
              price_delta_huf: modifier.price_delta_huf,
              option_type: 'modifier'
            });

          if (modError) {
            console.error('Modifier insert error:', modError);
            // Don't fail the whole order for modifier errors
          }
        }

        for (const side of item.sides) {
          const { error: sideError } = await supabase
            .from('order_item_options')
            .insert({
              order_item_id: orderItemData.id,
              label_snapshot: `Köret: ${side.name}`,
              price_delta_huf: side.price_huf,
              option_type: 'side',
              side_item_id: side.id
            });

          if (sideError) {
            console.error('Side insert error:', sideError);
            // Don't fail the whole order for side errors
          }
        }
      }
    }

    console.log('Order completed successfully:', orderCode);

    // === LOYALTY SYSTEM ===
    let loyaltyReward = null;
    try {
      // Upsert customer loyalty record
      const { data: existingLoyalty } = await supabase
        .from('customer_loyalty')
        .select('*')
        .eq('phone', customer.phone)
        .maybeSingle();

      let newOrderCount = 1;
      if (existingLoyalty) {
        newOrderCount = existingLoyalty.order_count + 1;
        await supabase
          .from('customer_loyalty')
          .update({
            order_count: newOrderCount,
            total_spent_huf: existingLoyalty.total_spent_huf + calculatedTotal,
            email: customer.email || existingLoyalty.email,
            last_order_at: new Date().toISOString(),
            current_tier: newOrderCount >= 20 ? 'gold' : newOrderCount >= 10 ? 'silver' : 'bronze',
          })
          .eq('phone', customer.phone);
      } else {
        await supabase
          .from('customer_loyalty')
          .insert({
            phone: customer.phone,
            email: customer.email || null,
            order_count: 1,
            total_spent_huf: calculatedTotal,
            last_order_at: new Date().toISOString(),
          });
      }

      // Check milestones
      const milestones: Record<number, { type: string; value: number }> = {
        5: { type: 'percentage', value: 5 },
        10: { type: 'percentage', value: 10 },
        20: { type: 'fixed', value: 500 },
      };

      // Also every 10th order after 20
      let milestone = milestones[newOrderCount];
      if (!milestone && newOrderCount > 20 && newOrderCount % 10 === 0) {
        milestone = { type: 'percentage', value: 5 };
      }

      if (milestone) {
        // Generate coupon code
        const couponCode = `HUSEG${newOrderCount}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        
        // Create coupon
        await supabase.from('coupons').insert({
          code: couponCode,
          discount_type: milestone.type,
          discount_value: milestone.value,
          is_active: true,
          min_order_huf: 0,
          max_uses: 1,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(), // 90 days
        });

        // Record reward
        await supabase.from('loyalty_rewards').insert({
          phone: customer.phone,
          reward_type: milestone.type === 'percentage' ? 'percentage_discount' : 'fixed_discount',
          reward_value: milestone.value,
          coupon_code: couponCode,
          triggered_at_order_count: newOrderCount,
        });

        loyaltyReward = {
          coupon_code: couponCode,
          discount_type: milestone.type,
          discount_value: milestone.value,
          order_count: newOrderCount,
        };

        console.log(`Loyalty reward generated: ${couponCode} for order #${newOrderCount}`);
      }
    } catch (loyaltyError) {
      console.error('Loyalty system error (non-fatal):', loyaltyError);
      // Don't fail the order for loyalty errors
    }

    // Initialize Resend client
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send confirmation email to customer
    try {
      console.log(`[${requestId}] Preparing confirmation email for ${customer.email}`);
      
      const itemsHtml = validatedItems.map(item => {
        const modifiersHtml = item.modifiers.length > 0 
          ? `<br><small style="color: #666;">+ ${item.modifiers.map(mod => mod.label_snapshot).join(', ')}</small>`
          : '';
        
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <strong>${item.name_snapshot}</strong> × ${item.qty}${modifiersHtml}
            </td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
              ${item.line_total_huf.toLocaleString()} Ft
            </td>
          </tr>
        `;
      }).join('');

      const loyaltyHtml = loyaltyReward ? `
        <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 8px; font-size: 18px;">🎉 Köszönjük a hűségedet!</p>
          <p style="margin: 0 0 8px; font-size: 14px;">Ez a ${loyaltyReward.order_count}. rendelésed!</p>
          <p style="margin: 0; font-size: 20px; font-weight: bold; color: #d97706;">
            Kuponod: ${loyaltyReward.coupon_code}
          </p>
          <p style="margin: 4px 0 0; font-size: 14px; color: #666;">
            ${loyaltyReward.discount_type === 'percentage' ? `${loyaltyReward.discount_value}% kedvezmény` : `${loyaltyReward.discount_value} Ft kedvezmény`} a következő rendelésedből!
          </p>
        </div>
      ` : '';

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Kiscsibe – Rendelés visszaigazolás</h2>
          <p>Kedves ${customer.name}!</p>
          <p>Köszönjük rendelését! Az alábbi részletekkel rögzítettük:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Rendelés részletei</h3>
            <p><strong>Rendelés kód:</strong> ${orderCode}</p>
            <p><strong>Telefonszám:</strong> ${customer.phone}</p>
            ${date && time ? `<p><strong>Átvétel:</strong> ${date} ${time}</p>` : '<p><strong>Átvétel:</strong> Amilyen hamar lehet</p>'}
            <p><strong>Fizetés:</strong> ${payment_method === 'cash' ? 'Készpénz' : 'Kártya'}</p>
            ${customer.notes ? `<p><strong>Megjegyzés:</strong> ${customer.notes}</p>` : ''}
          </div>

          <h3>Rendelt termékek</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${itemsHtml}
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td style="padding: 12px; border-top: 2px solid #333;">Összesen</td>
              <td style="padding: 12px; border-top: 2px solid #333; text-align: right;">${calculatedTotal.toLocaleString()} Ft</td>
            </tr>
          </table>

          ${loyaltyHtml}

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0 0 4px 0;"><strong>Kiscsibe Reggeliző & Étterem</strong></p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #555;">📍 1141 Budapest, Vezér u. 110.</p>
            <p style="margin: 0 0 4px 0; font-size: 14px; color: #555;">🕐 H–P: 7:00–15:00 | Szo: 8:00–14:00 | V: Zárva</p>
            <p style="margin: 0; font-size: 14px;">
              <a href="https://www.facebook.com/kiscsibeetteremXIV" style="color: #1877F2; text-decoration: none;">📘 Facebook</a>
            </p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Köszönjük, hogy minket választott! 💛
          </p>
        </div>
      `;

      const emailText = `
        Kiscsibe – Rendelés visszaigazolás

        Kedves ${customer.name}!

        Köszönjük rendelését! Az alábbi részletekkel rögzítettük:

        Rendelés kód: ${orderCode}
        Telefonszám: ${customer.phone}
        ${pickup_time ? `Átvétel: ${new Date(pickup_time).toLocaleString('hu-HU')}` : 'Átvétel: Amilyen hamar lehet'}
        Fizetés: ${payment_method === 'cash' ? 'Készpénz' : 'Kártya'}
        ${customer.notes ? `Megjegyzés: ${customer.notes}` : ''}

        Rendelt termékek:
        ${validatedItems.map(item => `- ${item.name_snapshot} × ${item.qty}: ${item.line_total_huf.toLocaleString()} Ft${item.modifiers.length > 0 ? ` (+ ${item.modifiers.map(mod => mod.label_snapshot).join(', ')})` : ''}`).join('\n')}

        Összesen: ${calculatedTotal.toLocaleString()} Ft
        ${loyaltyReward ? `\nHűségkupon: ${loyaltyReward.coupon_code} (${loyaltyReward.discount_type === 'percentage' ? `${loyaltyReward.discount_value}%` : `${loyaltyReward.discount_value} Ft`} kedvezmény)` : ''}

        Kiscsibe Reggeliző & Étterem
        1141 Budapest, Vezér u. 110.
        H–P: 7:00–15:00 | Szo: 8:00–14:00 | V: Zárva
        Facebook: https://www.facebook.com/kiscsibeetteremXIV
        Köszönjük, hogy minket választott! 💛
      `;

      await resend.emails.send({
        from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
        to: [customer.email],
        bcc: ['kiscsibeetterem@gmail.com', 'gataibence@gmail.com'], // Admin copies
        subject: `Kiscsibe – rendelés visszaigazolás #${orderCode}`,
        html: emailHtml,
        text: emailText,
      });

      console.log(`[${requestId}] Confirmation email sent to:`, customer.email);
    } catch (emailError) {
      console.error(`[${requestId}] Email sending failed:`, emailError);
      // Don't fail the order if email sending fails
    }

    console.log(`[${requestId}] Order completed successfully:`, orderCode);
    
    return new Response(
      JSON.stringify({
        success: true,
        order_code: orderCode,
        total_huf: calculatedTotal,
        request_id: requestId,
        loyalty_reward: loyaltyReward,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error(`[${requestId}] Submit order error:`, error);
    
    // Determine appropriate HTTP status code based on error type
    let statusCode = 400;
    if (error.message.includes('betelt') || error.message.includes('elfogyott')) {
      statusCode = 409; // Conflict
    } else if (error.message.includes('nyitvatartási') || error.message.includes('múltbeli')) {
      statusCode = 400; // Bad Request
    } else if (error.message.includes('nem található')) {
      statusCode = 404; // Not Found
    } else if (error.message.includes('Ismeretlen hiba')) {
      statusCode = 500; // Internal Server Error
    }
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Ismeretlen hiba történt',
        request_id: requestId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: statusCode,
      }
    );
  }
});