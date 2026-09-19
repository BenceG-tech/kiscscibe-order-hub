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
  <article className="food-frame group flex h-full flex-col border-primary/15 bg-card/95">
    <div className="aspect-[16/10] w-full overflow-hidden border-b border-border/50 bg-muted">
      {item.item_image_url ? (
        <img 
          src={item.item_image_url} 
          alt={item.item_name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/55 via-card to-background">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border border-primary/20 bg-background/35 shadow-soft">
            <img src={kiscsibeLogo} alt="" className="h-12 w-12 object-contain opacity-65" />
          </div>
        </div>
      )}
    </div>
    <div className="flex flex-1 flex-col p-4 md:p-5">
      <span className="mb-1.5 w-fit rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary md:text-xs">{label}</span>
      <h4 className="line-clamp-3 font-sofia text-[20px] font-bold leading-[1.22] text-card-foreground md:text-[23px]">{capitalizeFirst(item.item_name)}</h4>
      {item.item_description && (
        <p className="mt-2 line-clamp-2 text-[14px] leading-relaxed text-muted-foreground md:text-[15px]">{item.item_description}</p>
      )}
    </div>
  </article>
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
      <Card className="soft-panel overflow-hidden border-0">
        <CardContent className="p-0">
          <div className="bg-primary/10 px-6 py-4">
            <div className="flex items-center gap-3">
              <ChefHat className="h-6 w-6 text-primary" />
              <h3 className="text-xl font-bold">Napi Menü</h3>
            </div>
          </div>
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-3/4 rounded-full bg-muted"></div>
              <div className="h-4 w-1/2 rounded-full bg-muted"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!menuData) {
    return (
      <Card className="soft-panel overflow-hidden border-0">
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
    <Card className="soft-panel overflow-hidden">
      <CardContent className="p-0">
        {/* Header with prominent price */}
        <div className="chalkboard border-b border-primary/35 px-4 py-4 md:px-6 md:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <ChefHat className="h-5 w-5 md:h-6 md:w-6 text-primary" />
              <div>
                <h3 className="font-sofia text-2xl font-bold text-primary md:text-3xl">Napi menü</h3>
                <p className="text-xs md:text-sm text-editorial-muted">Leves + Főétel</p>
              </div>
            </div>
             <span className="whitespace-nowrap text-[18px] font-bold text-editorial-foreground md:text-[19px]">
              {menuData.menu_price_huf.toLocaleString('hu-HU')} Ft
             </span>
          </div>
        </div>
        
        {/* Food cards - 2 columns always */}
        <div className="p-3 md:p-6">
          <div className="mx-auto grid max-w-4xl grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:gap-5">
            {menuData.soup && (
              <MenuItemCard item={menuData.soup} label="Leves" />
            )}
            {menuData.main && (
              <MenuItemCard item={menuData.main} label="Főétel" />
            )}
          </div>

          {/* Premium CTA Section */}
          <div className="mt-4 border-t border-border/50 pt-4 md:mt-6 md:pt-5">
            <div className="flex items-center justify-center">
              <Button 
                onClick={handleAddMenuToCart}
                size="lg"
                 className="h-12 w-full bg-primary px-6 text-base font-bold shadow-warm transition-all hover:bg-primary/90 hover:shadow-lg"
                disabled={!isAvailable}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                {isAvailable ? "Menü kosárba" : "Elfogyott"}
                {isAvailable && (
                   <span className="ml-2 border-l border-primary-foreground/25 pl-3 text-sm font-semibold">
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
