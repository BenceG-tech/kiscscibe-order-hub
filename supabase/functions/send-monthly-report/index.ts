import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month");

    // Default: previous month
    const now = new Date();
    let year: number, month: number;
    if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
      [year, month] = monthParam.split("-").map(Number);
    } else {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      year = prev.getFullYear();
      month = prev.getMonth() + 1;
    }

    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate = month === 12
      ? `${year + 1}-01-01`
      : `${year}-${String(month + 1).padStart(2, "0")}-01`;

    const monthLabel = `${year}. ${String(month).padStart(2, "0")}`;

    console.log(`Generating monthly report for: ${monthLabel}`);

    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("type, category, gross_amount, net_amount, vat_amount, vat_rate, status")
      .gte("issue_date", startDate)
      .lt("issue_date", endDate);

    if (error) throw error;

    const all = invoices || [];
    const income = all.filter((i: any) => i.type !== "incoming");
    const expense = all.filter((i: any) => i.type === "incoming");

    const totalIncome = income.reduce((s: number, i: any) => s + i.gross_amount, 0);
    const totalExpense = expense.reduce((s: number, i: any) => s + i.gross_amount, 0);
    const result = totalIncome - totalExpense;

    // VAT breakdown
    const vatBreakdown: Record<number, { net: number; vat: number; gross: number }> = {};
    for (const inv of all) {
      const rate = (inv as any).vat_rate || 27;
      if (!vatBreakdown[rate]) vatBreakdown[rate] = { net: 0, vat: 0, gross: 0 };
      vatBreakdown[rate].net += (inv as any).net_amount;
      vatBreakdown[rate].vat += (inv as any).vat_amount;
      vatBreakdown[rate].gross += (inv as any).gross_amount;
    }

    const vatHtml = Object.entries(vatBreakdown)
      .sort(([a], [b]) => Number(b) - Number(a))
      .map(([rate, vals]) =>
        `<tr><td style="padding:6px 8px;">${rate}%</td><td style="padding:6px 8px;text-align:right;">${vals.net.toLocaleString()} Ft</td><td style="padding:6px 8px;text-align:right;">${vals.vat.toLocaleString()} Ft</td><td style="padding:6px 8px;text-align:right;font-weight:bold;">${vals.gross.toLocaleString()} Ft</td></tr>`
      ).join("");

    // Category breakdown
    const catLabels: Record<string, string> = {
      ingredient: "Alapanyagok", utility: "Rezsi", rent: "Bérleti díj",
      equipment: "Felszerelés", salary: "Bér", tax: "Adó",
      food_sale: "Étel értékesítés", other: "Egyéb",
    };
    const catTotals: Record<string, number> = {};
    for (const inv of all) {
      const label = catLabels[(inv as any).category] || (inv as any).category;
      const sign = (inv as any).type === "incoming" ? -1 : 1;
      catTotals[label] = (catTotals[label] || 0) + (inv as any).gross_amount * sign;
    }
    const catHtml = Object.entries(catTotals)
      .sort(([, a], [, b]) => b - a)
      .map(([cat, amount]) =>
        `<tr><td style="padding:6px 8px;">${cat}</td><td style="padding:6px 8px;text-align:right;font-weight:bold;">${amount.toLocaleString()} Ft</td></tr>`
      ).join("");

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">📊 Havi pénzügyi riport — ${monthLabel}</h2>
        
        <div style="display:flex;gap:12px;margin:20px 0;">
          <div style="flex:1;background:#f0fdf4;padding:16px;border-radius:8px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#666;">Bevétel</p>
            <p style="margin:4px 0;font-size:24px;font-weight:bold;color:#16a34a;">${totalIncome.toLocaleString()} Ft</p>
          </div>
          <div style="flex:1;background:#fef2f2;padding:16px;border-radius:8px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#666;">Kiadás</p>
            <p style="margin:4px 0;font-size:24px;font-weight:bold;color:#dc2626;">${totalExpense.toLocaleString()} Ft</p>
          </div>
          <div style="flex:1;background:${result >= 0 ? '#f0fdf4' : '#fef2f2'};padding:16px;border-radius:8px;text-align:center;">
            <p style="margin:0;font-size:12px;color:#666;">Eredmény</p>
            <p style="margin:4px 0;font-size:24px;font-weight:bold;color:${result >= 0 ? '#16a34a' : '#dc2626'};">${result.toLocaleString()} Ft</p>
          </div>
        </div>

        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
          <h3 style="margin-top:0;">📋 ÁFA összesítő</h3>
          <table style="width:100%;border-collapse:collapse;">
            <tr style="border-bottom:1px solid #ddd;"><th style="text-align:left;padding:6px 8px;">Kulcs</th><th style="text-align:right;padding:6px 8px;">Nettó</th><th style="text-align:right;padding:6px 8px;">ÁFA</th><th style="text-align:right;padding:6px 8px;">Bruttó</th></tr>
            ${vatHtml}
          </table>
        </div>

        <div style="background:#f8f9fa;padding:15px;border-radius:8px;margin:15px 0;">
          <h3 style="margin-top:0;">📂 Kategória bontás</h3>
          <table style="width:100%;border-collapse:collapse;">
            ${catHtml}
          </table>
        </div>

        <p style="color:#999;font-size:12px;margin-top:20px;">
          Automatikus havi riport — Kiscsibe rendelési rendszer · ${all.length} bizonylat alapján
        </p>
      </div>
    `;

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendApiKey);

    await resend.emails.send({
      from: "Kiscsibe Rendszer <rendeles@kiscsibe-etterem.hu>",
      to: ["kiscsibeetterem@gmail.com", "gataibence@gmail.com"],
      subject: `Kiscsibe havi riport — ${monthLabel} — Eredmény: ${result.toLocaleString()} Ft`,
      html: emailHtml,
    });

    console.log(`Monthly report sent for ${monthLabel}`);

    return new Response(
      JSON.stringify({ success: true, month: monthLabel, income: totalIncome, expense: totalExpense, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("send-monthly-report error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
