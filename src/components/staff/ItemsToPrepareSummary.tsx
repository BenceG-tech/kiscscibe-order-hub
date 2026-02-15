import { useState, useEffect, useCallback } from "react";
import { ChevronDown, ChefHat, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { format } from "date-fns";

interface OrderItem {
  name_snapshot: string;
  qty: number;
}

interface Order {
  status: string;
  items?: OrderItem[];
}

interface ItemsToPrepareSummaryProps {
  orders: Order[];
}

interface DailyOfferItemInfo {
  id: string;
  is_sold_out: boolean;
}

const ItemsToPrepareSummary = ({ orders }: ItemsToPrepareSummaryProps) => {
  const [open, setOpen] = useState(false);
  const [soldOutMap, setSoldOutMap] = useState<Map<string, DailyOfferItemInfo>>(new Map());
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const activeOrders = orders.filter(o => ["new", "preparing"].includes(o.status));

  // Aggregate items
  const itemMap = new Map<string, number>();
  for (const order of activeOrders) {
    for (const item of order.items || []) {
      itemMap.set(item.name_snapshot, (itemMap.get(item.name_snapshot) || 0) + item.qty);
    }
  }

  const aggregated = Array.from(itemMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([name, qty]) => ({ name, qty }));

  // Fetch today's daily_offer_items
  useEffect(() => {
    const fetchDailyItems = async () => {
      const today = format(new Date(), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("daily_offer_items")
        .select("id, is_sold_out, menu_items(name), daily_offers!inner(date)")
        .eq("daily_offers.date", today);

      if (error) {
        console.error("[ItemsToPrepareSummary] Error fetching daily items:", error);
        return;
      }

      const map = new Map<string, DailyOfferItemInfo>();
      for (const item of data || []) {
        const name = (item.menu_items as any)?.name;
        if (name) {
          map.set(name, { id: item.id, is_sold_out: item.is_sold_out });
        }
      }
      setSoldOutMap(map);
    };

    fetchDailyItems();
  }, []);

  const handleToggleSoldOut = useCallback(async (itemName: string, dailyItemId: string, currentSoldOut: boolean) => {
    setTogglingId(dailyItemId);
    const newSoldOut = !currentSoldOut;

    const { error } = await supabase
      .from("daily_offer_items")
      .update({ is_sold_out: newSoldOut })
      .eq("id", dailyItemId);

    if (error) {
      console.error("[ItemsToPrepareSummary] Toggle error:", error);
      toast.error("Hiba történt a módosítás során");
    } else {
      setSoldOutMap(prev => {
        const next = new Map(prev);
        next.set(itemName, { id: dailyItemId, is_sold_out: newSoldOut });
        return next;
      });
      toast.success(
        newSoldOut
          ? `${itemName} megjelölve elfogyottként`
          : `${itemName} újra elérhető`
      );
    }
    setTogglingId(null);
  }, []);

  if (aggregated.length === 0) return null;

  return (
    <div className="mx-2 rounded-lg border border-border/60 bg-card/80 overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <ChefHat className="h-4 w-4 text-primary" />
          <span>Elkészítendő tételek ({aggregated.length})</span>
        </div>
        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-1 space-y-1.5">
          {aggregated.map(({ name, qty }) => {
            const dailyItem = soldOutMap.get(name);
            const isSoldOut = dailyItem?.is_sold_out ?? false;
            const isToggling = togglingId === dailyItem?.id;

            return (
              <div key={name} className="flex items-center gap-2 justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-bold text-primary text-sm shrink-0">{qty}×</span>
                  <span className={cn(
                    "text-sm truncate max-w-[160px]",
                    isSoldOut && "line-through opacity-60"
                  )}>
                    {name}
                  </span>
                  {isSoldOut && (
                    <Badge variant="destructive" className="text-[10px] px-1.5 py-0 shrink-0">
                      Elfogyott
                    </Badge>
                  )}
                </div>
                {dailyItem && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isToggling}
                    onClick={() => handleToggleSoldOut(name, dailyItem.id, isSoldOut)}
                    className={cn(
                      "text-xs h-7 px-2 shrink-0",
                      isSoldOut
                        ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-950"
                        : "text-destructive hover:text-destructive hover:bg-destructive/10"
                    )}
                  >
                    {isToggling ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : isSoldOut ? (
                      "Elérhető"
                    ) : (
                      "Elfogyott"
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ItemsToPrepareSummary;
