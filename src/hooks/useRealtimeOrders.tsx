import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Order {
  id: string;
  code: string;
  name: string;
  phone: string;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time?: string;
  created_at: string;
  notes?: string;
}

// Fallback polling interval — safety net for the case where the realtime
// websocket silently drops (laptop sleep, network switch, proxy timeout).
// Owner reported "orders don't arrive on admin" tickets that were actually
// realtime drops — the row was in the DB the whole time.
const POLL_INTERVAL_MS = 30_000;

export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Track order IDs we've already surfaced so poll-triggered inserts also
  // fire the "new order" sound/toast exactly once.
  const knownIdsRef = useRef<Set<string>>(new Set());
  const isFirstLoadRef = useRef(true);

  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUABt11/LNeSsFJoHO8diJOAcXaLvtYJ5NEAxQp+PwtmNEGRlttv71xs+COwYfabLs655PFAxQp+LxtGIbATCV1/LKeSwGI3fH8N1PRAgWdLnl63VIFAs=');
      audio.volume = 0.3;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Could not play notification sound:', error);
    }
  };

  const notifyNewOrder = useCallback((order: Order) => {
    playNotificationSound();
    toast({
      title: "Új rendelés! 🔔",
      description: `${order.name} - ${order.code}`,
      duration: 5000,
    });
  }, [toast]);

  const fetchOrders = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        if (!opts?.silent) {
          toast({
            title: "Hiba",
            description: "Nem sikerült betölteni a rendeléseket",
            variant: "destructive",
          });
        }
        return;
      }

      const rows = (data || []) as Order[];

      // Detect brand-new orders that arrived via polling (realtime miss).
      if (!isFirstLoadRef.current) {
        for (const row of rows) {
          if (!knownIdsRef.current.has(row.id) && row.status === 'new') {
            notifyNewOrder(row);
          }
        }
      }
      knownIdsRef.current = new Set(rows.map(r => r.id));
      isFirstLoadRef.current = false;

      setOrders(rows);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [notifyNewOrder, toast]);

  useEffect(() => {
    fetchOrders();

    // ── Realtime subscription ──
    // Auto-recreates on channel error / closed state so a dropped websocket
    // (laptop sleep, wifi switch) doesn't silently stop delivering new orders.
    let channel: ReturnType<typeof supabase.channel> | null = null;
    let reconnectTimer: number | null = null;

    const subscribe = () => {
      channel = supabase
        .channel(`orders-changes-${Date.now()}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'orders' },
          (payload) => {
            const newOrder = payload.new as Order;
            if (!newOrder?.id) return;
            if (knownIdsRef.current.has(newOrder.id)) return;
            knownIdsRef.current.add(newOrder.id);
            notifyNewOrder(newOrder);
            setOrders(prev => [newOrder, ...prev]);
          }
        )
        .on(
          'postgres_changes',
          { event: 'UPDATE', schema: 'public', table: 'orders' },
          (payload) => {
            const updatedOrder = payload.new as Order;
            setOrders(prev =>
              prev.map(order => (order.id === updatedOrder.id ? updatedOrder : order))
            );
          }
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            console.warn(`[useRealtimeOrders] Channel status=${status} — resubscribing in 3s and refetching`);
            if (channel) {
              try { supabase.removeChannel(channel); } catch { /* ignore */ }
              channel = null;
            }
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(() => {
              fetchOrders({ silent: true });
              subscribe();
            }, 3000);
          }
        });
    };

    subscribe();

    // ── Polling fallback ──
    // Every 30s, force-refetch orders. If the websocket silently dropped, this
    // guarantees new orders still show up (and trigger the notification via
    // the notifyNewOrder path in fetchOrders).
    const pollId = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, POLL_INTERVAL_MS);

    // ── Visibility handler ──
    // When the admin tab comes back to the foreground (laptop wake, tab focus)
    // immediately refetch so the owner sees anything that arrived while away.
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders({ silent: true });
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    window.addEventListener('online', onVisible);

    return () => {
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      window.clearInterval(pollId);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
      window.removeEventListener('online', onVisible);
      if (channel) {
        try { supabase.removeChannel(channel); } catch { /* ignore */ }
      }
    };
  }, [fetchOrders, notifyNewOrder]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Siker",
        description: "Rendelés státusz frissítve",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a rendelés státuszát",
        variant: "destructive",
      });
    }
  };

  const getNewOrdersCount = () => orders.filter(o => o.status === 'new').length;
  const getOrdersByStatus = (status: string) => orders.filter(o => o.status === status);

  return {
    orders,
    loading,
    updateOrderStatus,
    getNewOrdersCount,
    getOrdersByStatus,
    refetch: fetchOrders,
  };
};
