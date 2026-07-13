import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Interpret a YYYY-MM-DD HH:mm wall-clock time as Europe/Budapest and return its UTC ISO string.
function budapestWallTimeToUtcIso(date: string, time: string): string {
  const naive = new Date(`${date}T${time}:00Z`);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Budapest',
    timeZoneName: 'longOffset',
  });
  const parts = dtf.formatToParts(naive);
  const offsetPart = parts.find((p) => p.type === 'timeZoneName')?.value || 'GMT+01:00';
  const m = offsetPart.match(/GMT([+-])(\d{2}):?(\d{2})?/);
  const sign = m && m[1] === '-' ? -1 : 1;
  const hh = m ? parseInt(m[2], 10) : 0;
  const mm = m && m[3] ? parseInt(m[3], 10) : 0;
  const offsetMin = sign * (hh * 60 + mm);
  return new Date(naive.getTime() - offsetMin * 60_000).toISOString();
}

// Return the date (YYYY-MM-DD) and time (HH:MM) in Europe/Budapest for a given Date (or now).
function getBudapestParts(d: Date = new Date()): { date: string; time: string } {
  const dateFmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const timeFmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return { date: dateFmt.format(d), time: timeFmt.format(d) };
}

// Day-of-week in Europe/Budapest (0=Sun..6=Sat)
function budapestDayOfWeek(dateStr: string): number {
  // dateStr = YYYY-MM-DD, interpreted as a local Budapest date (no tz shift risk)
  const [y, mo, da] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, mo - 1, da)).getUTCDay();
}

// ─── Opening-hours business rules (single source of truth for backend) ───
// Mon–Fri only, weekends closed.
//   Breakfast pickup window: 07:00 – 10:00
//   Lunch pickup window:     10:30 – 16:00
//   Same-day order cutoff:   15:30 (after which "today" is not accepted)
const BREAKFAST_START_MIN = 7 * 60;
const BREAKFAST_END_MIN = 10 * 60;
const LUNCH_START_MIN = 10 * 60 + 30;
const LUNCH_END_MIN = 16 * 60;
const TODAY_ORDER_CUTOFF_MIN = 15 * 60 + 30;

function isWithinPickupWindow(dateStr: string, timeStr: string, isBreakfastOnly: boolean): boolean {
  const dow = budapestDayOfWeek(dateStr);
  if (dow === 0 || dow === 6) return false;
  const [hours, minutes] = timeStr.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  if (isBreakfastOnly) {
    return totalMinutes >= BREAKFAST_START_MIN && totalMinutes <= BREAKFAST_END_MIN;
  }
  return totalMinutes >= LUNCH_START_MIN && totalMinutes <= LUNCH_END_MIN;
}

// Kept for backwards compatibility with existing callsites
function isBudapestLunchWindow(dateStr: string, timeStr: string): boolean {
  return isWithinPickupWindow(dateStr, timeStr, false);
}

// Normalize any Hungarian phone input to canonical "+36XXXXXXXXX" (9 digits after +36).
// Accepts: "06 30 …", "+36 30 …", "3630…", "0036…", spaces, dashes, etc.
// Returns the original trimmed string if it doesn't look like a HU number so we don't
// silently corrupt legitimate international numbers.
function normalizeHungarianPhoneServer(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  let digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0036')) digits = digits.slice(4);
  else if (digits.startsWith('36') && digits.length >= 10) digits = digits.slice(2);
  if (digits.startsWith('06')) digits = digits.slice(2);
  else if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length >= 8 && digits.length <= 9) return `+36${digits}`;
  return trimmed;
}

// Whitelist payment_method against orders_payment_method_check to avoid silent 23514 failures.
function normalizePaymentMethod(raw: string | null | undefined): string {
  const v = String(raw || '').toLowerCase().trim();
  if (v === 'cash') return 'cash';
  if (v === 'pos' || v === 'card' || v === 'terminal' || v === 'bankkartya') return 'pos';
  if (v === 'card_online' || v === 'online' || v === 'stripe') return 'card_online';
  // Anything unknown → safest default: cash (customer pays on pickup).
  return 'cash';
}


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
  daily_type?: 'offer' | 'menu' | 'complete_menu';
  daily_date?: string;
  daily_id?: string;
}

interface CustomerInfo {
  name: string;
  phone: string;
  email?: string | null;
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
  session_id?: string | null;
  // Optional 15-min bucket sent by the client so retries of the SAME customer
  // intent (network error/timeout) collapse into a single order via the
  // idempotency_key unique index. Missing → server derives its own bucket.
  idempotency_bucket?: number | null;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  console.log(`[${requestId}] Starting order submission...`);

