import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalOrderNotifications } from '@/hooks/useGlobalOrderNotifications';
import OrderNotificationModal from '@/components/admin/OrderNotificationModal';

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
    currentNotification,
    pendingCount,
    dismissNotification,
    playNotificationSound,
    audioUnlocked,
    lastNewOrderAt,
  } = useGlobalOrderNotifications(enabled);

  const navigateTo = isAdmin ? '/admin/orders' : '/staff/orders';

  return (
    <OrderNotificationsContext.Provider value={{ newOrdersCount, clearNewOrdersCount, playNotificationSound, audioUnlocked, lastNewOrderAt }}>

      {enabled && currentNotification && (
        <OrderNotificationModal
          order={currentNotification}
          onDismiss={dismissNotification}
          pendingCount={pendingCount}
          navigateTo={navigateTo}
        />
      )}
      {children}
    </OrderNotificationsContext.Provider>
  );
};
