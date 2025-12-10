import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { UtensilsCrossed, Soup } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { capitalizeFirst } from "@/lib/utils";

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
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Napi menü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!menuData) {
    return (
      <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="h-5 w-5" />
            Napi menü
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Az adott napra még nincs teljes menü kijelölve.</p>
        </CardContent>
      </Card>
    );
  }

  const isAvailable = menuData.menu_remaining_portions > 0;
  const isLowStock = menuData.menu_remaining_portions <= 5 && menuData.menu_remaining_portions > 0;

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <UtensilsCrossed className="h-5 w-5" />
          Napi menü (leves + főétel)
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="secondary" className="text-lg font-bold bg-primary text-primary-foreground">
            {menuData.menu_price_huf} Ft
          </Badge>
          <Badge variant="outline" className="text-xs">
            Max: {menuData.menu_max_portions}
          </Badge>
          <Badge 
            variant={isAvailable ? (isLowStock ? "destructive" : "outline") : "destructive"}
            className="text-xs"
          >
            {isAvailable 
              ? (isLowStock ? `Kevés maradt: ${menuData.menu_remaining_portions}` : `Maradt: ${menuData.menu_remaining_portions}`)
              : "Elfogyott mára"
            }
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <h4 className="font-medium">Összetétel:</h4>
          
          {menuData.soup && (
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              {menuData.soup.item_image_url ? (
                <img 
                  src={menuData.soup.item_image_url} 
                  alt={menuData.soup.item_name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0">
                  <Soup className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-700 text-xs mb-1">
                  leves
                </Badge>
                <h5 className="font-medium">{capitalizeFirst(menuData.soup.item_name)}</h5>
                {menuData.soup.item_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{menuData.soup.item_description}</p>
                )}
              </div>
            </div>
          )}

          {menuData.main && (
            <div className="flex items-start gap-3 p-3 bg-background/50 rounded-lg">
              {menuData.main.item_image_url ? (
                <img 
                  src={menuData.main.item_image_url} 
                  alt={menuData.main.item_name}
                  className="w-12 h-12 rounded-lg object-cover shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                  <UtensilsCrossed className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <Badge variant="outline" className="bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-700 text-xs mb-1">
                  főétel
                </Badge>
                <h5 className="font-medium">{capitalizeFirst(menuData.main.item_name)}</h5>
                {menuData.main.item_description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{menuData.main.item_description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleAddMenuToCart}
          disabled={!isAvailable}
          size="lg"
          className="w-full text-lg font-semibold"
        >
          {isAvailable ? "Menü kosárba" : "Elfogyott"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default DailyMenuPanel;