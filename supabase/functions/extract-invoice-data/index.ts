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
            role: "user",
            content: [
              { type: "image_url", image_url: { url: image_url } },
              {
                type: "text",
                text: "Extract all data from this Hungarian invoice/receipt image. Look for: partner name, tax ID (adószám), invoice number (számlaszám), issue date (kelt/kiállítás), due date (fizetési határidő), gross amount (bruttó összeg in HUF), VAT rate, and categorize it. Also extract line items if visible.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_invoice_data",
              description: "Extract structured data from a Hungarian invoice image.",
              parameters: {
                type: "object",
                properties: {
                  partner_name: { type: "string", description: "Name of the invoice issuer/partner" },
                  partner_tax_id: { type: "string", description: "Tax ID (adószám) of the partner, e.g. 12345678-2-42" },
                  invoice_number: { type: "string", description: "Invoice number (számlaszám)" },
                  issue_date: { type: "string", description: "Issue date in YYYY-MM-DD format" },
                  due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
                  gross_amount: { type: "integer", description: "Gross amount in HUF (integer)" },
                  vat_rate: { type: "integer", enum: [27, 5, 0], description: "VAT rate percentage" },
                  category: {
                    type: "string",
                    enum: ["ingredients", "utility", "rent", "equipment", "salary", "tax", "other"],
                    description: "Best guess category for this expense",
                  },
                  line_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit_price: { type: "number" },
                        line_total: { type: "number" },
                      },
                      required: ["description"],
                    },
                    description: "Individual line items from the invoice",
                  },
                },
                required: ["partner_name", "partner_tax_id", "invoice_number", "issue_date", "due_date", "gross_amount", "vat_rate", "category", "line_items"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_invoice_data" } },
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
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      throw new Error("No structured data returned from AI");
    }

    const extracted = JSON.parse(toolCall.function.arguments);
    console.log("Extracted invoice data:", JSON.stringify(extracted).substring(0, 200));

    return new Response(
      JSON.stringify({ success: true, data: extracted }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("extract-invoice-data error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