  // Hoisted so the catch block can log a failed attempt with full context
  let attemptCtx: {
    supabase: any | null;
    customer: CustomerInfo | null;
    items: OrderItem[];
    payment_method: string | null;
    pickup_date: string | null;
    pickup_time_slot: string | null;
    session_id: string | null;
    userAgent: string;
  } = {
    supabase: null,
    customer: null,
    items: [],
    payment_method: null,
    pickup_date: null,
    pickup_time_slot: null,
    session_id: null,
    userAgent: req.headers.get('user-agent') || '',
  };

  // Rollback safety net: registered compensations run in reverse order if any step after
  // capacity/portion mutations throws. Prevents "ghost" bookings when the final INSERT fails.
  const compensations: Array<() => Promise<void>> = [];

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    attemptCtx.supabase = supabase;


    const {
      customer,
      payment_method,
      pickup_time,
      pickup_date,
      pickup_time_slot,
      items,
      coupon_code,
      session_id,
    }: OrderRequest = await req.json();

    // Backward-compat + safety net: whitelist payment_method so we never bounce off the check constraint.
    const payment_method_final = normalizePaymentMethod(payment_method);
    if (payment_method_final !== payment_method) {
      console.warn(`[${requestId}] payment_method normalized: '${payment_method}' → '${payment_method_final}'`);
    }

    // Server-side phone normalization → single canonical form.
    // Keeps idempotency, loyalty and admin views consistent no matter what shape the client sent.
    if (customer && typeof customer.phone === 'string') {
      const normalized = normalizeHungarianPhoneServer(customer.phone);
      if (normalized !== customer.phone) {
        console.log(`[${requestId}] phone normalized: '${customer.phone}' → '${normalized}'`);
        customer.phone = normalized;
      }
    }

    attemptCtx.customer = customer;
    attemptCtx.items = items || [];
    attemptCtx.payment_method = payment_method_final;
    attemptCtx.pickup_date = pickup_date || null;
    attemptCtx.pickup_time_slot = pickup_time_slot || null;
    attemptCtx.session_id = session_id || null;

