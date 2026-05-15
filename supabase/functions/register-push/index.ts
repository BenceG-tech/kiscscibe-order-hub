import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    // Require authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { phone, subscription } = body ?? {};

    if (typeof phone !== "string" || !phone.trim() || phone.length > 30) {
      return new Response(JSON.stringify({ error: "Invalid phone" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (
      !subscription ||
      typeof subscription.endpoint !== "string" ||
      !subscription.endpoint.startsWith("https://") ||
      !subscription.keys ||
      typeof subscription.keys !== "object"
    ) {
      return new Response(JSON.stringify({ error: "Invalid subscription" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(url, service);

    // Verify the phone belongs to the authenticated user via their order history
    const { data: ownedOrder } = await supabase
      .from("orders")
      .select("id")
      .eq("phone", phone)
      .eq("user_id", userData.user.id)
      .limit(1)
      .maybeSingle();

    if (!ownedOrder) {
      // Fallback: allow profile.phone match
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone")
        .eq("user_id", userData.user.id)
        .maybeSingle();
      if (!profile || profile.phone !== phone) {
        return new Response(JSON.stringify({ error: "Phone not associated with this account" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const { error } = await supabase
      .from("push_subscriptions")
      .upsert(
        {
          phone,
          endpoint: subscription.endpoint,
          keys_json: subscription.keys,
        },
        { onConflict: "endpoint" },
      );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("register-push error:", error);
    return new Response(JSON.stringify({ error: "Server error" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
