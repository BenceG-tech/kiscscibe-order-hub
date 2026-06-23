import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

function todayISO(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = claimsData.claims.sub;
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: isAdmin } = await admin.rpc("is_admin", { check_user_id: userId });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const checkId = String(body?.check_id || "");
    const today = todayISO();

    let result: { success: boolean; message: string; detail?: string } = {
      success: false,
      message: "Ismeretlen ellenőrzés.",
    };

    if (checkId === "daily_offer") {
      // Try to copy the most recent template into today
      const { data: existing } = await admin
        .from("daily_offers")
        .select("id")
        .eq("date", today)
        .maybeSingle();

      if (existing) {
        result = {
          success: false,
          message: "A mai napi ajánlat már létezik. Nyisd meg a Heti menü oldalt és adj hozzá tételeket.",
        };
      } else {
        const { data: tpl } = await admin
          .from("daily_offer_templates")
          .select("id, name, price_huf, items")
          .order("last_used_at", { ascending: false, nullsFirst: false })
          .limit(1)
          .maybeSingle();

        if (!tpl) {
          result = {
            success: false,
            message: "Nincs elérhető sablon. Hozd létre kézzel a Heti menü oldalon.",
          };
        } else {
          const { data: offer, error: offerErr } = await admin
            .from("daily_offers")
            .insert({
              date: today,
              price_huf: tpl.price_huf ?? 2200,
              is_published: false,
            })
            .select("id")
            .single();
          if (offerErr) throw offerErr;

          const items = Array.isArray(tpl.items) ? tpl.items : [];
          if (items.length > 0 && offer) {
            const rows = items.map((it: any) => ({
              daily_offer_id: offer.id,
              item_id: it.item_id ?? it.id,
              is_menu_part: it.is_menu_part ?? true,
              menu_role: it.menu_role ?? null,
              is_sold_out: false,
            })).filter((r: any) => r.item_id);
            if (rows.length > 0) {
              await admin.from("daily_offer_items").insert(rows);
            }
          }
          await admin.rpc("increment_template_usage", { template_id: tpl.id });
          result = {
            success: true,
            message: `Létrehoztam a mai napi ajánlatot a(z) "${tpl.name}" sablonból. Ne felejtsd el publikálni!`,
          };
        }
      }
    } else if (checkId === "capacity") {
      // Create default lunch slots 10:30 - 14:30 every 30 min
      const slots: string[] = [];
      for (let m = 10 * 60 + 30; m < 15 * 60; m += 30) {
        const h = Math.floor(m / 60);
        const mm = m % 60;
        slots.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`);
      }

      const { data: existing } = await admin
        .from("capacity_slots")
        .select("timeslot")
        .eq("date", today);
      const existingSet = new Set((existing || []).map((s: any) => s.timeslot));

      const toInsert = slots
        .filter((t) => !existingSet.has(t))
        .map((t) => ({
          date: today,
          timeslot: t,
          max_orders: 5,
          booked_orders: 0,
        }));

      if (toInsert.length === 0) {
        result = { success: true, message: "Már léteznek az idősávok – nincs teendő." };
      } else {
        const { error } = await admin.from("capacity_slots").insert(toInsert);
        if (error) throw error;
        result = {
          success: true,
          message: `${toInsert.length} idősáv létrehozva 10:30 – 14:30 között.`,
        };
      }
    } else if (checkId === "stuck") {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { data: stuck } = await admin
        .from("orders")
        .select("id, code")
        .eq("status", "new")
        .lt("created_at", cutoff);
      const ids = (stuck || []).map((o: any) => o.id);
      if (ids.length === 0) {
        result = { success: true, message: "Nincs régi 'új' rendelés." };
      } else {
        const { error } = await admin
          .from("orders")
          .update({ status: "cancelled" })
          .in("id", ids);
        if (error) throw error;
        result = {
          success: true,
          message: `${ids.length} régi rendelés lemondva.`,
          detail: (stuck || []).map((o: any) => o.code).join(", "),
        };
      }
    } else if (checkId === "sold_out") {
      const { data: offer } = await admin
        .from("daily_offers")
        .select("id")
        .eq("date", today)
        .maybeSingle();
      if (!offer) {
        result = { success: false, message: "Nincs mai napi ajánlat." };
      } else {
        const { error, count } = await admin
          .from("daily_offer_items")
          .update({ is_sold_out: false }, { count: "exact" })
          .eq("daily_offer_id", offer.id)
          .eq("is_sold_out", true);
        if (error) throw error;
        result = {
          success: true,
          message: `${count ?? 0} tétel visszaállítva elérhetőre.`,
        };
      }
    } else if (checkId === "submit_order" || checkId === "db_write") {
      result = { success: true, message: "Futtasd újra az ellenőrzést." };
    } else {
      result = { success: false, message: `A(z) "${checkId}" ellenőrzéshez nincs automatikus javítás.` };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(
      JSON.stringify({ success: false, message: e?.message || "Hiba a javítás közben.", detail: String(e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
