import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

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
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Érvénytelen email cím.");
    }

    await resend.emails.send({
      from: "Kiscsibe Reggeliző & Étterem <onboarding@resend.dev>",
      to: [email],
      subject: "Köszönjük a feliratkozást! - Kiscsibe Étterem",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #fffbeb;">
          <div style="text-align: center; margin-bottom: 24px;">
            <h1 style="color: #d97706; font-size: 28px; margin: 0;">🐣 Kiscsibe Étterem</h1>
            <p style="color: #92400e; font-size: 14px; margin-top: 4px;">Reggeliző & Étterem</p>
          </div>
          
          <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
            <h2 style="color: #92400e; margin-top: 0;">Köszönjük a feliratkozást! 🎉</h2>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Örülünk, hogy feliratkoztál a heti menü hírlevelünkre!
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              <strong>Mire számíthatsz?</strong> Minden héten emailben elküldjük neked az aktuális heti menünket, 
              hogy időben megtervezhesd az ebédedet.
            </p>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              Addig is szeretettel várunk éttermünkben! 🍽️
            </p>
          </div>
          
          <hr style="border: none; border-top: 1px solid #fde68a; margin: 24px 0;" />
          
          <div style="color: #92400e; font-size: 14px; text-align: center;">
            <p style="margin: 4px 0;"><strong>Kiscsibe Reggeliző & Étterem</strong></p>
            <p style="margin: 4px 0;">📍 1145 Budapest, Vezér utca 12.</p>
            <p style="margin: 4px 0;">📞 +36 1 234 5678</p>
            <p style="margin: 4px 0;">✉️ info@kiscsibeetterem.hu</p>
          </div>
          
          <p style="font-size: 11px; color: #999; text-align: center; margin-top: 20px;">
            Ha nem te iratkoztál fel, vagy le szeretnél iratkozni, kérjük írj nekünk a info@kiscsibeetterem.hu címre.
          </p>
        </div>
      `,
    });

    console.log("Welcome newsletter sent to:", email);

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Ismeretlen hiba történt.";
    console.error("send-welcome-newsletter error:", message);
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
