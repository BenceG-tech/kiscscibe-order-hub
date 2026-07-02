import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

type CheckStatus = "ok" | "warn" | "fail";

interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}

function todayISO(): string {
  // Europe/Budapest date (yyyy-mm-dd)
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Budapest",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const checks: Check[] = [];
  const today = todayISO();
  const now = new Date();
  const dow = new Date(today + "T00:00:00").getDay(); // 0=Sun
  const isWeekend = dow === 0 || dow === 6;

  // 1. Daily offer for today
  try {
    const { data: offer, error } = await supabase
      .from("daily_offers")
      .select("id, price_huf")
      .eq("date", today)
      .maybeSingle();
    if (error) throw error;
    if (!offer) {
      checks.push({
        id: "daily_offer",
        label: "Napi ajánlat (ma)",
        status: isWeekend ? "ok" : "warn",
        message: isWeekend ? "Hétvégén zárva, nincs napi ajánlat." : "Nincs mai napi ajánlat beállítva.",
      });
    } else {
      const { count: itemsCount } = await supabase
        .from("daily_offer_items")
        .select("id", { count: "exact", head: true })
        .eq("daily_offer_id", offer.id);
      checks.push({
        id: "daily_offer",
        label: "Napi ajánlat (ma)",
        status: itemsCount && itemsCount > 0 ? "ok" : "warn",
        message:
          itemsCount && itemsCount > 0
            ? `Mai ajánlat rendben (${itemsCount} tétel, ${offer.price_huf ?? "—"} Ft).`
            : "Mai ajánlat létezik, de nincsenek tételek.",
      });
    }
  } catch (e: any) {
    checks.push({ id: "daily_offer", label: "Napi ajánlat (ma)", status: "fail", message: e?.message || "Hiba" });
  }

  // 2. Capacity slots for today
  try {
    if (isWeekend) {
      checks.push({ id: "capacity", label: "Idősávok (ma)", status: "ok", message: "Hétvégén zárva." });
    } else {
      const { count } = await supabase
        .from("capacity_slots")
        .select("id", { count: "exact", head: true })
        .eq("date", today);
      checks.push({
        id: "capacity",
        label: "Idősávok (ma)",
        status: count && count >= 4 ? "ok" : "warn",
        message:
          count && count >= 4
            ? `${count} idősáv elérhető ma.`
            : `Csak ${count ?? 0} idősáv van — előfordulhat, hogy a rendszer menet közben hoz létre újat.`,
      });
    }
  } catch (e: any) {
    checks.push({ id: "capacity", label: "Idősávok (ma)", status: "fail", message: e?.message || "Hiba" });
  }

  // 3. Submit-order edge function reachable (HEAD/OPTIONS)
  try {
    const url = `${supabaseUrl}/functions/v1/submit-order`;
    const r = await fetch(url, {
      method: "OPTIONS",
      headers: { Origin: "https://kiscsibe-etterem.hu" },
    });
    checks.push({
      id: "submit_order",
      label: "Rendelés leadás funkció",
      status: r.ok || r.status === 204 ? "ok" : "warn",
      message: r.ok || r.status === 204 ? "Edge function elérhető." : `Váratlan státusz: ${r.status}`,
    });
  } catch (e: any) {
    checks.push({ id: "submit_order", label: "Rendelés leadás funkció", status: "fail", message: e?.message || "Nem elérhető" });
  }

  // 4. Database write test (insert + delete an order_attempts probe)
  try {
    const probe = {
      customer_name: "__health_check__",
      customer_phone: null,
      cart_snapshot: [],
      total_huf: 0,
      error_message: "health probe",
    };
    const { data: ins, error: insErr } = await supabase
      .from("order_attempts")
      .insert(probe)
      .select("id")
      .single();
    if (insErr) throw insErr;
    await supabase.from("order_attempts").delete().eq("id", ins.id);
    checks.push({ id: "db_write", label: "Adatbázis írás", status: "ok", message: "Próbabejegyzés sikerült." });
  } catch (e: any) {
    checks.push({ id: "db_write", label: "Adatbázis írás", status: "fail", message: e?.message || "Hiba" });
  }

  // 5. Email service (Resend) reachable
  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      checks.push({ id: "email", label: "E-mail szolgáltatás", status: "warn", message: "RESEND_API_KEY nincs beállítva." });
    } else {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${resendKey}` },
      });
      checks.push({
        id: "email",
        label: "E-mail szolgáltatás",
        status: r.ok ? "ok" : "warn",
        message: r.ok ? "Resend elérhető." : `Resend válasz: ${r.status}`,
      });
    }
  } catch (e: any) {
    checks.push({ id: "email", label: "E-mail szolgáltatás", status: "warn", message: e?.message || "Nem elérhető" });
  }

  // 6. Stuck 'new' orders (> 30 minutes)
  try {
    const cutoff = new Date(now.getTime() - 30 * 60 * 1000).toISOString();
    const { data: stuck, error } = await supabase
      .from("orders")
      .select("code, created_at")
      .eq("status", "new")
      .lt("created_at", cutoff)
      .limit(5);
    if (error) throw error;
    if (!stuck || stuck.length === 0) {
      checks.push({ id: "stuck", label: "Régóta nyitott rendelések", status: "ok", message: "Nincs 30 percnél régebbi 'új' rendelés." });
    } else {
      checks.push({
        id: "stuck",
        label: "Régóta nyitott rendelések",
        status: "warn",
        message: `${stuck.length} rendelés > 30 perce 'új' állapotban.`,
        detail: stuck.map((o: any) => o.code).join(", "),
      });
    }
  } catch (e: any) {
    checks.push({ id: "stuck", label: "Régóta nyitott rendelések", status: "fail", message: e?.message || "Hiba" });
  }

  // 7. Sold-out check for today
  if (!isWeekend) {
    try {
      const { data: offer } = await supabase
        .from("daily_offers")
        .select("id")
        .eq("date", today)
        .maybeSingle();
      if (offer) {
        const { data: items } = await supabase
          .from("daily_offer_items")
          .select("is_sold_out")
          .eq("daily_offer_id", offer.id);
        const all = items || [];
        const soldOut = all.filter((i: any) => i.is_sold_out).length;
        if (all.length > 0 && soldOut === all.length) {
          checks.push({ id: "sold_out", label: "Készlet", status: "warn", message: "Minden mai tétel kifogyott!" });
        } else if (soldOut > 0) {
          checks.push({ id: "sold_out", label: "Készlet", status: "ok", message: `${soldOut} / ${all.length} tétel kifogyott.` });
        } else {
          checks.push({ id: "sold_out", label: "Készlet", status: "ok", message: "Minden tétel elérhető." });
        }
      }
    } catch (e: any) {
      checks.push({ id: "sold_out", label: "Készlet", status: "warn", message: e?.message || "Nem ellenőrizhető" });
    }
  }

  // 8. Ghost capacity bookings: booked_orders > actual orders for that slot (today)
  try {
    const { data: slots } = await supabase
      .from("capacity_slots")
      .select("date, timeslot, booked_orders")
      .eq("date", today)
      .gt("booked_orders", 0);

    const ghosts: string[] = [];
    for (const s of slots || []) {
      // Match by pickup_time in Budapest local time — compare hh:mm portion
      const { data: orders } = await supabase
        .from("orders")
        .select("id, pickup_time, status")
        .neq("status", "cancelled")
        .gte("pickup_time", `${s.date}T00:00:00Z`)
        .lte("pickup_time", `${s.date}T23:59:59Z`);
      const slotHHMM = String(s.timeslot).slice(0, 5);
      const matching = (orders || []).filter((o: any) => {
        if (!o.pickup_time) return false;
        const bpTime = new Intl.DateTimeFormat("en-GB", {
          timeZone: "Europe/Budapest", hour: "2-digit", minute: "2-digit", hour12: false,
        }).format(new Date(o.pickup_time));
        return bpTime === slotHHMM;
      }).length;
      if ((s.booked_orders as number) > matching) {
        ghosts.push(`${slotHHMM} (foglalt: ${s.booked_orders}, rendelés: ${matching})`);
      }
    }
    if (ghosts.length === 0) {
      checks.push({ id: "ghost_slots", label: "Szellemfoglalások", status: "ok", message: "Nincs szellemfoglalás ma." });
    } else {
      checks.push({
        id: "ghost_slots",
        label: "Szellemfoglalások",
        status: "warn",
        message: `${ghosts.length} idősávban a foglalás nem egyezik a rendelésszámmal.`,
        detail: ghosts.join(", "),
      });
    }
  } catch (e: any) {
    checks.push({ id: "ghost_slots", label: "Szellemfoglalások", status: "warn", message: e?.message || "Nem ellenőrizhető" });
  }


  const summary = {
    ok: checks.filter((c) => c.status === "ok").length,
    warn: checks.filter((c) => c.status === "warn").length,
    fail: checks.filter((c) => c.status === "fail").length,
  };

  return new Response(
    JSON.stringify({
      ran_at: new Date().toISOString(),
      summary,
      checks,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
