import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateInput(body: Record<string, unknown>): {
  name: string;
  email: string;
  phone: string;
  message: string;
} {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (!name || name.length > 100) {
    throw new Error("A név megadása kötelező (max 100 karakter).");
  }
  if (!email || email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Érvényes email cím megadása kötelező (max 255 karakter).");
  }
  if (phone.length > 30) {
    throw new Error("A telefonszám túl hosszú (max 30 karakter).");
  }
  if (!message || message.length > 2000) {
    throw new Error("Az üzenet megadása kötelező (max 2000 karakter).");
  }

  return { name, email, phone, message };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  const preflight = handleCorsPreflightRequest(req);
  if (preflight) return preflight;

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY not configured");
      throw new Error("Email szolgáltatás nincs konfigurálva.");
    }

    const resend = new Resend(resendApiKey);
    const body = await req.json();
    const { name, email, phone, message } = validateInput(body);

    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safePhone = escapeHtml(phone || "Nem adott meg");
    const safeMessage = escapeHtml(message);
    const timestamp = new Date().toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });

    // Send notification to restaurant
    await resend.emails.send({
      from: "Kiscsibe Weboldal <onboarding@resend.dev>",
      to: ["info@kiscsibeetterem.hu"],
      subject: `Új üzenet a weboldalról - ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 10px;">
            Új üzenet a weboldalról
          </h2>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555; width: 120px;">Feladó neve:</td>
              <td style="padding: 8px 12px;">${safeName}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Email:</td>
              <td style="padding: 8px 12px;"><a href="mailto:${safeEmail}">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Telefon:</td>
              <td style="padding: 8px 12px;">${safePhone}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
              <td style="padding: 8px 12px; font-weight: bold; color: #555;">Küldés ideje:</td>
              <td style="padding: 8px 12px;">${timestamp}</td>
            </tr>
          </table>
          <div style="background-color: #f5f5f5; padding: 16px; border-radius: 8px; margin-top: 16px;">
            <h3 style="margin-top: 0; color: #333;">Üzenet:</h3>
            <p style="white-space: pre-wrap; line-height: 1.6;">${safeMessage}</p>
          </div>
        </div>
      `,
    });

    // Send confirmation to sender
    await resend.emails.send({
      from: "Kiscsibe Reggeliző & Étterem <onboarding@resend.dev>",
      to: [email],
      subject: "Kiscsibe - Megkaptuk üzenetét",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #d97706;">Köszönjük üzenetét!</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Kedves ${safeName},
          </p>
          <p style="font-size: 16px; line-height: 1.6; color: #333;">
            Megkaptuk üzenetét. Munkatársaink általában <strong>24 órán belül</strong> válaszolnak.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
          <div style="color: #666; font-size: 14px;">
            <p style="margin: 4px 0;"><strong>Kiscsibe Reggeliző & Étterem</strong></p>
            <p style="margin: 4px 0;">📍 1145 Budapest, Vezér utca 12.</p>
            
            <p style="margin: 4px 0;">✉️ info@kiscsibeetterem.hu</p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba történt.";
    console.error("send-contact-email error:", message);
    return new Response(
      JSON.stringify({ error: message }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
