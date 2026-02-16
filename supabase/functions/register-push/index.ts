import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const { phone, subscription } = await req.json();

    if (!phone || !subscription?.endpoint || !subscription?.keys) {
      throw new Error("Missing phone or subscription data");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Upsert subscription (update if endpoint exists, insert otherwise)
    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          phone,
          endpoint: subscription.endpoint,
          keys_json: subscription.keys,
        },
        { onConflict: "endpoint" }
      );

    if (error) throw error;

    console.log(`Push subscription registered for phone: ${phone}`);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("register-push error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