    // === Server-side "attempted submission" beacon ===
    // Write to abandoned_carts using the service role IMMEDIATELY so we have a durable record
    // even if the client-side x-session-id header is stripped by a CDN/proxy, or the browser
    // crashes mid-request. This is our source-of-truth "someone tried to order" signal.
    if (session_id) {
      try {
        await supabase.from('abandoned_carts').upsert({
          session_id,
          customer_name: customer?.name || null,
          customer_phone: customer?.phone || null,
          customer_email: customer?.email || null,
          cart_snapshot: {
            items: items || [],
            diagnostic: {
              step: 'submit_attempt',
              source: 'edge_function',
              request_id: requestId,
              recorded_at: new Date().toISOString(),
            },
          },
          total_huf: (items || []).reduce((s: number, it: any) => s + (Number(it?.qty) || 0) * (Number(it?.unit_price_huf) || 0), 0),
          step: 'submit_attempt',
          user_agent: attemptCtx.userAgent,
          last_activity_at: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      } catch (e) {
        console.warn(`[${requestId}] Server-side submit_attempt beacon failed (non-fatal):`, e);
      }
    }



    // ── Idempotency: dedupe network retries / double-clicks within a 5-minute window.
    //    Key = session_id + phone + items shape. A fresh session_id (issued per Checkout mount)
    //    lets the same customer legitimately place a second identical order later.
    let idempotency_key: string | null = null;
    if (session_id && customer?.phone && Array.isArray(items)) {
      const totalQty = items.reduce((s, it) => s + (Number(it?.qty) || 0), 0);
      idempotency_key = `${session_id}|${customer.phone}|${items.length}|${totalQty}|${pickup_date || ''}|${pickup_time_slot || ''}`.slice(0, 255);
      try {
        const { data: existing } = await supabase
          .from('orders')
          .select('id, code, total_huf')
          .eq('idempotency_key', idempotency_key)
          .gt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString())
          .maybeSingle();
        if (existing) {
          console.warn(`[${requestId}] Duplicate submission detected — returning existing order ${existing.code}`);
          return new Response(
            JSON.stringify({
              success: true,
              order_code: existing.code,
              total_huf: existing.total_huf,
              request_id: requestId,
              loyalty_reward: null,
              duplicate: true,
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
          );
        }
      } catch (e) {
        console.warn(`[${requestId}] Idempotency pre-check failed (non-fatal):`, e);
      }
    }

    console.log(`[${requestId}] Processing order for:`, customer.name, 'with', items.length, 'items');

    // Validate required fields
    if (!customer.name || !customer.phone) {
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

    const validatedDailyDates = new Set<string>();

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

          // Fallback: if the daily offer/menu has no price set in DB, accept the
          // client-submitted unit price (validated to a sane range) so the order
          // does not fail with a not-null violation downstream.
          if (currentPrice === null || currentPrice === undefined) {
            const clientPrice = Number(item.unit_price_huf);
            if (Number.isFinite(clientPrice) && clientPrice > 0 && clientPrice <= 10000) {
              console.warn(`Daily ${tableName} ${item.daily_id} has NULL price_huf — falling back to client price ${clientPrice}.`);
              currentPrice = clientPrice;
            } else {
              throw new Error('A napi ajánlat ára nincs beállítva — kérjük értesítse az éttermet.');
            }
          }
        }

        // Check if ordering is still allowed - prevent past dates (Budapest local date, string compare)
        const todayBudapest = getBudapestParts().date;
        if (itemDateStr < todayBudapest) {
          throw new Error(`Múltbeli dátumra nem lehet rendelni: ${itemDateStr}`);
        }

        validatedDailyDates.add(itemDateStr);

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

        // Register rollback for this portion decrement
        const tblForRollback = tableName;
        const idForRollback = item.daily_id!;
        const qtyForRollback = item.qty;
        compensations.push(async () => {
          try {
            const { data: cur } = await supabase
              .from(tblForRollback)
              .select('remaining_portions')
              .eq('id', idForRollback)
              .single();
            const restored = (cur?.remaining_portions ?? 0) + qtyForRollback;
            await supabase
              .from(tblForRollback)
              .update({ remaining_portions: restored })
              .eq('id', idForRollback);
            console.log(`Rollback: restored ${qtyForRollback} portions on ${tblForRollback} ${idForRollback}`);
          } catch (e) {
            console.error('Portion rollback failed:', e);
          }
        });

      }
    }

    if (dailyItems.length > 0 && !pickup_date && !pickup_time_slot && !pickup_time) {
      if (validatedDailyDates.size > 1) {
        throw new Error('Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre');
      }
      const dailyDate = [...validatedDailyDates][0];
      const nowBudapest = getBudapestParts();
      if (dailyDate !== nowBudapest.date) {
        throw new Error('Napi ajánlatot csak a saját napjára, időpont választással lehet előrendelni');
      }
      if (!isBudapestLunchWindow(nowBudapest.date, nowBudapest.time)) {
        throw new Error('Napi ajánlatot mielőbbi átvétellel csak 10:30 és 15:00 között lehet rendelni');
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

      // Atomic increment — safe against concurrent orders using the same coupon.
      const { data: incrementOk, error: incErr } = await supabase
        .rpc('atomic_coupon_increment', { _coupon_id: coupon.id });
      if (incErr || !incrementOk) {
        console.error('Coupon atomic increment failed:', incErr);
        throw new Error('Ez a kupon időközben elfogyott');
      }

      const couponIdForRollback = coupon.id;
      compensations.push(async () => {
        try {
          const { data: cur } = await supabase
            .from('coupons')
            .select('used_count')
            .eq('id', couponIdForRollback)
            .single();
          await supabase
            .from('coupons')
            .update({ used_count: Math.max(0, Number(cur?.used_count || 0) - 1) })
            .eq('id', couponIdForRollback);
          console.log(`Rollback: decremented coupon usage ${couponIdForRollback}`);
        } catch (e) {
          console.error('Coupon rollback failed:', e);
        }
      });

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

    let orderCode = orderCodeData as string;
    console.log('Generated order code:', orderCode);

    // Handle capacity slot update if pickup_time is specified
    let date = '';
    let time = '';
    
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
      // Legacy format: parse ISO string in Europe/Budapest (not UTC!) to avoid a 2h shift
      const bp = getBudapestParts(new Date(pickup_time));
      date = bp.date;
      time = normalizeTimeString(bp.time);
      console.log('Updating capacity for (legacy format, Budapest):', date, time);
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

        // Auto-align pickup date to the daily item's date if mismatched (defensive)
        const dailyDate = uniqueDailyDates[0];
        if (dailyDate !== date) {
          console.warn(`Pickup date ${date} mismatches daily item date ${dailyDate} — auto-aligning to ${dailyDate}.`);
          date = dailyDate;
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
        
        // Validate business hours (Budapest local) BEFORE creating slot,
        // and align with validate_pickup_time (10:30–15:00 weekdays only).
        const dayOfWeek = budapestDayOfWeek(date);
        const [hours, minutes] = time.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes;

        console.log(`Validating business hours (Budapest): date=${date}, time=${time}, dow=${dayOfWeek}, mins=${totalMinutes}`);

        if (dayOfWeek === 0 || dayOfWeek === 6) {
          console.error(`[${requestId}] Rejected: weekend closed (dow=${dayOfWeek})`);
          throw new Error('Hétvégén zárva tartunk');
        }

        // Lunch window: 10:30 – 15:00 (matches validate_pickup_time trigger)
        const isValidTime = totalMinutes >= 10 * 60 + 30 && totalMinutes <= 15 * 60;
        if (!isValidTime) {
          console.error(`[${requestId}] Rejected: outside lunch window (${time})`);
          throw new Error('A kiválasztott időpont nyitvatartási időn kívül esik (10:30 – 15:00)');
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
          const duplicateSlot = createError.code === '23505' || String(createError.message || '').toLowerCase().includes('duplicate');
          if (duplicateSlot) {
            console.warn('Capacity slot was created by a concurrent request, continuing with atomic update:', date, time);
          } else {
            console.error('Capacity slot creation error:', createError);
            throw new Error('Hiba az időpont létrehozásakor');
          }
        } else {
          capacityData = newCapacityData;
        }
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

      // Register rollback for capacity slot booking
      const slotDate = date;
      const slotTime = time;
      compensations.push(async () => {
        try {
          const { data: cur } = await supabase
            .from('capacity_slots')
            .select('booked_orders')
            .eq('date', slotDate)
            .eq('timeslot', slotTime)
            .single();
          const restored = Math.max(0, (cur?.booked_orders ?? 1) - 1);
          await supabase
            .from('capacity_slots')
            .update({ booked_orders: restored })
            .eq('date', slotDate)
            .eq('timeslot', slotTime);
          console.log(`Rollback: released capacity slot ${slotDate} ${slotTime}`);
        } catch (e) {
          console.error('Capacity rollback failed:', e);
        }
      });
    }

    // Insert order with retry on unique code collision (max 3 attempts)
    let orderData: any = null;
    let orderInsertError: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const { data, error } = await supabase
        .from('orders')
        .insert({
          code: orderCode,
          name: customer.name,
          phone: customer.phone,
          email: customer.email || null,
          total_huf: calculatedTotal,
          status: 'new',
          payment_method: payment_method_final,
          pickup_time: pickup_time || (date && time ? budapestWallTimeToUtcIso(date, time.slice(0, 5)) : null),
          notes: customer.notes || null,
          coupon_code: appliedCouponCode,
          discount_huf: discountHuf,
          idempotency_key: idempotency_key,
        })
        .select('id')
        .single();

      if (!error) {
        orderData = data;
        orderInsertError = null;
        break;
      }
      orderInsertError = error;
      // 23505 = unique_violation. Two cases:
      //   (a) orders.code collision → regenerate & retry
      //   (b) orders.idempotency_key collision → same submission raced past our pre-check,
      //       return the existing order instead of failing.
      if ((error as any).code === '23505') {
        const msg = String((error as any).message || '');
        if (msg.includes('idempotency_key') && idempotency_key) {
          const { data: existing } = await supabase
            .from('orders')
            .select('id, code, total_huf')
            .eq('idempotency_key', idempotency_key)
            .maybeSingle();
          if (existing) {
            console.warn(`Idempotency race resolved — returning existing order ${existing.code}`);
            if (compensations.length > 0) {
              console.log(`[${requestId}] Rolling back duplicate request mutations before returning existing order...`);
              for (let i = compensations.length - 1; i >= 0; i--) {
                try { await compensations[i](); } catch (e) { console.error(`[${requestId}] Duplicate compensation ${i} failed:`, e); }
              }
              compensations.length = 0;
            }
            return new Response(
              JSON.stringify({ success: true, order_code: existing.code, total_huf: existing.total_huf, request_id: requestId, loyalty_reward: null, duplicate: true }),
              { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
            );
          }
        }
        if (attempt < 2) {
          console.warn(`Order code collision on ${orderCode}, regenerating (attempt ${attempt + 1})`);
          const { data: newCode } = await supabase.rpc('gen_order_code');
          if (newCode) orderCode = newCode as string;
          continue;
        }
      }
      break;
    }

    if (orderInsertError || !orderData) {
      console.error('Order insert error:', orderInsertError);
      throw new Error('Rendelés mentési hiba');
    }

    const orderId = orderData.id;
    console.log('Created order:', orderId);

    // Register rollback: if any downstream step (items, options) fails, DELETE this order
    // so we don't leave phantom rows with no items visible to staff.
    compensations.push(async () => {
      try {
        const { data: orderItemsForRollback } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderId);
        const rollbackItemIds = (orderItemsForRollback || []).map((r: any) => r.id);
        if (rollbackItemIds.length > 0) {
          await supabase.from('order_item_options').delete().in('order_item_id', rollbackItemIds);
        }
        await supabase.from('coupon_usages').delete().eq('order_id', orderId);
        await supabase.from('order_items').delete().eq('order_id', orderId);
        await supabase.from('orders').delete().eq('id', orderId);
        console.log(`Rollback: deleted order ${orderId}`);
      } catch (e) {
        console.error('Order rollback failed:', e);
      }
    });

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
          throw new Error('Napi tétel metaadat mentési hiba');
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
            throw new Error('Rendelési opció mentési hiba');
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
            throw new Error('Köret mentési hiba');
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
      if (!customer.email) {
        console.log(`[${requestId}] No customer email provided — skipping confirmation email.`);
      } else {
      console.log(`[${requestId}] Preparing confirmation email for ${customer.email}`);
      
      const itemsHtml = validatedItems.map(item => {
        const modifiersHtml = item.modifiers.length > 0 
          ? `<br><small style="color: #666;">+ ${item.modifiers.map(mod => escapeHtml(mod.label_snapshot)).join(', ')}</small>`
          : '';
        
        return `
          <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">
              <strong>${escapeHtml(item.name_snapshot)}</strong> × ${item.qty}${modifiersHtml}
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
          <p>Kedves ${escapeHtml(customer.name)}!</p>
          <p>Köszönjük rendelését! Az alábbi részletekkel rögzítettük:</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Rendelés részletei</h3>
            <p><strong>Rendelés kód:</strong> ${escapeHtml(orderCode)}</p>
            <p><strong>Telefonszám:</strong> ${escapeHtml(customer.phone)}</p>
            ${date && time ? `<p><strong>Átvétel:</strong> ${escapeHtml(date)} ${escapeHtml(time)}</p>` : '<p><strong>Átvétel:</strong> Amilyen hamar lehet</p>'}
            <p><strong>Fizetés:</strong> ${payment_method_final === 'cash' ? 'Készpénz' : 'Kártya'}</p>
            ${customer.notes ? `<p><strong>Megjegyzés:</strong> ${escapeHtml(customer.notes)}</p>` : ''}
          </div>

          <h3>Rendelt termékek</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${itemsHtml}
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td style="padding: 12px; border-top: 2px solid #333;">Összesen</td>
              <td style="padding: 12px; border-top: 2px solid #333; text-align: right;">${calculatedTotal.toLocaleString()} Ft</td>
            </tr>
          </table>

          <div style="background: #f0f4f8; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #d0d5dd;">
            <h4 style="margin: 0 0 8px; font-size: 14px; color: #333;">🧾 Digitális nyugta</h4>
            <table style="width: 100%; font-size: 13px; color: #555;">
              <tr><td>Nettó összeg:</td><td style="text-align: right;">${Math.round(calculatedTotal / 1.27).toLocaleString()} Ft</td></tr>
              <tr><td>ÁFA (27%):</td><td style="text-align: right;">${(calculatedTotal - Math.round(calculatedTotal / 1.27)).toLocaleString()} Ft</td></tr>
              <tr style="font-weight: bold;"><td>Bruttó összeg:</td><td style="text-align: right;">${calculatedTotal.toLocaleString()} Ft</td></tr>
            </table>
            <p style="margin: 8px 0 0; font-size: 11px; color: #999; font-style: italic;">
              Bizonylat szám: ${orderCode} · Dátum: ${new Date().toLocaleDateString('hu-HU')} · Ez a dokumentum nem minősül adóügyi bizonylatnak.
            </p>
          </div>

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
        Fizetés: ${payment_method_final === 'cash' ? 'Készpénz' : 'Kártya'}
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

      // Fire-and-forget: do NOT block the response on Resend. If email is slow
      // and the edge function times out, the client sees an error and retries —
      // creating duplicate orders. EdgeRuntime.waitUntil keeps the promise
      // alive after we've already returned success to the browser.
      const emailPromise = resend.emails.send({
        from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
        to: [customer.email],
        bcc: ['info@kiscsibeetterem.hu', 'gataibence@gmail.com'],
        subject: `Kiscsibe – rendelés visszaigazolás #${orderCode}`,
        html: emailHtml,
        text: emailText,
      }).then(() => {
        console.log(`[${requestId}] Confirmation email sent to:`, customer.email);
      }).catch((emailError) => {
        console.error(`[${requestId}] Email sending failed:`, emailError);
      });

      try {
        // deno-lint-ignore no-explicit-any
        (globalThis as any).EdgeRuntime?.waitUntil?.(emailPromise);
      } catch (_) { /* runtime may not support waitUntil — promise still lives briefly */ }
      }
    } catch (emailError) {
      console.error(`[${requestId}] Email preparation failed:`, emailError);
    }

    console.log(`[${requestId}] Order completed successfully:`, orderCode);

    // Mark abandoned cart as converted (non-fatal)
    if (attemptCtx.session_id) {
      try {
        await attemptCtx.supabase
          .from('abandoned_carts')
          .update({ converted_order_id: orderId, last_activity_at: new Date().toISOString() })
          .eq('session_id', attemptCtx.session_id);
      } catch (e) {
        console.warn(`[${requestId}] Could not mark abandoned cart converted:`, e);
      }
    }

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

    // Roll back any capacity/portion mutations that succeeded before the failure,
    // in reverse order. Prevents "ghost" bookings that eat inventory without an order.
    if (compensations.length > 0) {
      console.log(`[${requestId}] Running ${compensations.length} rollback compensations...`);
      for (let i = compensations.length - 1; i >= 0; i--) {
        try { await compensations[i](); } catch (e) { console.error(`[${requestId}] Compensation ${i} failed:`, e); }
      }
    }


    // Mark abandoned_carts row as failed with the exact reason (non-fatal).
    if (attemptCtx.session_id && attemptCtx.supabase) {
      try {
        await attemptCtx.supabase.from('abandoned_carts').upsert({
          session_id: attemptCtx.session_id,
          customer_name: attemptCtx.customer?.name || null,
          customer_phone: attemptCtx.customer?.phone || null,
          customer_email: attemptCtx.customer?.email || null,
          cart_snapshot: {
            items: attemptCtx.items || [],
            diagnostic: {
              step: 'submit_failed',
              source: 'edge_function',
              request_id: requestId,
              error_message: error?.message || 'Ismeretlen hiba',
              recorded_at: new Date().toISOString(),
            },
          },
          total_huf: (attemptCtx.items || []).reduce((s: number, it: any) => s + (Number(it?.qty) || 0) * (Number(it?.unit_price_huf) || 0), 0),
          step: 'submit_failed',
          user_agent: attemptCtx.userAgent,
          last_activity_at: new Date().toISOString(),
        }, { onConflict: 'session_id' });
      } catch (e) {
        console.warn(`[${requestId}] Could not mark abandoned cart submit_failed:`, e);
      }
    }

    // Log the failed attempt for admin visibility (non-fatal)
    try {
      if (attemptCtx.supabase) {
        const totalGuess = (attemptCtx.items || []).reduce((sum, it: any) => {
          const q = Number(it?.qty) || 0;
          const p = Number(it?.unit_price_huf) || 0;
          return sum + q * p;
        }, 0);

        await attemptCtx.supabase.from('order_attempts').insert({
          customer_name: attemptCtx.customer?.name || null,
          customer_phone: attemptCtx.customer?.phone || null,
          customer_email: attemptCtx.customer?.email || null,
          cart_snapshot: attemptCtx.items || [],
          total_huf: totalGuess || null,
          error_message: error?.message || 'Ismeretlen hiba',
          error_code: error?.code || null,
          payment_method: attemptCtx.payment_method,
          pickup_date: attemptCtx.pickup_date,
          pickup_time_slot: attemptCtx.pickup_time_slot,
          user_agent: attemptCtx.userAgent,
        });
      }
    } catch (logError) {
      console.error(`[${requestId}] Failed to log order attempt:`, logError);
    }

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