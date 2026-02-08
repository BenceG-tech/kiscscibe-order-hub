import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Mail, Users, Calendar, Send, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const HU_DAYS = ["Vasárnap", "Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat"];
const HU_MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];

function getWeekDates(): { monday: string; friday: string; dates: string[]; label: string } {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);
  monday.setHours(0, 0, 0, 0);

  const dates: string[] = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d.toISOString().split("T")[0]);
  }

  const m = monday;
  const f = new Date(monday);
  f.setDate(monday.getDate() + 4);
  const label = `${HU_MONTHS[m.getMonth()]} ${m.getDate()}–${f.getDate()}.`;

  return { monday: dates[0], friday: dates[4], dates, label };
}

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return `${HU_DAYS[d.getDay()]}, ${HU_MONTHS[d.getMonth()]} ${d.getDate()}.`;
}

interface DayPreview {
  date: string;
  menuPrice: number | null;
  items: Array<{
    name: string;
    price: number;
    isMenuPart: boolean;
    menuRole: string | null;
  }>;
}

const WeeklyNewsletterPanel = () => {
  const [isSending, setIsSending] = useState(false);
  const { monday, dates, label: weekLabel } = getWeekDates();

  // Fetch subscriber count
  const { data: subscriberCount = 0 } = useQuery({
    queryKey: ["subscribers-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("subscribers")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  // Fetch last sent info
  const { data: lastSent, refetch: refetchLastSent } = useQuery({
    queryKey: ["newsletter-last-sent"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "newsletter_last_sent")
        .maybeSingle();
      if (error) throw error;
      return data?.value_json as { sent_at: string; week: string; count: number; errors: number } | null;
    },
  });

  // Fetch weekly menu data
  const { data: weekData = [] } = useQuery({
    queryKey: ["weekly-menu-preview", dates],
    queryFn: async () => {
      const { data: offers } = await supabase
        .from("daily_offers")
        .select("id, date, price_huf, note")
        .in("date", dates)
        .order("date");

      if (!offers || offers.length === 0) return [];

      const result: DayPreview[] = [];

      for (const offer of offers) {
        const { data: menuData } = await supabase
          .from("daily_offer_menus")
          .select("menu_price_huf")
          .eq("daily_offer_id", offer.id)
          .maybeSingle();

        const { data: offerItems } = await supabase
          .from("daily_offer_items")
          .select("is_menu_part, menu_role, item_id")
          .eq("daily_offer_id", offer.id);

        if (!offerItems || offerItems.length === 0) continue;

        const itemIds = offerItems.map((oi) => oi.item_id).filter(Boolean) as string[];
        const { data: menuItems } = await supabase
          .from("menu_items")
          .select("id, name, price_huf")
          .in("id", itemIds);

        const itemMap = new Map((menuItems || []).map((mi) => [mi.id, mi]));

        const items = offerItems
          .filter((oi) => oi.item_id && itemMap.has(oi.item_id!))
          .map((oi) => {
            const mi = itemMap.get(oi.item_id!)!;
            return {
              name: mi.name,
              price: mi.price_huf,
              isMenuPart: oi.is_menu_part,
              menuRole: oi.menu_role,
            };
          });

        result.push({
          date: offer.date,
          menuPrice: menuData?.menu_price_huf || null,
          items,
        });
      }

      return result;
    },
  });

  const handleSend = async () => {
    setIsSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-weekly-menu", {
        body: { week_start: monday },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success(`Heti menü kiküldve ${data.sent} feliratkozónak!`);
        if (data.errors > 0) {
          toast.warning(`${data.errors} email küldése sikertelen.`);
        }
        refetchLastSent();
      } else {
        throw new Error(data?.error || "Ismeretlen hiba.");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Hiba történt a küldés során.";
      toast.error(msg);
    } finally {
      setIsSending(false);
    }
  };

  const lastSentDate = lastSent?.sent_at
    ? new Date(lastSent.sent_at).toLocaleString("hu-HU", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const isCurrentWeekSent = lastSent?.week === monday;
  const hasMenuData = weekData.length > 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Feliratkozók</p>
              <p className="text-2xl font-bold">{subscriberCount}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktuális hét</p>
              <p className="text-base font-semibold">{weekLabel}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Legutóbbi küldés</p>
              {lastSentDate ? (
                <p className="text-sm font-medium">{lastSentDate}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Még nem volt</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status badge */}
      {isCurrentWeekSent && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-accent/50 border border-accent">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <span className="text-sm text-foreground">
            Erre a hétre már kiküldted a menüt ({lastSent?.count} címzett).
          </span>
        </div>
      )}

      {/* Weekly Menu Preview */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Heti menü előnézet
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!hasMenuData ? (
            <div className="flex items-center gap-2 p-4 text-muted-foreground">
              <AlertCircle className="h-5 w-5" />
              <span>Erre a hétre még nincs napi ajánlat beállítva.</span>
            </div>
          ) : (
            <div className="space-y-4">
              {weekData.map((day) => {
                const menuItems = day.items.filter((i) => i.isMenuPart);
                const alacarteItems = day.items.filter((i) => !i.isMenuPart);

                return (
                  <div
                    key={day.date}
                    className="border-l-3 border-primary pl-4 py-2"
                  >
                    <h4 className="font-semibold text-sm sm:text-base text-foreground mb-2">
                      {formatDayLabel(day.date)}
                    </h4>

                    {menuItems.length > 0 && day.menuPrice && (
                      <div className="mb-2">
                        <Badge variant="secondary" className="mb-1.5 text-xs">
                          🍽️ Menü – {day.menuPrice} Ft
                        </Badge>
                        {menuItems.map((item, idx) => (
                          <div key={idx} className="text-sm pl-2 py-0.5">
                            {item.menuRole === "leves" ? "🥣" : "🍖"} {item.name}
                          </div>
                        ))}
                      </div>
                    )}

                    {alacarteItems.length > 0 && (
                      <div>
                        {menuItems.length > 0 && (
                          <p className="text-xs font-semibold text-muted-foreground mt-1 mb-1">À la carte</p>
                        )}
                        {alacarteItems.map((item, idx) => (
                          <div key={idx} className="text-sm pl-2 py-0.5">
                            • {item.name}{item.price > 0 ? <> — <span className="font-medium">{item.price} Ft</span></> : null}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              size="lg"
              disabled={isSending || subscriberCount === 0 || !hasMenuData}
              className="gap-2"
            >
              {isSending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Küldés folyamatban...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Heti menü kiküldése
                </>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Heti menü kiküldése</AlertDialogTitle>
              <AlertDialogDescription>
                Biztosan ki akarod küldeni a heti menüt <strong>{subscriberCount} feliratkozónak</strong>?
                {isCurrentWeekSent && (
                  <span className="block mt-2 text-destructive font-medium">
                    ⚠️ Erre a hétre már küldtél hírlevelet. Biztos újra ki akarod küldeni?
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Mégsem</AlertDialogCancel>
              <AlertDialogAction onClick={handleSend}>Kiküldés</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {subscriberCount === 0 && (
          <p className="text-sm text-muted-foreground">Nincs feliratkozó a rendszerben.</p>
        )}
        {!hasMenuData && subscriberCount > 0 && (
          <p className="text-sm text-muted-foreground">Állítsd be a heti menüt a kiküldés előtt.</p>
        )}
      </div>
    </div>
  );
};

export default WeeklyNewsletterPanel;
