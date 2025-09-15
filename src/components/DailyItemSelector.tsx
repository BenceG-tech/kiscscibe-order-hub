import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Package, Coffee, Clock, AlertCircle, Plus, Minus } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { toast } from "sonner";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
  image_url?: string;
}

interface DailyOfferItem {
  id: string;
  menu_items?: MenuItem;
}

interface DailyMenuItems {
  id: string;
  menu_items?: MenuItem;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_offer_items?: DailyOfferItem[];
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_menu_items?: DailyMenuItems[];
}

interface DailyItemSelectorProps {
  type: 'offer' | 'menu';
  data: DailyOffer | DailyMenu;
  canOrder: boolean;
  showDetails?: boolean;
  deadlineText?: string | null;
}

const DailyItemSelector = ({ type, data, canOrder, showDetails = false, deadlineText }: DailyItemSelectorProps) => {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const { addItem } = useCart();

  const items = type === 'offer' 
    ? (data as DailyOffer).daily_offer_items || []
    : (data as DailyMenu).daily_menu_items || [];

  const allItemIds = items.map(item => item.id);
  const allSelected = selectedItems.length === items.length && selectedItems.length > 0;
  
  // Calculate pricing with quantities
  const calculatePrice = () => {
    if (allSelected) {
      // If all items selected, use package price multiplied by max quantity
      const maxQuantity = Math.max(...selectedItems.map(id => quantities[id] || 1));
      return data.price_huf * maxQuantity;
    } else {
      // If partial selection, use individual item prices with quantities
      return selectedItems.reduce((total, itemId) => {
        const item = items.find(i => i.id === itemId);
        const quantity = quantities[itemId] || 1;
        return total + ((item?.menu_items?.price_huf || 0) * quantity);
      }, 0);
    }
  };

  const getTotalQuantity = () => {
    return selectedItems.reduce((total, itemId) => total + (quantities[itemId] || 1), 0);
  };

  const handleItemToggle = (itemId: string) => {
    setSelectedItems(prev => {
      const newSelected = prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId];
      
      // Initialize quantity to 1 when item is selected
      if (!prev.includes(itemId)) {
        setQuantities(prevQty => ({ ...prevQty, [itemId]: 1 }));
      }
      
      return newSelected;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      setSelectedItems([]);
      setQuantities({});
    } else {
      setSelectedItems(allItemIds);
      // Initialize all quantities to 1
      const newQuantities: Record<string, number> = {};
      allItemIds.forEach(id => {
        newQuantities[id] = quantities[id] || 1;
      });
      setQuantities(newQuantities);
    }
  };

  const handleQuantityChange = (itemId: string, change: number) => {
    setQuantities(prev => {
      const currentQty = prev[itemId] || 1;
      const newQty = Math.max(1, currentQty + change);
      return { ...prev, [itemId]: newQty };
    });
  };

  const handleAddToCart = () => {
    if (selectedItems.length === 0) {
      toast.error('Válassz legalább egy tételt!');
      return;
    }

    try {
      if (allSelected) {
        // Add as complete package with max quantity
        const maxQuantity = Math.max(...selectedItems.map(id => quantities[id] || 1));
        const itemNames = items.map(item => item.menu_items?.name).filter(Boolean).join(', ');
        const packageName = type === 'offer' ? 'Napi ajánlat' : 'Napi menü';
        
        for (let i = 0; i < maxQuantity; i++) {
          addItem({
            id: `daily_${type}_${data.id}`,
            name: `${packageName} - ${itemNames}`,
            price_huf: data.price_huf,
            modifiers: [],
            daily_type: type,
            daily_date: data.date,
            daily_id: data.id,
          });
        }
      } else {
        // Add selected items individually with quantities
        selectedItems.forEach(itemId => {
          const item = items.find(i => i.id === itemId);
          const quantity = quantities[itemId] || 1;
          if (item?.menu_items) {
            for (let i = 0; i < quantity; i++) {
              addItem({
                id: item.menu_items.id,
                name: item.menu_items.name,
                price_huf: item.menu_items.price_huf,
                modifiers: [],
                image_url: item.menu_items.image_url,
              });
            }
          }
        });
      }

      toast.success('Tételek hozzáadva a kosárhoz!');
      setSelectedItems([]);
      setQuantities({});
    } catch (error) {
      toast.error('Hiba történt a kosárhoz adás során');
    }
  };

  const totalPrice = calculatePrice();
  const savings = allSelected ? items.reduce((sum, item) => sum + (item.menu_items?.price_huf || 0), 0) - data.price_huf : 0;

  return (
    <Card className={`${showDetails ? 'border-2 border-primary/30 bg-gradient-to-br from-background to-primary/5 shadow-lg' : 'border-2 border-dashed border-primary/20 bg-gradient-to-br from-background to-primary/5'}`}>
      <CardContent className="p-4 space-y-4">
        {showDetails && (
          <div className="space-y-4 mb-6">
            <div className="flex items-center justify-between">
              <Badge className={`${type === 'offer' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'} text-base px-4 py-2 rounded-full font-bold shadow-md`}>
                {data.price_huf} Ft
              </Badge>
              <div className="flex gap-2 text-xs">
                <Badge variant="outline">Max: {data.max_portions}</Badge>
                <Badge variant={data.remaining_portions > 0 ? "default" : "destructive"}>
                  {data.remaining_portions > 0 ? `Maradt: ${data.remaining_portions}` : 'Elfogyott'}
                </Badge>
              </div>
            </div>
            {deadlineText && (
              <div className="flex items-center gap-2 p-2 bg-orange-500/10 rounded-lg border border-orange-500/20">
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="text-orange-500 text-sm font-medium">{deadlineText}</p>
              </div>
            )}
            {data.note && (
              <div className={`flex items-center gap-2 p-3 ${type === 'offer' ? 'bg-primary/10' : 'bg-secondary/10'} rounded-lg`}>
                <Clock className={`h-4 w-4 ${type === 'offer' ? 'text-primary' : 'text-secondary'}`} />
                <p className={`${type === 'offer' ? 'text-primary' : 'text-secondary'} text-sm font-medium`}>{data.note}</p>
              </div>
            )}
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {type === 'offer' ? <Package className="h-5 w-5 text-primary" /> : <Coffee className="h-5 w-5 text-secondary" />}
            <span className="font-semibold">Válaszd ki, mit szeretnél:</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
            className="text-xs"
          >
            {allSelected ? 'Egyik sem' : 'Mind'}
          </Button>
        </div>

        <div className="space-y-3">
          {items.map((item, index) => (
            <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border border-primary/10 hover:border-primary/20 transition-colors">
              <Checkbox
                id={item.id}
                checked={selectedItems.includes(item.id)}
                onCheckedChange={() => handleItemToggle(item.id)}
                className="mt-1"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </span>
                  <label 
                    htmlFor={item.id}
                    className="font-medium cursor-pointer flex-1"
                  >
                    {item.menu_items?.name}
                  </label>
                  <Badge variant="outline" className="text-xs">
                    {item.menu_items?.price_huf} Ft
                  </Badge>
                </div>
                {item.menu_items?.description && (
                  <p className="text-muted-foreground text-sm mt-1 ml-8">
                    {item.menu_items.description}
                  </p>
                )}
                {selectedItems.includes(item.id) && (
                  <div className="flex items-center gap-2 mt-2 ml-8">
                    <span className="text-sm text-muted-foreground">Mennyiség:</span>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, -1)}
                        disabled={quantities[item.id] <= 1}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="mx-2 font-medium min-w-[2rem] text-center">
                        {quantities[item.id] || 1}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleQuantityChange(item.id, 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="text-sm font-medium text-primary">
                      = {((item.menu_items?.price_huf || 0) * (quantities[item.id] || 1)).toLocaleString()} Ft
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {selectedItems.length > 0 && (
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Összesen ({getTotalQuantity()} darab):</span>
              </div>
              <div className="text-right">
                <div className="font-bold text-lg">
                  {totalPrice.toLocaleString()} Ft
                </div>
                {savings > 0 && (
                  <div className="text-sm text-green-600">
                    Megtakarítás: {savings.toLocaleString()} Ft
                  </div>
                )}
              </div>
            </div>
            
            <Button 
              onClick={handleAddToCart}
              disabled={!canOrder || data.remaining_portions <= 0}
              className={`w-full ${type === 'offer' ? 'bg-primary hover:bg-primary/90' : 'bg-secondary hover:bg-secondary/90'}`}
              size="lg"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {data.remaining_portions <= 0 ? 'Elfogyott' : `Kosárba (${getTotalQuantity()} db)`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DailyItemSelector;