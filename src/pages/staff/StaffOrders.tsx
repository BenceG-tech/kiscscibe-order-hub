import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import StaffLayout from "./StaffLayout";
import KanbanColumn from "@/components/staff/KanbanColumn";
import StatusSummaryBar from "@/components/staff/StatusSummaryBar";
import PastOrdersSection from "@/components/staff/PastOrdersSection";
import { LoadingSpinner } from "@/components/ui/loading";
import { Button } from "@/components/ui/button";
import { useTickTimer } from "@/hooks/useTickTimer";
import { RefreshCw, Inbox } from "lucide-react";

interface OrderItemOption {
  id: string;
  label_snapshot: string;
  option_type: string | null;
  price_delta_huf: number;
}

interface OrderItem {
  id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
  options?: OrderItemOption[];
}

interface Order {
  id: string;
  code: string;
  name: string;
  phone: string;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time: string | null;
  created_at: string;
  notes?: string;
  items?: OrderItem[];
}

const COLUMNS = [
  {
    status: "new",
    title: "Új rendelések",
    headerClass: "bg-red-500 text-white",
    emptyMessage: "Nincs új rendelés",
    columnId: "column-new",
  },
  {
    status: "preparing",
    title: "Készítés alatt",
    headerClass: "bg-orange-500 text-white",
    emptyMessage: "Nincs készülő rendelés",
    columnId: "column-preparing",
  },
  {
    status: "ready",
    title: "Kész – átvételre vár",
    headerClass: "bg-green-600 text-white",
    emptyMessage: "Nincs kész rendelés",
    columnId: "column-ready",
  },
] as const;

const StaffOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const tick = useTickTimer(30000);
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const fetchOrders = useCallback(async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      toast.error("Nem sikerült betölteni a rendeléseket");
      setLoading(false);
      return;
    }

    // Fetch items + options for all orders in parallel
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("id, name_snapshot, qty, unit_price_huf, line_total_huf")
          .eq("order_id", order.id);

        const itemIds = (itemsData || []).map((i) => i.id);
        let optionsMap: Record<string, OrderItemOption[]> = {};

        if (itemIds.length > 0) {
          const { data: optionsData } = await supabase
            .from("order_item_options")
            .select("id, label_snapshot, option_type, price_delta_huf, order_item_id")
            .in("order_item_id", itemIds);

          if (optionsData) {
            for (const opt of optionsData) {
              const key = opt.order_item_id || "";
              if (!optionsMap[key]) optionsMap[key] = [];
              optionsMap[key].push({
                id: opt.id,
                label_snapshot: opt.label_snapshot,
                option_type: opt.option_type,
                price_delta_huf: opt.price_delta_huf,
              });
            }
          }
        }

        const itemsWithOptions = (itemsData || []).map((item) => ({
          ...item,
          options: optionsMap[item.id] || [],
        }));

        return { ...order, items: itemsWithOptions };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("staff-orders-kds")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          // Debounce realtime refetches to prevent double-firing
          clearTimeout(refetchTimerRef.current);
          refetchTimerRef.current = setTimeout(() => fetchOrders(), 300);
        }
      )
      .subscribe();

    return () => {
      clearTimeout(refetchTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);

  // Old fetchOrders removed — now defined above via useCallback

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    try {
      // Find order for logging
      const order = orders.find((o) => o.id === orderId);
      const orderCode = order?.code || orderId.slice(0, 8);
      const oldStatus = order?.status || "unknown";

      console.log(`[KDS] Updating order #${orderCode}: ${oldStatus} -> ${newStatus}`);

      const { data, error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId)
        .select();

      if (error) {
        console.error(`[KDS] DB error for #${orderCode}:`, error);
        toast.error(error.message || "Nem sikerült frissíteni a státuszt");
        return;
      }

      if (!data || data.length === 0) {
        console.error(`[KDS] WARNING: 0 rows affected for #${orderCode} — possible RLS/permission issue`);
        toast.error("Nincs jogosultság vagy a rendelés nem található. Próbálj kijelentkezni és újra bejelentkezni.");
        return;
      }

      console.log(`[KDS] Update successful for #${orderCode}: status is now "${data[0].status}"`);

      const statusLabels: Record<string, string> = {
        preparing: "Elfogadva – készítés megkezdve",
        ready: "Elkészült – átvételre vár",
        completed: "Átvéve – lezárva",
        cancelled: "Rendelés lemondva",
      };
      // Optimistic local state update so card moves immediately
      setOrders(prev =>
        prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o)
      );
      toast.success(statusLabels[newStatus] || "Státusz frissítve");

      // Fire-and-forget: send status email to customer
      supabase.functions.invoke('send-order-status-email', {
        body: { order_id: orderId, new_status: newStatus }
      }).catch(err => console.error('Status email error:', err));
    } catch (err) {
      console.error(`[KDS] Exception:`, err);
      toast.error("Váratlan hiba – kérlek próbáld újra, vagy frissítsd az oldalt.");
    } finally {
      setUpdatingId(null);
    }
  };

  // Split orders
  const activeByStatus = (status: string) =>
    orders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const pastOrders = orders.filter((o) =>
    ["completed", "cancelled"].includes(o.status)
  );

  const newOrders = activeByStatus("new");
  const preparingOrders = activeByStatus("preparing");
  const readyOrders = activeByStatus("ready");

  const hasActiveOrders = newOrders.length + preparingOrders.length + readyOrders.length > 0;

  if (loading) {
    return (
      <StaffLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="space-y-4 pb-8">
        {/* Summary bar */}
        <StatusSummaryBar
          newCount={newOrders.length}
          preparingCount={preparingOrders.length}
          readyCount={readyOrders.length}
        />

        {/* Empty state when no active orders */}
        {!hasActiveOrders && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Inbox className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Jelenleg nincs aktív rendelés
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Várjuk az új rendeléseket! Az értesítések automatikusan megjelennek.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setLoading(true);
                fetchOrders();
              }}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Frissítés
            </Button>
          </div>
        )}

        {/* Kanban Grid: 3 columns on desktop, stacked on mobile */}
        {hasActiveOrders && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {COLUMNS.map((col) => {
              const colOrders =
                col.status === "new"
                  ? newOrders
                  : col.status === "preparing"
                  ? preparingOrders
                  : readyOrders;

              return (
                <KanbanColumn
                  key={col.status}
                  title={col.title}
                  count={colOrders.length}
                  orders={colOrders}
                  headerClass={col.headerClass}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                  tick={tick}
                  emptyMessage={col.emptyMessage}
                  columnId={col.columnId}
                />
              );
            })}
          </div>
        )}

        {/* Past orders (collapsible) */}
        <PastOrdersSection orders={pastOrders} />
      </div>
    </StaffLayout>
  );
};

export default StaffOrders;
