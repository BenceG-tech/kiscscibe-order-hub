import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { generateRatingToken, logEmailSend, maskEmail, ratingLinksHtml, SITE_URL } from "../_shared/rating-token.ts";

function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const { requireInternalSecret } = await import("../_shared/auth.ts");
  const auth = requireInternalSecret(req, corsHeaders);
  if (!auth.ok) return auth.response;

  try {
    const { order_id } = await req.json();
    if (!order_id) throw new Error("Missing order_id");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if already rated
    const { data: existing } = await supabase
      .from("order_ratings")
      .select("id")
      .eq("order_id", order_id)
      .maybeSingle();

    if (existing) {
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "Already rated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, code, name, email, phone")
      .eq("id", order_id)
      .single();

    if (orderError || !order) throw new Error("Order not found");
    if (!order.email) {
      await logEmailSend(supabase as any, {
        order_id,
        email_type: "rating_request",
        recipient: "(none)",
        status: "skipped",
        error: "No customer email",
      });
      return new Response(JSON.stringify({ success: true, skipped: true, reason: "No email" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = await generateRatingToken(order_id);
    const siteUrl = SITE_URL;


    // Fetch Google Review URL
    let googleReviewUrl = "https://g.page/review/kiscsibe";
    try {
      const { data: s } = await supabase.from("settings").select("value_json").eq("key", "google_review_url").maybeSingle();
      if (s?.value_json) googleReviewUrl = String(s.value_json);
    } catch { /* fallback */ }

    const stars = ratingLinksHtml(order_id, token);
    void siteUrl;

    const emailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#333;">Hogy ízlett? 🍽️</h2>
        <p>Kedves ${escapeHtml(order.name)}!</p>
        <p>Reméljük ízlett a rendelésed (#${escapeHtml(order.code)})! Kérjük értékeld az élményed:</p>
        <div style="text-align:center;margin:30px 0;">
          ${stars}
        </div>
        <p style="text-align:center;color:#666;">Kattints egy emojira az értékeléshez!</p>
        <div style="background:#fff3e0;padding:20px;border-radius:8px;margin:20px 0;text-align:center;">
          <p style="margin:0 0 10px;">⭐ Tetszett? Értékelj minket Google-ön is!</p>
          <a href="${googleReviewUrl}" style="display:inline-block;background:#4285f4;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;font-weight:bold;">
            Google értékelés
          </a>
        </div>
        <p style="color:#666;font-size:14px;">Köszönjük, hogy minket választottál! 💛<br>Kiscsibe Étterem</p>
      </div>
    `;

    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
    await resend.emails.send({
      from: "Kiscsibe Étterem <rendeles@kiscsibe-etterem.hu>",
      to: [order.email],
      subject: `Kiscsibe – Hogy ízlett? #${order.code}`,
      html: emailHtml,
    });

    console.log(`Rating request email sent to ${order.email} for order ${order.code}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("send-rating-request error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
