import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { ChefHat, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { capitalizeFirst } from "@/lib/utils";
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

interface DailyMenuData {
  menu_id: string;
  menu_price_huf: number;
  menu_max_portions: number;
  menu_remaining_portions: number;
  soup: MenuItem | null;
  main: MenuItem | null;
}

interface DailyMenuPanelProps {
  date: Date;
  menuData: DailyMenuData | null;
  loading: boolean;
}

const MenuItemCard = ({ item, label }: { item: MenuItem; label: string }) => (
  <div className="bg-card rounded-2xl md:rounded-3xl overflow-hidden shadow-lg ring-1 ring-black/5 dark:ring-white/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300">
    <div className="aspect-[4/3] md:aspect-[16/9] w-full overflow-hidden">
      {item.item_image_url ? (
        <img 
          src={item.item_image_url} 
          alt={item.item_name}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
          <img src={kiscsibeLogo} alt="Kiscsibe" className="h-[60%] md:h-[70%] w-auto object-contain opacity-80 drop-shadow-lg" />
        </div>
      )}
    </div>
    <div className="p-3 md:p-4">
      <span className="text-[10px] md:text-xs font-medium text-primary uppercase tracking-wide">{label}</span>
      <h4 className="font-semibold text-sm md:text-lg mt-0.5 md:mt-1 line-clamp-2">{capitalizeFirst(item.item_name)}</h4>
      {item.item_description && (
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-1 md:line-clamp-2 mt-0.5 md:mt-1">{item.item_description}</p>
      )}
    </div>
  </div>
);

const DailyMenuPanel = ({ date, menuData, loading }: DailyMenuPanelProps) => {
  const { addCompleteMenu } = useCart();

  const handleAddMenuToCart = () => {
    if (!menuData || !menuData.soup || !menuData.main) {
      toast.error("A menü nem teljes");
      return;
    }

    if (menuData.menu_remaining_portions <= 0) {
      toast.error("A menü elfogyott mára");
      return;
    }

    try {
      addCompleteMenu({
        id: menuData.menu_id,
        date: format(date, 'yyyy-MM-dd'),
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
      
      toast.success("Menü hozzáadva a kosárhoz!");
    } catch (error) {
      toast.error("Hiba történt a menü kosárba tételekor");
    }
  };

  if (loading) {
    return (
      <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Napi Menü</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!menuData) {
    return (
      <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Napi Menü</h3>
            </div>
          </div>
          <div className="p-6">
            <p className="text-muted-foreground">Az adott napra még nincs teljes menü kijelölve.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isAvailable = menuData.menu_remaining_portions > 0;

  return (
    <Card className="border-0 bg-card/95 backdrop-blur-sm shadow-xl rounded-3xl overflow-hidden">
      <CardContent className="p-0">
        {/* Header with prominent price */}
        <div className="bg-primary/10 px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <div>
                <h3 className="text-lg md:text-xl font-bold">Napi Menü</h3>
                <p className="text-xs md:text-sm text-muted-foreground">Leves + Főétel</p>
              </div>
            </div>
            <Badge className="bg-primary text-primary-foreground text-lg md:text-xl px-4 py-1.5 shadow-lg font-bold">
              {menuData.menu_price_huf.toLocaleString('hu-HU')} Ft
            </Badge>
          </div>
        </div>
        
        {/* Food cards - 2 columns always */}
        <div className="p-3 md:p-6">
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            {menuData.soup && (
              <MenuItemCard item={menuData.soup} label="Leves" />
            )}
            {menuData.main && (
              <MenuItemCard item={menuData.main} label="Főétel" />
            )}
          </div>

          {/* Premium CTA Section */}
          <div className="mt-4 md:mt-6 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl p-3 md:p-5">
            <div className="flex items-center justify-center">
              <Button 
                onClick={handleAddMenuToCart}
                size="lg"
                className="w-full bg-gradient-to-r from-primary to-primary/80 shadow-lg hover:shadow-xl transition-all px-6 h-12"
                disabled={!isAvailable}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAvailable ? "Menü kosárba" : "Elfogyott"}
                {isAvailable && (
                  <span className="ml-2 bg-white/20 px-2.5 py-0.5 rounded-full text-sm font-semibold">
                    {menuData.menu_price_huf.toLocaleString('hu-HU')} Ft
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyMenuPanel;
