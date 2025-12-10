import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Calendar as CalendarIcon, ChefHat, Soup, UtensilsCrossed } from "lucide-react";
import { CartDialog } from "@/components/CartDialog";
import { Calendar } from "@/components/ui/calendar";
import { format, getDay, isPast, isToday } from "date-fns";
import { hu } from "date-fns/locale";
import { getSmartInitialDate, getContentLabel } from "@/lib/dateUtils";

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

const Etlap = () => {
  const { toast } = useToast();
  const { state: cart, addItem, addCompleteMenu } = useCart();
  const [selectedDate, setSelectedDate] = useState<Date>(getSmartInitialDate());
  const [dailyData, setDailyData] = useState<DailyOffersData | null>(null);
  const [menuData, setMenuData] = useState<DailyMenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

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
        
        setDailyData({
          offer_id: result.offer_id,
          offer_date: result.offer_date,
          offer_price_huf: result.offer_price_huf,
          offer_note: result.offer_note,
          offer_max_portions: result.offer_max_portions,
          offer_remaining_portions: result.offer_remaining_portions,
          items: items
        });

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
  }, []);

  useEffect(() => {
    fetchDailyData(selectedDate);
  }, [selectedDate]);

  const handleDateSelect = (date: Date | undefined) => {
    if (date && !isPast(date) && getDay(date) !== 0 && getDay(date) !== 6) {
      setSelectedDate(date);
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
    
    toast({
      title: "Menü kosárba téve",
      description: `Napi menü: ${menuData.soup.item_name} + ${menuData.main.item_name}`
    });
  };

  // Get extra items (not part of menu)
  const extraItems = dailyData?.items.filter(item => !item.is_menu_part) || [];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Napi Ajánlat
            </h1>
            <p className="text-xl text-muted-foreground">
              Válassz a napi friss ételek közül!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar Section */}
            <div className="lg:col-span-1">
              <Card className="sticky top-32">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <CalendarIcon className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Válassz napot</h3>
                  </div>
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
            <div className="lg:col-span-2 space-y-6">
              {/* Date Title */}
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">
                  {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })}
                </h2>
                <Badge variant="outline" className="text-sm">
                  {getContentLabel(selectedDate).title}
                </Badge>
              </div>

              {loading ? (
                <Card>
                  <CardContent className="p-8">
                    <div className="animate-pulse space-y-4">
                      <div className="h-6 bg-muted rounded w-1/2"></div>
                      <div className="h-4 bg-muted rounded w-3/4"></div>
                      <div className="h-4 bg-muted rounded w-1/4"></div>
                    </div>
                  </CardContent>
                </Card>
              ) : dailyData && dailyData.items.length > 0 ? (
                <>
                  {/* Daily Menu Card */}
                  {menuData && menuData.soup && menuData.main && (
                    <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
                      <CardContent className="p-0">
                        <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ChefHat className="h-6 w-6 text-primary" />
                              <h3 className="text-xl font-bold">Napi Menü</h3>
                            </div>
                            <Badge className="bg-primary text-primary-foreground text-lg px-4 py-1">
                              {menuData.menu_price_huf} Ft
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Leves + Főétel kedvezményes áron
                          </p>
                        </div>
                        
                        <div className="p-6 space-y-4">
                          {/* Soup */}
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg shrink-0">
                              <Soup className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Leves</span>
                              </div>
                              <h4 className="font-semibold text-lg">{menuData.soup.item_name}</h4>
                              {menuData.soup.item_description && (
                                <p className="text-sm text-muted-foreground">{menuData.soup.item_description}</p>
                              )}
                            </div>
                          </div>

                          {/* Main Course */}
                          <div className="flex items-start gap-4">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg shrink-0">
                              <UtensilsCrossed className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">Főétel</span>
                              </div>
                              <h4 className="font-semibold text-lg">{menuData.main.item_name}</h4>
                              {menuData.main.item_description && (
                                <p className="text-sm text-muted-foreground">{menuData.main.item_description}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="text-sm text-muted-foreground">
                              Elérhető: {menuData.menu_remaining_portions} adag
                            </div>
                            <Button 
                              onClick={handleAddMenuToCart}
                              className="bg-gradient-to-r from-primary to-primary-glow"
                              disabled={menuData.menu_remaining_portions <= 0}
                            >
                              <ShoppingCart className="h-4 w-4 mr-2" />
                              Menü kosárba
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Extra Items */}
                  {extraItems.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold">További napi ételek</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {extraItems.map((item) => (
                          <Card key={item.id} className="group hover:shadow-lg transition-all duration-300">
                            <CardContent className="p-0">
                              {item.item_image_url && (
                                <div className="aspect-video bg-muted overflow-hidden">
                                  <img 
                                    src={item.item_image_url} 
                                    alt={item.item_name}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                  />
                                </div>
                              )}
                              <div className="p-4 space-y-3">
                                <div className="flex items-start justify-between gap-2">
                                  <h4 className="font-semibold">{item.item_name}</h4>
                                  <Badge variant="secondary" className="shrink-0">
                                    {item.item_price_huf} Ft
                                  </Badge>
                                </div>
                                {item.item_description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {item.item_description}
                                  </p>
                                )}
                                {item.item_allergens && item.item_allergens.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {item.item_allergens.map((allergen, idx) => (
                                      <Badge key={idx} variant="outline" className="text-xs">
                                        {allergen}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                <Button 
                                  onClick={() => handleAddItemToCart(item)}
                                  className="w-full"
                                  size="sm"
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

                  {/* Note */}
                  {dailyData.offer_note && (
                    <Card className="bg-muted/50">
                      <CardContent className="p-4">
                        <p className="text-sm text-muted-foreground italic">
                          {dailyData.offer_note}
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <ChefHat className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nincs ajánlat erre a napra</h3>
                    <p className="text-muted-foreground">
                      Válassz egy másik napot a naptárból, vagy nézz vissza később!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.itemCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="rounded-full h-14 w-14 bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm relative transition-all duration-300 hover:scale-110"
          >
            <ShoppingCart className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 bg-warmth text-white min-w-[20px] h-5 flex items-center justify-center text-xs">
              {cart.itemCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <CartDialog open={isCartOpen} onOpenChange={setIsCartOpen} />
    </div>
  );
};

export default Etlap;
