import { useEffect, useRef } from "react";

const SESSION_KEY = "kc_cart_session_id";
const SUPABASE_URL_FALLBACK = "https://gvtsbnivuysunnjrpndk.supabase.co";
const SUPABASE_ANON_KEY_FALLBACK = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2dHNibml2dXlzdW5uanJwbmRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3OTU2OTMsImV4cCI6MjA3MzM3MTY5M30.F2jdRSnEJYKD8ryCFRbGZUC6_ksED6iPVDhc638STd8";

type CheckoutTrackingStep = "details" | "submit_attempt" | "submit_failed" | "submit_success" | "validation_blocked";

export function getCartSessionId(): string {
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }
}

interface TrackingArgs {
  cartItems: any[];
  totalHuf: number;
  name?: string;
  phone?: string;
  email?: string;
  step?: string;
  enabled?: boolean;
}

interface PersistCheckoutSnapshotArgs {
  sessionId: string;
  cartItems: any[];
  totalHuf: number;
  name?: string;
  phone?: string;
  email?: string;
  step: CheckoutTrackingStep | string;
  errorMessage?: string | null;
}

export async function persistCheckoutSnapshot({
  sessionId,
  cartItems,
  totalHuf,
  name,
  phone,
  email,
  step,
  errorMessage,
}: PersistCheckoutSnapshotArgs): Promise<boolean> {
  try {
    const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL as string) || SUPABASE_URL_FALLBACK;
    const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string) || SUPABASE_ANON_KEY_FALLBACK;
    if (!supabaseUrl || !anonKey || !sessionId) return false;

    const recordedAt = new Date().toISOString();
    const cartSnapshot = errorMessage
      ? {
          items: cartItems || [],
          diagnostic: {
            step,
            error_message: errorMessage,
            recorded_at: recordedAt,
          },
        }
      : cartItems || [];

    const response = await fetch(`${supabaseUrl}/rest/v1/abandoned_carts?on_conflict=session_id`, {
      method: "POST",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates",
        "x-session-id": sessionId,
      },
      body: JSON.stringify({
        session_id: sessionId,
        customer_name: name || null,
        customer_phone: phone || null,
        customer_email: email || null,
        cart_snapshot: cartSnapshot,
        total_huf: totalHuf || 0,
        step,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        last_activity_at: recordedAt,
      }),
    });

    return response.ok;
  } catch (e) {
    console.debug("checkout snapshot tracking failed", e);
    return false;
  }
}

/**
 * Persist a snapshot of the in-progress checkout to abandoned_carts every
 * ~20s while the user is filling in their data. Helps admins see who tried
 * to order but didn't finish.
 */
export function useAbandonedCartTracking({
  cartItems,
  totalHuf,
  name,
  phone,
  email,
  step = "details",
  enabled = true,
}: TrackingArgs) {
  const sessionId = useRef<string>(getCartSessionId());
  const debounceTimer = useRef<number | null>(null);
  const lastSerialized = useRef<string>("");

  useEffect(() => {
    if (!enabled) return;
    if (!cartItems || cartItems.length === 0) return;

    // Only track once the customer has at least started entering contact info
    const hasContact = (name && name.trim().length > 1) || (phone && phone.trim().length >= 6);
    if (!hasContact) return;

    const payload = {
      session_id: sessionId.current,
      customer_name: name || null,
      customer_phone: phone || null,
      customer_email: email || null,
      cart_snapshot: cartItems as any,
      total_huf: totalHuf || 0,
      step,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      last_activity_at: new Date().toISOString(),
    };

    const serialized = JSON.stringify(payload);
    if (serialized === lastSerialized.current) return;

    if (debounceTimer.current) {
      window.clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = window.setTimeout(async () => {
      lastSerialized.current = serialized;
      try {
        await persistCheckoutSnapshot({
          sessionId: sessionId.current,
          cartItems,
          totalHuf,
          name,
          phone,
          email,
          step,
        });
      } catch (e) {
        // non-fatal
        console.debug("abandoned cart tracking failed", e);
      }
    }, 20000);

    return () => {
      if (debounceTimer.current) {
        window.clearTimeout(debounceTimer.current);
      }
    };
  }, [cartItems, totalHuf, name, phone, email, step, enabled]);

  return sessionId.current;
}
