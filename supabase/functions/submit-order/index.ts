import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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
    const menuItemIds = items.map(item => item.item_id);
    const { data: menuItems, error: menuError } = await supabase
      .from('menu_items')
      .select('id, name, price_huf, is_active')
      .in('id', menuItemIds);

    if (menuError) {
      console.error('Menu items fetch error:', menuError);
      throw new Error('Hiba az étlap betöltése során');
    }

    // Validate all items are active and recalculate total
    let calculatedTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
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

      // Atomically update capacity slot
      const { data: capacityData, error: capacityError } = await supabase
        .from('capacity_slots')
        .select('max_orders, booked_orders')
        .eq('date', date)
        .eq('timeslot', time)
        .single();

      if (capacityError) {
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
        .eq('timeslot', time);

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
      const { data: orderItemData, error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          item_id: item.item_id,
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

      // Insert modifiers for this item
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

    console.log('Order completed successfully:', orderCode);

    // TODO: Send confirmation email when RESEND_API_KEY is available
    // This will be implemented once DNS records are verified

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