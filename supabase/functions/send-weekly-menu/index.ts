import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const HU_DAYS = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function getWeekDates(weekStartStr?: string): { monday: string; friday: string; dates: string[] } {
  let monday: Date;
  if (weekStartStr) {
    monday = new Date(weekStartStr + "T00:00:00");
  } else {
    const now = new Date();
    const day = now.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    monday = new Date(now);
    monday.setDate(now.getDate() + diff);
  }
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }
  return { monday: dates[0], friday: dates[4], dates };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const dayName = HU_DAYS[d.getDay()];
  const month = HU_MONTHS[d.getMonth()];
  return `${dayName}, ${month} ${d.getDate()}.`;
}

function formatDateRange(monday: string, friday: string): string {
  const m = new Date(monday + "T00:00:00");
  const f = new Date(friday + "T00:00:00");
  const mMonth = HU_MONTHS[m.getMonth()];
  const fMonth = HU_MONTHS[f.getMonth()];
  if (mMonth === fMonth) {
    return `${mMonth} ${m.getDate()}-${f.getDate()}.`;
  }
  return `${mMonth} ${m.getDate()}. - ${fMonth} ${f.getDate()}.`;
}

interface DayData {
  date: string;
  menuPrice: number | null;
  items: Array<{
    name: string;
    price: number;
    isMenuPart: boolean;
    menuRole: string | null;
  }>;
}

