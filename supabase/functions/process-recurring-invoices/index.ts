import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const today = new Date().toISOString().split("T")[0];
    console.log(`Processing recurring invoices for: ${today}`);

    // Fetch active recurring invoices where next_due_date <= today
    const { data: recurring, error: fetchError } = await supabase
      .from("recurring_invoices")
      .select("*")
      .eq("is_active", true)
      .lte("next_due_date", today);

    if (fetchError) throw fetchError;

    let created = 0;
    for (const rec of recurring || []) {
      // Create invoice
      const { error: insertError } = await supabase.from("invoices").insert({
        type: "incoming",
        status: "pending",
        partner_name: rec.partner_name,
        partner_tax_id: rec.partner_tax_id,
        category: rec.category,
        gross_amount: rec.gross_amount,
        net_amount: rec.net_amount,
        vat_amount: rec.vat_amount,
        vat_rate: rec.vat_rate,
        issue_date: today,
        due_date: rec.next_due_date,
        notes: rec.notes ? `[Ismétlődő] ${rec.notes}` : "[Ismétlődő számla]",
      });

      if (insertError) {
        console.error(`Failed to create invoice for ${rec.partner_name}:`, insertError);
        continue;
      }

      // Calculate next due date
      const currentDue = new Date(rec.next_due_date);
      let nextDue: Date;
      if (rec.frequency === "monthly") {
        nextDue = new Date(currentDue.getFullYear(), currentDue.getMonth() + 1, rec.day_of_month);
      } else if (rec.frequency === "quarterly") {
        nextDue = new Date(currentDue.getFullYear(), currentDue.getMonth() + 3, rec.day_of_month);
      } else {
        nextDue = new Date(currentDue.getFullYear() + 1, currentDue.getMonth(), rec.day_of_month);
      }

      const nextDueStr = nextDue.toISOString().split("T")[0];
      await supabase
        .from("recurring_invoices")
        .update({ next_due_date: nextDueStr })
        .eq("id", rec.id);

      created++;
      console.log(`Created invoice for ${rec.partner_name}, next due: ${nextDueStr}`);
    }

    return new Response(
      JSON.stringify({ success: true, processed: recurring?.length || 0, created }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("process-recurring-invoices error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
