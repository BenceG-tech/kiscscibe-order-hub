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
import { useIsMobile } from "@/hooks/use-mobile";
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
  email?: string | null;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time: string | null;
  created_at: string;
  notes?: string;
  items?: OrderItem[];
}

type TabStatus = "new" | "preparing" | "ready";

const COLUMNS = [
  {
    status: "new" as TabStatus,
    title: "Új rendelések",
    headerClass: "bg-red-500 text-white",
    emptyMessage: "Nincs új rendelés",
    columnId: "column-new",
  },
  {
    status: "preparing" as TabStatus,
    title: "Készítés alatt",
    headerClass: "bg-orange-500 text-white",
    emptyMessage: "Nincs készülő rendelés",
    columnId: "column-preparing",
  },
  {
    status: "ready" as TabStatus,
    title: "Kész – átvételre vár",
    headerClass: "bg-green-600 text-white",
    emptyMessage: "Nincs kész rendelés",
    columnId: "column-ready",
  },
] as const;

const TAB_ORDER: TabStatus[] = ["new", "preparing", "ready"];

const StaffOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabStatus>("new");
  const tick = useTickTimer(30000);
  const refetchTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const isMobile = useIsMobile();

  // ── Swipe support ──
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const swipeContainerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
    };
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;
      const dx = e.changedTouches[0].clientX - touchStartRef.current.x;
      const dy = e.changedTouches[0].clientY - touchStartRef.current.y;
      touchStartRef.current = null;

      // Only count horizontal swipes (dx > dy)
      if (Math.abs(dx) < 50 || Math.abs(dy) > Math.abs(dx)) return;

      const currentIdx = TAB_ORDER.indexOf(activeTab);
      if (dx < 0 && currentIdx < TAB_ORDER.length - 1) {
        setActiveTab(TAB_ORDER[currentIdx + 1]);
      } else if (dx > 0 && currentIdx > 0) {
        setActiveTab(TAB_ORDER[currentIdx - 1]);
      }
    },
    [activeTab]
  );

  // ── Data fetching ──
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

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
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
        console.error(`[KDS] WARNING: 0 rows affected for #${orderCode}`);
        toast.error("Nincs jogosultság vagy a rendelés nem található.");
        return;
      }

      console.log(`[KDS] Update successful for #${orderCode}`);

      const statusLabels: Record<string, string> = {
        preparing: "Elfogadva – készítés megkezdve",
        ready: "Elkészült – átvételre vár",
        completed: "Átvéve – lezárva",
        cancelled: "Rendelés lemondva",
      };
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      toast.success(statusLabels[newStatus] || "Státusz frissítve");

      supabase.functions
        .invoke("send-order-status-email", {
          body: { order_id: orderId, new_status: newStatus },
        })
        .catch((err) => console.error("Status email error:", err));
    } catch (err) {
      console.error(`[KDS] Exception:`, err);
      toast.error("Váratlan hiba – kérlek próbáld újra.");
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Derived data ──
  const activeByStatus = (status: string) =>
    orders
      .filter((o) => o.status === status)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const pastOrders = orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  const newOrders = activeByStatus("new");
  const preparingOrders = activeByStatus("preparing");
  const readyOrders = activeByStatus("ready");
  const hasActiveOrders = newOrders.length + preparingOrders.length + readyOrders.length > 0;

  const getColumnOrders = (status: TabStatus) => {
    switch (status) {
      case "new": return newOrders;
      case "preparing": return preparingOrders;
      case "ready": return readyOrders;
    }
  };

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
        {/* Sticky Summary Bar */}
        <div className="sticky top-[calc(env(safe-area-inset-top,0px)+56px+48px)] z-30 bg-background border-b">
          <StatusSummaryBar
            newCount={newOrders.length}
            preparingCount={preparingOrders.length}
            readyCount={readyOrders.length}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />
        </div>

        {/* Empty state */}
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

        {/* Kanban content */}
        {hasActiveOrders && (
          <>
            {/* Mobile / Tablet: single column with swipe */}
            <div
              className="lg:hidden"
              ref={swipeContainerRef}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {COLUMNS.filter((col) => col.status === activeTab).map((col) => (
                <KanbanColumn
                  key={col.status}
                  title={col.title}
                  count={getColumnOrders(col.status).length}
                  orders={getColumnOrders(col.status)}
                  headerClass={col.headerClass}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                  tick={tick}
                  emptyMessage={col.emptyMessage}
                  columnId={col.columnId}
                />
              ))}
            </div>

            {/* Desktop: 3-column grid */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  title={col.title}
                  count={getColumnOrders(col.status).length}
                  orders={getColumnOrders(col.status)}
                  headerClass={col.headerClass}
                  onStatusChange={handleStatusChange}
                  updatingId={updatingId}
                  tick={tick}
                  emptyMessage={col.emptyMessage}
                  columnId={col.columnId}
                />
              ))}
            </div>
          </>
        )}

        {/* Past orders */}
        <PastOrdersSection orders={pastOrders} />
      </div>
    </StaffLayout>
  );
};

export default StaffOrders;
