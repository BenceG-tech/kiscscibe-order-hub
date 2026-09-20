// Shared HMAC rating-token scheme.
// MUST stay in sync with supabase/functions/submit-rating/index.ts verification.
export async function generateRatingToken(orderId: string): Promise<string> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`rating:${orderId}`));
  const bytes = new Uint8Array(sig);
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "").slice(0, 32);
}

/** Canonical public site URL used in all customer-facing email links. */
export const SITE_URL = "https://kiscsibeetterem.hu";

/** Mask an email address so console logs never contain the full address. */
export function maskEmail(email: string | null | undefined): string {
  if (!email) return "(none)";
  const [local, domain] = String(email).split("@");
  if (!domain) return "***";
  return `${local.slice(0, 1)}***@${domain}`;
}

/** Build the 1–5 emoji rating links block. */
export function ratingLinksHtml(orderId: string, token: string): string {
  return [1, 2, 3, 4, 5].map((r) => {
    const url = `${SITE_URL}/rate?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}&rating=${r}`;
    const emoji = r <= 2 ? "😞" : r === 3 ? "😐" : r === 4 ? "😊" : "🤩";
    return `<a href="${url}" style="text-decoration:none;font-size:32px;margin:0 4px;">${emoji}</a>`;
  }).join("");
}

type LogArgs = {
  order_id: string | null;
  email_type: string;
  recipient: string;
  status: "sent" | "failed" | "skipped";
  resend_message_id?: string | null;
  error?: string | null;
};

/** Best-effort insert into email_send_log. Never throws. */
export async function logEmailSend(
  supabase: { from: (t: string) => { insert: (v: unknown) => Promise<{ error: unknown }> } },
  args: LogArgs,
): Promise<void> {
  try {
    const { error } = await supabase.from("email_send_log").insert({
      order_id: args.order_id,
      email_type: args.email_type,
      recipient: args.recipient,
      status: args.status,
      resend_message_id: args.resend_message_id ?? null,
      error: args.error ? String(args.error).slice(0, 1000) : null,
    });
    if (error) console.error("email_send_log insert failed:", error);
  } catch (e) {
    console.error("email_send_log insert threw:", e);
  }
}
