import { Button } from "@/components/ui/button";
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
  <article className="food-frame group flex min-h-[118px] border-border/50 bg-card/85 sm:h-full sm:max-w-[340px] sm:flex-col">
    <div className="w-[104px] shrink-0 overflow-hidden border-r border-border/40 bg-muted sm:aspect-[16/10] sm:w-full sm:border-b sm:border-r-0">
      {item.item_image_url ? (
        <img 
          src={item.item_image_url} 
          alt={item.item_name}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.035]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-secondary/55 via-card to-background">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-background/35 sm:h-16 sm:w-16">
            <img src={kiscsibeLogo} alt="" className="h-7 w-7 object-contain opacity-65 sm:h-10 sm:w-10" />
          </div>
        </div>
      )}
    </div>
    <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-4">
      <span className="mb-1 w-fit text-[10px] font-bold uppercase text-primary sm:mb-1.5 sm:text-xs">{label}</span>
      <h4 className="line-clamp-2 font-sofia text-[17px] font-bold leading-[1.2] text-card-foreground sm:line-clamp-3 sm:text-[21px]">{capitalizeFirst(item.item_name)}</h4>
      {item.item_description && (
        <p className="mt-1 line-clamp-1 text-[12px] leading-relaxed text-muted-foreground sm:mt-2 sm:line-clamp-2 sm:text-[14px]">{item.item_description}</p>
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
      <div className="border-y border-border/50 py-5">
        <div className="animate-pulse space-y-3"><div className="h-5 w-40 rounded bg-muted" /><div className="h-3 w-64 rounded bg-muted" /></div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex items-center gap-3 border-y border-border/50 py-5">
        <ChefHat className="h-5 w-5 text-primary" />
        <p className="text-sm text-muted-foreground">Az adott napra még nincs teljes menü kijelölve.</p>
      </div>
    );
  }

  const isAvailable = menuData.menu_remaining_portions > 0;

  return (
    <section className="border-y border-border/55 py-4 sm:py-5" aria-label="Napi menü">
        <div className="mb-3 flex items-center justify-between gap-4 sm:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><ChefHat className="h-5 w-5" /></span>
              <div>
                <h3 className="font-sofia text-xl font-bold text-foreground sm:text-2xl">Napi menü</h3>
                <p className="text-[11px] text-muted-foreground sm:text-xs">Leves + Főétel</p>
              </div>
            </div>
             <span className="whitespace-nowrap text-[16px] font-bold text-foreground sm:text-[18px]">
              {menuData.menu_price_huf.toLocaleString('hu-HU')} Ft
             </span>
        </div>

          <div className="mx-auto grid max-w-[700px] grid-cols-1 items-stretch gap-3 sm:grid-cols-2 sm:justify-items-center sm:gap-4">
            {menuData.soup && (
              <MenuItemCard item={menuData.soup} label="Leves" />
            )}
            {menuData.main && (
              <MenuItemCard item={menuData.main} label="Főétel" />
            )}
          </div>

          <div className="mt-4 flex justify-center sm:mt-5">
            <div className="flex items-center justify-center">
              <Button 
                onClick={handleAddMenuToCart}
                size="lg"
                 className="h-12 w-full max-w-[420px] bg-primary px-6 text-base font-bold shadow-warm transition-all hover:bg-primary/90 sm:min-w-[360px]"
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
    </section>
  );
};

export default DailyMenuPanel;
