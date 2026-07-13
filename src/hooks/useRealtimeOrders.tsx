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
const POLL_INTERVAL_MS = 30_000;

// Reconnect backoff: exponential 2s → 4s → 8s → 16s → 32s → 60s (cap).
const BASE_RECONNECT_MS = 2_000;
const MAX_RECONNECT_MS = 60_000;

/**
 * List-only hook for admin/staff order pages.
 *
 * IMPORTANT: This hook deliberately does NOT play sounds or fire toasts for
 * new orders. That is the single responsibility of `useGlobalOrderNotifications`
 * (mounted app-wide via OrderNotificationsProvider). Duplicating the
 * notification here caused double-fire (toast + modal + double sound) whenever
 * both hooks were active on the admin orders page.
 */
export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const knownIdsRef = useRef<Set<string>>(new Set());
  const reconnectAttemptRef = useRef(0);

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
      knownIdsRef.current = new Set(rows.map(r => r.id));
      setOrders(rows);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchOrders();

    // ── Realtime subscription (list updates only, no notifications) ──
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
          if (status === 'SUBSCRIBED') {
            reconnectAttemptRef.current = 0;
            return;
          }
          if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            const attempt = reconnectAttemptRef.current;
            const delay = Math.min(BASE_RECONNECT_MS * Math.pow(2, attempt), MAX_RECONNECT_MS);
            reconnectAttemptRef.current = attempt + 1;
            console.warn(`[useRealtimeOrders] Channel status=${status} — reconnect in ${delay}ms (attempt ${attempt + 1})`);
            if (channel) {
              try { supabase.removeChannel(channel); } catch { /* ignore */ }
              channel = null;
            }
            if (reconnectTimer) window.clearTimeout(reconnectTimer);
            reconnectTimer = window.setTimeout(() => {
              fetchOrders({ silent: true });
              subscribe();
            }, delay);
          }
        });
    };

    subscribe();

    // ── Polling fallback (30s) ──
    const pollId = window.setInterval(() => {
      fetchOrders({ silent: true });
    }, POLL_INTERVAL_MS);

    // ── Visibility handler ──
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
  }, [fetchOrders]);

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
