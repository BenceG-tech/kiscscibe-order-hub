import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export const STATUS_EMAIL_WARNING = "A státusz mentve, de az e-mail értesítést nem sikerült elküldeni.";

/** Strict: only {success:true} with a non-empty id, or already_sent/skipped, counts as success. */
export function interpretStatusEmailResponse(data: unknown): string | null {
  const d = data as Record<string, unknown> | null;
  if (!d || typeof d !== "object") return "Malformed response";
  if (d.success !== true) return String(d.error ?? "Status email rejected");
  if (d.already_sent === true || d.skipped === true) return null;
  if (typeof d.id === "string" && d.id.trim().length > 0) return null;
  return "Malformed response: missing message id";
}

/** Returns null on success, or a readable error. Never throws; status is never rolled back. */
export async function sendStatusEmail(orderId: string, newStatus: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.functions.invoke("send-order-status-email", {
      body: { order_id: orderId, new_status: newStatus },
    });
    if (error) {
      const details = error instanceof FunctionsHttpError ? await error.context.text() : error.message;
      console.error("Status email failed:", details);
      return details || "Status email failed";
    }
    const err = interpretStatusEmailResponse(data);
    if (err) console.error("Status email rejected:", err);
    return err;
  } catch (err) {
    console.error("Status email error:", err);
    return String(err);
  }
}
