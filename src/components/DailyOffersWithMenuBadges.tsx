import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

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

interface Props {
  data: DailyOffersData;
  canOrder: boolean;
}

const DailyOffersWithMenuBadges = ({ data, canOrder }: Props) => {
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const { addDailyOffer } = useCart();

  const updateQuantity = (itemId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: Math.max(0, (prev[itemId] || 0) + change)
    }));
  };

  const addToCart = (item: MenuItem) => {
    const quantity = quantities[item.id] || 1;
    
    // Add individual daily offer item
    addDailyOffer({
      id: data.offer_id,
      date: data.offer_date,
      price_huf: item.item_price_huf * quantity,
      daily_offer_items: [{
        menu_items: {
          name: item.item_name
        }
      }]
    });

    toast.success(`${item.item_name} hozzáadva a kosárhoz (${quantity} db)`);
    setQuantities(prev => ({ ...prev, [item.id]: 0 }));
  };

  const nonMenuItems = data.items.filter(item => !item.is_menu_part);
  const menuItems = data.items.filter(item => item.is_menu_part);

  return (
    <div className="space-y-4">
      {/* Today's Special Offers */}
      <div>
        <h4 className="text-lg font-semibold mb-3 text-foreground">Mai ajánlatok</h4>
        <div className="grid gap-3">
          {[...nonMenuItems, ...menuItems].map((item) => (
            <Card key={item.id} className="transition-all duration-200 hover:shadow-md">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h5 className="font-medium text-foreground truncate">{item.item_name}</h5>
                      {item.is_menu_part && (
                        <Badge 
                          variant="secondary" 
                          className="text-xs font-medium bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-400 dark:border-yellow-800"
                        >
                          MENÜ
                        </Badge>
                      )}
                    </div>
                    {item.item_description && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {item.item_description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg text-primary">
                        {item.item_price_huf.toLocaleString()} Ft
                      </span>
                      {canOrder && data.offer_remaining_portions && data.offer_remaining_portions > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={!quantities[item.id]}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                              {quantities[item.id] || 0}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => updateQuantity(item.id, 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <Button
                            onClick={() => addToCart(item)}
                            disabled={!quantities[item.id]}
                            size="sm"
                            className="h-8 px-3"
                          >
                            <ShoppingCart className="h-3 w-3 mr-1" />
                            Kosárba
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        {data.offer_remaining_portions === 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Az ajánlatok elfogytak erre a napra</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyOffersWithMenuBadges;