import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, ImageOff, UtensilsCrossed } from "lucide-react";
import { addDays, format, isWeekend, nextMonday } from "date-fns";

interface AlertItem {
  key: string;
  icon: React.ReactNode;
  message: string;
  variant: "default" | "destructive";
}

const DashboardAlerts = () => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useEffect(() => {
    const check = async () => {
      const result: AlertItem[] = [];

      // Next working day
      const today = new Date();
      let nextWorkDay = addDays(today, 1);
      if (isWeekend(nextWorkDay)) {
        nextWorkDay = nextMonday(nextWorkDay);
      }
      const nextDateStr = format(nextWorkDay, "yyyy-MM-dd");

      // Check tomorrow's offer
      const { data: offerData } = await supabase
        .from("daily_offers")
        .select("id")
        .eq("date", nextDateStr)
        .limit(1);

      if (!offerData || offerData.length === 0) {
        result.push({
          key: "no-tomorrow-menu",
          icon: <UtensilsCrossed className="h-4 w-4" />,
          message: `A következő munkanap (${nextDateStr}) menüje még nincs beállítva!`,
          variant: "destructive",
        });
      }

      // Check images
      const { count } = await supabase
        .from("menu_items")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true)
        .is("image_url", null);

      if (count && count > 10) {
        result.push({
          key: "missing-images",
          icon: <ImageOff className="h-4 w-4" />,
          message: `${count} aktív ételnél hiányzik a kép.`,
          variant: "default",
        });
      }

      // Check low portions today
      const todayStr = format(today, "yyyy-MM-dd");
      const { data: todayOffer } = await supabase
        .from("daily_offers")
        .select("id, remaining_portions")
        .eq("date", todayStr)
        .limit(1);

      if (todayOffer && todayOffer.length > 0) {
        const offer = todayOffer[0];
        if (offer.remaining_portions !== null && offer.remaining_portions < 5) {
          result.push({
            key: "low-portions-offer",
            icon: <AlertTriangle className="h-4 w-4" />,
            message: `Mai ajánlat: csak ${offer.remaining_portions} adag maradt!`,
            variant: "destructive",
          });
        }

        // Check menu portions
        const { data: menuData } = await supabase
          .from("daily_offer_menus")
          .select("remaining_portions")
          .eq("daily_offer_id", offer.id)
          .limit(1);

        if (menuData && menuData.length > 0 && menuData[0].remaining_portions < 5) {
          result.push({
            key: "low-portions-menu",
            icon: <AlertTriangle className="h-4 w-4" />,
            message: `Mai menü: csak ${menuData[0].remaining_portions} adag maradt!`,
            variant: "destructive",
          });
        }
      }

      setAlerts(result);
    };

    check();
  }, []);

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <Alert key={alert.key} variant={alert.variant}>
          {alert.icon}
          <AlertDescription className="ml-2">{alert.message}</AlertDescription>
        </Alert>
      ))}
    </div>
  );
};

export default DashboardAlerts;
