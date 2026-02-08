import React, { createContext, useContext } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useGlobalOrderNotifications } from '@/hooks/useGlobalOrderNotifications';
import OrderNotificationModal from '@/components/admin/OrderNotificationModal';

interface OrderNotificationsContextType {
  newOrdersCount: number;
  clearNewOrdersCount: () => void;
}

const OrderNotificationsContext = createContext<OrderNotificationsContextType>({
  newOrdersCount: 0,
  clearNewOrdersCount: () => {},
});

export const useOrderNotifications = () => useContext(OrderNotificationsContext);

/**
 * Single-component provider — hooks are always called in the same order
 * regardless of auth state, preventing the "Rendered more hooks" error.
 */
export const OrderNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { canViewOrders, loading, rolesLoading, isAdmin } = useAuth();

  // Derive enabled flag — hook is ALWAYS called (consistent hook count)
  const enabled = !loading && !rolesLoading && canViewOrders;

  const {
    newOrdersCount,
    clearNewOrdersCount,
    currentNotification,
    pendingCount,
    dismissNotification,
  } = useGlobalOrderNotifications(enabled);

  const navigateTo = isAdmin ? '/admin/orders' : '/staff/orders';

  return (
    <OrderNotificationsContext.Provider value={{ newOrdersCount, clearNewOrdersCount }}>
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
