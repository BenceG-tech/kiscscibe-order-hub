import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ChefHat } from "lucide-react";
import { CartDialog } from "@/components/CartDialog";
import { SidePickerModal } from "@/components/SidePickerModal";
import WeeklyDateStrip from "@/components/WeeklyDateStrip";
import { format, getDay, isPast } from "date-fns";
import { hu } from "date-fns/locale";
import { getSmartInitialDate, getContentLabel } from "@/lib/dateUtils";
import { capitalizeFirst } from "@/lib/utils";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
import heroImage from "@/assets/hero-desktop.png";
import DailyMenuPanel from "@/components/DailyMenuPanel";
import AlwaysAvailableSection from "@/components/sections/AlwaysAvailableSection";

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
  const [sidePickerOpen, setSidePickerOpen] = useState(false);
  const [pendingCartItem, setPendingCartItem] = useState<MenuItem | null>(null);
  const [facebookImageUrl, setFacebookImageUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);

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

        // Fetch facebook image URL
        const { data: offerRow } = await supabase
          .from('daily_offers')
          .select('facebook_image_url')
          .eq('date', dateStr)
          .maybeSingle();
        setFacebookImageUrl((offerRow as any)?.facebook_image_url || null);

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
        setFacebookImageUrl(null);
      }
    } catch (error) {
      console.error('Error fetching daily data:', error);
      setDailyData(null);
      setMenuData(null);
      setFacebookImageUrl(null);
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

  const handleDateSelect = (date: Date) => {
    if (!isPast(date) && getDay(date) !== 0 && getDay(date) !== 6) {
      setSelectedDate(date);
    }
  };

  const isDateDisabled = (date: Date) => {
    return isPast(date) || getDay(date) === 0 || getDay(date) === 6;
  };

  const handleAddItemToCart = async (item: MenuItem) => {
    // Check if item has menu_role of 'leves' - if so, add directly to cart
    if (item.menu_role === 'leves') {
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
      return;
    }
    
    // For non-soup items (főétel), open side picker modal
    setPendingCartItem(item);
    setSidePickerOpen(true);
  };

  const handleSideSelected = (selectedSides: { id: string; name: string; price_huf: number }[]) => {
    if (!pendingCartItem) return;
    
    addItem({
      id: pendingCartItem.item_id,
      name: pendingCartItem.item_name,
      price_huf: pendingCartItem.item_price_huf,
      modifiers: [],
      sides: selectedSides.map(side => ({
        id: side.id,
        name: side.name,
        price_huf: 0 // Sides included in price
      })),
      image_url: pendingCartItem.item_image_url
    });
    
    const sideText = selectedSides.length > 0 
      ? ` (köret: ${selectedSides.map(s => s.name).join(', ')})`
      : '';
    
    toast({
      title: "Kosárba tetve",
      description: `${pendingCartItem.item_name}${sideText} hozzáadva a kosárhoz`
    });
    
    setPendingCartItem(null);
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
      <main className="pt-20">
        {/* Hero Section with image */}
        <section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img 
            src={heroImage} 
            alt="Napi ajánlat"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">
                Napi Ajánlat
              </h1>
              <p className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                Friss, házias ételek minden nap
              </p>
            </div>
          </div>
        </section>

        {/* Compact Date Picker */}
        <section className="py-6 bg-background">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex justify-center">
              <WeeklyDateStrip
                selectedDate={selectedDate}
                onSelect={handleDateSelect}
                availableDates={availableDates}
                isDateDisabled={isDateDisabled}
              />
            </div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-6 pb-24">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
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
              <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl">
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
                {/* Facebook Image - uploaded by admin */}
                {facebookImageUrl && (
                  <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl overflow-hidden">
                    <CardContent className="p-0">
                      <button
                        onClick={() => setLightboxOpen(true)}
                        className="w-full cursor-pointer focus:outline-none"
                      >
                        <img
                          src={facebookImageUrl}
                          alt={`Napi ajánlat - ${format(selectedDate, "MMMM d.", { locale: hu })}`}
                          className="w-full h-auto rounded-3xl hover:opacity-95 transition-opacity"
                        />
                      </button>
                    </CardContent>
                  </Card>
                )}

                {/* Daily Menu Card - Using shared component for consistency */}
                {menuData && menuData.soup && menuData.main && (
                  <DailyMenuPanel date={selectedDate} menuData={menuData} loading={false} />
                )}

                {/* Extra Items */}
                {extraItems.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">További napi ételek</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {extraItems.map((item) => (
                        <Card 
                          key={item.id} 
                          className="group border-0 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                        >
                          <CardContent className="p-0">
                            <div className="aspect-video overflow-hidden">
                              {item.item_image_url ? (
                                <img 
                                  src={item.item_image_url} 
                                  alt={item.item_name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                                  <img src={kiscsibeLogo} alt="Kiscsibe" className="h-[70%] w-auto object-contain opacity-80 drop-shadow-lg" />
                                </div>
                              )}
                            </div>
                            <div className="p-4 md:p-6 space-y-3">
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
                  <Card className="border-0 bg-muted/50 rounded-2xl">
                    <CardContent className="p-4">
                      <p className="text-sm text-muted-foreground italic">
                        📝 {dailyData.offer_note}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl">
                <CardContent className="p-8 text-center">
                  <h3 className="text-xl font-semibold mb-2">Nincs elérhető ajánlat</h3>
                  <p className="text-muted-foreground">
                    Erre a napra még nem töltöttünk fel napi menüt.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Always Available Items */}
            <AlwaysAvailableSection />
          </div>
        </section>
      </main>
      <Footer />
      <CartDialog open={isCartOpen} onOpenChange={setIsCartOpen} />
      
      {/* Side Picker Modal for main courses */}
      <SidePickerModal
        open={sidePickerOpen}
        onOpenChange={(open) => {
          setSidePickerOpen(open);
          if (!open && pendingCartItem) {
            // If closed without selecting, add item without sides
            addItem({
              id: pendingCartItem.item_id,
              name: pendingCartItem.item_name,
              price_huf: pendingCartItem.item_price_huf,
              modifiers: [],
              sides: [],
              image_url: pendingCartItem.item_image_url
            });
            toast({
              title: "Kosárba tetve",
              description: `${pendingCartItem.item_name} hozzáadva köret nélkül`
            });
            setPendingCartItem(null);
          }
        }}
        mainItemId={pendingCartItem?.item_id || ""}
        mainItemName={pendingCartItem?.item_name || ""}
        mainItemRequiresSideSelection={false}
        onSideSelected={handleSideSelected}
        dailyOfferId={dailyData?.offer_id}
      />

      {/* Lightbox for Facebook image */}
      {lightboxOpen && facebookImageUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightboxOpen(false)}
        >
          <img
            src={facebookImageUrl}
            alt="Napi ajánlat"
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default Etlap;
