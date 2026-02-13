import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderData } from "@/hooks/useAnalyticsData";
import StatCard from "./StatCard";
import { DollarSign, TrendingUp, CreditCard, CalendarDays, Clock } from "lucide-react";
import { format, parseISO, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(142 76% 36%)",
  "hsl(38 92% 50%)",
  "hsl(0 84% 60%)",
  "hsl(262 83% 58%)",
];

const DAY_NAMES = ["Vas", "Hé", "Ke", "Sze", "Csü", "Pé", "Szo"];

interface RevenueTabProps {
  orders: OrderData[];
}

const RevenueTab = ({ orders }: RevenueTabProps) => {
  const completedOrders = useMemo(() => orders.filter(o => o.status !== "cancelled"), [orders]);

  const totalRevenue = useMemo(() => completedOrders.reduce((sum, o) => sum + o.total_huf, 0), [completedOrders]);
  const avgOrderValue = useMemo(() => completedOrders.length ? Math.round(totalRevenue / completedOrders.length) : 0, [totalRevenue, completedOrders]);

  // Daily revenue trend
  const dailyRevenue = useMemo(() => {
    const map = new Map<string, number>();
    completedOrders.forEach(o => {
      const day = format(parseISO(o.created_at), "MM.dd");
      map.set(day, (map.get(day) || 0) + o.total_huf);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, revenue]) => ({ date, revenue }));
  }, [completedOrders]);

  // Average order value trend
  const avgOrderTrend = useMemo(() => {
    const map = new Map<string, { total: number; count: number }>();
    completedOrders.forEach(o => {
      const day = format(parseISO(o.created_at), "MM.dd");
      const prev = map.get(day) || { total: 0, count: 0 };
      map.set(day, { total: prev.total + o.total_huf, count: prev.count + 1 });
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, { total, count }]) => ({ date, avg: Math.round(total / count) }));
  }, [completedOrders]);

  // Payment method split
  const paymentSplit = useMemo(() => {
    const map = new Map<string, number>();
    completedOrders.forEach(o => {
      const method = o.payment_method === "card" ? "Kártya" : "Készpénz";
      map.set(method, (map.get(method) || 0) + o.total_huf);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [completedOrders]);

  // Best day of week
  const dayOfWeekRevenue = useMemo(() => {
    const totals = [0, 0, 0, 0, 0, 0, 0];
    completedOrders.forEach(o => {
      const dow = getDay(parseISO(o.created_at));
      totals[dow] += o.total_huf;
    });
    // Mon-Sat (skip Sunday index 0)
    return [1, 2, 3, 4, 5, 6].map(i => ({ day: DAY_NAMES[i], revenue: totals[i] }));
  }, [completedOrders]);

  // Revenue by time slot (30min buckets 7:00-15:00)
  const timeSlotRevenue = useMemo(() => {
    const slots: Record<string, number> = {};
    for (let h = 7; h < 15; h++) {
      slots[`${h}:00`] = 0;
      slots[`${h}:30`] = 0;
    }
    completedOrders.forEach(o => {
      const time = o.pickup_time ? parseISO(o.pickup_time) : parseISO(o.created_at);
      const h = time.getHours();
      const m = time.getMinutes();
      if (h >= 7 && h < 15) {
        const key = `${h}:${m < 30 ? "00" : "30"}`;
        if (slots[key] !== undefined) slots[key] += o.total_huf;
      }
    });
    return Object.entries(slots).map(([time, revenue]) => ({ time, revenue }));
  }, [completedOrders]);

  const fmtHuf = (v: number) => `${v.toLocaleString("hu-HU")} Ft`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={DollarSign} title="Össz bevétel" value={fmtHuf(totalRevenue)} />
        <StatCard icon={TrendingUp} title="Átl. rendelési érték" value={fmtHuf(avgOrderValue)} />
        <StatCard icon={CreditCard} title="Rendelések" value={completedOrders.length} />
      </div>

      {/* Daily revenue line chart */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Napi bevétel</CardTitle></CardHeader>
        <CardContent>
          {dailyRevenue.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat a választott időszakban</p>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtHuf(v), "Bevétel"]} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Avg order value trend */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Átlagos rendelési érték trend</CardTitle></CardHeader>
        <CardContent>
          {avgOrderTrend.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={avgOrderTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(1)}k`} />
                <Tooltip formatter={(v: number) => [fmtHuf(v), "Átlag"]} />
                <Line type="monotone" dataKey="avg" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Payment method pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Fizetési mód megoszlás</CardTitle></CardHeader>
          <CardContent>
            {paymentSplit.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={paymentSplit} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {paymentSplit.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmtHuf(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Best day of week */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Legjobb nap a héten</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={dayOfWeekRevenue}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [fmtHuf(v), "Bevétel"]} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Revenue by time slot */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Bevétel időszakonként</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={timeSlotRevenue}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval={1} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => [fmtHuf(v), "Bevétel"]} />
              <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default RevenueTab;
