import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Clock,
  CreditCard,
  Banknote,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface PastOrdersSectionProps {
  orders: Order[];
}

/** Format date as Hungarian string: "február 7., péntek" */
const formatHungarianDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString("hu-HU", {
    month: "long",
    day: "numeric",
    weekday: "long",
  });
};

/** Group orders by date string (YYYY-MM-DD) */
const groupByDate = (orders: Order[]): Map<string, Order[]> => {
  const grouped = new Map<string, Order[]>();
  for (const order of orders) {
    const dateKey = new Date(order.created_at).toISOString().split("T")[0];
    if (!grouped.has(dateKey)) grouped.set(dateKey, []);
    grouped.get(dateKey)!.push(order);
  }
  // Sort by date descending
  return new Map(
    [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a))
  );
};

const getDateLabel = (dateKey: string): string => {
  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
  if (dateKey === today) return "Ma";
  if (dateKey === yesterday) return "Tegnap";
  return formatHungarianDate(dateKey);
};

const PastOrdersSection = ({ orders }: PastOrdersSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (orders.length === 0) return null;

  const grouped = groupByDate(orders);

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

      <CollapsibleContent className="mt-3 space-y-5">
        {[...grouped.entries()].map(([dateKey, dateOrders]) => (
          <div key={dateKey}>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {getDateLabel(dateKey)} ({dateOrders.length})
            </h4>
            <div className="space-y-2">
              {dateOrders.map((order) => (
                <PastOrderCard key={order.id} order={order} />
              ))}
            </div>
          </div>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
};

const PastOrderCard = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Collapsible open={expanded} onOpenChange={setExpanded}>
      <div
        className={cn(
          "rounded-lg border bg-card text-sm",
          order.status === "cancelled" && "opacity-60"
        )}
      >
        {/* Summary row (always visible) */}
        <CollapsibleTrigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-3 p-3 hover:bg-muted/30 transition-colors rounded-lg"
          >
            <div className="flex items-center gap-3 min-w-0">
              {order.status === "completed" ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 shrink-0" />
              )}
              <div className="min-w-0 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-bold">#{order.code}</span>
                  <span className="text-muted-foreground truncate">
                    {order.name}
                  </span>
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleTimeString("hu-HU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
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
              <span className="font-semibold">
                {order.total_huf.toLocaleString("hu-HU")} Ft
              </span>
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
              {expanded ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </div>
          </button>
        </CollapsibleTrigger>

        {/* Expanded details */}
        <CollapsibleContent>
          <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
            {/* Customer contact */}
            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <a
                href={`tel:${order.phone}`}
                className="flex items-center gap-1 hover:text-foreground"
              >
                <Phone className="h-3 w-3" />
                {order.phone}
              </a>
              {order.email && (
                <a
                  href={`mailto:${order.email}`}
                  className="flex items-center gap-1 hover:text-foreground"
                >
                  <Mail className="h-3 w-3" />
                  {order.email}
                </a>
              )}
              {order.pickup_time && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Átvétel:{" "}
                  {new Date(order.pickup_time).toLocaleString("hu-HU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              )}
            </div>

            {/* Ordered items */}
            {order.items && order.items.length > 0 && (
              <div className="space-y-1">
                {order.items.map((item) => (
                  <div key={item.id}>
                    <div className="flex justify-between text-xs gap-2">
                      <span>
                        {item.qty}× {item.name_snapshot}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {item.line_total_huf} Ft
                      </span>
                    </div>
                    {item.options &&
                      item.options.filter((o) => o.option_type !== "daily_meta")
                        .length > 0 && (
                        <div className="ml-4 space-y-0.5">
                          {item.options
                            .filter((o) => o.option_type !== "daily_meta")
                            .map((opt) => (
                              <div
                                key={opt.id}
                                className="text-xs text-muted-foreground/70"
                              >
                                ↳ {opt.label_snapshot}
                                {opt.price_delta_huf !== 0 &&
                                  ` (${opt.price_delta_huf > 0 ? "+" : ""}${opt.price_delta_huf} Ft)`}
                              </div>
                            ))}
                        </div>
                      )}
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            {order.notes && (
              <p className="text-xs bg-muted/60 p-2 rounded text-muted-foreground italic">
                {order.notes}
              </p>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default PastOrdersSection;
