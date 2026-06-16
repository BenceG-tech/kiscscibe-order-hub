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

const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

/**
 * Global order notification hook.
 * @param enabled – when false every hook still runs (consistent hook count)
 *                   but side-effects are skipped.
 */
export const useGlobalOrderNotifications = (enabled: boolean = true) => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioUnlockedRef = useRef(false);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  // Track last time we checked for orders; used for missed-orders sweep after sleep
  const lastSeenAtRef = useRef<string>(new Date().toISOString());

  const currentNotification = pendingOrders[0] || null;

  // ── Reset initializedRef when enabled goes false ──
  useEffect(() => {
    if (!enabled) {
      initializedRef.current = false;
    }
  }, [enabled]);

  // ── Unlock audio on first user interaction (iOS/iPad safe) ──
  useEffect(() => {
    if (!enabled) return;

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return;
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (!Ctx) return;
        const ctx = new Ctx();
        audioContextRef.current = ctx;
        // Play a 1-sample silent buffer inside the gesture to actually unlock iOS Safari
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        audioUnlockedRef.current = true;
        setAudioUnlocked(true);
        console.log('[Notifications] Audio unlocked (silent buffer played)');
      } catch (err) {
        console.log('[Notifications] Audio unlock failed:', err);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);
    document.addEventListener('touchend', unlockAudio);
    document.addEventListener('pointerdown', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('touchend', unlockAudio);
      document.removeEventListener('pointerdown', unlockAudio);
    };
  }, [enabled]);

  // ── Play notification sound (+ vibration for tablets/phones) ──
  const playNotificationSound = useCallback(() => {
    try {
      navigator.vibrate?.([200, 100, 200, 100, 400]);
    } catch { /* ignore */ }

    if (!audioContextRef.current) {
      try {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext);
        if (Ctx) audioContextRef.current = new Ctx();
      } catch {
        console.log('[Notifications] Cannot create AudioContext');
      }
    }
    const ctx = audioContextRef.current;

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
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().then(() => playWithWebAudio(ctx)).catch(() => {});
        } else {
          playWithWebAudio(ctx);
        }
      }
    } catch (err) {
      console.log('[Notifications] Could not play sound:', err);
    }
  }, []);

  const dismissNotification = useCallback(() => {
    setPendingOrders(prev => prev.slice(1));
  }, []);

  const clearNewOrdersCount = useCallback(() => {
    setNewOrdersCount(0);
  }, []);

  // ── Handle incoming new order ──
  const handleNewOrder = useCallback((newOrder: PendingOrder) => {
    if (!enabledRef.current) return;
    if (knownOrderIdsRef.current.has(newOrder.id)) return;
    console.log('[Notifications] 🔔 New order:', newOrder.code);
    knownOrderIdsRef.current.add(newOrder.id);
    lastSeenAtRef.current = newOrder.created_at > lastSeenAtRef.current
      ? newOrder.created_at
      : lastSeenAtRef.current;
    playNotificationSound();
    setPendingOrders(prev => [...prev, newOrder]);
    setNewOrdersCount(prev => prev + 1);
  }, [playNotificationSound]);

  // ── Missed orders sweep: catch any orders that arrived while sleeping/disconnected ──
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
      if (data && data.length) {
        console.log(`[Notifications] Sweep found ${data.length} missed orders since ${since}`);
        data.forEach((o) => handleNewOrder(o as PendingOrder));
      }
    } catch (e) {
      console.log('[Notifications] sweep exception:', e);
    }
  }, [handleNewOrder]);

  // ── Initialize known order IDs (once per enable cycle) ──
  useEffect(() => {
    if (!enabled) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    (async () => {
      const { data } = await supabase
        .from('orders')
        .select('id, created_at')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        knownOrderIdsRef.current = new Set(data.map(o => o.id));
        if (data[0]?.created_at) lastSeenAtRef.current = data[0].created_at;
        console.log(`[Notifications] Loaded ${data.length} existing order IDs`);
      }
    })();
  }, [enabled]);

  // ── Create subscription with retry ──
  const createSubscription = useCallback(async () => {
    if (channelRef.current) {
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Notifications] No active session, deferring subscription');
      return;
    }

    const channelName = `order-notifications-${Date.now()}`;
    console.log(`[Notifications] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload: any) => handleNewOrder(payload.new as PendingOrder))
      .subscribe((status, err) => {
        console.log(`[Notifications] Subscription status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] ✅ Successfully subscribed');
          retryCountRef.current = 0;
          // Sweep anything that came in between disconnect/reconnect
          sweepMissedOrders();
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Notifications] ❌ Subscription failed: ${status}`, err);
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
            retryCountRef.current += 1;
            retryTimeoutRef.current = setTimeout(() => createSubscription(), delay);
          }
        }
      });

    channelRef.current = channel;
  }, [handleNewOrder, sweepMissedOrders]);

  // ── Set up subscription + re-subscribe on auth changes ──
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
      if (event === 'SIGNED_OUT') {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
          channelRef.current = null;
        }
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

  // ── Reconnect on visibility change + sweep missed orders + resume audio ──
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notifications] Tab visible — resume audio + sweep + re-subscribe');
        audioContextRef.current?.resume?.().catch(() => {});
        retryCountRef.current = 0;
        sweepMissedOrders();
        createSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [enabled, createSubscription, sweepMissedOrders]);

  // ── Periodic safety sweep every 60s (covers Realtime stalls on tablets) ──
  useEffect(() => {
    if (!enabled) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sweepMissedOrders();
      }
    }, 60_000);
    return () => clearInterval(interval);
  }, [enabled, sweepMissedOrders]);

  return {
    currentNotification,
    pendingOrders,
    pendingCount: pendingOrders.length,
    newOrdersCount,
    dismissNotification,
    clearNewOrdersCount,
    audioUnlocked,
    playNotificationSound,
  };
};
