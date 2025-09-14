import { useState, useEffect } from 'react';
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

export const useRealtimeOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Sound notification function
  const playNotificationSound = () => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAUABt11/LNeSsFJoHO8diJOAcXaLvtYJ5NEAxQp+PwtmNEGRlttv71xs+COwYfabLs655PFAxQp+LxtGIbATCV1/LKeSwGI3fH8N1PRAgWdLnl63VIFAs=');
      audio.volume = 0.3;
      audio.play().catch(console.error);
    } catch (error) {
      console.error('Could not play notification sound:', error);
    }
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        toast({
          title: "Hiba",
          description: "Nem sikerült betölteni a rendeléseket",
          variant: "destructive"
        });
        return;
      }

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Set up realtime subscription for new orders
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload.new);
          
          // Play sound notification
          playNotificationSound();
          
          // Show toast notification
          const newOrder = payload.new as Order;
          toast({
            title: "Új rendelés! 🔔",
            description: `${newOrder.name} - ${newOrder.code}`,
            duration: 5000
          });

          // Update orders state
          setOrders(prev => [newOrder, ...prev]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('Order updated:', payload.new);
          const updatedOrder = payload.new as Order;
          
          setOrders(prev => 
            prev.map(order => 
              order.id === updatedOrder.id ? updatedOrder : order
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [toast]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: "Siker",
        description: "Rendelés státusz frissítve"
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a rendelés státuszát",
        variant: "destructive"
      });
    }
  };

  const getNewOrdersCount = () => {
    return orders.filter(order => order.status === 'new').length;
  };

  const getOrdersByStatus = (status: string) => {
    return orders.filter(order => order.status === status);
  };

  return {
    orders,
    loading,
    updateOrderStatus,
    getNewOrdersCount,
    getOrdersByStatus,
    refetch: fetchOrders
  };
};