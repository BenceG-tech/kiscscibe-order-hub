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

    const { item_id, item_name, prompt_override, style } = await req.json();

    if (!item_name) {
      return new Response(
        JSON.stringify({ error: "item_name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

    const angles = ["45 degree", "55 degree", "65 degree", "70 degree slightly overhead", "low close angle"];
    const lights = ["soft natural daylight from the left", "warm window light from the right", "soft diffused overhead daylight", "golden hour warm light"];
    const surfaces = ["dark slate stone table", "dark walnut wooden table", "weathered oak wooden table", "rustic dark pine table"];
    const garnishes = ["a small sprig of fresh parsley", "a few fresh dill leaves", "a pinch of paprika dust on the rim", "a small lemon wedge on the side", "no garnish"];
    const compositions = ["food slightly off-center to the right", "food centered", "food slightly off-center to the left", "close-up filling most of the frame"];

    const variation = `Composition: ${pick(angles)}, ${pick(lights)}, ${pick(surfaces)}. Plating: ${pick(compositions)}, ${pick(garnishes)}. Variation seed #${Math.floor(Math.random() * 1_000_000)}.`;

    const platePrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served on a simple white oval disposable paper/plastic plate. Homestyle, generous portion, realistic everyday Hungarian restaurant presentation — NOT studio fine-dining food photography. Photorealistic, sharp focus on the food. ${variation}`;

    const boxPrompt = `Authentic Hungarian restaurant takeaway photo of "${item_name}". Served inside an open brown kraft cardboard takeaway box lined with red-and-white checkered (vichy / gingham pattern) parchment paper. Wooden restaurant table background, slightly out of focus. Optionally a tiny fresh garnish of lettuce, tomato slice and cucumber on the side. Homestyle, generous portion. Photorealistic, NOT studio fine-dining food photography. ${variation}`;

    const chosenStyle = style === "plate" || style === "box"
      ? style
      : (Math.random() < 0.5 ? "plate" : "box");

    const prompt = prompt_override || (chosenStyle === "plate" ? platePrompt : boxPrompt);

    console.log(`Generating image for: ${item_name}`);

    // Call Nano Banana (Gemini Flash Image)
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "user", content: prompt }
        ],
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
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const imageData = aiData.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageData) {
      throw new Error("No image generated from AI");
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
