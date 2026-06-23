import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "kc_cart_session_id";

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
        // Send x-session-id header so RLS can verify the row belongs to this session.
        const SUPABASE_URL = "https://gvtsbnivuysunnjrpndk.supabase.co";
        const ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
        await fetch(`${SUPABASE_URL}/rest/v1/abandoned_carts?on_conflict=session_id`, {
          method: "POST",
          headers: {
            apikey: ANON_KEY,
            Authorization: `Bearer ${ANON_KEY}`,
            "Content-Type": "application/json",
            Prefer: "resolution=merge-duplicates",
            "x-session-id": sessionId.current,
          },
          body: JSON.stringify(payload),
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
