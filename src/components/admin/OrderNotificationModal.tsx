import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingBag, Clock, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface PendingOrder {
  id: string;
  code: string;
  total_huf: number;
  pickup_time: string | null;
  created_at: string;
}

interface OrderNotificationModalProps {
  order: PendingOrder | null;
  onDismiss: () => void;
  pendingCount: number;
}

const OrderNotificationModal = ({ order, onDismiss, pendingCount }: OrderNotificationModalProps) => {
  const navigate = useNavigate();

  if (!order) return null;

  const handleView = () => {
    onDismiss();
    navigate('/admin/orders');
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('hu-HU', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatPickupTime = (pickupTime: string | null) => {
    if (!pickupTime) return null;
    const date = new Date(pickupTime);
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();
    const time = date.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit' });
    return isToday ? `ma ${time}` : date.toLocaleDateString('hu-HU', { month: 'short', day: 'numeric' }) + ` ${time}`;
  };

  return (
    <Dialog open={!!order} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md border-2 border-primary bg-card p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {/* Animated Header */}
        <div className="bg-primary text-primary-foreground p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary-glow/20 to-transparent animate-pulse" />
          <div className="relative z-10">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-foreground/20 mb-4 animate-bounce">
              <Bell className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold">ÚJ RENDELÉS ÉRKEZETT!</h2>
            {pendingCount > 1 && (
              <p className="text-sm mt-2 opacity-80">
                +{pendingCount - 1} további rendelés várakozik
              </p>
            )}
          </div>
        </div>

        {/* Order Details */}
        <div className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Rendelés:</span>
              <span className="text-xl font-bold text-primary">#{order.code}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Összeg:</span>
              <span className="text-xl font-bold">{order.total_huf.toLocaleString('hu-HU')} Ft</span>
            </div>

            {order.pickup_time && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Átvétel:
                </span>
                <span className="font-medium">{formatPickupTime(order.pickup_time)}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Beérkezett:</span>
              <span>{formatTime(order.created_at)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleView}
              className="flex-1 h-12 text-base font-semibold"
            >
              <ShoppingBag className="h-5 w-5 mr-2" />
              Megtekintés
            </Button>
            <Button 
              variant="outline"
              onClick={onDismiss}
              className="h-12 px-4"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderNotificationModal;
