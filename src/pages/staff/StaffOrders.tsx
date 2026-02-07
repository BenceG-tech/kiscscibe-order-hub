import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import StaffLayout from "./StaffLayout";
import KanbanColumn from "@/components/staff/KanbanColumn";
import StatusSummaryBar from "@/components/staff/StatusSummaryBar";
import PastOrdersSection from "@/components/staff/PastOrdersSection";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { useTickTimer } from "@/hooks/useTickTimer";

interface OrderItem {
  id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
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
  },
  {
    status: "preparing",
    title: "Készítés alatt",
    headerClass: "bg-orange-500 text-white",
    emptyMessage: "Nincs készülő rendelés",
  },
  {
    status: "ready",
    title: "Kész – átvételre vár",
    headerClass: "bg-green-600 text-white",
    emptyMessage: "Nincs kész rendelés",
  },
] as const;

const StaffOrders = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const tick = useTickTimer(30000);

  useEffect(() => {
    fetchOrders();

    const channel = supabase
      .channel("staff-orders-kds")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => fetchOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (ordersError) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a rendeléseket",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch items for all orders in parallel
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("id, name_snapshot, qty, unit_price_huf, line_total_huf")
          .eq("order_id", order.id);

        return { ...order, items: itemsData || [] };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);

    const { error } = await supabase
      .from("orders")
      .update({ status: newStatus })
      .eq("id", orderId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a státuszt",
        variant: "destructive",
      });
    } else {
      const statusLabels: Record<string, string> = {
        preparing: "Elfogadva – készítés megkezdve",
        ready: "Elkészült – átvételre vár",
        completed: "Átvéve – lezárva",
        cancelled: "Rendelés lemondva",
      };
      toast({
        title: statusLabels[newStatus] || "Státusz frissítve",
      });
    }

    setUpdatingId(null);
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

        {/* Kanban Grid: 3 columns on desktop, stacked on mobile */}
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
              />
            );
          })}
        </div>

        {/* Past orders (collapsible) */}
        <PastOrdersSection orders={pastOrders} />
      </div>
    </StaffLayout>
  );
};

export default StaffOrders;
