import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, isSameDay, isToday } from "date-fns";
import { hu } from "date-fns/locale";
import { CalendarDays, Clock } from "lucide-react";

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
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (selectedDate) return selectedDate;
    
    const today = new Date();
    // If today has an offer, select today
    // Otherwise, we'll set it after loading data
    return today;
  });

  useEffect(() => {
    fetchDailyOffers();
  }, []);

  useEffect(() => {
    // Auto-select logic after data loads
    if (!loading && dailyOffers.length > 0 && !selectedDate) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const hasOfferToday = dailyOffers.some(offer => offer.date === todayString);
      
      if (hasOfferToday) {
        setCurrentDate(today);
      } else {
        // Find next upcoming date with offer
        const upcomingOffers = dailyOffers
          .filter(offer => new Date(offer.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (upcomingOffers.length > 0) {
          setCurrentDate(new Date(upcomingOffers[0].date));
        }
      }
    }
  }, [loading, dailyOffers, selectedDate]);

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

  const handleTodayClick = () => {
    const today = new Date();
    setCurrentDate(today);
    onDateSelect?.(today);
  };

  const currentOffer = getOffersForDate(currentDate)[0];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Mobile: Today's offer first, then calendar */}
      <div className="block md:hidden space-y-6">
        {/* Today's Offer Card - Mobile */}
        <Card className="rounded-2xl shadow-lg border-primary/30 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {isToday(currentDate) ? "Mai ajánlat" : format(currentDate, 'MMMM dd.', { locale: hu })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(currentDate, 'EEEE', { locale: hu })}
                  </p>
                </div>
              </div>
              {currentOffer && (
                <Badge className="bg-primary text-primary-foreground text-base px-4 py-2 rounded-full font-bold shadow-md">
                  {currentOffer.price_huf} Ft
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {currentOffer && currentOffer.daily_offer_items?.length ? (
              <div className="space-y-4">
                {currentOffer.note && (
                  <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                    <p className="text-primary text-sm font-medium">{currentOffer.note}</p>
                  </div>
                )}
                <ul className="space-y-3">
                  {currentOffer.daily_offer_items.map((offerItem, index) => (
                    <li key={offerItem.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-primary/10">
                      <span className="flex-shrink-0 w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                        {index + 1}
                      </span>
                      <div className="flex-1">
                        <span className="text-foreground font-medium text-base leading-relaxed">
                          {offerItem.menu_items?.name}
                        </span>
                        {offerItem.menu_items?.description && (
                          <p className="text-muted-foreground text-sm mt-1">
                            {offerItem.menu_items.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-center">
                    Ezen a napon nincs napi ajánlat
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Calendar - Mobile */}
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold text-foreground">
                Napi ajánlatok
              </CardTitle>
              <Button
                onClick={handleTodayClick}
                variant="outline"
                size="sm"
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                Ma
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={currentDate}
              onSelect={handleDateSelect}
              locale={hu}
              className="rounded-md border-0 p-0 w-full [&_table]:w-full [&_td]:p-2 [&_button]:h-12 [&_button]:w-full"
              modifiers={{
                hasOffer: (date) => hasOfferOnDate(date)
              }}
              modifiersStyles={{
                hasOffer: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold',
                  borderRadius: '8px'
                }
              }}
            />
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 bg-primary rounded-md"></span>
              Napi ajánlat elérhető
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Desktop: Two-column layout */}
      <div className="hidden md:block">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendar - Desktop */}
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                  <CalendarDays className="h-6 w-6 text-primary" />
                  Napi ajánlatok naptára
                </CardTitle>
                <Button
                  onClick={handleTodayClick}
                  variant="outline"
                  size="sm"
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                >
                  Ma
                </Button>
              </div>
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
                    fontWeight: 'bold',
                    borderRadius: '6px'
                  }
                }}
              />
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 bg-primary rounded"></span>
                Napi ajánlat elérhető
              </div>
            </CardContent>
          </Card>

          {/* Selected Day's Offer - Desktop */}
          <Card className="rounded-2xl shadow-lg border-primary/30 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {isToday(currentDate) ? "Mai ajánlat" : "Napi ajánlat"}
                  </CardTitle>
                  <p className="text-primary font-medium mt-1">
                    {format(currentDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
                  </p>
                </div>
                {currentOffer && (
                  <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 rounded-full font-bold shadow-lg">
                    {currentOffer.price_huf} Ft
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {currentOffer && currentOffer.daily_offer_items?.length ? (
                <div className="space-y-6">
                  {currentOffer.note && (
                    <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <Clock className="h-5 w-5 text-primary" />
                      <p className="text-primary font-medium">{currentOffer.note}</p>
                    </div>
                  )}
                  <ul className="space-y-4">
                    {currentOffer.daily_offer_items.map((offerItem, index) => (
                      <li key={offerItem.id} className="flex items-start gap-4 p-4 bg-background/70 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors">
                        <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <div className="flex-1">
                          <span className="text-foreground font-semibold text-lg leading-relaxed block">
                            {offerItem.menu_items?.name}
                          </span>
                          {offerItem.menu_items?.description && (
                            <p className="text-muted-foreground mt-2">
                              {offerItem.menu_items.description}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <CalendarDays className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground text-lg">
                      Ezen a napon nincs napi ajánlat
                    </p>
                    <p className="text-muted-foreground/70 text-sm mt-2">
                      Válassz egy másik napot a naptárban
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyOfferCalendar;
