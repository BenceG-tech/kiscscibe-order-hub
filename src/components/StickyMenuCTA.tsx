import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { UtensilsCrossed, ShoppingCart } from "lucide-react";

interface StickyMenuCTAProps {
  menuData: {
    menu_id: string;
    menu_price_huf: number;
    menu_remaining_portions: number;
    soup: { id: string; name: string; } | null;
    main: { id: string; name: string; } | null;
  } | null;
  date: Date;
  onAddToCart: () => void;
}

const StickyMenuCTA = ({ menuData, date, onAddToCart }: StickyMenuCTAProps) => {
  const { state } = useCart();

  if (!menuData || !menuData.soup || !menuData.main || menuData.menu_remaining_portions <= 0) {
    return null;
  }

  const hasItemsInCart = state.items.length > 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 z-50 md:hidden">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <UtensilsCrossed className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="font-medium text-sm truncate">Napi menü</span>
            <Badge variant="secondary" className="text-xs bg-primary text-primary-foreground">
              {menuData.menu_price_huf} Ft
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground truncate">
            {menuData.soup.name} + {menuData.main.name}
          </p>
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {hasItemsInCart && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <ShoppingCart className="h-3 w-3" />
              <span>{state.itemCount}</span>
            </div>
          )}
          
          <Button onClick={onAddToCart} size="sm" className="font-semibold">
            Kosárba
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StickyMenuCTA;