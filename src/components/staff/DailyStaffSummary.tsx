import { ClipboardList, Activity, Clock } from "lucide-react";
import { formatPickupCountdown } from "@/hooks/useTickTimer";

interface Order {
  id: string;
  status: string;
  pickup_time: string | null;
  created_at: string;
}

interface DailyStaffSummaryProps {
  orders: Order[];
  tick: number;
}

const DailyStaffSummary = ({ orders, tick: _tick }: DailyStaffSummaryProps) => {
  const todayStr = new Date().toDateString();
  const todayOrders = orders.filter(o => new Date(o.created_at).toDateString() === todayStr && o.status !== "cancelled");
  const activeCount = orders.filter(o => ["new", "preparing", "ready"].includes(o.status)).length;

  // Find next pickup
  const now = Date.now();
  const upcomingPickups = orders
    .filter(o => ["new", "preparing", "ready"].includes(o.status) && o.pickup_time)
    .map(o => ({ time: o.pickup_time!, ms: new Date(o.pickup_time!).getTime() }))
    .filter(p => p.ms > now - 60000) // include slightly overdue
    .sort((a, b) => a.ms - b.ms);

  const nextPickup = upcomingPickups[0];
  const nextPickupInfo = nextPickup ? formatPickupCountdown(nextPickup.time) : null;

  return (
    <div className="grid grid-cols-3 gap-2 px-2">
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <ClipboardList className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">Mai</p>
          <p className="text-lg font-bold leading-tight">{todayOrders.length}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <Activity className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight">Aktív</p>
          <p className="text-lg font-bold leading-tight">{activeCount}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-muted/50 rounded-lg px-3 py-2">
        <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground leading-tight truncate">Következő</p>
          <p className={`text-sm font-bold leading-tight truncate ${
            nextPickupInfo?.urgency === "overdue" ? "text-red-500" :
            nextPickupInfo?.urgency === "critical" ? "text-red-500" :
            nextPickupInfo?.urgency === "warn" ? "text-orange-500" : ""
          }`}>
            {nextPickupInfo ? nextPickupInfo.text : "—"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DailyStaffSummary;
