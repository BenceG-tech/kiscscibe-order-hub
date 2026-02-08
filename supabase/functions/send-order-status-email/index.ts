import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StatusEmailRequest {
  order_id: string;
  new_status: string;
}

const STATUS_CONFIG: Record<string, { subject: string; heading: string; message: string; emoji: string }> = {
  preparing: {
    subject: 'Rendelésed elfogadtuk – készítjük!',
    heading: 'A rendelésedet elfogadtuk! 👨‍🍳',
    message: 'Elkezdtük a rendelésed elkészítését. Hamarosan kész lesz!',
    emoji: '🔥',
  },
  ready: {
    subject: 'Rendelésedet elkészítettük – átveheted!',
    heading: 'A rendelésedet elkészítettük! 🎉',
    message: 'A rendelésedet elkészítettük és átvételre vár. Gyere és vedd át!',
    emoji: '✅',
  },
  completed: {
    subject: 'Köszönjük, hogy nálunk rendeltél!',
    heading: 'Köszönjük a rendelésedet! 💛',
    message: 'Reméljük ízlett! Szeretettel várunk legközelebb is.',
    emoji: '⭐',
  },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { order_id, new_status }: StatusEmailRequest = await req.json();

    if (!order_id || !new_status) {
      throw new Error('Missing order_id or new_status');
    }

    const config = STATUS_CONFIG[new_status];
    if (!config) {
      console.log(`No email configured for status: ${new_status}`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'No email for this status' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch order with email
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      console.error('Order not found:', orderError);
      throw new Error('Order not found');
    }

    if (!order.email) {
      console.log(`No email address for order ${order.code} — skipping email`);
      return new Response(
        JSON.stringify({ success: true, skipped: true, reason: 'No customer email' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch order items
    const { data: items } = await supabase
      .from('order_items')
      .select('name_snapshot, qty, line_total_huf')
      .eq('order_id', order_id);

    const itemsHtml = (items || []).map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          <strong>${item.name_snapshot}</strong> × ${item.qty}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          ${item.line_total_huf.toLocaleString()} Ft
        </td>
      </tr>
    `).join('');

    const pickupInfo = order.pickup_time
      ? `Átvétel: ${new Date(order.pickup_time).toLocaleString('hu-HU')}`
      : 'Átvétel: Amilyen hamar lehet';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">${config.emoji} ${config.heading}</h2>
        <p>Kedves ${order.name}!</p>
        <p>${config.message}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rendelés részletei</h3>
          <p><strong>Rendelés kód:</strong> ${order.code}</p>
          <p><strong>${pickupInfo}</strong></p>
          <p><strong>Fizetés:</strong> ${order.payment_method === 'cash' ? 'Készpénz' : 'Kártya'}</p>
        </div>

        ${(items && items.length > 0) ? `
          <h3>Rendelt termékek</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            ${itemsHtml}
            <tr style="font-weight: bold; background: #f8f9fa;">
              <td style="padding: 12px; border-top: 2px solid #333;">Összesen</td>
              <td style="padding: 12px; border-top: 2px solid #333; text-align: right;">${order.total_huf.toLocaleString()} Ft</td>
            </tr>
          </table>
        ` : ''}

        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Kiscsibe Étterem</strong></p>
          <p style="margin: 5px 0;">📍 1234 Budapest, Példa utca 12.</p>
          <p style="margin: 5px 0;">📞 +36 1 234 5678</p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Köszönjük, hogy minket választottál! 💛
        </p>
      </div>
    `;

    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));

    await resend.emails.send({
      from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
      to: [order.email],
      subject: `Kiscsibe – ${config.subject} #${order.code}`,
      html: emailHtml,
    });

    console.log(`Status email sent: ${new_status} → ${order.email} (order ${order.code})`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('send-order-status-email error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
