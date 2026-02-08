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
 * Inner component that activates the notification hook and renders the modal.
 * Only mounted when the user is admin or staff.
 */
const ActiveNotifications = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin } = useAuth();
  const {
    newOrdersCount,
    clearNewOrdersCount,
    currentNotification,
    pendingCount,
    dismissNotification,
  } = useGlobalOrderNotifications();

  // Determine where the "View" button navigates based on role
  const navigateTo = isAdmin ? '/admin/orders' : '/staff/orders';

  return (
    <OrderNotificationsContext.Provider value={{ newOrdersCount, clearNewOrdersCount }}>
      <OrderNotificationModal
        order={currentNotification}
        onDismiss={dismissNotification}
        pendingCount={pendingCount}
        navigateTo={navigateTo}
      />
      {children}
    </OrderNotificationsContext.Provider>
  );
};

/**
 * Provider that conditionally activates order notifications for admin/staff users.
 * Must be placed inside AuthProvider and BrowserRouter.
 */
export const OrderNotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { canViewOrders, loading, rolesLoading } = useAuth();

  // While auth is loading, render children without notifications
  if (loading || rolesLoading) {
    return (
      <OrderNotificationsContext.Provider value={{ newOrdersCount: 0, clearNewOrdersCount: () => {} }}>
        {children}
      </OrderNotificationsContext.Provider>
    );
  }

  // Only activate notifications for admin/staff
  if (canViewOrders) {
    return <ActiveNotifications>{children}</ActiveNotifications>;
  }

  // Regular users get no notifications
  return (
    <OrderNotificationsContext.Provider value={{ newOrdersCount: 0, clearNewOrdersCount: () => {} }}>
      {children}
    </OrderNotificationsContext.Provider>
  );
};
