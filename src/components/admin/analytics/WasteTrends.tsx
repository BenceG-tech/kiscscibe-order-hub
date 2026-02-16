import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingDown, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { format, subWeeks, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface WasteEntry {
  id: string;
  date: string;
  item_name: string;
  planned_portions: number | null;
  sold_portions: number | null;
  wasted_portions: number;
}

const DAY_NAMES = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];

const WasteTrends = () => {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEntries = async () => {
      const eightWeeksAgo = format(subWeeks(new Date(), 8), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_waste_log")
        .select("id, date, item_name, planned_portions, sold_portions, wasted_portions")
        .gte("date", eightWeeksAgo)
        .order("date", { ascending: true });

      if (!error) setEntries(data || []);
      setLoading(false);
    };
    fetchEntries();
  }, []);

  // Weekly totals for line chart
  const weeklyData = useMemo(() => {
    const weekMap: Record<string, number> = {};
    for (const e of entries) {
      const d = new Date(e.date);
      const weekStart = new Date(d);
      weekStart.setDate(d.getDate() - d.getDay() + 1);
      const key = format(weekStart, "MM.dd");
      weekMap[key] = (weekMap[key] || 0) + e.wasted_portions;
    }
    return Object.entries(weekMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([week, total]) => ({ week: `Hét ${week}`, wasted: total }));
  }, [entries]);

  // Day-of-week aggregation
  const dayAggregation = useMemo(() => {
    const dayMap: Record<number, { total: number; count: number }> = {};
    const dateSet = new Set<string>();
    
    for (const e of entries) {
      const dow = getDay(new Date(e.date));
      if (!dayMap[dow]) dayMap[dow] = { total: 0, count: 0 };
      dayMap[dow].total += e.wasted_portions;
      const key = `${e.date}-${dow}`;
      if (!dateSet.has(key)) {
        dateSet.add(key);
        dayMap[dow].count++;
      }
    }

    return Object.entries(dayMap)
      .map(([dow, data]) => ({
        day: DAY_NAMES[Number(dow)],
        dow: Number(dow),
        avg: data.count > 0 ? Math.round(data.total / data.count) : 0,
        total: data.total,
      }))
      .filter(d => d.dow >= 1 && d.dow <= 5)
      .sort((a, b) => b.avg - a.avg);
  }, [entries]);

  // Recurring waste items (appeared >= 3 times)
  const recurringItems = useMemo(() => {
    const itemMap: Record<string, { count: number; totalWasted: number; days: Set<number> }> = {};
    
    for (const e of entries) {
      if (!itemMap[e.item_name]) {
        itemMap[e.item_name] = { count: 0, totalWasted: 0, days: new Set() };
      }
      itemMap[e.item_name].count++;
      itemMap[e.item_name].totalWasted += e.wasted_portions;
      itemMap[e.item_name].days.add(getDay(new Date(e.date)));
    }

    return Object.entries(itemMap)
      .filter(([, data]) => data.count >= 3)
      .map(([name, data]) => ({
        name,
        count: data.count,
        totalWasted: data.totalWasted,
        days: Array.from(data.days).map(d => DAY_NAMES[d]),
      }))
      .sort((a, b) => b.count - a.count);
  }, [entries]);

  // Week-over-week trend
  const weekTrend = useMemo(() => {
    if (weeklyData.length < 2) return null;
    const last = weeklyData[weeklyData.length - 1].wasted;
    const prev = weeklyData[weeklyData.length - 2].wasted;
    if (prev === 0) return null;
    const change = Math.round(((last - prev) / prev) * 100);
    return { change, improving: change < 0 };
  }, [weeklyData]);

  // Template-based suggestions
  const suggestions = useMemo(() => {
    const tips: string[] = [];

    for (const item of recurringItems.slice(0, 3)) {
      tips.push(
        `A "${item.name}" az elmúlt 8 hétből ${item.count}-szor maradt — fontold meg a mennyiség csökkentését.`
      );
    }

    if (dayAggregation.length > 0) {
      const worstDay = dayAggregation[0];
      tips.push(
        `${worstDay.day} napra átlagosan ${worstDay.avg} adag marad — ez a legpazarlóbb nap.`
      );
    }

    if (weekTrend && !weekTrend.improving && weekTrend.change > 20) {
      tips.push(
        `A pazarlás az előző héthez képest ${weekTrend.change}%-kal nőtt — érdemes felülvizsgálni az adagszámokat.`
      );
    }

    return tips;
  }, [recurringItems, dayAggregation, weekTrend]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nincs elegendő pazarlási adat a trendek elemzéséhez.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Week trend indicator */}
      {weekTrend && (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          weekTrend.improving
            ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
            : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
        }`}>
          {weekTrend.improving
            ? <TrendingDown className="h-5 w-5 text-green-600" />
            : <TrendingUp className="h-5 w-5 text-red-600" />}
          <span className={`text-sm font-medium ${weekTrend.improving ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
            {weekTrend.improving
              ? `Javuló trend: ${Math.abs(weekTrend.change)}%-kal kevesebb pazarlás az előző héthez képest`
              : `Romló trend: ${weekTrend.change}%-kal több pazarlás az előző héthez képest`}
          </span>
        </div>
      )}

      {/* Weekly line chart */}
      {weeklyData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Heti pazarlás trend (8 hét)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Line type="monotone" dataKey="wasted" stroke="hsl(var(--destructive))" strokeWidth={2} dot={{ r: 4 }} name="Pazarolt adagok" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recurring items */}
      {recurringItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Ismétlődő pazarlás
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recurringItems.map((item) => (
                <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.count}× maradt · Napok: {item.days.join(", ")}
                    </p>
                  </div>
                  <Badge variant="destructive">{item.totalWasted} adag</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Day-of-week analysis */}
      {dayAggregation.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Pazarlás napok szerint</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {dayAggregation.map((day) => (
                <div key={day.day} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <span className="text-sm font-medium">{day.day}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">átl. {day.avg} adag/nap</span>
                    <Badge variant="outline">{day.total} összesen</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Javaslatok
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {suggestions.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-primary mt-0.5">💡</span>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default WasteTrends;
