import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface PendingOrder {
  id: string;
  code: string;
  total_huf: number;
  pickup_time: string | null;
  created_at: string;
}

export const useGlobalOrderNotifications = () => {
  const [pendingOrders, setPendingOrders] = useState<PendingOrder[]>([]);
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const knownOrderIdsRef = useRef<Set<string>>(new Set());
  const initializedRef = useRef(false);

  // Current order to show in modal (first in queue)
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
        console.log('Audio unlocked');
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

      // Play a pleasant ding-dong pattern (3 tones)
      playTone(880, 0, 0.2);      // A5
      playTone(1100, 0.15, 0.2);  // C#6
      playTone(1320, 0.3, 0.3);   // E6
      
      // Second set for emphasis
      setTimeout(() => {
        playTone(880, 0, 0.2);
        playTone(1100, 0.15, 0.2);
        playTone(1320, 0.3, 0.3);
      }, 600);

      console.log('Notification sound played');
    } catch (err) {
      console.log('Could not play notification sound:', err);
    }
  }, []);

  // Dismiss current notification
  const dismissNotification = useCallback(() => {
    setPendingOrders(prev => prev.slice(1));
  }, []);

  // Clear badge count
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
      }
    };

    fetchInitialOrders();
  }, []);

  // Set up real-time subscription (stable - no knownOrderIds dependency)
  useEffect(() => {
    const channel = supabase
      .channel('global-admin-orders-v3')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as PendingOrder;
          
          // Check if this is truly a new order we haven't seen
          if (!knownOrderIdsRef.current.has(newOrder.id)) {
            console.log('New order received:', newOrder.code);
            
            // Track this order
            knownOrderIdsRef.current.add(newOrder.id);
            
            // Play sound
            playNotificationSound();
            
            // Add to pending orders queue
            setPendingOrders(prev => [...prev, newOrder]);
            
            // Update count
            setNewOrdersCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound]);

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
