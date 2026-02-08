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

export const useGlobalOrderNotifications = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentNotification = pendingOrders[0] || null;

  // Unlock audio on first user interaction
  useEffect(() => {
    const unlockAudio = () => {
      if (!audioUnlocked) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContextRef.current.state === 'suspended') {
          audioContextRef.current.resume();
        }
        setAudioUnlocked(true);
        console.log('[Notifications] Audio unlocked');
      }
    };

    document.addEventListener('click', unlockAudio, { once: true });
    document.addEventListener('keydown', unlockAudio, { once: true });
    document.addEventListener('touchstart', unlockAudio, { once: true });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
    };
  }, [audioUnlocked]);

  // Play notification sound using Web Audio API
  const playNotificationSound = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    try {
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

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

      console.log('[Notifications] Sound played');
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

  // Initialize: fetch existing order IDs (run once)
  useEffect(() => {
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
  }, []);

  // Handle incoming new order
  const handleNewOrder = useCallback((payload: any) => {
    const newOrder = payload.new as PendingOrder;
    
    if (!knownOrderIdsRef.current.has(newOrder.id)) {
      console.log('[Notifications] 🔔 New order received:', newOrder.code);
      
      knownOrderIdsRef.current.add(newOrder.id);
      playNotificationSound();
      setPendingOrders(prev => [...prev, newOrder]);
      setNewOrdersCount(prev => prev + 1);
    }
  }, [playNotificationSound]);

  // Create and subscribe to the realtime channel
  const createSubscription = useCallback(async () => {
    // Clean up existing channel
    if (channelRef.current) {
      console.log('[Notifications] Removing old channel before re-subscribing');
      await supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    // Check for active session
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
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        handleNewOrder
      )
      .subscribe((status, err) => {
        console.log(`[Notifications] Subscription status: ${status}`, err || '');

        if (status === 'SUBSCRIBED') {
          console.log('[Notifications] ✅ Successfully subscribed to order notifications');
          retryCountRef.current = 0; // Reset retry count on success
        }

        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          console.error(`[Notifications] ❌ Subscription failed: ${status}`, err);
          
          if (retryCountRef.current < MAX_RETRIES) {
            const delay = BASE_DELAY_MS * Math.pow(2, retryCountRef.current);
            retryCountRef.current += 1;
            console.log(`[Notifications] Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
            
            retryTimeoutRef.current = setTimeout(() => {
              createSubscription();
            }, delay);
          } else {
            console.error(`[Notifications] ❌ Max retries (${MAX_RETRIES}) exceeded. Giving up.`);
          }
        }

        if (status === 'CLOSED') {
          console.log('[Notifications] Channel closed');
        }
      });

    channelRef.current = channel;
  }, [handleNewOrder]);

  // Set up subscription + re-subscribe on auth changes
  useEffect(() => {
    createSubscription();

    // Listen for auth state changes and re-subscribe
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
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [createSubscription]);

  return {
    currentNotification,
    pendingOrders,
    pendingCount: pendingOrders.length,
    newOrdersCount,
    dismissNotification,
    clearNewOrdersCount,
    audioUnlocked,
  };
};
