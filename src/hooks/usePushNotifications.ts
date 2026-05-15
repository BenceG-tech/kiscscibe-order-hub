import { useState, useEffect, useCallback } from "react";

const VAPID_PUBLIC_KEY = ""; // Will be set when VAPID keys are configured

// @ts-ignore - PushManager types may not be available in all TS configs
export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, []);

  const checkSubscription = async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      setIsSubscribed(!!sub);
    } catch {
      // ignore
    }
  };

  const subscribe = useCallback(async (phone: string) => {
    if (!isSupported || !VAPID_PUBLIC_KEY) return false;

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== "granted") return false;

      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      // Register with backend (requires authenticated user)
      const { supabase } = await import("@/integrations/supabase/client");
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.warn("Push registration requires sign-in");
        return false;
      }
      const { error: invokeError } = await supabase.functions.invoke("register-push", {
        body: { phone, subscription: sub.toJSON() },
      });
      if (invokeError) throw invokeError;
      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.error("Push subscription error:", err);
      return false;
    }
  }, [isSupported]);

  const unsubscribe = useCallback(async () => {
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await (reg as any).pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setIsSubscribed(false);
    } catch {
      // ignore
    }
  }, []);

  return { isSupported: isSupported && !!VAPID_PUBLIC_KEY, isSubscribed, permission, subscribe, unsubscribe };
};

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}
