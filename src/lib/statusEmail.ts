import { FunctionsHttpError } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

/** Fire the status email; returns null on provider acceptance, or a readable error. Never throws. */
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
    if (data && data.success === false) {
      console.error("Status email rejected:", data.error);
      return String(data.error ?? "rejected");
    }
    return null;
  } catch (err) {
    console.error("Status email error:", err);
    return String(err);
  }
}
