import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, isToday, isBefore, startOfTomorrow } from "date-fns";
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
    
    const today = new Date();
    return today;
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
                    {isToday(currentDate) ? "Mai ajánlatok" : format(currentDate, 'MMMM dd.', { locale: hu })}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {format(currentDate, 'EEEE', { locale: hu })}
                  </p>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
                      <div key={offer.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-primary text-primary-foreground text-base px-4 py-2 rounded-full font-bold shadow-md">
                            {offer.price_huf} Ft
                          </Badge>
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline">Max: {offer.max_portions}</Badge>
                            <Badge variant={offer.remaining_portions > 0 ? "default" : "destructive"}>
                              Maradt: {offer.remaining_portions}
                            </Badge>
                          </div>
                        </div>
                        {getDeadlineText(new Date(offer.date)) && (
                          <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <p className="text-orange-500 text-sm font-medium">{getDeadlineText(new Date(offer.date))}</p>
                          </div>
                        )}
                        {offer.note && (
                          <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg">
                            <Clock className="h-4 w-4 text-primary" />
                            <p className="text-primary text-sm font-medium">{offer.note}</p>
                          </div>
                        )}
                        <ul className="space-y-3">
                          {offer.daily_offer_items?.map((offerItem, index) => (
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
                        <DailyItemSelector 
                          type="offer"
                          data={offer}
                          canOrder={canOrderForDate(new Date(offer.date))}
                        />
                      </div>
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
                      <div key={menu.id} className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge className="bg-secondary text-secondary-foreground text-base px-4 py-2 rounded-full font-bold shadow-md">
                            {menu.price_huf} Ft
                          </Badge>
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline">Max: {menu.max_portions}</Badge>
                            <Badge variant={menu.remaining_portions > 0 ? "default" : "destructive"}>
                              Maradt: {menu.remaining_portions}
                            </Badge>
                          </div>
                        </div>
                        {getDeadlineText(new Date(menu.date)) && (
                          <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            <p className="text-orange-500 text-sm font-medium">{getDeadlineText(new Date(menu.date))}</p>
                          </div>
                        )}
                        {menu.note && (
                          <div className="flex items-center gap-2 p-3 bg-secondary/10 rounded-lg">
                            <Clock className="h-4 w-4 text-secondary" />
                            <p className="text-secondary text-sm font-medium">{menu.note}</p>
                          </div>
                        )}
                        <ul className="space-y-3">
                          {menu.daily_menu_items?.map((menuItem, index) => (
                            <li key={menuItem.id} className="flex items-start gap-3 p-3 bg-background/50 rounded-lg border border-secondary/10">
                              <span className="flex-shrink-0 w-6 h-6 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                                {index + 1}
                              </span>
                              <div className="flex-1">
                                <span className="text-foreground font-medium text-base leading-relaxed">
                                  {menuItem.menu_items?.name}
                                </span>
                                {menuItem.menu_items?.description && (
                                  <p className="text-muted-foreground text-sm mt-1">
                                    {menuItem.menu_items.description}
                                  </p>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                        <DailyItemSelector 
                          type="menu"
                          data={menu}
                          canOrder={canOrderForDate(new Date(menu.date))}
                        />
                      </div>
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
              hasContent: (date) => hasAnyOnDate(date)
            }}
            modifiersStyles={{
              hasContent: {
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 'bold',
                borderRadius: '8px'
              }
            }}
            />
            <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <span className="w-4 h-4 bg-primary rounded-md"></span>
              Ajánlat vagy menü elérhető
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
                  hasContent: (date) => hasAnyOnDate(date)
                }}
                modifiersStyles={{
                  hasContent: {
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    fontWeight: 'bold',
                    borderRadius: '6px'
                  }
                }}
              />
              <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="w-4 h-4 bg-primary rounded"></span>
                Ajánlat vagy menü elérhető
              </div>
            </CardContent>
          </Card>

          {/* Selected Day's Content - Desktop */}
          <Card className="rounded-2xl shadow-lg border-primary/30 bg-gradient-to-br from-background to-primary/5">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-foreground">
                    {isToday(currentDate) ? "Mai ajánlatok" : "Napi ajánlatok"}
                  </CardTitle>
                  <p className="text-primary font-medium mt-1">
                    {format(currentDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
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
                        <div key={offer.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-primary text-primary-foreground text-lg px-6 py-2 rounded-full font-bold shadow-lg">
                              {offer.price_huf} Ft
                            </Badge>
                            <div className="flex gap-2">
                              <Badge variant="outline">Max: {offer.max_portions} adag</Badge>
                              <Badge variant={offer.remaining_portions > 0 ? "default" : "destructive"}>
                                Maradt: {offer.remaining_portions}
                              </Badge>
                            </div>
                          </div>
                          {getDeadlineText(new Date(offer.date)) && (
                            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                              <AlertCircle className="h-5 w-5 text-orange-500" />
                              <p className="text-orange-500 font-medium">{getDeadlineText(new Date(offer.date))}</p>
                            </div>
                          )}
                          {offer.note && (
                            <div className="flex items-center gap-3 p-4 bg-primary/10 rounded-lg border border-primary/20">
                              <Clock className="h-5 w-5 text-primary" />
                              <p className="text-primary font-medium">{offer.note}</p>
                            </div>
                          )}
                          <ul className="space-y-4">
                            {offer.daily_offer_items?.map((offerItem, index) => (
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
                          <DailyItemSelector 
                            type="offer"
                            data={offer}
                            canOrder={canOrderForDate(new Date(offer.date))}
                          />
                        </div>
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
                        <div key={menu.id} className="space-y-4">
                          <div className="flex items-center justify-between">
                            <Badge className="bg-secondary text-secondary-foreground text-lg px-6 py-2 rounded-full font-bold shadow-lg">
                              {menu.price_huf} Ft
                            </Badge>
                            <div className="flex gap-2">
                              <Badge variant="outline">Max: {menu.max_portions} adag</Badge>
                              <Badge variant={menu.remaining_portions > 0 ? "default" : "destructive"}>
                                Maradt: {menu.remaining_portions}
                              </Badge>
                            </div>
                          </div>
                          {getDeadlineText(new Date(menu.date)) && (
                            <div className="flex items-center gap-3 p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                              <AlertCircle className="h-5 w-5 text-orange-500" />
                              <p className="text-orange-500 font-medium">{getDeadlineText(new Date(menu.date))}</p>
                            </div>
                          )}
                          {menu.note && (
                            <div className="flex items-center gap-3 p-4 bg-secondary/10 rounded-lg border border-secondary/20">
                              <Clock className="h-5 w-5 text-secondary" />
                              <p className="text-secondary font-medium">{menu.note}</p>
                            </div>
                          )}
                          <ul className="space-y-4">
                            {menu.daily_menu_items?.map((menuItem, index) => (
                              <li key={menuItem.id} className="flex items-start gap-4 p-4 bg-background/70 rounded-lg border border-secondary/10 hover:border-secondary/20 transition-colors">
                                <span className="flex-shrink-0 w-8 h-8 bg-secondary text-secondary-foreground rounded-full flex items-center justify-center font-bold">
                                  {index + 1}
                                </span>
                                <div className="flex-1">
                                  <span className="text-foreground font-semibold text-lg leading-relaxed block">
                                    {menuItem.menu_items?.name}
                                  </span>
                                  {menuItem.menu_items?.description && (
                                    <p className="text-muted-foreground mt-2">
                                      {menuItem.menu_items.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                          <DailyItemSelector 
                            type="menu"
                            data={menu}
                            canOrder={canOrderForDate(new Date(menu.date))}
                          />
                        </div>
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DailyOfferCalendar;