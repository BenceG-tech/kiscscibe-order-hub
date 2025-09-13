import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, isSameDay } from "date-fns";
import { hu } from "date-fns/locale";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
}

interface DailyOfferItem {
  id: string;
  menu_items?: MenuItem;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  daily_offer_items?: DailyOfferItem[];
}

interface DailyOfferCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const DailyOfferCalendar = ({ onDateSelect, selectedDate }: DailyOfferCalendarProps) => {
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(selectedDate || new Date());

  useEffect(() => {
    fetchDailyOffers();
  }, []);

  const fetchDailyOffers = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (
            id,
            menu_items (
              id,
              name,
              description,
              price_huf
            )
          )
        `)
        .order('date', { ascending: true });

      if (!error && data) {
        setDailyOffers(data);
      }
    } catch (error) {
      console.error('Error fetching daily offers:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => {
    return getOffersForDate(date).length > 0;
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      onDateSelect?.(date);
    }
  };

  const currentOffer = getOffersForDate(currentDate)[0];

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Current Day's Menu */}
      <Card className="rounded-2xl shadow-md border-primary/20">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
              Napi ajánlat {format(currentDate, 'MM.dd. EEEE', { locale: hu })}
            </CardTitle>
            {currentOffer && (
              <Badge className="bg-primary text-primary-foreground text-base px-4 py-2 rounded-full font-semibold w-fit">
                {currentOffer.price_huf} Ft
              </Badge>
            )}
          </div>
          {currentOffer?.note && (
            <p className="text-primary text-sm font-medium">{currentOffer.note}</p>
          )}
        </CardHeader>
        <CardContent>
          {currentOffer && currentOffer.daily_offer_items?.length ? (
            <ul className="space-y-3">
              {currentOffer.daily_offer_items.map((offerItem) => (
                <li key={offerItem.id} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg mt-0.5">•</span>
                  <div className="flex-1">
                    <span className="text-foreground text-base md:text-lg leading-relaxed">
                      {offerItem.menu_items?.name}
                    </span>
                    {offerItem.menu_items?.price_huf && (
                      <span className="text-muted-foreground ml-2">
                        {offerItem.menu_items.price_huf}.-
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              Ezen a napon nincs napi ajánlat
            </p>
          )}
        </CardContent>
      </Card>

      {/* Calendar */}
      <Card className="rounded-2xl shadow-md border-primary/20">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Válassz napot a napi ajánlat megtekintéséhez
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleDateSelect}
            locale={hu}
            className="rounded-md border-0 p-0"
            modifiers={{
              hasOffer: (date) => hasOfferOnDate(date)
            }}
            modifiersStyles={{
              hasOffer: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold'
              }
            }}
          />
          <div className="mt-4 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <span className="w-4 h-4 bg-primary rounded"></span>
              Napi ajánlat elérhető
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DailyOfferCalendar;