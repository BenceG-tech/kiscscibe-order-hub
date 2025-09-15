import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price_huf: number;
  category_id?: string;
  image_url?: string;
  is_temporary?: boolean;
}

interface OfferFormItem {
  id: string;
  isMenuPart: boolean;
  menuRole?: 'leves' | 'főétel';
}

interface MenuItemSelectionProps {
  selectedItems: OfferFormItem[];
  onUpdateItemMenuSettings: (itemId: string, isMenuPart: boolean, menuRole?: 'leves' | 'főétel') => void;
  onRemoveOfferItem: (itemId: string) => void;
  availableItems: MenuItem[];
}

export const MenuItemSelection: React.FC<MenuItemSelectionProps> = ({
  selectedItems,
  onUpdateItemMenuSettings,
  onRemoveOfferItem,
  availableItems
}) => {
  if (selectedItems.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Válasszon ételeket az ajánlathoz
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-medium text-sm text-muted-foreground mb-2">KIVÁLASZTOTT ÉTELEK</h4>
      <div className="space-y-2">
        {selectedItems.map(selectedItem => {
          const item = availableItems.find(i => i.id === selectedItem.id);
          if (!item) return null;

          return (
            <div
              key={item.id}
              className="p-3 border rounded-lg bg-primary/5 border-primary/20"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-medium text-sm">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.price_huf} Ft</div>
                  {item.is_temporary && (
                    <Badge variant="secondary" className="mt-1 text-xs">Ideiglenes</Badge>
                  )}
                </div>
                
                <div className="flex items-center gap-4 ml-4">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id={`menu-${item.id}`}
                      checked={selectedItem.isMenuPart}
                      onCheckedChange={(checked) => 
                        onUpdateItemMenuSettings(item.id, !!checked, selectedItem.menuRole)
                      }
                    />
                    <Label htmlFor={`menu-${item.id}`} className="text-xs">
                      Menü része
                    </Label>
                  </div>
                  
                  {selectedItem.isMenuPart && (
                    <Select
                      value={selectedItem.menuRole || ''}
                      onValueChange={(value) => 
                        onUpdateItemMenuSettings(item.id, true, value as 'leves' | 'főétel')
                      }
                    >
                      <SelectTrigger className="w-24 h-8">
                        <SelectValue placeholder="Szerep" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="leves">Leves</SelectItem>
                        <SelectItem value="főétel">Főétel</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-destructive/10"
                    onClick={() => onRemoveOfferItem(item.id)}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};