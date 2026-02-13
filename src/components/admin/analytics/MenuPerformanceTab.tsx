import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderItemData, OrderItemOptionData, MenuItemData, MenuCategoryData } from "@/hooks/useAnalyticsData";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface MenuPerformanceTabProps {
  orderItems: OrderItemData[];
  orderItemOptions: OrderItemOptionData[];
  menuItems: MenuItemData[];
  menuCategories: MenuCategoryData[];
}

const MenuPerformanceTab = ({ orderItems, orderItemOptions, menuItems, menuCategories }: MenuPerformanceTabProps) => {
  // Top 10 most ordered
  const topItems = useMemo(() => {
    const map = new Map<string, number>();
    orderItems.forEach(i => {
      map.set(i.name_snapshot, (map.get(i.name_snapshot) || 0) + i.qty);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 25 ? name.slice(0, 25) + "…" : name, count }));
  }, [orderItems]);

  // Bottom 10
  const bottomItems = useMemo(() => {
    const map = new Map<string, number>();
    orderItems.forEach(i => {
      map.set(i.name_snapshot, (map.get(i.name_snapshot) || 0) + i.qty);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1] - b[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }, [orderItems]);

  // Category performance
  const categoryPerformance = useMemo(() => {
    const catMap = new Map<string, string>();
    menuCategories.forEach(c => catMap.set(c.id, c.name));

    const itemCatMap = new Map<string, string>();
    menuItems.forEach(mi => {
      if (mi.category_id) itemCatMap.set(mi.id, catMap.get(mi.category_id) || "Egyéb");
    });

    const counts = new Map<string, number>();
    orderItems.forEach(oi => {
      const cat = (oi.item_id && itemCatMap.get(oi.item_id)) || "Egyéb";
      counts.set(cat, (counts.get(cat) || 0) + oi.qty);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [orderItems, menuItems, menuCategories]);

  // Side popularity
  const sidePopularity = useMemo(() => {
    const map = new Map<string, number>();
    orderItemOptions.filter(o => o.option_type === "side").forEach(o => {
      map.set(o.label_snapshot, (map.get(o.label_snapshot) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, count }));
  }, [orderItemOptions]);

  // Modifier usage
  const modifierUsage = useMemo(() => {
    const map = new Map<string, number>();
    orderItemOptions.filter(o => o.option_type === "modifier").forEach(o => {
      map.set(o.label_snapshot, (map.get(o.label_snapshot) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, count }));
  }, [orderItemOptions]);

  const fmtBar = (v: number) => [`${v} db`, "Darab"];

  return (
    <div className="space-y-6">
      {/* Top 10 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Top 10 legrendeltebb étel</CardTitle></CardHeader>
        <CardContent>
          {topItems.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={topItems} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={140} />
                <Tooltip formatter={fmtBar} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Bottom 10 */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Alsó 10 — eltávolítási jelöltek</CardTitle></CardHeader>
        <CardContent>
          {bottomItems.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
          ) : (
            <div className="space-y-2">
              {bottomItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                  <span className="text-sm truncate max-w-[70%]">{item.name}</span>
                  <span className="text-sm font-medium text-muted-foreground">{item.count} db</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category performance */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">Kategória teljesítmény</CardTitle></CardHeader>
        <CardContent>
          {categoryPerformance.length === 0 ? (
            <p className="text-muted-foreground text-sm py-8 text-center">Nincs adat</p>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={categoryPerformance}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip formatter={fmtBar} />
                <Bar dataKey="count" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        {/* Side popularity */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Köretek népszerűsége</CardTitle></CardHeader>
          <CardContent>
            {sidePopularity.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs köret adat</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={sidePopularity} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={fmtBar} />
                  <Bar dataKey="count" fill="hsl(142 76% 36%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Modifier usage */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Modifier használat</CardTitle></CardHeader>
          <CardContent>
            {modifierUsage.length === 0 ? (
              <p className="text-muted-foreground text-sm py-8 text-center">Nincs modifier adat</p>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={modifierUsage} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
                  <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={120} />
                  <Tooltip formatter={fmtBar} />
                  <Bar dataKey="count" fill="hsl(38 92% 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MenuPerformanceTab;
