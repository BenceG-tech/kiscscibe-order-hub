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

    // Determine report date (default: today, or pass ?date=YYYY-MM-DD)
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

    // Coupon usage summary
    const couponOrders = completedOrders.filter(o => o.coupon_code);
    const couponSummary = couponOrders.length > 0 
      ? `<p>🎟️ <strong>Kuponos rendelések:</strong> ${couponOrders.length} db (összkedvezmény: ${totalDiscount.toLocaleString()} Ft)</p>`
      : '';

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

        ${cancelledOrders.length > 0 ? `
          <div style="background: #fef2f2; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <p>❌ <strong>Lemondott rendelések:</strong> ${cancelledOrders.length} db</p>
          </div>
        ` : ''}

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
