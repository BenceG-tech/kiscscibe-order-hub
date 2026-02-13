import { useState } from "react";
import { ChevronDown, ChefHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderItem {
  name_snapshot: string;
  qty: number;
}

interface Order {
  status: string;
  items?: OrderItem[];
}

interface ItemsToPrepareSummaryProps {
  orders: Order[];
}

const ItemsToPrepareSummary = ({ orders }: ItemsToPrepareSummaryProps) => {
  const [open, setOpen] = useState(false);

  const activeOrders = orders.filter(o => ["new", "preparing"].includes(o.status));
  
  // Aggregate items
  const itemMap = new Map<string, number>();
  for (const order of activeOrders) {
    for (const item of order.items || []) {
      itemMap.set(item.name_snapshot, (itemMap.get(item.name_snapshot) || 0) + item.qty);
    }
  }

  const aggregated = Array.from(itemMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  if (aggregated.length === 0) return null;

  return (
    <div className="mx-2 rounded-lg border border-border/60 bg-card/80 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ChefHat className="h-4 w-4 text-primary" />
          <span>Elkészítendő tételek ({aggregated.length})</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
          {aggregated.map(({ name, qty }) => (
            <span key={name} className="inline-flex items-center gap-1 text-sm bg-muted rounded-full px-2.5 py-1">
              <span className="font-bold text-primary">{qty}×</span>
              <span className="truncate max-w-[160px]">{name}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default ItemsToPrepareSummary;
