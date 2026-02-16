import { Button } from "@/components/ui/button";
import { Phone, CreditCard, Banknote, Clock, XCircle, AlertTriangle, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  formatRelativeTime,
  formatPickupCountdown,
  getOrderUrgency,
} from "@/hooks/useTickTimer";

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
  coupon_code?: string | null;
  discount_huf?: number;
}

interface KanbanOrderCardProps {
  order: Order;
  onStatusChange: (orderId: string, newStatus: string) => void;
  updating: boolean;
  tick: number;
}

const STATUS_CONFIG = {
  new: {
    borderColor: "border-l-red-500",
    nextStatus: "preparing",
    actionLabel: "Elfogadom",
    actionClass: "bg-amber-500 hover:bg-amber-600 text-white",
  },
  preparing: {
    borderColor: "border-l-orange-500",
    nextStatus: "ready",
    actionLabel: "Kész!",
    actionClass: "bg-green-600 hover:bg-green-700 text-white",
  },
  ready: {
    borderColor: "border-l-green-500",
    nextStatus: "completed",
    actionLabel: "Átvéve",
    actionClass: "bg-gray-600 hover:bg-gray-700 text-white",
  },
} as const;

const KanbanOrderCard = ({ order, onStatusChange, updating, tick }: KanbanOrderCardProps) => {
  const config = STATUS_CONFIG[order.status as keyof typeof STATUS_CONFIG];
  if (!config) return null;

  const urgency = getOrderUrgency(order.pickup_time, order.status);
  const pickupInfo = formatPickupCountdown(order.pickup_time);
  const relativeTime = formatRelativeTime(order.created_at);

  return (
    <div
      className={cn(
        "bg-card rounded-lg border-l-4 shadow-sm transition-all duration-300",
        config.borderColor,
        urgency === "aging" && "ring-2 ring-amber-400/60 animate-pulse",
        urgency === "urgent" && "ring-2 ring-red-500/80 animate-pulse",
        pickupInfo?.urgency === "overdue" && "ring-2 ring-red-700 bg-red-50 dark:bg-red-950/30",
        pickupInfo?.urgency === "critical" && "ring-2 ring-red-500 bg-red-50/50 dark:bg-red-950/20",
      )}
    >
      <div className="p-3 sm:p-4 space-y-3">
        {/* Header: Code + Total */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              #{order.code}
            </span>
            <p className="text-xs text-muted-foreground mt-0.5">{relativeTime}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-foreground">
              {order.total_huf.toLocaleString("hu-HU")} Ft
            </span>
            {order.coupon_code && order.discount_huf && order.discount_huf > 0 && (
              <div className="flex items-center justify-end gap-1 text-xs text-green-600 dark:text-green-400 mt-0.5">
                <Tag className="h-3 w-3" />
                <span>{order.coupon_code} (-{order.discount_huf.toLocaleString("hu-HU")} Ft)</span>
              </div>
            )}
            <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground mt-0.5">
              {order.payment_method === "cash" ? (
                <>
                  <Banknote className="h-3.5 w-3.5" /> Készpénz
                </>
              ) : (
                <>
                  <CreditCard className="h-3.5 w-3.5" /> Kártya
                </>
              )}
            </div>
          </div>
        </div>

        {/* Pickup countdown */}
        {pickupInfo && (
          <div
            className={cn(
              "flex items-center gap-1.5 text-sm font-medium rounded px-2 py-1",
              pickupInfo.urgency === "normal" && "bg-muted text-foreground",
              pickupInfo.urgency === "warn" && "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
              pickupInfo.urgency === "critical" && "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 animate-pulse",
              pickupInfo.urgency === "overdue" && "bg-red-200 text-red-900 dark:bg-red-900/60 dark:text-red-200 font-bold",
            )}
          >
            {pickupInfo.urgency === "overdue" ? (
              <AlertTriangle className="h-4 w-4" />
            ) : (
              <Clock className="h-4 w-4" />
            )}
            {pickupInfo.text}
          </div>
        )}

        {/* Customer info */}
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">{order.name}</p>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <a href={`tel:${order.phone}`} className="flex items-center gap-1 hover:text-foreground">
              <Phone className="h-3 w-3" />
              <span>{order.phone}</span>
            </a>
          </div>
        </div>

        {/* Items list with options */}
        {order.items && order.items.length > 0 && (
          <div className="space-y-1.5">
            {order.items.map((item) => (
              <div key={item.id}>
                <div className="flex justify-between text-sm gap-2">
                  <span className="text-muted-foreground">
                    {item.qty}× {item.name_snapshot}
                  </span>
                  <span className="text-muted-foreground shrink-0">
                    {item.line_total_huf} Ft
                  </span>
                </div>
                {/* Item options (sides, modifiers) - filter out daily_meta */}
                {item.options && item.options.filter(o => o.option_type !== 'daily_meta').length > 0 && (
                  <div className="ml-5 mt-0.5 space-y-0.5">
                    {item.options
                      .filter(o => o.option_type !== 'daily_meta')
                      .map((opt) => (
                      <div key={opt.id} className="flex items-center gap-1 text-xs text-muted-foreground/80">
                        <span className="text-primary/60">↳</span>
                        <span>{opt.label_snapshot}</span>
                        {opt.price_delta_huf !== 0 && (
                          <span className="text-muted-foreground/60">
                            ({opt.price_delta_huf > 0 ? "+" : ""}{opt.price_delta_huf} Ft)
                          </span>
                        )}
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
          <div className="text-xs bg-muted/60 p-2 rounded text-muted-foreground italic">
            {order.notes}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <Button
            size="sm"
            className={cn(
              "flex-1 h-12 font-semibold text-sm relative z-10 touch-manipulation select-none",
              config.actionClass
            )}
            onClick={() => onStatusChange(order.id, config.nextStatus)}
            disabled={updating}
          >
            {updating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              config.actionLabel
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-11 w-11 p-0"
            asChild
          >
            <a href={`tel:${order.phone}`} aria-label="Hívás">
              <Phone className="h-4 w-4" />
            </a>
          </Button>

          {order.status !== "ready" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-11 w-11 p-0 text-muted-foreground hover:text-destructive"
                  disabled={updating}
                  aria-label="Lemondás"
                >
                  <XCircle className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Rendelés lemondása</AlertDialogTitle>
                  <AlertDialogDescription>
                    Biztosan le akarod mondani a <strong>#{order.code}</strong> számú rendelést?
                    Ez a művelet nem vonható vissza.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Mégsem</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    onClick={() => onStatusChange(order.id, "cancelled")}
                  >
                    Igen, lemondás
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
    </div>
  );
};

export default KanbanOrderCard;
