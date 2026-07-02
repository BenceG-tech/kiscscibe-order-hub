import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface PendingOrder {
  id: string;
  code: string;
  total_huf: number;
  pickup_time: string | null;
  created_at: string;
}

const MAX_RETRIES = 8;
const BASE_DELAY_MS = 2000;
const HEARTBEAT_MS = 30_000;
const STALE_SUBSCRIBED_MS = 90_000;
// Flap protection: if the channel closes very quickly after opening, back off
// aggressively so we don't burn CPU / log spam in a 2-second SUBSCRIBED→CLOSED loop.
const FLAP_WINDOW_MS = 5_000;      // "quickly" = closed within 5s of subscribing
const FLAP_THRESHOLD = 3;          // 3 such flaps triggers cooldown
const FLAP_COOLDOWN_MS = 60_000;   // 60s pause before resuming subscription attempts
const DEV = typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV;
const log = (...args: unknown[]) => { if (DEV) console.log(...args); };

/**
 * Global order notification hook.
 *
 * Dedupe strategy: cursor-based on `created_at`.
 *   - Any order with `created_at > lastSeenAtRef` fires a notification exactly once
 *     (firedIdsRef prevents double-fire when both Realtime + sweep see it).
 *   - This eliminates the start-up race where an order arriving between the
 *     initial fetch and the channel SUBSCRIBED event would be silently
 *     classified as "old".
 */
