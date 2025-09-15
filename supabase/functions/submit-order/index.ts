import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrderModifier {
  label_snapshot: string;
  price_delta_huf: number;
}

interface OrderItem {
  item_id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  modifiers: OrderModifier[];
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
  pickup_time?: string;
  items: OrderItem[];
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      customer,
      payment_method,
      pickup_time,
      items
    }: OrderRequest = await req.json();

    console.log('Processing order for:', customer.name, 'with', items.length, 'items');

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
        const modifiersTotal = item.modifiers.reduce((sum, mod) => sum + mod.price_delta_huf, 0);
        const lineTotal = (currentPrice + modifiersTotal) * item.qty;
        
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
          // Complete menu orders use the daily_offer_menus table
          tableName = 'daily_offer_menus';
        } else {
          throw new Error(`Ismeretlen napi tétel típus: ${item.daily_type}`);
        }

        // Check if daily item exists and has available portions
        let dailyData, dailyError;
        
        if (item.daily_type === 'complete_menu') {
          // For complete menus, use menu_id and get associated offer date
          const { data: menuData, error: menuErr } = await supabase
            .from('daily_offer_menus')
            .select(`
              id, 
              menu_price_huf, 
              remaining_portions,
              daily_offers!inner(date)
            `)
            .eq('id', item.menu_id || item.daily_id)
            .single();
          
          if (menuErr || !menuData) {
            throw new Error(`Napi menü nem található: ${item.name_snapshot}`);
          }
          
          dailyData = {
            id: menuData.id,
            price_huf: menuData.menu_price_huf,
            remaining_portions: menuData.remaining_portions,
            date: menuData.daily_offers.date
          };
          dailyError = null;
        } else {
          const result = await supabase
            .from(tableName)
            .select('id, price_huf, remaining_portions, date')
            .eq('id', item.daily_id)
            .single();
          
          dailyData = result.data;
          dailyError = result.error;
        }

        if (dailyError || !dailyData) {
          throw new Error(`Napi tétel nem található: ${item.name_snapshot}`);
        }

        // Check if ordering is still allowed - prevent past dates
        const itemDate = new Date(dailyData.date + 'T00:00:00.000Z');
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time to start of day for comparison
        
        // Reject if trying to order for a past date
        if (itemDate < today) {
          throw new Error(`Múltbeli dátumra nem lehet rendelni: ${dailyData.date}`);
        }

        if (dailyData.remaining_portions < item.qty) {
          throw new Error(`Nincs elég adag: ${item.name_snapshot} (maradt: ${dailyData.remaining_portions})`);
        }

        // Use current price from database
        const currentPrice = dailyData.price_huf;
        const lineTotal = currentPrice * item.qty;
        
        calculatedTotal += lineTotal;
        
        validatedItems.push({
          ...item,
          unit_price_huf: currentPrice,
          line_total_huf: lineTotal
        });

        // Use race-safe atomic portion update function
        let updateSuccess, updateError;
        
        if (item.daily_type === 'complete_menu') {
          // For complete menus, update daily_offer_menus table
          const { data: success, error: err } = await supabase
            .rpc('update_daily_portions', {
              table_name: 'daily_offer_menus',
              daily_id: item.menu_id || item.daily_id,
              quantity_needed: item.qty
            });
          updateSuccess = success;
          updateError = err;
        } else {
          const { data: success, error: err } = await supabase
            .rpc('update_daily_portions', {
              table_name: tableName,
              daily_id: item.daily_id,
              quantity_needed: item.qty
            });
          updateSuccess = success;
          updateError = err;
        }

        if (updateError || !updateSuccess) {
          console.error('Failed to update daily item portions:', updateError);
          throw new Error(updateError?.message || 'Hiba a készlet frissítése során - nincs elég adag');
        }
      }
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
    if (pickup_time) {
      const pickupDate = new Date(pickup_time);
      const date = pickupDate.toISOString().split('T')[0];
      const time = pickupDate.toTimeString().split(' ')[0].slice(0, 5); // HH:MM format

      console.log('Updating capacity for:', date, time);

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
        const slotDate = new Date(date);
        const dayOfWeek = slotDate.getDay();
        const [hours, minutes] = time.split(':').map(Number);
        
        // Check if it's Sunday (closed)
        if (dayOfWeek === 0) {
          throw new Error('Vasárnap zárva tartunk');
        }
        
        // Check business hours
        let isValidTime = false;
        if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
          isValidTime = hours >= 7 && hours < 15;
        } else if (dayOfWeek === 6) { // Saturday
          isValidTime = hours >= 8 && hours < 14;
        }
        
        if (!isValidTime) {
          throw new Error('A kiválasztott időpont nyitvatartási időn kívül esik');
        }
        
        // Create the capacity slot
        const { data: newCapacityData, error: createError } = await supabase
          .from('capacity_slots')
          .insert({
            date,
            timeslot: `${time}:00`, // Add seconds
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

      if (capacityData.booked_orders >= capacityData.max_orders) {
        throw new Error('Az időpont közben betelt. Kérjük válasszon másikat.');
      }

      // Update booked orders count
      const { error: updateError } = await supabase
        .from('capacity_slots')
        .update({ 
          booked_orders: capacityData.booked_orders + 1 
        })
        .eq('date', date)
        .eq('timeslot', `${time}:00`); // Add seconds for consistency

      if (updateError) {
        console.error('Capacity update error:', updateError);
        throw new Error('Hiba az időpont foglalása során');
      }
    }

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        code: orderCode,
        name: customer.name,
        phone: customer.phone,
        total_huf: calculatedTotal,
        status: 'new',
        payment_method,
        pickup_time: pickup_time || null,
        notes: customer.notes || null
      })
      .select('id')
      .single();

    if (orderError) {
      console.error('Order insert error:', orderError);
      throw new Error('Rendelés mentési hiba');
    }

    const orderId = orderData.id;
    console.log('Created order:', orderId);

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
            price_delta_huf: 0
          });
        
        if (dailyError) {
          console.error('Daily item metadata insert error:', dailyError);
          // Don't fail the whole order for metadata errors
        }
      }

      // Insert modifiers for this item (only for regular items)
      if (!item.daily_type) {
        for (const modifier of item.modifiers) {
          const { error: modError } = await supabase
            .from('order_item_options')
            .insert({
              order_item_id: orderItemData.id,
              label_snapshot: modifier.label_snapshot,
              price_delta_huf: modifier.price_delta_huf
            });

          if (modError) {
            console.error('Modifier insert error:', modError);
            // Don't fail the whole order for modifier errors
          }
        }
      }
    }

    console.log('Order completed successfully:', orderCode);

    // Initialize Resend client
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    // Send confirmation email to customer
    try {
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

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Kiscsibe – Rendelés visszaigazolás</h2>
          <p>Kedves ${customer.name}!</p>
          <p>Köszönjük rendelését! Az alábbi részletekkel rögzítettük:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Rendelés részletei</h3>
            <p><strong>Rendelés kód:</strong> ${orderCode}</p>
            <p><strong>Telefonszám:</strong> ${customer.phone}</p>
            ${pickup_time ? `<p><strong>Átvétel:</strong> ${new Date(pickup_time).toLocaleString('hu-HU')}</p>` : '<p><strong>Átvétel:</strong> Amilyen hamar lehet</p>'}
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

          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0;"><strong>Kiscsibe Étterem</strong></p>
            <p style="margin: 5px 0;">📍 1234 Budapest, Példa utca 12.</p>
            <p style="margin: 5px 0;">📞 +36 1 234 5678</p>
            <p style="margin: 5px 0;">🕒 Hétfő-Vasárnap: 11:00-22:00</p>
          </div>

          <p style="color: #666; font-size: 14px;">
            Kérdés esetén hívjon minket a fenti telefonszámon!<br>
            Köszönjük, hogy minket választott!
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

        Kiscsibe Étterem
        1234 Budapest, Példa utca 12.
        +36 1 234 5678
        Hétfő-Vasárnap: 11:00-22:00

        Kérdés esetén hívjon minket!
        Köszönjük, hogy minket választott!
      `;

      await resend.emails.send({
        from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
        to: [customer.email],
        bcc: ['kiscsibeetterem@gmail.com'], // Admin copy
        subject: `Kiscsibe – rendelés visszaigazolás #${orderCode}`,
        html: emailHtml,
        text: emailText,
      });

      console.log('Confirmation email sent to:', customer.email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Don't fail the order if email sending fails
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_code: orderCode,
        total_huf: calculatedTotal
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Submit order error:', error);
    
    return new Response(
      JSON.stringify({
        error: error.message || 'Ismeretlen hiba történt'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});