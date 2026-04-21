import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const { date, tone, postType, style } = await req.json();
    if (!date) throw new Error("date is required");
    const toneLabel = tone || "étvágygerjesztő";
    const postTypeVal: "holnapi" | "mai_elkeszult" | "heti_indito" = postType || "holnapi";
    const styleVal: "kiscsibe" | "egyszeru" = style || "kiscsibe";

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
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const result = data[0];
    const items = Array.isArray(result.items) ? result.items : [];

    const menuItems = items.filter((i: any) => i.is_menu_part);
    const alacarteItems = items.filter((i: any) => !i.is_menu_part);

    const menuPrice = result.menu_price_huf || 2200;

    const menuDescription = menuItems.length > 0
      ? `Menü kombó: ${menuItems.map((i: any) => i.item_name).join(" + ")} (${menuPrice} Ft)`
      : "";

    const alacarteDescription = alacarteItems
      .map((i: any) => `- ${i.item_name} (${i.item_price_huf} Ft)`)
      .join("\n");

    const dayNames = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];
    const dateObj = new Date(date + "T00:00:00");
    const dayName = dayNames[dateObj.getDay()];
    const month = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const dayUpper = dayName.toUpperCase();

    // ============ EGYSZERŰ STÍLUS (régi) ============
    if (styleVal === "egyszeru") {
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
- A hangnem legyen "${toneLabel}"
- Említsd meg az étterem nevét: Kiscsibe
- Az ételneveket ne fordítsd le, írd helyesen
- Tegyél hashtag-eket a végére (max 4)
- Ne használj linkeket`,
            },
            {
              role: "user",
              content: `Dátum: ${month}.${day}. ${dayName}\n${menuDescription}\n${alacarteDescription ? `Napi ételek:\n${alacarteDescription}` : ""}\n${result.offer_note ? `Megjegyzés: ${result.offer_note}` : ""}`,
            },
          ],
          tools: [{
            type: "function",
            function: {
              name: "create_post",
              description: "Facebook poszt létrehozása",
              parameters: {
                type: "object",
                properties: {
                  post_text: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } },
                },
                required: ["post_text", "hashtags"],
                additionalProperties: false,
              },
            },
          }],
          tool_choice: { type: "function", function: { name: "create_post" } },
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "Túl sok kérés, próbáld újra később." }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (response.status === 402) {
          return new Response(JSON.stringify({ error: "AI szolgáltatás korlát elérve." }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error("AI gateway error");
      }

      const aiResult = await response.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        return new Response(JSON.stringify({ error: "Az AI nem tudott posztot generálni." }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(
        JSON.stringify({ style: "egyszeru", post_text: parsed.post_text, hashtags: parsed.hashtags || [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============ KISCSIBE STÍLUS (gazdag) ============

    // Post type specifikus instrukciók
    const typeInstructions: Record<string, { titleHint: string; hookHint: string; vibe: string }> = {
      holnapi: {
        titleHint: `🔥 HOLNAPI NAPI AJÁNLAT – ${dayUpper} (${String(month).padStart(2, "0")}.${String(day).padStart(2, "0")}.) 🔥  vagy  🔥 ${dayUpper} = ÚJABB KISCSIBE NAPI MENÜ! 🍽️`,
        hookHint: "Előzetes hangulat: 'Holnap sem maradsz éhesen… sőt 😏👇' vagy 'Ha egy igazán ütős, házias ebédre vágysz… holnap is nálunk a helyed! 👇'",
        vibe: "Holnapi előzetes — felkeltjük az érdeklődést, kedvet csinálunk a holnapi ebédhez.",
      },
      mai_elkeszult: {
        titleHint: `🔥 ELKÉSZÜLTEK A MAI ÉTELEK! 🍽️  vagy  🔥 ELKÉSZÜLTEK A MAI FINOMSÁGOK! 🍗🍝🥗`,
        hookHint: "Mai 'kész van' hangulat: 'Illatok már az utcán… te mikor jössz? 😏👇' vagy 'Na ez most tényleg az a nap, amikor nem érdemes főzni otthon… 😏👇'",
        vibe: "Mai elkészült — a kaja már a pulton, gyors, sürgető, étvágygerjesztő. Mintha az illat már szállna.",
      },
      heti_indito: {
        titleHint: `🚀 HÉTFŐI INDÍTÁS A KISCSIBÉBEN! 🍗🔥  vagy  🚀 ÚJ HÉT, ÚJ MENÜ! 🔥`,
        hookHint: "Heti indító: 'Ha erősen indulna a hét, nálunk megvan hozzá az üzemanyag 😏👇' vagy 'Indítsd jól a hetet egy igazi házias ebéddel!'",
        vibe: "Heti indító — energikus, motiváló, 'gyere és kezdjük jól a hetet' érzés.",
      },
    };

    const typeInfo = typeInstructions[postTypeVal];

    const systemPrompt = `Te egy magyar étterem (Kiscsibe Reggeliző Étterem, Budapest, Zugló, Vezér utca 110.) Facebook közösségi média menedzsere vagy. Írj egy autentikus, Kiscsibe-stílusú posztot a megadott napi ajánlatról.

═══════ KÖTELEZŐ STRUKTÚRA ═══════

A poszt PONTOSAN ezekből a részekből áll, ebben a sorrendben:

1) **title** — CSUPA NAGYBETŰS címsor 🔥 emoji-val az elején és egy másik emoji-val a végén
   Példa stílus: ${typeInfo.titleHint}

2) **hook** — 1-2 mondatos bevezető, kacsintós/közvetlen hangnem, mindig 😏👇 vagy 😎👇 emoji-val végződik
   ${typeInfo.hookHint}