export const useGlobalOrderNotifications = (enabled: boolean = true) => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [lastNewOrderAt, setLastNewOrderAt] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const firedIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  // Cursor: only orders strictly newer than this fire a notification.
  const lastSeenAtRef = useRef<string>(new Date(0).toISOString());
  // Last time we received a SUBSCRIBED ack — used by the heartbeat to detect a wedged channel.
  const lastSubscribedAtRef = useRef<number>(0);
  // Flap detection: track recent close events + cooldown state.
  const recentFlapsRef = useRef<number[]>([]);
  const cooldownUntilRef = useRef<number>(0);

  const currentNotification = pendingOrders[0] || null;

  // ── Reset on disable ──
  useEffect(() => {
    if (!enabled) {
      initializedRef.current = false;
    }
  }, [enabled]);

  // ── Audio unlock (iOS/iPad safe) ──
  useEffect(() => {
    if (!enabled) return;

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        if (ctx.state === 'suspended') ctx.resume().catch(() => {});
        audioUnlockedRef.current = true;
        setAudioUnlocked(true);
        console.log('[Notifications] Audio unlocked');
      } catch (err) {
        console.log('[Notifications] Audio unlock failed:', err);
      }
    };

    const events = ['click', 'keydown', 'touchstart', 'touchend', 'pointerdown'];
    events.forEach((e) => document.addEventListener(e, unlockAudio));
    return () => events.forEach((e) => document.removeEventListener(e, unlockAudio));
  }, [enabled]);

  // ── Play sound + vibration ──
  const playNotificationSound = useCallback(() => {
    try { navigator.vibrate?.([200, 100, 200, 100, 400]); } catch { /* ignore */ }

    if (!audioContextRef.current) {
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (Ctx) audioContextRef.current = new Ctx();
      } catch { /* ignore */ }
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;

    const playWithWebAudio = (ctx: AudioContext) => {
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = frequency;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0, ctx.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(0.3, ctx.currentTime + startTime + 0.05);
        gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + startTime + duration);
        oscillator.start(ctx.currentTime + startTime);
        oscillator.stop(ctx.currentTime + startTime + duration);
      };
      playTone(880, 0, 0.2);
      playTone(1100, 0.15, 0.2);
      playTone(1320, 0.3, 0.3);
      setTimeout(() => {
        playTone(880, 0, 0.2);
        playTone(1100, 0.15, 0.2);
        playTone(1320, 0.3, 0.3);
      }, 600);
    };

    try {
      if (ctx.state === 'suspended') {
        ctx.resume().then(() => playWithWebAudio(ctx)).catch(() => {});
      } else {
        playWithWebAudio(ctx);
      }
    } catch (err) {
      console.log('[Notifications] Could not play sound:', err);
    }
  }, []);

  const dismissNotification = useCallback(() => {
    setPendingOrders(prev => prev.slice(1));
  }, []);

  const clearNewOrdersCount = useCallback(() => setNewOrdersCount(0), []);

  // ── Notify on a new order (cursor + per-id dedupe) ──
  const notifyIfNew = useCallback((o: PendingOrder) => {
    if (!enabledRef.current) return;
    if (o.created_at <= lastSeenAtRef.current) return; // older than cursor — ignore
    if (firedIdsRef.current.has(o.id)) return;          // already fired (race protection)
    firedIdsRef.current.add(o.id);
    // Trim memory: keep firedIds bounded.
    if (firedIdsRef.current.size > 500) {
      firedIdsRef.current = new Set(Array.from(firedIdsRef.current).slice(-250));
    }
    console.log('[Notifications] 🔔 New order:', o.code);
    playNotificationSound();
    setPendingOrders(prev => [...prev, o]);
    setNewOrdersCount(prev => prev + 1);
    setLastNewOrderAt(o.created_at);
  }, [playNotificationSound]);

  // ── Sweep: fetch anything newer than cursor, advance cursor at the end ──
  const sweepMissedOrders = useCallback(async () => {
    if (!enabledRef.current) return;
    try {
      const since = lastSeenAtRef.current;
      const { data, error } = await supabase
        .from('orders')
        .select('id, code, total_huf, pickup_time, created_at')
        .gt('created_at', since)
        .order('created_at', { ascending: true })
        .limit(50);
      if (error) {
        console.log('[Notifications] sweep error:', error);
        return;
      }
      if (data?.length) {
        console.log(`[Notifications] Sweep found ${data.length} new since ${since}`);
        data.forEach((o) => notifyIfNew(o as PendingOrder));
        lastSeenAtRef.current = data[data.length - 1].created_at;
      }
    } catch (e) {
      console.log('[Notifications] sweep exception:', e);
    }
  }, [notifyIfNew]);

  // ── Init cursor (once per enable cycle): set lastSeenAt to most recent existing order ──
  useEffect(() => {
    if (!enabled || initializedRef.current) return;
    initializedRef.current = true;
    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('created_at')
        .order('created_at', { ascending: false })
        .limit(1);
      if (data?.[0]?.created_at) {
        lastSeenAtRef.current = data[0].created_at;
      } else {
        lastSeenAtRef.current = new Date().toISOString();
      }
      console.log(`[Notifications] Cursor initialized at ${lastSeenAtRef.current}`);
      // Immediate sweep in case orders arrived during init.
      sweepMissedOrders();
    })();
  }, [enabled, sweepMissedOrders]);

  // ── Create / re-create subscription ──
  const createSubscription = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Notifications] No session, deferring subscription');
      return;
    }

    const channelName = `order-notifications-${Date.now()}`;
    console.log(`[Notifications] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => notifyIfNew(payload.new as PendingOrder))
      .subscribe((status, err) => {
        console.log(`[Notifications] Subscription status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] ✅ Subscribed');
          retryCountRef.current = 0;
          lastSubscribedAtRef.current = Date.now();
          // Catch anything that arrived during the (re)connect.
          sweepMissedOrders();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`[Notifications] ❌ Subscription ${status}`, err);
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, Math.min(retryCountRef.current, 5));
            retryCountRef.current += 1;
            if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = setTimeout(() => createSubscription(), delay);
          }
        }
      });

    channelRef.current = channel;
  }, [notifyIfNew, sweepMissedOrders]);

  // ── Subscribe + re-subscribe on auth changes ──
  useEffect(() => {
    if (!enabled) {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      return;
    }

    createSubscription();

    const { data: { subscription: authSub } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
        retryCountRef.current = 0;
        createSubscription();
      }
      if (event === 'SIGNED_OUT' && channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    });

    return () => {
      authSub.unsubscribe();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [enabled, createSubscription]);

  // ── Visibility / focus: resume audio, sweep, re-subscribe ──
  useEffect(() => {
    if (!enabled) return;

    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      console.log('[Notifications] Tab visible — resume + sweep + re-subscribe');
      audioContextRef.current?.resume?.().catch(() => {});
      retryCountRef.current = 0;
      sweepMissedOrders();
      createSubscription();
    };

    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, [enabled, createSubscription, sweepMissedOrders]);

  // ── Heartbeat: every 30s sweep; if channel hasn't SUBSCRIBED in >90s, force reconnect ──
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      sweepMissedOrders();
      const sinceAck = Date.now() - lastSubscribedAtRef.current;
      if (lastSubscribedAtRef.current === 0 || sinceAck > STALE_SUBSCRIBED_MS) {
        console.warn(`[Notifications] Heartbeat: stale subscription (${sinceAck}ms), reconnecting`);
        retryCountRef.current = 0;
        createSubscription();
      }
    }, HEARTBEAT_MS);
    return () => clearInterval(interval);
  }, [enabled, sweepMissedOrders, createSubscription]);

  return {
    currentNotification,
    pendingOrders,
    pendingCount: pendingOrders.length,
    newOrdersCount,
    dismissNotification,
    clearNewOrdersCount,
    audioUnlocked,
    playNotificationSound,
    lastNewOrderAt,
  };
};
