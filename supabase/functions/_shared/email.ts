// Shared sender configuration + strict Resend result handling.
// Canonical domain: kiscsibeetterem.hu (no hyphen). The hyphenated domain is obsolete.

export const EMAIL_DOMAIN = "kiscsibeetterem.hu";
export const SENDER_ADDRESS = `rendeles@${EMAIL_DOMAIN}`;
export const SENDER_NAME = "KisCsibe Étterem";
export const EMAIL_FROM = `${SENDER_NAME} <${SENDER_ADDRESS}>`;
export const EMAIL_REPLY_TO = `info@${EMAIL_DOMAIN}`;
export const SITE_URL = `https://${EMAIL_DOMAIN}`;

export type SendOutcome =
  | { ok: true; id: string }
  | { ok: false; id: null; error: string };

/**
 * A send counts as accepted ONLY when the provider returned no error AND a
 * non-empty message id. Resend resolves (does not throw) on 4xx like 403
 * "domain not verified", so callers must never treat a resolved promise as success.
 */
export function interpretResendResult(res: unknown): SendOutcome {
  // deno-lint-ignore no-explicit-any
  const r = res as any;
  if (r?.error) {
    const e = r.error;
    const msg = typeof e === "string" ? e : (e?.message ?? JSON.stringify(e));
    const code = e?.statusCode ?? e?.name;
    return { ok: false, id: null, error: code ? `[${code}] ${msg}` : String(msg) };
  }
  const id = r?.data?.id;
  if (typeof id === "string" && id.trim().length > 0) return { ok: true, id };
  return { ok: false, id: null, error: "Provider returned no message id" };
}

export interface ResendLike {
  emails: { send: (payload: Record<string, unknown>) => Promise<unknown> };
}

/** Sends with canonical from/reply_to (caller may override reply_to) and never throws. */
export async function sendEmail(
  resend: ResendLike,
  payload: { to: string[]; subject: string; html: string; text?: string; reply_to?: string },
): Promise<SendOutcome> {
  try {
    const res = await resend.emails.send({
      from: EMAIL_FROM,
      reply_to: EMAIL_REPLY_TO,
      ...payload,
    });
    return interpretResendResult(res);
  } catch (err) {
    return { ok: false, id: null, error: String((err as Error)?.message ?? err) };
  }
}

export function maskEmail(email: string): string {
  const [u, d] = String(email || "").split("@");
  if (!d) return "***";
  return `${u.slice(0, 1)}***@${d}`;
}
