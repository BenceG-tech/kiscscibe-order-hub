import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingBag, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface PendingOrder {
  id: string;
  code: string;
  total_huf: number;
  pickup_time: string | null;
  created_at: string;
}

interface OrderNotificationOverlayProps {
  orders: PendingOrder[];
  onDismissOne: (id: string) => void;
  onDismissAll: () => void;
  navigateTo?: string;
}

const formatTime = (dateString: string) =>
  new Date(dateString).toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });

const formatPickup = (pickupTime: string | null) => {
  if (!pickupTime) return "ASAP";
  const date = new Date(pickupTime);
  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const time = date.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" });
  return isToday
    ? `ma ${time}`
    : `${date.toLocaleDateString("hu-HU", { month: "short", day: "numeric" })} ${time}`;
};

const OrderNotificationOverlay = ({
  orders,
  onDismissOne,
  onDismissAll,
  navigateTo = "/admin/orders",
}: OrderNotificationOverlayProps) => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  if (orders.length === 0) return null;

  const count = orders.length;

  const handleViewOne = (id: string) => {
    onDismissOne(id);
    navigate(navigateTo);
  };
  const handleViewAll = () => {
    onDismissAll();
    navigate(navigateTo);
  };

  // ── Single order: keep the classic large centered card look ──
  if (count === 1) {
    const order = orders[0];
    return (
      <Dialog open onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md border-2 border-primary bg-card p-0 overflow-hidden [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <div className="bg-primary text-primary-foreground p-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-transparent animate-pulse" />
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-4 animate-bounce">
                <Bell className="h-8 w-8" />
              </div>
              <h2 className="text-2xl font-bold">ÚJ RENDELÉS ÉRKEZETT!</h2>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rendelés:</span>
                <span className="text-xl font-bold text-primary">#{order.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Összeg:</span>
                <span className="text-xl font-bold">{order.total_huf.toLocaleString("hu-HU")} Ft</span>
              </div>
              {order.pickup_time && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Átvétel:
                  </span>
                  <span className="font-medium">{formatPickup(order.pickup_time)}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Beérkezett:</span>
                <span>{formatTime(order.created_at)}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleViewOne(order.id)} className="flex-1 h-12 text-base font-semibold">
                <ShoppingBag className="h-5 w-5 mr-2" />
                Megtekintés
              </Button>
              <Button variant="outline" onClick={() => onDismissOne(order.id)} className="h-12 px-4">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // ── Multi-order adaptive grid ──
  const gridCols = isMobile
    ? "grid-cols-1"
    : count === 2
    ? "grid-cols-2"
    : count <= 4
    ? "grid-cols-2"
    : "grid-cols-3";

  // Compact styling when many cards.
  const compact = !isMobile && count >= 5;
  const cardPad = compact ? "p-3" : "p-4";
  const codeSize = compact ? "text-lg" : "text-xl";
  const priceSize = compact ? "text-base" : "text-lg";

  const maxDialogWidth = count <= 2 ? "sm:max-w-2xl" : count <= 4 ? "sm:max-w-3xl" : "sm:max-w-5xl";

  return (
    <Dialog open onOpenChange={() => {}}>
      <DialogContent
        className={cn(
          "border-2 border-primary bg-card p-0 overflow-hidden [&>button]:hidden flex flex-col",
          maxDialogWidth,
          "max-h-[92vh] w-[calc(100vw-1rem)]"
        )}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Header */}
        <div className="bg-primary text-primary-foreground px-4 py-3 sm:px-6 sm:py-4 relative overflow-hidden shrink-0">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-transparent animate-pulse" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary-foreground/20 animate-bounce shrink-0">
                <Bell className="h-5 w-5" />
              </div>
              <h2 className="text-lg sm:text-xl font-bold">{count} új rendelés érkezett!</h2>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleViewAll}
                className="h-9 flex-1 sm:flex-none"
              >
                <ShoppingBag className="h-4 w-4 mr-1" />
                Összes megtekintése
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onDismissAll}
                className="h-9 bg-transparent border-primary-foreground/40 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                Összes bezárása
              </Button>
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="overflow-y-auto p-3 sm:p-4">
          <div className={cn("grid gap-3", gridCols)}>
            {orders.map((order) => (
              <div
                key={order.id}
                className={cn(
                  "relative rounded-lg border bg-muted/40 hover:bg-muted/60 transition-colors",
                  cardPad
                )}
              >
                <button
                  onClick={() => onDismissOne(order.id)}
                  aria-label="Bezárás"
                  className="absolute top-1 right-1 h-7 w-7 inline-flex items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex items-baseline justify-between pr-6 mb-2">
                  <span className={cn("font-bold text-primary", codeSize)}>#{order.code}</span>
                  <span className={cn("font-bold", priceSize)}>
                    {order.total_huf.toLocaleString("hu-HU")} Ft
                  </span>
                </div>

                <div className="space-y-1 text-xs sm:text-sm text-muted-foreground">
                  {order.pickup_time && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      <span className="text-foreground font-medium">
                        Átvétel: {formatPickup(order.pickup_time)}
                      </span>
                    </div>
                  )}
                  <div>Beérkezett: {formatTime(order.created_at)}</div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleViewOne(order.id)}
                  className="mt-3 w-full h-9 text-sm font-semibold"
                >
                  <ShoppingBag className="h-4 w-4 mr-1" />
                  Megtekintés
                </Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderNotificationOverlay;
