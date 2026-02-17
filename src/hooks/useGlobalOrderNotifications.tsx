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

  const currentNotification = pendingOrders[0] || null;

  // ── Reset initializedRef when enabled goes false ──
  useEffect(() => {
    if (!enabled) {
      initializedRef.current = false;
    }
  }, [enabled]);

  // ── Unlock audio on first user interaction (no { once: true }) ──
  useEffect(() => {
    if (!enabled) return;

    const unlockAudio = () => {
      if (audioUnlockedRef.current) return; // already unlocked
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        audioUnlockedRef.current = true;
        setAudioUnlocked(true);
        console.log('[Notifications] Audio unlocked');
      } catch (err) {
        console.log('[Notifications] Audio unlock failed:', err);
      }
    };

    document.addEventListener('click', unlockAudio);
    document.addEventListener('keydown', unlockAudio);
    document.addEventListener('touchstart', unlockAudio);

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [enabled]);

  // ── Play notification sound ──
  const playNotificationSound = useCallback(() => {
    // Try to create/resume AudioContext
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
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
          ctx.resume().then(() => {
            playWithWebAudio(ctx);
            console.log('[Notifications] Sound played (after resume)');
          }).catch(() => {
            console.log('[Notifications] AudioContext resume failed, trying fallback');
          });
        } else {
          playWithWebAudio(ctx);
          console.log('[Notifications] Sound played');
        }
      } else {
        console.log('[Notifications] No AudioContext available');
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

  // ── Initialize known order IDs (once per enable cycle) ──
  useEffect(() => {
    if (!enabled) return;
    if (initializedRef.current) return;
    initializedRef.current = true;

    const fetchInitialOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(100);
      if (data) {
        knownOrderIdsRef.current = new Set(data.map(o => o.id));
        console.log(`[Notifications] Loaded ${data.length} existing order IDs`);
      }
    };
    fetchInitialOrders();
  }, [enabled]);

  // ── Handle incoming new order ──
  const handleNewOrder = useCallback((payload: any) => {
    if (!enabledRef.current) return;
    const newOrder = payload.new as PendingOrder;
    if (!knownOrderIdsRef.current.has(newOrder.id)) {
      console.log('[Notifications] 🔔 New order received:', newOrder.code);
      knownOrderIdsRef.current.add(newOrder.id);
      playNotificationSound();
      setPendingOrders(prev => [...prev, newOrder]);
      setNewOrdersCount(prev => prev + 1);
    }
  }, [playNotificationSound]);

  // ── Create subscription with retry ──
  const createSubscription = useCallback(async () => {
    if (channelRef.current) {
      console.log('[Notifications] Removing old channel before re-subscribing');
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      console.warn('[Notifications] No active session, deferring subscription');
      return;
    }
    console.log('[Notifications] Session found for user:', session.user.email);

    const channelName = `order-notifications-${Date.now()}`;
    console.log(`[Notifications] Creating channel: ${channelName}`);

    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, handleNewOrder)
      .subscribe((status, err) => {
        console.log(`[Notifications] Subscription status: ${status}`, err || '');
        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] ✅ Successfully subscribed');
          retryCountRef.current = 0;
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Notifications] ❌ Subscription failed: ${status}`, err);
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
            retryCountRef.current += 1;
            console.log(`[Notifications] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            retryTimeoutRef.current = setTimeout(() => createSubscription(), delay);
          } else {
            console.error(`[Notifications] ❌ Max retries exceeded.`);
          }
        }
      });

    channelRef.current = channel;
  }, [handleNewOrder]);

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
        console.log(`[Notifications] Auth event: ${event} — re-subscribing`);
        retryCountRef.current = 0;
        createSubscription();
      }
      if (event === 'SIGNED_OUT') {
        console.log('[Notifications] Signed out — removing channel');
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

  // ── Reconnect on visibility change (tab back from background) ──
  useEffect(() => {
    if (!enabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Notifications] Tab became visible, checking subscription...');
        // Re-subscribe to ensure we haven't missed anything
        retryCountRef.current = 0;
        createSubscription();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, createSubscription]);

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
