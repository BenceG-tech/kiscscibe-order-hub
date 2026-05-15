import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";
import { requireAdmin } from "../_shared/auth.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  const auth = await requireAdmin(req, corsHeaders, { allowStaff: true });
  if (!auth.ok) return auth.response;

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const { image_url, document_text, file_name, file_type, source } = await req.json();

    if (!image_url && !document_text) {
      return new Response(
        JSON.stringify({ error: "image_url or document_text is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Extracting invoice data from:", file_name || image_url?.substring(0, 80) || "document_text");

    const content: Array<Record<string, unknown>> = [];
    if (image_url) content.push({ type: "image_url", image_url: { url: image_url } });
    content.push({
      type: "text",
      text: document_text
        ? `Extract structured data from this Hungarian invoice/receipt text. Source: ${source || "pdf_text"}. File: ${file_name || "unknown"} (${file_type || "unknown"}).\n\nIMPORTANT RULES:\n- Do not guess. If a field is ambiguous, missing, unreadable, or low confidence, return an empty string for text/date fields or omit numeric value by returning 0 only when the printed value is actually 0.\n- Prefer the final payable gross total (bruttó / fizetendő / összesen) over subtotals.\n- If multiple possible due dates or invoice numbers exist and you are not sure, leave it empty and add that field to needs_review.\n- Only include line_items if the item rows are clearly readable.\n\nDocument text:\n${String(document_text).slice(0, 18000)}`
        : "Extract all reliable data from this Hungarian invoice/receipt image. Do not guess: leave ambiguous or unreadable fields empty and list them in needs_review. Look for partner name, tax ID, invoice number, issue date, due date, final gross amount in HUF, VAT rate, category, and clearly visible line items including unit where possible.",
    });

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
            content,
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
                  partner_name: { type: "string", description: "Name of the invoice issuer/partner, empty if uncertain" },
                  partner_tax_id: { type: "string", description: "Tax ID (adószám), empty if uncertain" },
                  invoice_number: { type: "string", description: "Invoice number (számlaszám), empty if uncertain" },
                  issue_date: { type: "string", description: "Issue date in YYYY-MM-DD format, empty if uncertain" },
                  due_date: { type: "string", description: "Due date in YYYY-MM-DD format, empty if uncertain" },
                  gross_amount: { type: "integer", description: "Final gross amount in HUF, 0 if uncertain" },
                  vat_rate: { type: "integer", enum: [27, 5, 0], description: "VAT rate percentage" },
                  category: {
                    type: "string",
                    enum: ["ingredients", "utility", "rent", "equipment", "salary", "tax", "other"],
                    description: "Best guess category for this expense",
                  },
                  confidence: { type: "string", enum: ["magas", "közepes", "alacsony"], description: "How confident the extraction is" },
                  source: { type: "string", enum: ["image", "pdf_text", "pdf_image"], description: "Input source used for extraction" },
                  filled_fields: { type: "array", items: { type: "string" }, description: "Fields that were filled confidently" },
                  needs_review: { type: "array", items: { type: "string" }, description: "Fields intentionally left empty or requiring manual admin review" },
                  line_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        description: { type: "string" },
                        quantity: { type: "number" },
                        unit: { type: "string", description: "Unit like db, kg, l, csomag if visible" },
                        unit_price: { type: "number" },
                        line_total: { type: "number" },
                      },
                      required: ["description"],
                    },
                    description: "Individual line items from the invoice",
                  },
                },
                required: ["partner_name", "partner_tax_id", "invoice_number", "issue_date", "due_date", "gross_amount", "vat_rate", "category", "confidence", "source", "filled_fields", "needs_review", "line_items"],
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
