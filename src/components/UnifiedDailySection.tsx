import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import DailyMenuPanel from "@/components/DailyMenuPanel";
import WeeklyDateStrip from "@/components/WeeklyDateStrip";
import { supabase } from "@/integrations/supabase/client";
import { format, isPast, getDay } from "date-fns";
import { getSmartInitialDate, getContentLabel } from "@/lib/dateUtils";
import { hu } from "date-fns/locale";
import { capitalizeFirst } from "@/lib/utils";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
import StickyMenuCTA from "@/components/StickyMenuCTA";
import { SidePickerModal } from "@/components/SidePickerModal";

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

const UnifiedDailySection = () => {
  const { toast } = useToast();
  const { addItem, addCompleteMenu } = useCart();
  const [selectedDate, setSelectedDate] = useState<Date>(getSmartInitialDate());
  const [dailyData, setDailyData] = useState<DailyOffersData | null>(null);
  const [menuData, setMenuData] = useState<DailyMenuData | null>(null);
  const [loading, setLoading] = useState(false);
  const [availableDates, setAvailableDates] = useState<Date[]>([]);
  const [facebookImageUrl, setFacebookImageUrl] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [sidePickerOpen, setSidePickerOpen] = useState(false);
  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null);

  // Show all items individually (including menu-part items) so they can be ordered separately
  const extraItems = dailyData?.items || [];

  const handleAddItemToCart = (item: MenuItem) => {
    // Open side picker modal so user can choose a side dish
    setPendingItem(item);
    setSidePickerOpen(true);
  };

  const handleSideSelected = (selectedSides: { id: string; name: string; price_huf: number }[]) => {
    if (!pendingItem) return;
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    addItem({
      id: pendingItem.item_id,
      name: pendingItem.item_name,
      price_huf: pendingItem.item_price_huf,
      modifiers: [],
      sides: selectedSides.map(s => ({
        id: s.id,
        name: s.name,
        price_huf: s.price_huf
      })),
      image_url: pendingItem.item_image_url,
      daily_date: dateStr,
    });
    
    toast({
      title: "Kosárba tetve",
      description: `${pendingItem.item_name} hozzáadva a kosárhoz`
    });
    setPendingItem(null);
  };

  const handleAddMenuToCart = () => {
    if (!menuData || !menuData.soup || !menuData.main) return;
    
    try {
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

        // Fetch facebook image URL
        const { data: offerRow } = await supabase
          .from('daily_offers')
          .select('facebook_image_url')
          .eq('date', dateStr)
          .maybeSingle();
        setFacebookImageUrl((offerRow as any)?.facebook_image_url || null);

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

  return (
    <>
      {/* Weekly Date Strip - Compact inline picker */}
      <div className="flex justify-center mb-6">
        <WeeklyDateStrip
          selectedDate={selectedDate}
          onSelect={handleDateSelect}
          availableDates={availableDates}
          isDateDisabled={isDateDisabled}
        />
      </div>

      {/* Facebook Image - uploaded by admin */}
      {!loading && facebookImageUrl && (
        <div className="mb-6">
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
        </div>
      )}

      {/* Daily Menu Panel */}
      <div className="mb-6">
        <DailyMenuPanel 
          date={selectedDate}
          menuData={menuData}
          loading={loading}
        />
      </div>

      {/* Extra Items Section */}
      {!loading && dailyData && extraItems.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-sofia font-semibold">
              További napi ételek
            </h3>
            <Badge variant="outline" className="text-sm">
              {format(selectedDate, "MMMM d.", { locale: hu })}
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {extraItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-4 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl overflow-hidden"
              >
                {/* Bal: szöveg + ár + gomb */}
                <div className="flex-1 min-w-0 space-y-2">
                  <h4 className="text-base md:text-lg font-bold font-sofia leading-tight">
                    {capitalizeFirst(item.item_name)}
                  </h4>
                  {item.item_description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.item_description}
                    </p>
                  )}
                  <p className="text-lg md:text-xl font-bold text-primary">
                    {item.item_price_huf.toLocaleString('hu-HU')} Ft
                  </p>
                  <Button
                    size="sm"
                    className="rounded-full text-sm"
                    onClick={() => handleAddItemToCart(item)}
                  >
                    🛒 Kosárba
                  </Button>
                </div>

                {/* Jobb: kép */}
                <div className="w-28 h-28 md:w-36 md:h-36 shrink-0 rounded-2xl overflow-hidden bg-muted">
                  {item.item_image_url ? (
                    <img
                      src={item.item_image_url}
                      alt={item.item_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <img src={kiscsibeLogo} alt="Kiscsibe" className="h-2/3 w-auto object-contain opacity-60" />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No content state */}
      {!loading && (!dailyData || dailyData.items.length === 0) && !menuData && (
        <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-lg rounded-3xl">
          <CardContent className="p-6 text-center">
            <h3 className="text-xl font-sofia font-semibold mb-2">
              {format(selectedDate, "MMMM d. (EEEE)", { locale: hu })}
            </h3>
            <p className="text-muted-foreground">Még nincs felvéve ajánlat erre a napra.</p>
          </CardContent>
        </Card>
      )}

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

      {/* Side Picker Modal */}
      {pendingItem && (
        <SidePickerModal
          open={sidePickerOpen}
          onOpenChange={(open) => {
            setSidePickerOpen(open);
            if (!open) setPendingItem(null);
          }}
          mainItemId={pendingItem.item_id}
          mainItemName={pendingItem.item_name}
          onSideSelected={handleSideSelected}
          dailyOfferId={dailyData?.offer_id}
        />
      )}
    </>
  );
};

export default UnifiedDailySection;