3) **items** — Tömb, MINDEN ételhez egy ÉTELHEZ ILLŐ EGYEDI emoji + jelzős, étvágygerjesztő ételnév
   Emoji szabályok:
   - leves → 🍲 vagy 🍅 (ha tomatos) vagy 🥣
   - sertés/disznó → 🥩 vagy 🐷
   - csirke → 🍗 vagy 🐔
   - hal → 🐟 vagy 🐠
   - sajt/sajtos → 🧀
   - tészta/spagetti → 🍝
   - krumpli/burgonya → 🥔
   - rántott valami → 🍤 vagy 🥩
   - saláta → 🥗
   - főzelék → 🥦 vagy 🍲
   - palacsinta/desszert → 🥞 vagy 🍰
   - rizs → 🍚
   - virsli/kolbász → 🌭
   - tojás → 🍳
   - gomba → 🍄
   - káposzta → 🥬
   - tükörtojás → 🍳
   Az ételnévhez tegyél jelzőket: "Friss, ropogós...", "Szaftos...", "Aranybarnára sült...", "Krémes...", "Klasszikus...", "Omlós...", "Tartalmas..."
   Ha menü kombó van: az egyik item legyen 🔥 emoji-val és "menü kombó" jelzéssel (pl. "🔥 Sertéspaprikás krumplitésztával – na EZ a kombó!")

4) **closing** — 👉 emoji-val kezdődő záró ajánló mondat 😎 emoji-val végén
   Példák: "👉 Minden frissen készült, illatok már az utcán 😎" / "👉 Klasszikusok + egy kis extra csavar, Kiscsibe stílusban 😎" / "👉 Minden melegen, frissen, azonnal vihető!"

5) **schedule** — Több sor egymás alatt:
   ⏰ 11:30-tól várunk!
   💥 Menü: ${menuPrice.toLocaleString("hu-HU").replace(/,/g, ".")} Ft
   📍 1141 Budapest, Vezér utca 110.
   🥐 Reggeli: 7:00–10:00 között

6) **punchline** — Záró csattanó mondat 🔥 vagy 💥 vagy 😎 emoji-val
   Példák: "Ne maradj le… mert ezek gyorsan elfogynak! 🔥" / "Ne gondolkozz sokat… ebédidőben nálunk a helyed 😎" / "Gyere, mert ezek az ételek nem várnak sokáig… és mi sem! 💥"

7) **hashtags** — 6-10 hashtag, MINDIG tartalmazza:
   - #kiscsibe
   - #napiajanlat
   - #ebedido
   - #zuglo
   - #magyaros
   - #haziasizek vagy #hazias
   Plusz nap-specifikus (#${dayName}) és témaspecifikusak (#finom, #budapestfood, #gyerebe, #joetvagyat, #magyarkonyha, vagy konkrét ételhez kapcsolódó pl. #rantotthus, #csulok, #sztrapacska)

═══════ HANGULAT ═══════
${typeInfo.vibe}
Tone: ${toneLabel}. Magyaros, közvetlen, kicsit pimasz/közvetlen. NEM túl udvarias, NEM rideg. Mintha a tulaj írná.

═══════ FONTOS SZABÁLYOK ═══════
- NE használj linkeket
- Ne fordítsd le az ételneveket, magyarul, helyesen
- Az ételnevek első betűje legyen NAGY
- A jelzőket te találod ki — legyenek étvágygerjesztőek, NE generikusak
- A valódi posztok érzetét add vissza: élet, illat, sürgetés van a szövegben`;

    const userPrompt = `Dátum: ${month}.${day}. ${dayName}
Poszt típusa: ${postTypeVal}

Napi ételek (à la carte):
${alacarteDescription || "(nincs)"}

${menuItems.length > 0 ? `Menü kombó (egy árban):\n${menuItems.map((i: any) => `- [${i.menu_role}] ${i.item_name}`).join("\n")}\nMenü ára: ${menuPrice} Ft` : ""}

${result.offer_note ? `Megjegyzés: ${result.offer_note}` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "create_kiscsibe_post",
            description: "Kiscsibe-stílusú strukturált Facebook poszt létrehozása",
            parameters: {
              type: "object",
              properties: {
                title: { type: "string", description: "🔥 + CSUPA NAGYBETŰS címsor + emoji" },
                hook: { type: "string", description: "Bevezető 1-2 mondat, 😏👇 vagy 😎👇 a végén" },
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      emoji: { type: "string", description: "1 db ételhez illő emoji" },
                      text: { type: "string", description: "Jelzős, étvágygerjesztő ételnév (a kezdőbetű nagy)" },
                    },
                    required: ["emoji", "text"],
                    additionalProperties: false,
                  },
                },
                closing: { type: "string", description: "👉 záró ajánló 😎 emoji-val" },
                schedule: { type: "string", description: "Idő, ár, cím, reggeli — több sor egymás alatt emoji-kkal" },
                punchline: { type: "string", description: "Záró csattanó mondat emoji-val" },
                hashtags: {
                  type: "array",
                  items: { type: "string" },
                  description: "6-10 hashtag # nélkül vagy #-kel",
                },
              },
              required: ["title", "hook", "items", "closing", "schedule", "punchline", "hashtags"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "create_kiscsibe_post" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Túl sok kérés, próbáld újra később." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI szolgáltatás korlát elérve. Tölts fel kreditet." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        JSON.stringify({ error: "Az AI nem tudott posztot generálni." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const parsed = JSON.parse(toolCall.function.arguments);

    return new Response(
      JSON.stringify({
        style: "kiscsibe",
        title: parsed.title,
        hook: parsed.hook,
        items: parsed.items || [],
        closing: parsed.closing,
        schedule: parsed.schedule,
        punchline: parsed.punchline,
        hashtags: parsed.hashtags || [],
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("Facebook post gen error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Ismeretlen hiba" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
