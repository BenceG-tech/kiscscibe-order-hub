import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Clock } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  item_id: string;
  item_name: string;
  item_description?: string;
  item_price_huf: number;
}

interface DailyMenuData {
  menu_id: string;
  menu_price_huf: number;
  menu_max_portions: number;
  menu_remaining_portions: number;
  soup: MenuItem | null;
  main: MenuItem | null;
}

interface Props {
  menuData: DailyMenuData;
  date: Date;
  canOrder: boolean;
}

const DailyMenuShowcase = ({ menuData, date, canOrder }: Props) => {
  const { addCompleteMenu } = useCart();

  const handleOrderMenu = () => {
    if (!menuData.soup || !menuData.main) return;

    try {
      addCompleteMenu({
        id: menuData.menu_id,
        date: date.toISOString().split('T')[0],
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

      toast.success("Napi menü hozzáadva a kosárhoz!");
    } catch (error) {
      console.error('Error adding menu to cart:', error);
      toast.error("Hiba történt a menü hozzáadásakor");
    }
  };

  const isSoldOut = menuData.menu_remaining_portions <= 0;

  return (
    <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 border-yellow-200 dark:border-yellow-800">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Badge className="bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20 text-sm font-semibold">
            NAPI MENÜ
          </Badge>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Maradt: {menuData.menu_remaining_portions} adag</span>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          {/* Soup */}
          {menuData.soup && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">Leves</h4>
                <p className="font-semibold text-primary">{menuData.soup.item_name}</p>
                {menuData.soup.item_description && (
                  <p className="text-sm text-muted-foreground mt-1">{menuData.soup.item_description}</p>
                )}
              </div>
            </div>
          )}

          {/* Main Course */}
          {menuData.main && (
            <div className="flex items-start gap-3 p-3 bg-white/50 dark:bg-white/5 rounded-lg border border-yellow-200/50 dark:border-yellow-800/50">
              <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <h4 className="font-medium text-foreground mb-1">Főétel</h4>
                <p className="font-semibold text-primary">{menuData.main.item_name}</p>
                {menuData.main.item_description && (
                  <p className="text-sm text-muted-foreground mt-1">{menuData.main.item_description}</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {menuData.menu_price_huf.toLocaleString()} Ft
            </div>
            <div className="text-sm text-muted-foreground">
              Kedvezményes menü ár
            </div>
          </div>
          
          {canOrder && (
            <Button
              onClick={handleOrderMenu}
              disabled={isSoldOut || !menuData.soup || !menuData.main}
              size="lg"
              className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold px-6 py-3 shadow-lg"
            >
              {isSoldOut ? (
                "Elfogyott"
              ) : (
                <>
                  <ShoppingCart className="h-5 w-5 mr-2" />
                  Rendeld a menüt
                </>
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DailyMenuShowcase;