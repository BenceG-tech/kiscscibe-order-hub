import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DailyMenuPanel from "@/components/DailyMenuPanel";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isPast, isSunday, getDay } from "date-fns";
import { getSmartInitialDate, getContentLabel } from "@/lib/dateUtils";
import { hu } from "date-fns/locale";
import { capitalizeFirst } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
interface MenuItem {
  id: string;
  item_id: string;
  is_menu_part: boolean;
  menu_role?: string;
  item_name: string;
  item_description?: string;
  item_price_huf: number;
  item_allergens?: string[];
  item_image_url?: string;
}

interface DailyOffersData {
  offer_id: string;
  offer_date: string;
  offer_price_huf?: number;
  offer_note?: string;
  offer_max_portions?: number;
  offer_remaining_portions?: number;
  items: MenuItem[];
}

interface DailyMenuData {
  menu_id: string;
  menu_price_huf: number;
  menu_max_portions: number;
  menu_remaining_portions: number;
  soup: MenuItem | null;
  main: MenuItem | null;
}

import StickyMenuCTA from "@/components/StickyMenuCTA";

const UnifiedDailySection = () => {
  const { toast } = useToast();
  const { addItem, addCompleteMenu } = useCart();
  const [selectedDate, setSelectedDate] = useState<Date>(getSmartInitialDate());
  const [dailyData, setDailyData] = useState<DailyOffersData | null>(null);
  const [menuData, setMenuData] = useState<DailyMenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  // Get extra items (not part of menu)
  const extraItems = dailyData?.items.filter(item => !item.is_menu_part) || [];

  const handleAddItemToCart = (item: MenuItem) => {
    addItem({
      id: item.item_id,
      name: item.item_name,
      price_huf: item.item_price_huf,
      modifiers: [],
      sides: [],
      image_url: item.item_image_url
    });
    
    toast({
      title: "Kosárba tetve",
      description: `${item.item_name} hozzáadva a kosárhoz`
    });
  };

  const handleAddMenuToCart = () => {
    if (!menuData || !menuData.soup || !menuData.main) return;
    
    try {
      // This would be called from the sticky CTA
      const { addCompleteMenu } = require("@/contexts/CartContext");
      addCompleteMenu({
        id: menuData.menu_id,
        date: format(selectedDate, 'yyyy-MM-dd'),
        price_huf: menuData.menu_price_huf,
        soup: {
          id: menuData.soup.item_id,
          name: menuData.soup.item_name,
          description: menuData.soup.item_description || "",
          price_huf: menuData.soup.item_price_huf
        },
        main: {
          id: menuData.main.item_id,
          name: menuData.main.item_name,
          description: menuData.main.item_description || "",
          price_huf: menuData.main.item_price_huf
        },
        remaining_portions: menuData.menu_remaining_portions
      });
    } catch (error) {
      console.error('Error adding menu to cart:', error);
    }
  };

  const fetchDailyData = async (date: Date) => {
    setLoading(true);
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const { data, error } = await supabase.rpc('get_daily_data', {
        target_date: dateStr
      });

      if (error) throw error;

      if (data && data.length > 0) {
        const result = data[0];
        
        // Parse items from jsonb with proper typing
        const items: MenuItem[] = Array.isArray(result.items) 
          ? result.items.map((item: any) => ({
              id: item.id,
              item_id: item.item_id,
              is_menu_part: item.is_menu_part,
              menu_role: item.menu_role,
              item_name: item.item_name,
              item_description: item.item_description,
              item_price_huf: item.item_price_huf,
              item_allergens: item.item_allergens,
              item_image_url: item.item_image_url
            }))
          : [];
        
        // Set daily offers data
        setDailyData({
          offer_id: result.offer_id,
          offer_date: result.offer_date,
          offer_price_huf: result.offer_price_huf,
          offer_note: result.offer_note,
          offer_max_portions: result.offer_max_portions,
          offer_remaining_portions: result.offer_remaining_portions,
          items: items
        });

        // Set menu data if exists
        if (result.menu_id) {
          const soup = items.find(item => item.is_menu_part && item.menu_role === 'leves') || null;
          const main = items.find(item => item.is_menu_part && item.menu_role === 'főétel') || null;
          
          setMenuData({
            menu_id: result.menu_id,
            menu_price_huf: result.menu_price_huf,
            menu_max_portions: result.menu_max_portions,
            menu_remaining_portions: result.menu_remaining_portions,
            soup,
            main
          });
        } else {
          setMenuData(null);
        }
      } else {
        setDailyData(null);
        setMenuData(null);
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
      setDailyData(null);
      setMenuData(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableDates = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_offers')
        .select('date')
        .gte('date', format(new Date(), 'yyyy-MM-dd'));

      if (error) throw error;
      
      setAvailableDates(data.map(item => new Date(item.date)));
    } catch (error) {
      console.error('Error fetching available dates:', error);
    }
  };

  useEffect(() => {
    fetchAvailableDates();
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isPast(date) && getDay(date) !== 0 && getDay(date) !== 6) {
      setSelectedDate(date);
    }
  };

  const handleTodayClick = () => {
    const smartDate = getSmartInitialDate();
    setSelectedDate(smartDate);
  };

  const isDateDisabled = (date: Date) => {
    return isPast(date) || getDay(date) === 0 || getDay(date) === 6;
  };

  const hasContentOnDate = (date: Date) => {
    return availableDates.some(availableDate => 
      format(availableDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
    );
  };

  return (
    <>
      {/* Daily Menu Panel - First thing visitors see */}
      <div className="mb-6">
        <DailyMenuPanel 
          date={selectedDate}
          menuData={menuData}
          loading={loading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Calendar Section - Compact */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-sofia font-semibold">Naptár</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              disabled={isPast(new Date()) || getDay(new Date()) === 0 || getDay(new Date()) === 6}
              className="h-7 text-xs px-2"
            >
              Ma
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-2">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                locale={hu}
                modifiers={{
                  hasContent: hasContentOnDate,
                  weekend: (date: Date) => getDay(date) === 0 || getDay(date) === 6,
                  today: isToday
                }}
                modifiersStyles={{
                  hasContent: { 
                    backgroundColor: 'hsl(var(--primary) / 0.1)',
                    border: '2px solid hsl(var(--primary))',
                    fontWeight: 'bold'
                  },
                  weekend: { 
                    color: 'hsl(var(--muted-foreground))',
                    textDecoration: 'line-through'
                  },
                  today: {
                    backgroundColor: 'hsl(var(--accent))',
                    fontWeight: 'bold'
                  }
                }}
                className="w-full"
              />
              <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-primary/10 border border-primary rounded"></div>
                  <span>Ajánlat</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2.5 h-2.5 bg-muted-foreground/20 rounded"></div>
                  <span>Zárva</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section - More space for daily offers */}
        <div className="space-y-4">
          {/* Daily Offers - Interactive Selector */}
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ) : dailyData && dailyData.items.length > 0 ? (
            <div className="space-y-4">
              <h3 className="text-xl font-sofia font-semibold">
                {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })} - {(() => {
                  const { title } = getContentLabel(selectedDate);
                  return title;
                })()}
              </h3>
              
              {/* Extra Items - Grid layout exactly like on /etlap */}
              {extraItems.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">További napi ételek</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {extraItems.map((item) => (
                      <Card key={item.id} className="group hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                        <CardContent className="p-0">
                          <div className="aspect-video bg-muted overflow-hidden">
                            {item.item_image_url ? (
                              <img 
                                src={item.item_image_url} 
                                alt={item.item_name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
                                <img src={kiscsibeLogo} alt="Kiscsibe" className="h-[85%] w-auto object-contain drop-shadow-xl" />
                              </div>
                            )}
                          </div>
                          <div className="p-4 space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-semibold">{capitalizeFirst(item.item_name)}</h4>
                              <Badge variant="secondary" className="shrink-0 bg-primary/10 text-primary font-semibold">
                                {item.item_price_huf} Ft
                              </Badge>
                            </div>
                            {item.item_description && (
                              <p className="text-sm text-muted-foreground line-clamp-2">
                                {item.item_description}
                              </p>
                            )}
                            <Button
                              onClick={() => handleAddItemToCart(item)}
                              className="w-full"
                            >
                              Kosárba
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-sofia font-semibold mb-2">
                  {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })} - {(() => {
                    const { title } = getContentLabel(selectedDate);
                    return title;
                  })()}
                </h3>
                <p className="text-muted-foreground">Még nincs felvéve ajánlat erre a napra.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      <StickyMenuCTA 
        menuData={menuData ? {
          menu_id: menuData.menu_id,
          menu_price_huf: menuData.menu_price_huf,
          menu_remaining_portions: menuData.menu_remaining_portions,
          soup: menuData.soup ? { id: menuData.soup.item_id, name: menuData.soup.item_name } : null,
          main: menuData.main ? { id: menuData.main.item_id, name: menuData.main.item_name } : null
        } : null}
        date={selectedDate}
        onAddToCart={handleAddMenuToCart}
      />

      {/* Mobile bottom spacing for sticky CTA */}
      <div className="h-20 md:h-0"></div>
    </>
  );
};

export default UnifiedDailySection;