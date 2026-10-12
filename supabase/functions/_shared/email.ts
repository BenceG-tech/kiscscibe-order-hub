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
export type ResendSource = ResendLike | (() => ResendLike);

/** Lazy client factory: missing key / constructor errors surface as a failed send, never a throw. */
export function lazyResend(make: (key: string) => ResendLike, getKey: () => string | undefined): () => ResendLike {
  let client: ResendLike | null = null;
  return () => {
    if (!client) {
      const key = getKey();
      if (!key) throw new Error("RESEND_API_KEY not configured");
      client = make(key);
    }
    return client;
  };
}

export async function sendEmail(
  resend: ResendSource,
  payload: { to: string[]; subject: string; html: string; text?: string; reply_to?: string },
): Promise<SendOutcome> {
  try {
    const client = typeof resend === "function" ? resend() : resend;
    const res = await client.emails.send({
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

export interface BulkResult { sent: number; failed: number; errors: string[] }

/** Sends one email per recipient (batched); counts only strict provider acceptances. */
export async function sendToMany(
  resend: ResendSource,
  recipients: string[],
  payload: { subject: string; html: string },
  batchSize = 50,
): Promise<BulkResult> {
  const result: BulkResult = { sent: 0, failed: 0, errors: [] };
  for (let i = 0; i < recipients.length; i += batchSize) {
    await Promise.all(recipients.slice(i, i + batchSize).map(async (to) => {
      const out = await sendEmail(resend, { to: [to], ...payload });
      if (out.ok) result.sent++;
      else { result.failed++; result.errors.push(`${maskEmail(to)}: ${out.error}`); }
    }));
  }
  return result;
}

/** Campaign outcome: all-failed is a failure; partial is flagged. */
export function campaignOutcome(r: BulkResult): { success: boolean; partial: boolean; status: number } {
  if (r.sent === 0) return { success: false, partial: false, status: 502 };
  return { success: true, partial: r.failed > 0, status: 200 };
}
