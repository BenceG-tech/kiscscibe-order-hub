import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface Order {
  id: string;
  status: string;
  pickup_time: string | null;
  items?: { name_snapshot: string; qty: number }[];
}

interface PrintableDailySummaryProps {
  orders: Order[];
}

const PrintableDailySummary = ({ orders }: PrintableDailySummaryProps) => {
  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch today's daily offer items
  const { data: dailyItems } = useQuery({
    queryKey: ["print-daily-items", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offer_items")
        .select("id, is_menu_part, menu_role, menu_items(name, price_huf), daily_offers!inner(date, max_portions, remaining_portions)")
        .eq("daily_offers.date", today);
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch menu price
  const { data: menuData } = useQuery({
    queryKey: ["print-menu-data", today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offer_menus")
        .select("menu_price_huf, max_portions, remaining_portions, daily_offers!inner(date)")
        .eq("daily_offers.date", today)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const activeOrders = orders.filter(o => ["new", "preparing"].includes(o.status));

  // Aggregate items to prepare
  const itemMap = new Map<string, number>();
  for (const order of activeOrders) {
    for (const item of order.items || []) {
      itemMap.set(item.name_snapshot, (itemMap.get(item.name_snapshot) || 0) + item.qty);
    }
  }
  const aggregated = Array.from(itemMap.entries()).sort((a, b) => b[1] - a[1]);

  // Group by pickup time slots
  const timeSlots = new Map<string, { name: string; qty: number }[]>();
  for (const order of activeOrders) {
    const slotLabel = order.pickup_time
      ? format(new Date(order.pickup_time), "HH:mm")
      : "Nincs megadva";
    if (!timeSlots.has(slotLabel)) timeSlots.set(slotLabel, []);
    for (const item of order.items || []) {
      const slot = timeSlots.get(slotLabel)!;
      const existing = slot.find(s => s.name === item.name_snapshot);
      if (existing) existing.qty += item.qty;
      else slot.push({ name: item.name_snapshot, qty: item.qty });
    }
  }

  const sortedSlots = Array.from(timeSlots.entries()).sort((a, b) => a[0].localeCompare(b[0]));

  return (
    <div className="hidden print:block p-4 text-black bg-white" id="printable-summary">
      <h1 className="text-xl font-bold mb-1">
        Kiscsibe — Napi összesítő
      </h1>
      <p className="text-sm mb-4">
        {format(new Date(), "yyyy. MMMM d., EEEE", { locale: hu })}
      </p>

      {/* Daily offer items */}
      {dailyItems && dailyItems.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold border-b border-black pb-1 mb-2">Mai napi ajánlat</h2>
          {menuData && (
            <p className="text-sm mb-1">
              Menü ár: <strong>{(menuData as any).menu_price_huf} Ft</strong> | 
              Adagok: {(menuData as any).remaining_portions}/{(menuData as any).max_portions}
            </p>
          )}
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1">Étel</th>
                <th className="text-center py-1 w-20">Szerep</th>
                <th className="text-center py-1 w-20">Adag</th>
              </tr>
            </thead>
            <tbody>
              {dailyItems.map((item: any, i: number) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">{item.menu_items?.name}</td>
                  <td className="text-center py-1">
                    {item.is_menu_part ? (item.menu_role === "leves" ? "Leves" : "Főétel") : "—"}
                  </td>
                  <td className="text-center py-1">{item.daily_offers?.max_portions || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Items to prepare */}
      {aggregated.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold border-b border-black pb-1 mb-2">
            Elkészítendő tételek ({activeOrders.length} aktív rendelés)
          </h2>
          <table className="w-full text-sm border-collapse">
            <tbody>
              {aggregated.map(([name, qty], i) => (
                <tr key={i} className="border-b border-gray-300">
                  <td className="py-1">{name}</td>
                  <td className="text-right py-1 font-bold w-16">{qty} db</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Time slot breakdown */}
      {sortedSlots.length > 0 && (
        <div className="mb-4">
          <h2 className="text-base font-bold border-b border-black pb-1 mb-2">Időszakos bontás</h2>
          {sortedSlots.map(([time, items], i) => (
            <div key={i} className="mb-2">
              <p className="font-semibold text-sm">{time}</p>
              {items.map((item, j) => (
                <p key={j} className="text-sm pl-4">{item.qty}× {item.name}</p>
              ))}
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 mt-6">
        Nyomtatva: {format(new Date(), "HH:mm")}
      </p>
    </div>
  );
};

export default PrintableDailySummary;
