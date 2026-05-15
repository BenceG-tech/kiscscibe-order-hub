import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { hasInternalSecret, requireAdmin } from "../_shared/auth.ts";

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

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
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  // Allow either internal-secret (server-to-server) or admin/staff auth (dashboard)
  if (!hasInternalSecret(req)) {
    const auth = await requireAdmin(req, corsHeaders, { allowStaff: true });
    if (!auth.ok) return auth.response;
  }

  try {
    const { order_id, new_status }: StatusEmailRequest = await req.json();
    console.log(`Processing status email: order=${order_id}, status=${new_status}`);

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

    // Fetch Google Review URL from settings
    let googleReviewUrl = 'https://g.page/review/kiscsibe'; // fallback
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('value_json')
        .eq('key', 'google_review_url')
        .maybeSingle();
      if (settingsData?.value_json) {
        googleReviewUrl = String(settingsData.value_json);
      }
    } catch (e) {
      console.log('Could not fetch google_review_url setting, using fallback');
    }

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

    console.log(`Order found: ${order.code}, email: ${order.email || 'none'}`);

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
          <strong>${escapeHtml(item.name_snapshot)}</strong> × ${item.qty}
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
        <p>Kedves ${escapeHtml(order.name)}!</p>
        <p>${config.message}</p>
        
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Rendelés részletei</h3>
          <p><strong>Rendelés kód:</strong> ${escapeHtml(order.code)}</p>
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

        ${new_status === 'completed' ? `
        <div style="background: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="margin: 0 0 10px 0; font-size: 16px;">⭐ Tetszett az élmény?</p>
          <a href="${googleReviewUrl}" style="display: inline-block; background: #4285f4; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
            Értékeld a tapasztalatod Google-ön!
          </a>
          <p style="margin: 10px 0 0; font-size: 13px; color: #888;">
            📝 1 órán belül küldünk egy rövid kérdőívet is az élményedről.
          </p>
        </div>
        ` : ''}

        <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Kiscsibe Étterem</strong></p>
        </div>

        <p style="color: #666; font-size: 14px;">
          Köszönjük, hogy minket választottál! 💛
        </p>
      </div>
    `;

    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      console.error('RESEND_API_KEY not configured');
      throw new Error('RESEND_API_KEY not configured');
    }

    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: 'Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>',
      to: [order.email],
      subject: `Kiscsibe – ${config.subject} #${order.code}`,
      html: emailHtml,
    });

    console.log(`Status email sent successfully: ${new_status} → ${order.email} (order ${order.code})`, emailResult);

    // Schedule rating request email for completed orders (60 min delay via setTimeout)
    if (new_status === 'completed') {
      try {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const internalSecret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        setTimeout(async () => {
          try {
            await fetch(`${supabaseUrl}/functions/v1/send-rating-request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${internalSecret}`,
                'x-internal-secret': internalSecret,
              },
              body: JSON.stringify({ order_id }),
            });
            console.log(`Rating request triggered for order ${order.code}`);
          } catch (e) {
            console.error('Rating request trigger failed:', e);
          }
        }, 60 * 60 * 1000);
      } catch (e) {
        console.error('Failed to schedule rating request:', e);
      }
    }

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
