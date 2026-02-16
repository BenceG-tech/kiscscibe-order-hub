import { cn } from "@/lib/utils";
import KanbanOrderCard from "./KanbanOrderCard";

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
  coupon_code?: string | null;
  discount_huf?: number;
}

interface KanbanColumnProps {
  title: string;
  count: number;
  orders: Order[];
  headerClass: string;
  onStatusChange: (orderId: string, newStatus: string) => void;
  updatingId: string | null;
  tick: number;
  emptyMessage: string;
  columnId?: string;
}

const KanbanColumn = ({
  title,
  count,
  orders,
  headerClass,
  onStatusChange,
  updatingId,
  tick,
  emptyMessage,
  columnId,
}: KanbanColumnProps) => {
  return (
    <div id={columnId} className="flex flex-col min-h-0 scroll-mt-36">
      {/* Column header */}
      <div
        className={cn(
          "flex items-center justify-between px-3 py-2 rounded-t-lg font-semibold text-sm",
          headerClass
        )}
      >
        <span>{title}</span>
        <span className="inline-flex items-center justify-center h-6 min-w-[24px] rounded-full bg-white/30 text-xs font-bold px-1.5">
          {count}
        </span>
      </div>

      {/* Cards container */}
      <div className="flex-1 space-y-3 p-2 bg-muted/30 rounded-b-lg min-h-[120px] max-h-[calc(100vh-280px)] overflow-y-auto">
        {orders.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {emptyMessage}
          </p>
        ) : (
          orders.map((order) => (
            <KanbanOrderCard
              key={order.id}
              order={order}
              onStatusChange={onStatusChange}
              updating={updatingId === order.id}
              tick={tick}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;
