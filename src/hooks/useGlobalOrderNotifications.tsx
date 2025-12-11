import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface NewOrder {
  id: string;
  code: string;
  created_at: string;
}

export const useGlobalOrderNotifications = () => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [lastOrderIds, setLastOrderIds] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    // Create a more noticeable notification sound using Web Audio API
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1sbW1xdHZ4eXl4d3Z1c3FvbGpmYl5aVlJOSkZCPjo2Mi4qJiIeGhYSEA4MCggGBAIAAQMFBwkLDQ8RExUXGRsdHyEjJScoKistLzEzNTc5Oz0/QUJERVZXX2dvc3uAhoyRlpuepKmusbW4u77BxMfKzc/S1NfZ29ze4OLk5ufo6err7O3u7u/w8PHx8vLy8/P09PT09fX19fX19fX19fX19fT09PPz8/Ly8fHw7+7t7Ovq6Ofm5OPh397c2dfV09DOy8nGw8C9ureyraijnoqFgHt2cWxnYl1YU05JRD86NTErJiEcFxMOCgYCAP///fr28e3o5ODc2NTQzMjEwLy4tLCsqKSgnJiUkIyIhIB8eHRwbGhkYFxYVFBMSERAODQwKCQgHBgUEAwIAAABAwUHCQsNDxETFRcZGx0fISMlJygqKy0vMTM1Nzk7PT9BQkRGR0lLTE5PUVNUV1laXF1fYGJjZGZnaWprbG1ub3BxcnN0dXZ3d3h5eXp7e3x9fX5+f4CAgYGCgoODhISFhYaGh4eIiImJioqLi4yMjY2Ojo+PkJCRkZKSk5OUlJWVlpaXl5iYmZmampubm5ycnZ2enp+foKChoaKio6OkpKWlpqanp6ioqamqqqqrrKysra2urq+vsLCxsbKys7O0tLW1tra3t7i4ubm6uru7vLy9vb6+v7/AwMHBwsLDw8TExcXGxsfHyMjJycrKy8vMzM3Nzs7Pz9DQ0dHS0tPT1NTV1dbW19fY2NnZ2trb29zc3d3e3t/f4ODh4eLi4+Pk5OXl5ubn5+jo6enq6uvr7Ozs7e7u7+/w8PHx8vLz8/T09fX29vf3+Pj5+fr6+/v8/P39/v7//w==');
    audioRef.current.volume = 0.7;
  }, []);

  const playNotificationSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(err => {
        console.log('Could not play notification sound:', err);
      });
    }
  }, []);

  const clearNewOrdersCount = useCallback(() => {
    setNewOrdersCount(0);
  }, []);

  useEffect(() => {
    // Fetch initial order IDs to avoid notifying for existing orders
    const fetchInitialOrders = async () => {
      const { data } = await supabase
        .from('orders')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (data) {
        setLastOrderIds(new Set(data.map(o => o.id)));
      }
    };

    fetchInitialOrders();

    // Set up real-time subscription
    const channel = supabase
      .channel('global-admin-orders')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          const newOrder = payload.new as NewOrder;
          
          // Check if this is truly a new order we haven't seen
          if (!lastOrderIds.has(newOrder.id)) {
            console.log('New order received:', newOrder.code);
            
            // Play sound
            playNotificationSound();
            
            // Show toast with action
            toast({
              title: "🔔 Új rendelés érkezett!",
              description: `Rendelés: #${newOrder.code}`,
              action: (
                <button
                  onClick={() => navigate('/admin/orders')}
                  className="bg-primary text-primary-foreground px-3 py-1 rounded text-sm font-medium hover:bg-primary/90"
                >
                  Megtekintés
                </button>
              ),
              duration: 10000,
            });
            
            // Update count and tracked IDs
            setNewOrdersCount(prev => prev + 1);
            setLastOrderIds(prev => new Set([...prev, newOrder.id]));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [playNotificationSound, toast, navigate, lastOrderIds]);

  return {
    newOrdersCount,
    clearNewOrdersCount,
  };
};
