import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, isToday, isBefore, startOfTomorrow, getDay } from "date-fns";
import { getSmartInitialDate, getContentLabel } from "@/lib/dateUtils";
import { hu } from "date-fns/locale";
import { CalendarDays, Clock, Package, Coffee, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";
import DailyItemSelector from "./DailyItemSelector";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
  image_url?: string;
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
  max_portions: number;
  remaining_portions: number;
  daily_offer_items?: DailyOfferItem[];
}

interface DailyMenuItems {
  id: string;
  menu_items?: MenuItem;
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_menu_items?: DailyMenuItems[];
}

interface DailyOfferCalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDate?: Date;
}

const DailyOfferCalendar = ({ onDateSelect, selectedDate }: DailyOfferCalendarProps) => {
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (selectedDate) return selectedDate;
    
    return getSmartInitialDate();
  });

  // Helper function to check if ordering is allowed for a given date
  const canOrderForDate = (date: Date) => {
    const today = new Date();
    const tomorrow = startOfTomorrow();
    
    // If it's today, always allow ordering
    if (isToday(date)) return true;
    
    // If it's tomorrow, allow ordering until midnight today
    if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return true; // Current implementation allows until midnight (server will validate)
    }
    
    // For future dates beyond tomorrow, allow ordering
    return date > tomorrow;
  };

  // Helper function to get deadline text
  const getDeadlineText = (date: Date) => {
    const tomorrow = startOfTomorrow();
    
    if (format(date, 'yyyy-MM-dd') === format(tomorrow, 'yyyy-MM-dd')) {
      return 'Rendelés éjfélig!';
    }
    
    return null;
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Auto-select logic after data loads
    if (!loading && (dailyOffers.length > 0 || dailyMenus.length > 0) && !selectedDate) {
      const today = new Date();
      const todayString = format(today, 'yyyy-MM-dd');
      const hasOfferToday = dailyOffers.some(offer => offer.date === todayString);
      const hasMenuToday = dailyMenus.some(menu => menu.date === todayString);
      
      if (hasOfferToday || hasMenuToday) {
        setCurrentDate(today);
      } else {
        // Find next upcoming date with offer or menu
        const allDates = [
          ...dailyOffers.map(o => ({ date: o.date, type: 'offer' })),
          ...dailyMenus.map(m => ({ date: m.date, type: 'menu' }))
        ];
        
        const upcomingDates = allDates
          .filter(item => new Date(item.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        if (upcomingDates.length > 0) {
          setCurrentDate(new Date(upcomingDates[0].date));
        }
      }
    }
  }, [loading, dailyOffers, dailyMenus, selectedDate]);

  const fetchData = async () => {
    try {
      const [offersResult, menusResult] = await Promise.all([
        supabase
          .from('daily_offers')
          .select(`
            *,
            daily_offer_items (
              id,
              menu_items (
                id,
                name,
                description,
                price_huf,
                image_url
              )
            )
          `)
          .order('date', { ascending: true }),
        supabase
          .from('daily_menus')
          .select(`
            *,
            daily_menu_items (
              id,
              menu_items (
                id,
                name,
                description,
                price_huf,
                image_url
              )
            )
          `)
          .order('date', { ascending: true })
      ]);

      if (!offersResult.error && offersResult.data) {
        setDailyOffers(offersResult.data);
      }
      
      if (!menusResult.error && menusResult.data) {
        setDailyMenus(menusResult.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const getMenusForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyMenus.filter(menu => menu.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => {
    return getOffersForDate(date).length > 0;
  };

  const hasMenuOnDate = (date: Date) => {
    return getMenusForDate(date).length > 0;
  };

  const hasAnyOnDate = (date: Date) => {
    return hasOfferOnDate(date) || hasMenuOnDate(date);
  };

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6; // Sunday = 0, Saturday = 6
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(date);
      onDateSelect?.(date);
    }
  };

  const handleTodayClick = () => {
    const smartDate = getSmartInitialDate();
    setCurrentDate(smartDate);
    onDateSelect?.(smartDate);
  };

  const currentOffers = getOffersForDate(currentDate);
  const currentMenus = getMenusForDate(currentDate);

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
        {/* Today's Content Card - Mobile */}
        <Card className="rounded-2xl shadow-lg border-primary/30 bg-gradient-to-br from-background to-primary/5">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarDays className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg font-bold text-foreground">
                    {(() => {
                      const { title } = getContentLabel(currentDate);
                      return title;
                    })()}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(currentDate, 'EEEE', { locale: hu })}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isWeekend(currentDate) ? (
              <div className="text-center py-8">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    Hétvégén zárva
                  </p>
                  <p className="text-muted-foreground/70 text-sm">
                    A vendéglő szombaton és vasárnap zárva tart
                  </p>
                </div>
              </div>
            ) : (
              <Tabs defaultValue="offers" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="offers" className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Ajánlatok
                  </TabsTrigger>
                  <TabsTrigger value="menus" className="flex items-center gap-2">
                    <Coffee className="h-4 w-4" />
                    Menük
                  </TabsTrigger>
                </TabsList>
              
              <TabsContent value="offers">
                {currentOffers.length > 0 ? (
                  <div className="space-y-4">
                    {currentOffers.map((offer) => (
                      <DailyItemSelector 
                        key={offer.id}
                        type="offer"
                        data={offer}
                        canOrder={canOrderForDate(new Date(offer.date))}
                        showDetails={true}
                        deadlineText={getDeadlineText(new Date(offer.date))}
                      />
                    ))}
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
              </TabsContent>
              
              <TabsContent value="menus">
                {currentMenus.length > 0 ? (
                  <div className="space-y-4">
                    {currentMenus.map((menu) => (
                      <DailyItemSelector 
                        key={menu.id}
                        type="menu"
                        data={menu}
                        canOrder={canOrderForDate(new Date(menu.date))}
                        showDetails={true}
                        deadlineText={getDeadlineText(new Date(menu.date))}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-muted-foreground text-center">
                        Ezen a napon nincs napi menü
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
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
              hasContent: (date) => hasAnyOnDate(date),
              weekend: (date) => isWeekend(date)
            }}
            modifiersStyles={{
              hasContent: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold',
                borderRadius: '8px'
              },
              weekend: {
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
                textDecoration: 'line-through',
                opacity: 0.6,
                borderRadius: '8px'
              }
            }}
            />
            <div className="mt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 bg-primary rounded-md"></span>
                Ajánlat vagy menü elérhető
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 bg-muted rounded-md"></span>
                Hétvége - zárva
              </div>
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
                  hasContent: (date) => hasAnyOnDate(date),
                  weekend: (date) => isWeekend(date)
                }}
                modifiersStyles={{
                  hasContent: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
                    borderRadius: '6px'
                  },
                  weekend: {
                    backgroundColor: 'hsl(var(--muted))',
                    color: 'hsl(var(--muted-foreground))',
                    textDecoration: 'line-through',
                    opacity: 0.6,
                    borderRadius: '6px'
                  }
                }}
              />
              <div className="mt-6 space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-primary rounded"></span>
                  Ajánlat vagy menü elérhető
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 bg-muted rounded"></span>
                  Hétvége - zárva
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Day's Content - Desktop */}
          <Card className="rounded-2xl shadow-lg border-primary/30 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {(() => {
                      const { title } = getContentLabel(currentDate);
                      return title;
                    })()}
                  </CardTitle>
                  <p className="text-primary font-medium mt-1">
                    {format(currentDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isWeekend(currentDate) ? (
                <div className="text-center py-12">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xl font-medium mb-2">
                      Hétvégén zárva
                    </p>
                    <p className="text-muted-foreground/70 text-sm">
                      A vendéglő szombaton és vasárnap zárva tart
                    </p>
                  </div>
                </div>
              ) : (
                <Tabs defaultValue="offers" className="w-full">
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="offers" className="flex items-center gap-2">
                      <Package className="h-4 w-4" />
                      Napi ajánlatok
                    </TabsTrigger>
                    <TabsTrigger value="menus" className="flex items-center gap-2">
                      <Coffee className="h-4 w-4" />
                      Napi menük
                    </TabsTrigger>
                  </TabsList>
                
                <TabsContent value="offers">
                  {currentOffers.length > 0 ? (
                    <div className="space-y-6">
                      {currentOffers.map((offer) => (
                        <DailyItemSelector 
                          key={offer.id}
                          type="offer"
                          data={offer}
                          canOrder={canOrderForDate(new Date(offer.date))}
                          showDetails={true}
                          deadlineText={getDeadlineText(new Date(offer.date))}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-6 bg-muted/50 rounded-lg">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">
                          Ezen a napon nincs napi ajánlat
                        </p>
                        <p className="text-muted-foreground/70 text-sm mt-2">
                          Válassz egy másik napot a naptárban
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="menus">
                  {currentMenus.length > 0 ? (
                    <div className="space-y-6">
                      {currentMenus.map((menu) => (
                        <DailyItemSelector 
                          key={menu.id}
                          type="menu"
                          data={menu}
                          canOrder={canOrderForDate(new Date(menu.date))}
                          showDetails={true}
                          deadlineText={getDeadlineText(new Date(menu.date))}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-6 bg-muted/50 rounded-lg">
                        <Coffee className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">
                          Ezen a napon nincs napi menü
                        </p>
                        <p className="text-muted-foreground/70 text-sm mt-2">
                          Válassz egy másik napot a naptárban
                        </p>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyOfferCalendar;