import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderData, OrderItemData } from "@/hooks/useAnalyticsData";
import StatCard from "./StatCard";
import { ShoppingBag, XCircle, ListOrdered, Clock } from "lucide-react";
import { format, parseISO, getDay } from "date-fns";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";

const COLORS = [
  "hsl(142 76% 36%)",
  "hsl(0 84% 60%)",
  "hsl(38 92% 50%)",
  "hsl(262 83% 58%)",
  "hsl(var(--primary))",
];

const DAY_NAMES_SHORT = ["V", "H", "K", "Sze", "Cs", "P", "Szo"];

interface OrdersTabProps {
  orders: OrderData[];
  orderItems: OrderItemData[];
}

const OrdersTab = ({ orders, orderItems }: OrdersTabProps) => {
  const totalOrders = orders.length;
  const cancelledCount = useMemo(() => orders.filter(o => o.status === "cancelled").length, [orders]);
  const cancellationRate = totalOrders ? ((cancelledCount / totalOrders) * 100).toFixed(1) : "0";

  const avgItemsPerOrder = useMemo(() => {
    if (!orders.length) return 0;
    const itemCounts = new Map<string, number>();
    orderItems.forEach(i => {
      if (i.order_id) itemCounts.set(i.order_id, (itemCounts.get(i.order_id) || 0) + i.qty);
    });
    const total = Array.from(itemCounts.values()).reduce((s, v) => s + v, 0);
    return itemCounts.size ? (total / itemCounts.size).toFixed(1) : "0";
  }, [orders, orderItems]);

  // Daily order trend
  const dailyOrders = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const day = format(parseISO(o.created_at), "MM.dd");
      map.set(day, (map.get(day) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
  }, [orders]);

  // Status breakdown
  const statusBreakdown = useMemo(() => {
    const map = new Map<string, number>();
    orders.forEach(o => {
      const label = o.status === "cancelled" ? "Lemondott" : o.status === "completed" ? "Teljesített" : "Egyéb";
      map.set(label, (map.get(label) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // Peak hours heatmap (Mon-Sat x 7:00-15:00)
  const heatmapData = useMemo(() => {
    // grid[dayIndex 1-6][hour 7-14] = count
    const grid: number[][] = Array.from({ length: 6 }, () => Array(8).fill(0));
    orders.forEach(o => {
      const time = o.pickup_time ? parseISO(o.pickup_time) : parseISO(o.created_at);
      const dow = getDay(time); // 0=Sun
      if (dow >= 1 && dow <= 6) {
        const h = time.getHours();
        if (h >= 7 && h < 15) {
          grid[dow - 1][h - 7]++;
        }
      }
    });
    return grid;
  }, [orders]);

  const maxHeat = useMemo(() => Math.max(1, ...heatmapData.flat()), [heatmapData]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={ShoppingBag} title="Összes rendelés" value={totalOrders} />
        <StatCard icon={XCircle} title="Lemondási ráta" value={`${cancellationRate}%`} subtitle={`${cancelledCount} lemondott`} />
        <StatCard icon={ListOrdered} title="Átl. tétel/rendelés" value={avgItemsPerOrder} />
        <StatCard icon={Clock} title="Aktív státuszok" value={orders.filter(o => !["completed", "cancelled"].includes(o.status)).length} />
      </div>

      {/* Daily order trend */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Napi rendelési trend</CardTitle></CardHeader>
        <CardContent>
          {dailyOrders.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={dailyOrders}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={(v: number) => [`${v} db`, "Rendelések"]} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Status pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Státusz megoszlás</CardTitle></CardHeader>
          <CardContent>
            {statusBreakdown.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {statusBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Peak hours heatmap */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Csúcsórák heatmap</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <div className="min-w-[300px]">
                {/* Header row */}
                <div className="grid grid-cols-[40px_repeat(8,1fr)] gap-1 mb-1">
                  <div />
                  {Array.from({ length: 8 }, (_, i) => (
                    <div key={i} className="text-[10px] text-muted-foreground text-center">{7 + i}:00</div>
                  ))}
                </div>
                {/* Data rows */}
                {["Hé", "Ke", "Sze", "Csü", "Pé", "Szo"].map((day, rowIdx) => (
                  <div key={day} className="grid grid-cols-[40px_repeat(8,1fr)] gap-1 mb-1">
                    <div className="text-[11px] text-muted-foreground flex items-center">{day}</div>
                    {heatmapData[rowIdx].map((count, colIdx) => {
                      const intensity = count / maxHeat;
                      return (
                        <div
                          key={colIdx}
                          className="aspect-square rounded-sm flex items-center justify-center text-[10px] font-medium"
                          style={{
                            backgroundColor: count === 0
                              ? "hsl(var(--muted))"
                              : `hsl(var(--primary) / ${0.15 + intensity * 0.85})`,
                            color: intensity > 0.5 ? "hsl(var(--primary-foreground))" : "hsl(var(--foreground))",
                          }}
                          title={`${day} ${7 + colIdx}:00 — ${count} rendelés`}
                        >
                          {count > 0 ? count : ""}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrdersTab;
