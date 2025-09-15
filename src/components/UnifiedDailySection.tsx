import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import DailyItemSelector from "@/components/DailyItemSelector";
import DailyMenuShowcase from "@/components/DailyMenuShowcase";
import { supabase } from "@/integrations/supabase/client";
import { format, isToday, isPast, isSunday, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { useCart } from "@/contexts/CartContext";

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
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [dailyData, setDailyData] = useState<DailyOffersData | null>(null);
  const [menuData, setMenuData] = useState<DailyMenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);

  const { addCompleteMenu } = useCart();

  const handleAddMenuToCart = () => {
    if (!menuData || !menuData.soup || !menuData.main) return;
    
    try {
      addCompleteMenu({
        id: menuData.menu_id,
        date: selectedDate.toISOString().split('T')[0],
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
    const today = new Date();
    if (!isPast(today) && getDay(today) !== 0 && getDay(today) !== 6) {
      setSelectedDate(today);
    }
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold">Napi ajánlatok naptára</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTodayClick}
              disabled={isPast(new Date()) || getDay(new Date()) === 0 || getDay(new Date()) === 6}
            >
              Ma
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4">
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
              <div className="mt-4 space-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary/10 border-2 border-primary rounded"></div>
                  <span>Elérhető ajánlat</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-muted-foreground/20 rounded"></div>
                  <span>Zárva (hétvége)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Section */}
        <div className="space-y-6">
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
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-4">
                  {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })}
                </h3>
                <DailyItemSelector 
                  type="offer"
                  data={{
                    id: dailyData.offer_id,
                    date: dailyData.offer_date,
                    price_huf: dailyData.offer_price_huf || 0,
                    note: dailyData.offer_note,
                    max_portions: dailyData.offer_max_portions || 0,
                    remaining_portions: dailyData.offer_remaining_portions || 0,
                    daily_offer_items: dailyData.items.map(item => ({
                      id: item.id,
                      menu_items: {
                        id: item.item_id,
                        name: item.item_name,
                        description: item.item_description || "",
                        price_huf: item.item_price_huf,
                        image_url: item.item_image_url
                      }
                    }))
                  }}
                  canOrder={!isPast(selectedDate) && getDay(selectedDate) !== 0}
                  showDetails={true}
                />
              </div>

              {/* Daily Menu Showcase */}
              {menuData && menuData.soup && menuData.main && (
                <div>
                  <h3 className="text-xl font-semibold mb-4">Napi menü</h3>
                  <DailyMenuShowcase
                    menuData={menuData}
                    date={selectedDate}
                    canOrder={!isPast(selectedDate) && getDay(selectedDate) !== 0}
                  />
                </div>
              )}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-2">
                  {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })}
                </h3>
                <p className="text-muted-foreground">Még nincs felvéve ajánlat erre a napra.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Sticky CTA */}
      {menuData && menuData.soup && menuData.main && (
        <StickyMenuCTA 
          menuData={{
            menu_id: menuData.menu_id,
            menu_price_huf: menuData.menu_price_huf,
            menu_remaining_portions: menuData.menu_remaining_portions,
            soup: menuData.soup ? { id: menuData.soup.item_id, name: menuData.soup.item_name } : null,
            main: menuData.main ? { id: menuData.main.item_id, name: menuData.main.item_name } : null
          }}
          date={selectedDate}
          onAddToCart={handleAddMenuToCart}
        />
      )}

      {/* Mobile bottom spacing for sticky CTA */}
      <div className="h-20 md:h-0"></div>
    </>
  );
};

export default UnifiedDailySection;