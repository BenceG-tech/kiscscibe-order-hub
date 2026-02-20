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

    const { image_url } = await req.json();

    if (!image_url) {
      return new Response(
        JSON.stringify({ error: "image_url is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting invoice data from:", image_url.substring(0, 80));

    // Try with Gemini vision model through Lovable gateway
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an invoice data extraction assistant. You extract structured data from Hungarian invoice/receipt images. Always respond with valid JSON only. If you cannot read a field, use null.",
          },
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image_url } },
              {
                type: "text",
                text: `Ez egy magyar számla/bizonylat. Olvasd ki a következő adatokat és válaszolj KIZÁRÓLAG JSON formátumban, semmi mást ne írj:
{
  "partner_name": "kiállító/szállító neve (string vagy null)",
  "partner_tax_id": "adószám formátum: XXXXXXXX-X-XX (string vagy null)",
  "invoice_number": "számla sorszáma (string vagy null)",
  "issue_date": "kiállítás dátuma YYYY-MM-DD formátumban (string vagy null)",
  "due_date": "fizetési határidő YYYY-MM-DD formátumban (string vagy null)",
  "gross_amount": "bruttó végösszeg egész szám HUF-ban (number vagy null)",
  "vat_rate": "fő ÁFA kulcs számként pl. 27 (number vagy null)",
  "category": "tippeld meg: ingredients/utility/rent/equipment/salary/tax/other (string)",
  "line_items": [{"description": "tétel neve", "quantity": 1, "unit_price": 0, "line_total": 0}]
}
Ha egy mezőt nem tudsz kiolvasni, írd null-nak. NE találj ki adatokat.`,
              },
            ],
          },
        ],
        max_tokens: 2000,
        temperature: 0.1,
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
          JSON.stringify({ error: "AI kredit elfogyott." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error(`AI gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();

    // Try to get structured data from tool_calls first, then from message content
    let extracted: any = null;

    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extracted = JSON.parse(toolCall.function.arguments);
      } catch {
        console.log("Failed to parse tool_call arguments");
      }
    }

    if (!extracted) {
      // Parse from message content (direct JSON response)
      const content = aiData.choices?.[0]?.message?.content || "";
      console.log("AI response content:", content.substring(0, 300));

      // Extract JSON from the response, handling markdown code blocks
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      } else {
        // Try to find JSON object directly
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          jsonStr = objMatch[0];
        }
      }

      try {
        extracted = JSON.parse(jsonStr);
      } catch (e) {
        console.error("Failed to parse JSON from AI response:", jsonStr.substring(0, 200));
        throw new Error("Nem sikerült a számla adatokat feldolgozni. Próbáld újra tisztább képpel.");
      }
    }

    if (!extracted || typeof extracted !== "object") {
      throw new Error("No structured data returned from AI");
    }

    // Clean up the extracted data
    const cleaned = {
      partner_name: extracted.partner_name || null,
      partner_tax_id: extracted.partner_tax_id || null,
      invoice_number: extracted.invoice_number || null,
      issue_date: extracted.issue_date || null,
      due_date: extracted.due_date || null,
      gross_amount: typeof extracted.gross_amount === "number" ? Math.round(extracted.gross_amount) : null,
      vat_rate: typeof extracted.vat_rate === "number" ? extracted.vat_rate : null,
      category: extracted.category || "other",
      line_items: Array.isArray(extracted.line_items) ? extracted.line_items : [],
    };

    console.log("Extracted invoice data:", JSON.stringify(cleaned).substring(0, 200));

    return new Response(
      JSON.stringify({ success: true, data: cleaned }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-invoice-data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
