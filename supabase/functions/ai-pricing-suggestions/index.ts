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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch last 90 days of order items with prices
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();

    const { data: orders, error: ordersError } = await supabase
      .from("orders")
      .select("id, created_at, total_huf")
      .gte("created_at", ninetyDaysAgo)
      .eq("status", "completed");

    if (ordersError) throw ordersError;

    const orderIds = (orders || []).map((o: any) => o.id);
    if (orderIds.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Nincs elegendő adat az elemzéshez (0 teljesített rendelés az elmúlt 90 napban)." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch order items in batches if needed
    const { data: orderItems, error: itemsError } = await supabase
      .from("order_items")
      .select("item_id, name_snapshot, qty, unit_price_huf")
      .in("order_id", orderIds.slice(0, 500));

    if (itemsError) throw itemsError;

    // Aggregate: group by item name + price
    const aggregated: Record<string, { name: string; prices: Record<number, number>; totalQty: number }> = {};

    for (const item of (orderItems || [])) {
      const key = item.name_snapshot;
      if (!aggregated[key]) {
        aggregated[key] = { name: key, prices: {}, totalQty: 0 };
      }
      aggregated[key].prices[item.unit_price_huf] = (aggregated[key].prices[item.unit_price_huf] || 0) + item.qty;
      aggregated[key].totalQty += item.qty;
    }

    // Filter items with at least 5 orders
    const relevantItems = Object.values(aggregated).filter(i => i.totalQty >= 5);

    if (relevantItems.length === 0) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Nincs elegendő adat az elemzéshez." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build prompt data
    const dataForAI = relevantItems.map(item => ({
      name: item.name,
      total_sold: item.totalQty,
      price_breakdown: Object.entries(item.prices).map(([price, qty]) => ({
        price_huf: Number(price),
        quantity_sold: qty
      }))
    }));

    // Call Lovable AI Gateway with tool calling
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Te egy tapasztalt éttermi árazási tanácsadó vagy. Elemezd az eladási adatokat és adj konkrét, gyakorlatias árazási javaslatokat magyarul. Minden javaslat legyen rövid (max 2 mondat) és tartalmazzon konkrét számokat. Csak olyan ételekre adj javaslatot ahol az adatok alapján érdemi változtatás indokolt.`
          },
          {
            role: "user",
            content: `Az elmúlt 90 nap eladási adatai:\n\n${JSON.stringify(dataForAI, null, 2)}\n\nAdj árazási javaslatokat! Maximum 8 javaslatot adj.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_pricing",
              description: "Árazási javaslatok visszaadása",
              parameters: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item_name: { type: "string", description: "Étel neve" },
                        current_price: { type: "number", description: "Jelenlegi leggyakoribb ár" },
                        suggested_price: { type: "number", description: "Javasolt ár (0 ha nem kell változtatni)" },
                        direction: { type: "string", enum: ["increase", "decrease", "keep"], description: "Ár irány" },
                        reasoning: { type: "string", description: "Rövid indoklás magyarul" }
                      },
                      required: ["item_name", "current_price", "suggested_price", "direction", "reasoning"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["suggestions"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "suggest_pricing" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Túl sok kérés, próbáld újra később." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI szolgáltatás korlát elérve." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" }
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ suggestions: [], message: "Az AI nem tudott javaslatokat generálni." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ suggestions: parsed.suggestions || [], orders_analyzed: orders?.length || 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("AI pricing error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ismeretlen hiba" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