function generateEmailHtml(days: DayData[], dateRange: string): string {
  let daysHtml = "";

  for (const day of days) {
    if (day.items.length === 0) continue;

    const menuItems = day.items.filter((i) => i.isMenuPart);
    const alacarteItems = day.items.filter((i) => !i.isMenuPart);

    let itemsHtml = "";

    if (menuItems.length > 0 && day.menuPrice) {
      itemsHtml += `<div style="margin-bottom: 8px;">
        <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">🍽️ MENÜ – ${day.menuPrice} Ft</span>
      </div>`;
      for (const item of menuItems) {
        const roleLabel = item.menuRole === "leves" ? "🥣" : "🍖";
        itemsHtml += `<div style="padding: 4px 0 4px 12px; color: #333; font-size: 15px;">${roleLabel} ${item.name}</div>`;
      }
    }

    if (alacarteItems.length > 0) {
      if (menuItems.length > 0) {
        itemsHtml += `<div style="margin: 8px 0 4px 0; font-size: 12px; color: #92400e; font-weight: bold;">À la carte</div>`;
      }
      for (const item of alacarteItems) {
        itemsHtml += `<div style="padding: 3px 0 3px 12px; color: #333; font-size: 14px;">• ${item.name} — <strong>${item.price} Ft</strong></div>`;
      }
    }

    daysHtml += `
      <div style="margin-bottom: 20px; border-left: 3px solid #d97706; padding-left: 16px;">
        <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 17px;">${formatDate(day.date)}</h3>
        ${itemsHtml}
      </div>`;
  }

  if (!daysHtml) {
    daysHtml = `<p style="color: #666; font-style: italic; text-align: center; padding: 20px;">Erre a hétre még nincs menü beállítva.</p>`;
  }

  return `<!DOCTYPE html>
<html lang="hu">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f5f0e8;">
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbeb;">
    <div style="text-align: center; margin-bottom: 24px; padding: 20px 0; border-bottom: 2px solid #fde68a;">
      <h1 style="color: #d97706; font-size: 28px; margin: 0;">🐣 Kiscsibe Étterem</h1>
      <p style="color: #92400e; font-size: 14px; margin-top: 4px;">Heti menü – ${dateRange}</p>
    </div>

    <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <h2 style="color: #92400e; margin: 0 0 20px 0; text-align: center; font-size: 20px;">📋 Aktuális heti menünk</h2>
      ${daysHtml}
    </div>

    <div style="text-align: center; margin-top: 24px;">
      <a href="https://kiscscibe-order-hub.lovable.app" style="display: inline-block; background-color: #d97706; color: #ffffff; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">Rendelés leadása →</a>
    </div>

    <hr style="border: none; border-top: 1px solid #fde68a; margin: 24px 0;" />

    <div style="color: #92400e; font-size: 14px; text-align: center;">
      <p style="margin: 4px 0;"><strong>Kiscsibe Reggeliző & Étterem</strong></p>
      <p style="margin: 4px 0;">📍 1145 Budapest, Vezér utca 12.</p>
      <p style="margin: 4px 0;">📞 +36 1 234 5678</p>
      <p style="margin: 4px 0;">✉️ kiscsibeetterem@gmail.com</p>
    </div>

    <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
      Ezt a levelet azért kaptad, mert feliratkoztál a Kiscsibe Étterem heti menü hírlevelére.
      Ha le szeretnél iratkozni, kérjük írj a kiscsibeetterem@gmail.com címre.
    </p>
  </div>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Verify admin auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Nincs jogosultságod." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY nincs konfigurálva.");
    }

    // Verify user is admin
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Érvénytelen token." }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const userId = claimsData.claims.sub;

    // Use service role to check admin status and fetch data
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: isAdmin } = await adminClient.rpc("is_admin", { check_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Csak adminisztrátor küldheti ki." }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // 2. Parse request body
    const body = await req.json().catch(() => ({}));
    const { monday, friday, dates } = getWeekDates(body.week_start);
    const dateRange = formatDateRange(monday, friday);

    // 3. Fetch daily offers for the week
    const { data: offers } = await adminClient
      .from("daily_offers")
      .select("id, date, price_huf, note")
      .in("date", dates)
      .order("date");

    const daysData: DayData[] = [];

    if (offers && offers.length > 0) {
      for (const offer of offers) {
        // Get menu info
        const { data: menuData } = await adminClient
          .from("daily_offer_menus")
          .select("menu_price_huf")
          .eq("daily_offer_id", offer.id)
          .maybeSingle();

        // Get items
        const { data: offerItems } = await adminClient
          .from("daily_offer_items")
          .select("is_menu_part, menu_role, item_id")
          .eq("daily_offer_id", offer.id);

        if (!offerItems || offerItems.length === 0) continue;

        const itemIds = offerItems.map((oi) => oi.item_id).filter(Boolean);
        const { data: menuItems } = await adminClient
          .from("menu_items")
          .select("id, name, price_huf")
          .in("id", itemIds);

        const itemMap = new Map((menuItems || []).map((mi) => [mi.id, mi]));

        const items = offerItems
          .filter((oi) => oi.item_id && itemMap.has(oi.item_id))
          .map((oi) => {
            const mi = itemMap.get(oi.item_id!)!;
            return {
              name: mi.name,
              price: mi.price_huf,
              isMenuPart: oi.is_menu_part,
              menuRole: oi.menu_role,
            };
          });

        daysData.push({
          date: offer.date,
          menuPrice: menuData?.menu_price_huf || null,
          items,
        });
      }
    }

    // 4. Fetch all subscribers
    const { data: subscribers, error: subError } = await adminClient
      .from("subscribers")
      .select("email");

    if (subError) {
      throw new Error("Nem sikerült lekérni a feliratkozókat: " + subError.message);
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: false, error: "Nincsenek feliratkozók." }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // 5. Generate email
    const emailHtml = generateEmailHtml(daysData, dateRange);
    const subject = `Heti menü – Kiscsibe Étterem (${dateRange})`;

    // 6. Send in batches of 50
    const resend = new Resend(resendApiKey);
    const batchSize = 50;
    let totalSent = 0;
    let totalErrors = 0;
    const errors: string[] = [];

    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      const emailPromises = batch.map((sub) =>
        resend.emails
          .send({
            from: "Kiscsibe Reggeliző & Étterem <onboarding@resend.dev>",
            to: [sub.email],
            subject,
            html: emailHtml,
          })
          .then(() => {
            totalSent++;
          })
          .catch((err: Error) => {
            totalErrors++;
            errors.push(`${sub.email}: ${err.message}`);
          })
      );
      await Promise.all(emailPromises);
    }

    // 7. Save last sent info to settings
    const sentInfo = {
      sent_at: new Date().toISOString(),
      week: monday,
      count: totalSent,
      errors: totalErrors,
    };

    await adminClient
      .from("settings")
      .upsert({ key: "newsletter_last_sent", value_json: sentInfo }, { onConflict: "key" });

    console.log(`Weekly menu sent: ${totalSent} successful, ${totalErrors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        sent: totalSent,
        errors: totalErrors,
        error_details: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba.";
    console.error("send-weekly-menu error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
