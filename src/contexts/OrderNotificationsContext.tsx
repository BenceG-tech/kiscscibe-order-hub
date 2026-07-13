import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalOrderNotifications } from '@/hooks/useGlobalOrderNotifications';
import OrderNotificationOverlay from '@/components/admin/OrderNotificationOverlay';

interface OrderNotificationsContextType {
  newOrdersCount: number;
  clearNewOrdersCount: () => void;
  playNotificationSound: () => void;
  audioUnlocked: boolean;
  lastNewOrderAt: string | null;
}

const OrderNotificationsContext = createContext<OrderNotificationsContextType>({
  newOrdersCount: 0,
  clearNewOrdersCount: () => {},
  playNotificationSound: () => {},
  audioUnlocked: false,
  lastNewOrderAt: null,
});

export const useOrderNotifications = () => useContext(OrderNotificationsContext);

export const OrderNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { canViewOrders, loading, rolesLoading, isAdmin } = useAuth();
  const enabled = !loading && !rolesLoading && canViewOrders;

  const {
    newOrdersCount,
    clearNewOrdersCount,
    pendingOrders,
    dismissOrder,
    dismissAll,
    playNotificationSound,
    audioUnlocked,
    lastNewOrderAt,
  } = useGlobalOrderNotifications(enabled);

  const navigateTo = isAdmin ? '/admin/orders' : '/staff/orders';

  return (
    <OrderNotificationsContext.Provider value={{ newOrdersCount, clearNewOrdersCount, playNotificationSound, audioUnlocked, lastNewOrderAt }}>
      {enabled && pendingOrders.length > 0 && (
        <OrderNotificationOverlay
          orders={pendingOrders}
          onDismissOne={dismissOrder}
          onDismissAll={dismissAll}
          navigateTo={navigateTo}
        />
      )}
      {children}
    </OrderNotificationsContext.Provider>
  );
};
