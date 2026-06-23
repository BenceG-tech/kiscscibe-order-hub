import { useState, useMemo } from "react";
import { format, addDays, subWeeks, startOfWeek } from "date-fns";
import { hu } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Calendar, Utensils, Soup, ChefHat } from "lucide-react";
import { toast } from "sonner";

const WEEKDAY_SHORT = ["H", "K", "Sze", "Cs", "P"];

type PreviewItem = {
  is_menu_part: boolean;
  menu_role: string | null;
  menu_items: { name: string } | null;
};
type PreviewOffer = {
  date: string;
  price_huf: number | null;
  is_published: boolean;
  daily_offer_items: PreviewItem[];
};

function DayPreview({ offer, dateLabel }: { offer?: PreviewOffer; dateLabel: string }) {
  if (!offer || !offer.daily_offer_items?.length) {
    return (
      <div className="flex items-center justify-between py-1.5 text-xs">
        <span className="font-medium text-muted-foreground w-20">{dateLabel}</span>
        <span className="text-muted-foreground italic">Nincs ajánlat</span>
      </div>
    );
  }
  const soup = offer.daily_offer_items.find(i => i.is_menu_part && i.menu_role === "leves")?.menu_items?.name;
  const main = offer.daily_offer_items.find(i => i.is_menu_part && i.menu_role === "főétel")?.menu_items?.name;
  const others = offer.daily_offer_items
    .filter(i => !i.is_menu_part)
    .map(i => i.menu_items?.name)
    .filter(Boolean) as string[];

  return (
    <div className="py-1.5 text-xs space-y-0.5 border-b last:border-0">
      <div className="flex items-center gap-2">
        <span className="font-semibold w-20 shrink-0">{dateLabel}</span>
        {offer.price_huf && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
            {offer.price_huf} Ft
          </span>
        )}
        {!offer.is_published && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300">
            piszkozat
          </span>
        )}
      </div>
      <div className="pl-20 space-y-0.5">
        {soup && <div className="flex gap-1.5"><Soup className="h-3 w-3 mt-0.5 text-amber-600" /><span>{soup}</span></div>}
        {main && <div className="flex gap-1.5"><ChefHat className="h-3 w-3 mt-0.5 text-orange-600" /><span>{main}</span></div>}
        {others.length > 0 && (
          <div className="flex gap-1.5"><Utensils className="h-3 w-3 mt-0.5 text-muted-foreground" /><span className="text-muted-foreground">{others.join(", ")}</span></div>
        )}
        {!soup && !main && others.length === 0 && (
          <div className="text-muted-foreground italic">Üres</div>
        )}
      </div>
    </div>
  );
}

interface CopyMenuDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentWeekStart: Date;
}

const WEEKDAYS = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];

