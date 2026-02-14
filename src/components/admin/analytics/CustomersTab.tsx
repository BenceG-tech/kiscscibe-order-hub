import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderData } from "@/hooks/useAnalyticsData";
import StatCard from "./StatCard";
import { Users, UserPlus, Repeat, CalendarDays } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { differenceInDays, parseISO } from "date-fns";

const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(142 76% 36%)", "hsl(38 92% 50%)"];

interface CustomersTabProps {
  orders: OrderData[];
}

const CustomersTab = ({ orders }: CustomersTabProps) => {
  // Group by customer identifier (phone)
  const customerMap = useMemo(() => {
    const map = new Map<string, OrderData[]>();
    orders.forEach(o => {
      const key = o.phone || o.email || "unknown";
      const list = map.get(key) || [];
      list.push(o);
      map.set(key, list);
    });
    return map;
  }, [orders]);

  const uniqueCustomers = customerMap.size;
  const newCustomers = useMemo(() => {
    return Array.from(customerMap.values()).filter(list => list.length === 1).length;
  }, [customerMap]);
  const returningCustomers = uniqueCustomers - newCustomers;

  const newVsReturning = [
    { name: "Új", value: newCustomers },
    { name: "Visszatérő", value: returningCustomers },
  ];

  // Top 10 customers
  const topCustomers = useMemo(() => {
    return Array.from(customerMap.entries())
      .map(([key, list]) => ({
        name: list[0].name,
        phone: key,
        orderCount: list.length,
        totalSpent: list.reduce((s, o) => s + o.total_huf, 0),
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
  }, [customerMap]);

  // Avg days between orders (for returning customers)
  const avgFrequency = useMemo(() => {
    const frequencies: number[] = [];
    customerMap.forEach((list) => {
      if (list.length < 2) return;
      const sorted = list.sort((a, b) => a.created_at.localeCompare(b.created_at));
      for (let i = 1; i < sorted.length; i++) {
        const diff = differenceInDays(parseISO(sorted[i].created_at), parseISO(sorted[i - 1].created_at));
        if (diff > 0) frequencies.push(diff);
      }
    });
    if (!frequencies.length) return 0;
    return Math.round(frequencies.reduce((s, v) => s + v, 0) / frequencies.length);
  }, [customerMap]);

  const fmtHuf = (v: number) => `${v.toLocaleString("hu-HU")} Ft`;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} title="Egyedi vásárlók" value={uniqueCustomers} />
        <StatCard icon={UserPlus} title="Új vásárlók" value={newCustomers} />
        <StatCard icon={Repeat} title="Visszatérő" value={returningCustomers} />
        <StatCard icon={CalendarDays} title="Átl. visszatérés" value={avgFrequency ? `${avgFrequency} nap` : "—"} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* New vs returning pie */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Új vs. visszatérő arány</CardTitle></CardHeader>
          <CardContent>
            {uniqueCustomers === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={newVsReturning} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    {newVsReturning.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: 8 }} labelStyle={{ color: "hsl(var(--muted-foreground))" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top 10 customers table */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 vásárló</CardTitle></CardHeader>
          <CardContent>
            {topCustomers.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-2 font-medium text-muted-foreground">Név</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Rend.</th>
                      <th className="text-right py-2 font-medium text-muted-foreground">Összeg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers.map((c, i) => (
                      <tr key={i} className="border-b border-border/30 last:border-0">
                        <td className="py-1.5 truncate max-w-[150px]">{c.name}</td>
                        <td className="py-1.5 text-right">{c.orderCount}</td>
                        <td className="py-1.5 text-right font-medium">{fmtHuf(c.totalSpent)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CustomersTab;
