import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const { item_id, item_name, prompt_override, style, dish_kind: dish_kind_override } = await req.json();

    if (!item_name) {
      return new Response(
        JSON.stringify({ error: "item_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const angles = ["45 degree", "55 degree", "65 degree", "70 degree slightly overhead"];
    const lights = ["soft natural daylight from the left", "warm window light from the right", "soft diffused overhead daylight", "golden hour warm light"];
    const garnishes = ["a small sprig of fresh parsley", "a few fresh dill leaves", "a pinch of paprika dust on the rim", "no garnish"];
    const compositions = ["food slightly off-center to the right", "food centered", "food slightly off-center to the left", "close-up filling most of the frame"];

    // CONSISTENT surface — always dark slate stone table (brand-locked)
    const SURFACE = "dark slate stone table";

    const variation = `Composition: ${pick(angles)}, ${pick(lights)}, ${SURFACE}. Plating: ${pick(compositions)}, ${pick(garnishes)}. Variation seed #${Math.floor(Math.random() * 1_000_000)}.`;

    // Detect dish kind from item name (accent + case insensitive)
    const normalized = item_name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const SOUP_KEYWORDS = ["leves", "consomme", "husleves", "bouillon", "ragulev"];
    const SAUCY_KEYWORDS = [
      "porkolt", "paprikas", "tokany", "ragu", "solet", "gulyas",
      "martas", "becsinalt", "babgulyas", "lecso", "korompork",
      "csulokporkolt", "vadas", "csahi", "stefania", "rakott",
      "toltott kaposzta", "babfozelek", "fozelek", "halaszle",
    ];

    let dish_kind: "soup" | "saucy" | "main" = "main";
    if (SOUP_KEYWORDS.some((k) => normalized.includes(k))) {
      dish_kind = "soup";
    } else if (SAUCY_KEYWORDS.some((k) => normalized.includes(k))) {
      dish_kind = "saucy";
    }
    if (dish_kind_override === "soup" || dish_kind_override === "saucy" || dish_kind_override === "main") {
      dish_kind = dish_kind_override;
    }

    const soupPrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served in a simple plain white ROUND disposable paper DEEP soup bowl (papír mélytányér, kerek, mély) — NOT oval, NOT a flat plate, NOT ceramic. Broth and ingredients clearly visible inside the bowl. Homestyle, generous portion. Photorealistic, sharp focus on the food, NOT studio fine-dining. ${variation}`;

    const saucyPrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served in a simple plain white ROUND disposable paper DEEP plate (papír mélytányér, kerek, mély) so the sauce stays contained — NOT oval, NOT a flat plate, NOT ceramic. Generous homestyle portion. Photorealistic, sharp focus on the food, NOT studio fine-dining. ${variation}`;

    const mainPrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served on a simple plain white ROUND FLAT disposable paper plate (kerek, lapos papírtányér) — STRICTLY NOT oval, NOT square, NOT rectangular, NOT ceramic, NOT a deep bowl. Homestyle, generous portion. Photorealistic, sharp focus on the food, NOT studio fine-dining. ${variation}`;

    const boxPrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served inside an open brown kraft cardboard takeaway box lined with red-and-white checkered (vichy / gingham pattern) parchment paper, on a ${SURFACE}. Optionally a tiny fresh garnish of lettuce, tomato slice and cucumber on the side. Homestyle, generous portion. Photorealistic, NOT studio fine-dining food photography. Composition: ${pick(angles)}, ${pick(lights)}.`;

    // Resolve final prompt
    let prompt: string;
    if (prompt_override) {
      prompt = prompt_override;
    } else if (style === "box") {
      prompt = boxPrompt;
    } else {
      // style === "plate" OR undefined → pick by dish_kind
      prompt = dish_kind === "soup" ? soupPrompt : dish_kind === "saucy" ? saucyPrompt : mainPrompt;
    }

    console.log(`Generating image for: ${item_name} (dish_kind=${dish_kind}, style=${style ?? "auto"})`);

    // Retry loop — Gemini Flash Image occasionally returns text-only responses
    let imageData: string | undefined;
    let lastErrText = "";
    const MAX_ATTEMPTS = 3;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      const promptForAttempt = attempt === 1
        ? prompt
        : `IMPORTANT: Return an IMAGE in the response, not text. ${prompt}`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: promptForAttempt }],
          modalities: ["image", "text"],
        }),
      });

      if (!aiResponse.ok) {
        if (aiResponse.status === 429) {
          return new Response(
            JSON.stringify({ error: "Túl sok kérés, próbáld újra később." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (aiResponse.status === 402) {
          return new Response(
            JSON.stringify({ error: "AI kredit elfogyott, kérlek tölts fel kreditet." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        lastErrText = await aiResponse.text();
        console.error(`AI gateway error (attempt ${attempt}/${MAX_ATTEMPTS}):`, aiResponse.status, lastErrText);
        if (attempt === MAX_ATTEMPTS) {
          return new Response(
            JSON.stringify({ error: "Az AI most nem tudott képet generálni, próbáld újra pár másodperc múlva." }),
            { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        continue;
      }

      const aiData = await aiResponse.json();
      imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (imageData) break;

      console.warn(`No image in response (attempt ${attempt}/${MAX_ATTEMPTS}). Retrying...`);
    }

    if (!imageData) {
      return new Response(
        JSON.stringify({ error: "Az AI most nem tudott képet generálni, próbáld újra pár másodperc múlva." }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extract base64 data
    const base64Match = imageData.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      throw new Error("Invalid image data format");
    }

    const imageExt = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const base64Content = base64Match[2];

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Content);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const fileId = item_id || crypto.randomUUID();
    const folder = item_id ? "ai-generated" : "ai-generated/standalone";
    // Always use a unique filename so subsequent generations don't get cached behind the same URL
    const filePath = `${folder}/${fileId}-${Date.now()}.${imageExt}`;
    const contentType = `image/${base64Match[1]}`;

    const uploadResponse = await fetch(
      `${SUPABASE_URL}/storage/v1/object/menu-images/${filePath}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: bytes,
      }
    );

    if (!uploadResponse.ok) {
      const uploadErr = await uploadResponse.text();
      console.error("Storage upload error:", uploadErr);
      throw new Error("Failed to upload image to storage");
    }

    // Get public URL
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/menu-images/${filePath}`;

    // Update menu item only when item_id provided
    if (item_id) {
      const updateResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/menu_items?id=eq.${item_id}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            apikey: SUPABASE_SERVICE_ROLE_KEY,
            "Content-Type": "application/json",
            Prefer: "return=minimal",
          },
          body: JSON.stringify({ image_url: publicUrl }),
        }
      );

      if (!updateResponse.ok) {
        console.error("DB update error:", await updateResponse.text());
        throw new Error("Failed to update menu item image URL");
      }
    }

    console.log(`Successfully generated image for ${item_name}: ${publicUrl}`);

    return new Response(
      JSON.stringify({ success: true, image_url: publicUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("generate-food-image error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
