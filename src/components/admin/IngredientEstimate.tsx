import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, addDays, subWeeks } from "date-fns";
import { hu } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Printer, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import InfoTip from "./InfoTip";

const IngredientEstimate = () => {
  const [targetDate, setTargetDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    // Skip weekends
    const day = tomorrow.getDay();
    if (day === 0) tomorrow.setDate(tomorrow.getDate() + 1);
    if (day === 6) tomorrow.setDate(tomorrow.getDate() + 2);
    return tomorrow;
  });

  const dateStr = format(targetDate, "yyyy-MM-dd");
  const dayOfWeek = targetDate.getDay();

  // Fetch daily offer items for target date
  const { data: offerItems, isLoading: itemsLoading } = useQuery({
    queryKey: ["ingredient-estimate-items", dateStr],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offer_items")
        .select("id, item_id, is_menu_part, menu_role, menu_items(name, price_huf), daily_offers!inner(date, max_portions)")
        .eq("daily_offers.date", dateStr);
      if (error) throw error;
      return data || [];
    },
  });

  // Get previous 4 same-weekday dates
  const historicalDates = useMemo(() => {
    const dates: string[] = [];
    for (let w = 1; w <= 4; w++) {
      dates.push(format(subWeeks(targetDate, w), "yyyy-MM-dd"));
    }
    return dates;
  }, [targetDate]);

  // Fetch historical order data for same weekdays
  const { data: historicalData, isLoading: historyLoading } = useQuery({
    queryKey: ["ingredient-estimate-history", historicalDates],
    queryFn: async () => {
      const allItems: Record<string, number[]> = {};

      for (const histDate of historicalDates) {
        const { data: dayOrders } = await supabase
          .from("orders")
          .select("id")
          .gte("created_at", `${histDate}T00:00:00`)
          .lte("created_at", `${histDate}T23:59:59`)
          .neq("status", "cancelled");

        if (!dayOrders || dayOrders.length === 0) continue;

        const orderIds = dayOrders.map(o => o.id);
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("name_snapshot, qty")
          .in("order_id", orderIds);

        if (orderItems) {
          for (const item of orderItems) {
            if (!allItems[item.name_snapshot]) allItems[item.name_snapshot] = [];
            allItems[item.name_snapshot].push(item.qty);
          }
        }
      }

      // Calculate averages
      const averages: Record<string, number> = {};
      for (const [name, quantities] of Object.entries(allItems)) {
        averages[name] = Math.round(quantities.reduce((a, b) => a + b, 0) / historicalDates.length);
      }
      return averages;
    },
  });

  const isLoading = itemsLoading || historyLoading;

  const estimates = useMemo(() => {
    if (!offerItems || !historicalData) return [];

    return offerItems.map((item: any) => {
      const name = item.menu_items?.name || "Ismeretlen";
      const maxPortions = item.daily_offers?.max_portions || 50;
      const estimated = historicalData[name] || 0;
      const suggested = Math.max(estimated, Math.ceil(estimated * 1.2));

      let status: "ok" | "warn" | "danger" = "ok";
      if (maxPortions < estimated) status = "danger";
      else if (maxPortions < estimated * 1.2) status = "warn";

      return {
        name,
        menuRole: item.menu_role,
        isMenuPart: item.is_menu_part,
        maxPortions,
        estimated,
        suggested,
        status,
      };
    });
  }, [offerItems, historicalData]);

  const goBack = () => {
    const prev = new Date(targetDate);
    prev.setDate(prev.getDate() - 1);
    if (prev.getDay() === 0) prev.setDate(prev.getDate() - 2);
    if (prev.getDay() === 6) prev.setDate(prev.getDate() - 1);
    setTargetDate(prev);
  };

  const goForward = () => {
    const next = new Date(targetDate);
    next.setDate(next.getDate() + 1);
    if (next.getDay() === 0) next.setDate(next.getDate() + 1);
    if (next.getDay() === 6) next.setDate(next.getDate() + 2);
    setTargetDate(next);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            Készlet becslés
            <InfoTip text="Az elmúlt 4 hét azonos napjainak rendelési adatai alapján becsült adagszám." />
          </CardTitle>
          <Button variant="outline" size="sm" className="print:hidden" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" />
            Nyomtatás
          </Button>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goBack}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">
            {format(targetDate, "yyyy. MMMM d., EEEE", { locale: hu })}
          </span>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goForward}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : estimates.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            Nincs beállított napi ajánlat erre a napra.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4">Étel neve</th>
                  <th className="text-center py-2 px-2">Szerep</th>
                  <th className="text-center py-2 px-2">Beállított</th>
                  <th className="text-center py-2 px-2">Becsült igény</th>
                  <th className="text-center py-2 px-2">Javasolt</th>
                  <th className="text-center py-2 px-2">Állapot</th>
                </tr>
              </thead>
              <tbody>
                {estimates.map((est, idx) => (
                  <tr key={idx} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 font-medium">{est.name}</td>
                    <td className="text-center py-2 px-2">
                      {est.isMenuPart && (
                        <Badge variant="outline" className="text-[10px]">
                          {est.menuRole === "leves" ? "Leves" : "Főétel"}
                        </Badge>
                      )}
                    </td>
                    <td className="text-center py-2 px-2">{est.maxPortions}</td>
                    <td className="text-center py-2 px-2">{est.estimated}</td>
                    <td className="text-center py-2 px-2 font-semibold">{est.suggested}</td>
                    <td className="text-center py-2 px-2">
                      <Badge
                        variant={est.status === "ok" ? "default" : est.status === "warn" ? "secondary" : "destructive"}
                        className={
                          est.status === "ok"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : est.status === "warn"
                            ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                            : ""
                        }
                      >
                        {est.status === "ok" ? "OK" : est.status === "warn" ? "Szoros" : "Kevés!"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IngredientEstimate;
