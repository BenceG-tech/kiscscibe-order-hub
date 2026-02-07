import { useState, useEffect } from "react";

/**
 * Returns a tick counter that increments every `intervalMs` milliseconds.
 * Components that depend on relative time can use this to re-render periodically.
 */
export const useTickTimer = (intervalMs = 30000) => {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return tick;
};

/** Format a date as a Hungarian relative time string (e.g. "5 perce") */
export const formatRelativeTime = (dateString: string): string => {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "most érkezett";
  if (diffMin < 60) return `${diffMin} perce`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours} órája`;
  return `${Math.floor(hours / 24)} napja`;
};

/** Format pickup countdown (e.g. "12 perc múlva" or "KÉSÉS!") */
export const formatPickupCountdown = (pickupTime: string | null): { text: string; urgency: "normal" | "warn" | "critical" | "overdue" } | null => {
  if (!pickupTime) return null;
  
  const now = Date.now();
  const pickup = new Date(pickupTime).getTime();
  const diffMs = pickup - now;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 0) {
    return { text: "KÉSÉS!", urgency: "overdue" };
  }
  if (diffMin < 5) {
    return { text: `${diffMin} perc múlva`, urgency: "critical" };
  }
  if (diffMin < 10) {
    return { text: `${diffMin} perc múlva`, urgency: "warn" };
  }
  if (diffMin < 60) {
    return { text: `${diffMin} perc múlva`, urgency: "normal" };
  }
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return { text: `${hours}ó ${mins}p múlva`, urgency: "normal" };
};

/** Calculate urgency level for an order based on how long it's been in current status */
export const getOrderUrgency = (createdAt: string, status: string): "normal" | "aging" | "urgent" => {
  if (status !== "new" && status !== "preparing") return "normal";
  
  const diffMs = Date.now() - new Date(createdAt).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (status === "new") {
    if (diffMin > 10) return "urgent";
    if (diffMin > 5) return "aging";
  }
  if (status === "preparing") {
    if (diffMin > 20) return "urgent";
    if (diffMin > 15) return "aging";
  }
  return "normal";
};
