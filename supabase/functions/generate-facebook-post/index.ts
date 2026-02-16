import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const { date } = await req.json();
    if (!date) throw new Error("date is required");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch daily data
    const { data, error } = await supabase.rpc("get_daily_data", { target_date: date });
    if (error) throw error;

    if (!data || data.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nincs napi ajánlat erre a napra." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = data[0];
    const items = Array.isArray(result.items) ? result.items : [];

    const menuItems = items.filter((i: any) => i.is_menu_part);
    const alacarteItems = items.filter((i: any) => !i.is_menu_part);

    const menuDescription = menuItems.length > 0
      ? `Menü: ${menuItems.map((i: any) => i.item_name).join(" + ")} (${result.menu_price_huf || 2200} Ft)`
      : "";

    const alacarteDescription = alacarteItems
      .map((i: any) => `${i.item_name} (${i.item_price_huf} Ft)`)
      .join(", ");

    const dayNames = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    const dateObj = new Date(date + "T00:00:00");
    const dayName = dayNames[dateObj.getDay()];
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();

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
            content: `Írj egy rövid, hangulatos Facebook posztot magyarul egy étterem napi ajánlatáról. Szabályok:
- Maximum 300 karakter a poszt szöveg
- Használj emoji-kat mértékletesen (2-4 db)
- A hangnem legyen kedves, invitáló és barátságos
- Említsd meg az étterem nevét: Kiscsibe
- Az ételneveket ne fordítsd le, írd helyesen
- Tegyél hashtag-eket a végére (max 4)
- Ne használj linkeket`
          },
          {
            role: "user",
            content: `Dátum: ${month}.${day}. ${dayName}\n${menuDescription}\n${alacarteDescription ? `Napi ételek: ${alacarteDescription}` : ""}\n${result.offer_note ? `Megjegyzés: ${result.offer_note}` : ""}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "create_post",
              description: "Facebook poszt létrehozása",
              parameters: {
                type: "object",
                properties: {
                  post_text: { type: "string", description: "A Facebook poszt szövege" },
                  hashtags: { type: "array", items: { type: "string" }, description: "Hashtag-ek" }
                },
                required: ["post_text", "hashtags"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "create_post" } }
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
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: "Az AI nem tudott posztot generálni." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({ post_text: parsed.post_text, hashtags: parsed.hashtags || [] }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Facebook post gen error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ismeretlen hiba" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
