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
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
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
      <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-primary/10 px-6 py-4 border-b border-primary/20">
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
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Soup Card */}
            {menuData.soup && (
              <div className="bg-background/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  {menuData.soup.item_image_url ? (
                    <img 
                      src={menuData.soup.item_image_url} 
                      alt={menuData.soup.item_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
                      <img src={kiscsibeLogo} alt="Kiscsibe" className="h-[85%] w-auto object-contain drop-shadow-xl" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase">Leves</span>
                  <h4 className="font-semibold text-lg mt-1">{capitalizeFirst(menuData.soup.item_name)}</h4>
                  {menuData.soup.item_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{menuData.soup.item_description}</p>
                  )}
                </div>
              </div>
            )}

            {/* Main Course Card */}
            {menuData.main && (
              <div className="bg-background/50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[16/9] w-full overflow-hidden">
                  {menuData.main.item_image_url ? (
                    <img 
                      src={menuData.main.item_image_url} 
                      alt={menuData.main.item_name}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-50 to-amber-100/80 dark:from-amber-950/40 dark:to-amber-900/30 flex items-center justify-center">
                      <img src={kiscsibeLogo} alt="Kiscsibe" className="h-[85%] w-auto object-contain drop-shadow-xl" />
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase">Főétel</span>
                  <h4 className="font-semibold text-lg mt-1">{capitalizeFirst(menuData.main.item_name)}</h4>
                  {menuData.main.item_description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{menuData.main.item_description}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Elérhető: {menuData.menu_remaining_portions} adag
            </div>
            <Button 
              onClick={handleAddMenuToCart}
              className="bg-gradient-to-r from-primary to-primary-glow"
              disabled={!isAvailable}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isAvailable ? "Menü kosárba" : "Elfogyott"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyMenuPanel;
