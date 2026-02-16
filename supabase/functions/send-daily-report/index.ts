import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const reportDate = url.searchParams.get('date') || new Date().toISOString().split('T')[0];
    const dateStart = `${reportDate}T00:00:00`;
    const dateEnd = `${reportDate}T23:59:59`;

    console.log(`Generating daily report for: ${reportDate}`);

    // Fetch all orders for the day
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, total_huf, status, payment_method, created_at, coupon_code, discount_huf')
      .gte('created_at', dateStart)
      .lte('created_at', dateEnd);

    if (ordersError) throw ordersError;

    const allOrders = orders || [];
    const completedOrders = allOrders.filter(o => !['cancelled'].includes(o.status));
    const cancelledOrders = allOrders.filter(o => o.status === 'cancelled');

    // Revenue calculations
    const totalRevenue = completedOrders.reduce((sum, o) => sum + (o.total_huf || 0), 0);
    const totalDiscount = completedOrders.reduce((sum, o) => sum + (o.discount_huf || 0), 0);
    const cashRevenue = completedOrders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + (o.total_huf || 0), 0);
    const cardRevenue = completedOrders.filter(o => o.payment_method === 'card').reduce((sum, o) => sum + (o.total_huf || 0), 0);
    const avgOrderValue = completedOrders.length > 0 ? Math.round(totalRevenue / completedOrders.length) : 0;

    // Time slot breakdown
    const timeSlots = [
      { label: 'Reggeli (7-10)', start: 7, end: 10 },
      { label: 'Déli (10-14)', start: 10, end: 14 },
      { label: 'Délutáni (14-16)', start: 14, end: 16 },
    ];

    const timeSlotData = timeSlots.map(slot => {
      const slotOrders = completedOrders.filter(o => {
        const hour = new Date(o.created_at).getHours();
        return hour >= slot.start && hour < slot.end;
      });
      return {
        label: slot.label,
        count: slotOrders.length,
        revenue: slotOrders.reduce((sum, o) => sum + (o.total_huf || 0), 0),
      };
    });

    // Fetch top ordered items
    const orderIds = completedOrders.map(o => o.id);
    let topItemsHtml = '<p>Nincs adat</p>';

    if (orderIds.length > 0) {
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('name_snapshot, qty')
        .in('order_id', orderIds);

      if (orderItems && orderItems.length > 0) {
        const itemCounts: Record<string, number> = {};
        for (const item of orderItems) {
          itemCounts[item.name_snapshot] = (itemCounts[item.name_snapshot] || 0) + item.qty;
        }
        const sorted = Object.entries(itemCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
        topItemsHtml = sorted.map(([name, count], i) => 
          `<tr><td style="padding: 6px 8px;">${i + 1}. ${name}</td><td style="padding: 6px 8px; text-align: right; font-weight: bold;">${count} db</td></tr>`
        ).join('');
        topItemsHtml = `<table style="width: 100%; border-collapse: collapse;">${topItemsHtml}</table>`;
      }
    }

    // Fetch sold-out items for the day
    const { data: soldOutItems } = await supabase
      .from('daily_offer_items')
      .select('id, is_sold_out, menu_items(name), daily_offers!inner(date)')
      .eq('daily_offers.date', reportDate)
      .eq('is_sold_out', true);

    const soldOutNames = (soldOutItems || [])
      .map((item: any) => item.menu_items?.name)
      .filter(Boolean);

    let soldOutHtml = '';
    if (soldOutNames.length > 0) {
      soldOutHtml = `
        <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">🚫 Elfogyott ételek (${soldOutNames.length})</h3>
          <ul style="margin: 0; padding-left: 20px;">
            ${soldOutNames.map((n: string) => `<li>${n}</li>`).join('')}
          </ul>
        </div>
      `;
    }

    // Fetch remaining portions
    const { data: dailyOffer } = await supabase
      .from('daily_offers')
      .select('remaining_portions, max_portions')
      .eq('date', reportDate)
      .maybeSingle();

    const { data: dailyOfferMenu } = await supabase
      .from('daily_offer_menus')
      .select('remaining_portions, max_portions, daily_offers!inner(date)')
      .eq('daily_offers.date', reportDate)
      .maybeSingle();

    let portionsHtml = '';
    if (dailyOffer) {
      const offerRemaining = dailyOffer.remaining_portions ?? 0;
      const offerMax = dailyOffer.max_portions ?? 0;
      const menuRemaining = (dailyOfferMenu as any)?.remaining_portions ?? '-';
      const menuMax = (dailyOfferMenu as any)?.max_portions ?? '-';
      portionsHtml = `
        <div style="background: #e8f5e9; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">📦 Maradék adagok</h3>
          <p>Napi ajánlat: <strong>${offerRemaining}/${offerMax}</strong> adag maradt</p>
          ${dailyOfferMenu ? `<p>Napi menü: <strong>${menuRemaining}/${menuMax}</strong> adag maradt</p>` : ''}
        </div>
      `;
    }

    // Coupon usage summary
    const couponOrders = completedOrders.filter(o => o.coupon_code);
    const couponSummary = couponOrders.length > 0 
      ? `<p>🎟️ <strong>Kuponos rendelések:</strong> ${couponOrders.length} db (összkedvezmény: ${totalDiscount.toLocaleString()} Ft)</p>`
      : '';

    // Time slot HTML
    const timeSlotHtml = `
      <div style="background: #f3e8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <h3 style="margin-top: 0;">⏰ Időszakos bontás</h3>
        <table style="width: 100%; border-collapse: collapse;">
          ${timeSlotData.map(s => `
            <tr>
              <td style="padding: 6px 8px;">${s.label}</td>
              <td style="padding: 6px 8px; text-align: right;"><strong>${s.count} rendelés</strong></td>
              <td style="padding: 6px 8px; text-align: right;">${s.revenue.toLocaleString()} Ft</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📊 Napi bevételi riport — ${reportDate}</h2>
        
        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; font-size: 14px; color: #666;">Napi összesítés</p>
          <p style="margin: 5px 0; font-size: 32px; font-weight: bold; color: #16a34a;">${totalRevenue.toLocaleString()} Ft</p>
          <p style="margin: 0; font-size: 14px; color: #666;">${completedOrders.length} rendelés · átlag ${avgOrderValue.toLocaleString()} Ft</p>
        </div>

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">💳 Fizetési módok</h3>
          <p>💵 Készpénz: <strong>${cashRevenue.toLocaleString()} Ft</strong> (${completedOrders.filter(o => o.payment_method === 'cash').length} db)</p>
          <p>💳 Kártya: <strong>${cardRevenue.toLocaleString()} Ft</strong> (${completedOrders.filter(o => o.payment_method === 'card').length} db)</p>
          ${couponSummary}
        </div>

        ${timeSlotHtml}

        ${cancelledOrders.length > 0 ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p>❌ <strong>Lemondott rendelések:</strong> ${cancelledOrders.length} db</p>
          </div>
        ` : ''}

        ${soldOutHtml}
        ${portionsHtml}

        <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
          <h3 style="margin-top: 0;">🏆 Top 5 rendelt étel</h3>
          ${topItemsHtml}
        </div>

        <p style="color: #999; font-size: 12px; margin-top: 20px;">
          Ez az automatikus napi riport a Kiscsibe rendelési rendszer által generálva.
        </p>
      </div>
    `;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured');

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: 'Kiscsibe Rendszer <rendeles@kiscsibe-etterem.hu>',
      to: ['kiscsibeetterem@gmail.com', 'gataibence@gmail.com'],
      subject: `Kiscsibe napi riport — ${reportDate} — ${totalRevenue.toLocaleString()} Ft`,
      html: emailHtml,
    });

    console.log(`Daily report sent for ${reportDate}`);

    return new Response(
      JSON.stringify({ success: true, date: reportDate, revenue: totalRevenue, orders: completedOrders.length }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-daily-report error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