export function CopyMenuDialog({ open, onOpenChange, currentWeekStart }: CopyMenuDialogProps) {
  const queryClient = useQueryClient();
  const [isCopying, setIsCopying] = useState(false);
  const [selectedSourceWeek, setSelectedSourceWeek] = useState<string>("");
  const [selectedSourceDay, setSelectedSourceDay] = useState<string>("");
  const [selectedTargetDay, setSelectedTargetDay] = useState<string>("");

  // Preview for selected source week
  const weekPreviewDates = useMemo(() => {
    if (!selectedSourceWeek) return [];
    const start = new Date(selectedSourceWeek + "T12:00:00");
    return Array.from({ length: 5 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
  }, [selectedSourceWeek]);

  const { data: weekPreview, isLoading: weekPreviewLoading } = useQuery({
    queryKey: ["copy-preview-week", selectedSourceWeek],
    enabled: !!selectedSourceWeek && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offers")
        .select("date, price_huf, is_published, daily_offer_items(is_menu_part, menu_role, menu_items(name))")
        .in("date", weekPreviewDates);
      if (error) throw error;
      return data as unknown as PreviewOffer[];
    },
  });

  // Preview for selected source day
  const { data: dayPreview, isLoading: dayPreviewLoading } = useQuery({
    queryKey: ["copy-preview-day", selectedSourceDay],
    enabled: !!selectedSourceDay && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offers")
        .select("date, price_huf, is_published, daily_offer_items(is_menu_part, menu_role, menu_items(name))")
        .eq("date", selectedSourceDay)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PreviewOffer | null;
    },
  });

  // Preview for target day (what's already there)
  const { data: targetPreview, isLoading: targetPreviewLoading } = useQuery({
    queryKey: ["copy-preview-target", selectedTargetDay],
    enabled: !!selectedTargetDay && open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_offers")
        .select("date, price_huf, is_published, daily_offer_items(is_menu_part, menu_role, menu_items(name))")
        .eq("date", selectedTargetDay)
        .maybeSingle();
      if (error) throw error;
      return data as unknown as PreviewOffer | null;
    },
  });

  // Generate past 8 weeks for selection
  const pastWeeks = useMemo(() => {
    const weeks: { label: string; value: string; start: Date }[] = [];
    for (let i = 1; i <= 8; i++) {
      const weekStart = subWeeks(currentWeekStart, i);
      const weekEnd = addDays(weekStart, 4);
      weeks.push({
        label: `${format(weekStart, "MM.dd.", { locale: hu })} – ${format(weekEnd, "MM.dd.", { locale: hu })}`,
        value: format(weekStart, "yyyy-MM-dd"),
        start: weekStart,
      });
    }
    return weeks;
  }, [currentWeekStart]);

  // Generate all past weekdays (8 weeks) for day copy source
  const pastDays = useMemo(() => {
    const days: { label: string; value: string }[] = [];
    for (let w = 1; w <= 8; w++) {
      const weekStart = subWeeks(currentWeekStart, w);
      for (let d = 0; d < 5; d++) {
        const day = addDays(weekStart, d);
        days.push({
          label: `${format(day, "yyyy. MMM d. (EEEE)", { locale: hu })}`,
          value: format(day, "yyyy-MM-dd"),
        });
      }
    }
    return days;
  }, [currentWeekStart]);

  // Target days: current week + next week
  const targetDays = useMemo(() => {
    const days: { label: string; value: string }[] = [];
    for (let w = 0; w <= 1; w++) {
      const weekStart = addDays(currentWeekStart, w * 7);
      for (let d = 0; d < 5; d++) {
        const day = addDays(weekStart, d);
        days.push({
          label: `${format(day, "MMM d. (EEEE)", { locale: hu })}`,
          value: format(day, "yyyy-MM-dd"),
        });
      }
    }
    return days;
  }, [currentWeekStart]);

  const copyWeek = async () => {
    if (!selectedSourceWeek) {
      toast.error("Válassz forrás hetet");
      return;
    }
    setIsCopying(true);
    try {
      const sourceStart = new Date(selectedSourceWeek + "T12:00:00");
      const sourceDates = Array.from({ length: 5 }, (_, i) => format(addDays(sourceStart, i), "yyyy-MM-dd"));
      const targetDates = Array.from({ length: 5 }, (_, i) => format(addDays(currentWeekStart, i), "yyyy-MM-dd"));

      const { data: sourceOffers, error } = await supabase
        .from("daily_offers")
        .select("id, date, price_huf, max_portions, daily_offer_items(item_id, is_menu_part, menu_role)")
        .in("date", sourceDates);

      if (error) throw error;
      if (!sourceOffers?.length) {
        toast.error("A kiválasztott héten nincs napi ajánlat.");
        return;
      }

      let itemsAdded = 0;
      for (let i = 0; i < 5; i++) {
        const sourceOffer = sourceOffers.find(o => o.date === sourceDates[i]);
        if (!sourceOffer?.daily_offer_items?.length) continue;

        const targetDate = targetDates[i];
        const { data: existingOffer } = await supabase
          .from("daily_offers")
          .select("id, daily_offer_items(item_id)")
          .eq("date", targetDate)
          .maybeSingle();

        let targetOfferId: string;
        if (existingOffer) {
          targetOfferId = existingOffer.id;
        } else {
          const { data: newOffer, error: createErr } = await supabase
            .from("daily_offers")
            .insert({ date: targetDate, price_huf: sourceOffer.price_huf, max_portions: 50, remaining_portions: 50 })
            .select("id")
            .single();
          if (createErr) throw createErr;
          targetOfferId = newOffer.id;
        }

        const existingItemIds = existingOffer?.daily_offer_items?.map((i: any) => i.item_id) || [];
        const newItems = (sourceOffer.daily_offer_items as any[])
          .filter(item => item.item_id && !existingItemIds.includes(item.item_id))
          .map(item => ({
            daily_offer_id: targetOfferId,
            item_id: item.item_id,
            is_menu_part: item.is_menu_part,
            menu_role: item.menu_role,
          }));

        if (newItems.length > 0) {
          const { error: insertErr } = await supabase.from("daily_offer_items").insert(newItems);
          if (insertErr) throw insertErr;
          itemsAdded += newItems.length;
        }
      }

      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success(`Hét másolva: ${itemsAdded} új tétel hozzáadva`);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Copy week error:", err);
      toast.error("Hiba: " + err.message);
    } finally {
      setIsCopying(false);
    }
  };

  const copyDay = async () => {
    if (!selectedSourceDay || !selectedTargetDay) {
      toast.error("Válaszd ki a forrás és cél napot");
      return;
    }
    setIsCopying(true);
    try {
      const { data: sourceOffer, error } = await supabase
        .from("daily_offers")
        .select("id, price_huf, daily_offer_items(item_id, is_menu_part, menu_role)")
        .eq("date", selectedSourceDay)
        .maybeSingle();

      if (error) throw error;
      if (!sourceOffer?.daily_offer_items?.length) {
        toast.error("A kiválasztott napon nincs napi ajánlat.");
        return;
      }

      const { data: existingOffer } = await supabase
        .from("daily_offers")
        .select("id, daily_offer_items(item_id)")
        .eq("date", selectedTargetDay)
        .maybeSingle();

      let targetOfferId: string;
      if (existingOffer) {
        targetOfferId = existingOffer.id;
      } else {
        const { data: newOffer, error: createErr } = await supabase
          .from("daily_offers")
          .insert({ date: selectedTargetDay, price_huf: sourceOffer.price_huf, max_portions: 50, remaining_portions: 50 })
          .select("id")
          .single();
        if (createErr) throw createErr;
        targetOfferId = newOffer.id;
      }

      const existingItemIds = existingOffer?.daily_offer_items?.map((i: any) => i.item_id) || [];
      const newItems = (sourceOffer.daily_offer_items as any[])
        .filter(item => item.item_id && !existingItemIds.includes(item.item_id))
        .map(item => ({
          daily_offer_id: targetOfferId,
          item_id: item.item_id,
          is_menu_part: item.is_menu_part,
          menu_role: item.menu_role,
        }));

      if (newItems.length > 0) {
        const { error: insertErr } = await supabase.from("daily_offer_items").insert(newItems);
        if (insertErr) throw insertErr;
      }

      queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
      toast.success(`Nap másolva: ${newItems.length} új tétel hozzáadva`);
      onOpenChange(false);
    } catch (err: any) {
      console.error("Copy day error:", err);
      toast.error("Hiba: " + err.message);
    } finally {
      setIsCopying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Copy className="h-5 w-5" />
            Menü másolása
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="week">
          <TabsList className="w-full">
            <TabsTrigger value="week" className="flex-1">
              <Calendar className="h-4 w-4 mr-1" />
              Hét másolása
            </TabsTrigger>
            <TabsTrigger value="day" className="flex-1">
              <Calendar className="h-4 w-4 mr-1" />
              Nap másolása
            </TabsTrigger>
          </TabsList>

          <TabsContent value="week" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Forrás hét</Label>
              <Select value={selectedSourceWeek} onValueChange={setSelectedSourceWeek}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz hetet..." />
                </SelectTrigger>
                <SelectContent>
                  {pastWeeks.map(w => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedSourceWeek && (
              <div className="rounded-lg border bg-card p-3 max-h-[260px] overflow-y-auto">
                <div className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-1.5">
                  Előnézet — mi fog átmásolódni
                </div>
                {weekPreviewLoading ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-3">
                    <Loader2 className="h-3 w-3 animate-spin" /> Betöltés...
                  </div>
                ) : (
                  weekPreviewDates.map((dateStr, i) => {
                    const offer = weekPreview?.find(o => o.date === dateStr);
                    return (
                      <DayPreview
                        key={dateStr}
                        offer={offer}
                        dateLabel={`${WEEKDAY_SHORT[i]} ${dateStr.slice(5)}`}
                      />
                    );
                  })
                )}
              </div>
            )}

            <div className="p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground">
              A kiválasztott hét tételei az aktuális hétre ({format(currentWeekStart, "MM.dd.", { locale: hu })} – {format(addDays(currentWeekStart, 4), "MM.dd.", { locale: hu })}) másolódnak. Meglévő tételek nem törlődnek. A másolt napok <strong>piszkozatként</strong> jönnek létre — a heti nézetből publikálhatod őket.
            </div>


            <Button onClick={copyWeek} disabled={isCopying || !selectedSourceWeek} className="w-full">
              {isCopying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
              Hét másolása
            </Button>
          </TabsContent>

          <TabsContent value="day" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Forrás nap</Label>
              <Select value={selectedSourceDay} onValueChange={setSelectedSourceDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz forrás napot..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {pastDays.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cél nap</Label>
              <Select value={selectedTargetDay} onValueChange={setSelectedTargetDay}>
                <SelectTrigger>
                  <SelectValue placeholder="Válassz cél napot..." />
                </SelectTrigger>
                <SelectContent>
                  {targetDays.map(d => (
                    <SelectItem key={d.value} value={d.value}>
                      {d.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={copyDay} disabled={isCopying || !selectedSourceDay || !selectedTargetDay} className="w-full">
              {isCopying ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Copy className="h-4 w-4 mr-2" />}
              Nap másolása
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
