import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, CheckCircle, XCircle, Calendar, CreditCard, Banknote } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface PastOrdersSectionProps {
  orders: Order[];
}

const PastOrdersSection = ({ orders }: PastOrdersSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (orders.length === 0) return null;

  // Group by date
  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();

  const grouped = {
    today: orders.filter((o) => new Date(o.created_at).toDateString() === today),
    yesterday: orders.filter((o) => new Date(o.created_at).toDateString() === yesterday),
    older: orders.filter((o) => {
      const d = new Date(o.created_at).toDateString();
      return d !== today && d !== yesterday;
    }),
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="mt-6">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg hover:bg-muted"
        >
          <span className="font-semibold text-sm">
            Múltbeli rendelések ({orders.length})
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              isOpen && "rotate-180"
            )}
          />
        </Button>
      </CollapsibleTrigger>

      <CollapsibleContent className="mt-3 space-y-4">
        {grouped.today.length > 0 && (
          <PastGroup label="Ma" orders={grouped.today} />
        )}
        {grouped.yesterday.length > 0 && (
          <PastGroup label="Tegnap" orders={grouped.yesterday} />
        )}
        {grouped.older.length > 0 && (
          <PastGroup label="Régebbi" orders={grouped.older} />
        )}
      </CollapsibleContent>
    </Collapsible>
  );
};

const PastGroup = ({ label, orders }: { label: string; orders: Order[] }) => (
  <div>
    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
      {label}
    </h4>
    <div className="space-y-2">
      {orders.map((order) => (
        <div
          key={order.id}
          className={cn(
            "flex items-center justify-between gap-3 p-3 rounded-lg border bg-card text-sm",
            order.status === "cancelled" && "opacity-60"
          )}
        >
          <div className="flex items-center gap-3 min-w-0">
            {order.status === "completed" ? (
              <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500 shrink-0" />
            )}
            <div className="min-w-0">
              <span className="font-bold">#{order.code}</span>
              <span className="text-muted-foreground ml-2 truncate">{order.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              {order.payment_method === "cash" ? (
                <Banknote className="h-3.5 w-3.5" />
              ) : (
                <CreditCard className="h-3.5 w-3.5" />
              )}
            </div>
            <span className="font-semibold">{order.total_huf.toLocaleString("hu-HU")} Ft</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs",
                order.status === "completed"
                  ? "border-green-500 text-green-700 dark:text-green-400"
                  : "border-red-400 text-red-600 dark:text-red-400"
              )}
            >
              {order.status === "completed" ? "Átvéve" : "Lemondva"}
            </Badge>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default PastOrdersSection;
