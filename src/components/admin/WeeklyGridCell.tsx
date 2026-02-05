import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, ImageIcon, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { QuickImageUpload } from "./QuickImageUpload";
import { QuickPriceEdit } from "./QuickPriceEdit";
import { MenuPartToggle } from "./MenuPartToggle";
import { MenuItemEditDialog } from "./MenuItemEditDialog";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
  image_url?: string | null;
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  offerId: string;
  offerItemId: string;
  imageUrl?: string | null;
  price?: number;
  isMenuPart: boolean;
  menuRole?: string | null;
}

interface WeeklyGridCellProps {
  date: string;
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
  selectedItems: SelectedItem[];
  onAddItem: (itemId: string) => void;
  onRemoveItem: (offerItemId: string) => void;
  onImageUpdated?: () => void;
  onPriceChange?: (itemId: string, newPrice: number) => void;
  onMenuPartToggle?: (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => void;
  onItemEdit?: (itemId: string) => void;
}

export function WeeklyGridCell({
  categoryName,
  items,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onImageUpdated,
  onPriceChange,
  onMenuPartToggle,
  onItemEdit,
}: WeeklyGridCellProps) {
  const [open, setOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const handleSelect = (itemId: string) => {
    onAddItem(itemId);
    setOpen(false);
  };

  const handleEditClick = (itemId: string) => {
    setEditingItemId(itemId);
    setEditDialogOpen(true);
  };

  const handleEditSaved = () => {
    onImageUpdated?.();
  };

  // Filter out already selected items from the dropdown
  const availableItems = items.filter(
    item => !selectedItems.some(sel => sel.itemId === item.id)
  );

  return (
    <div className="space-y-1 min-h-[36px]">
      {/* Selected Items List */}
      {selectedItems.map((selectedItem) => (
        <div
          key={selectedItem.offerItemId}
          className="flex items-center gap-1 p-1 bg-background rounded border group"
        >
          {/* Image Thumbnail */}
          {selectedItem.imageUrl ? (
            <img
              src={selectedItem.imageUrl}
              alt=""
              className="h-6 w-6 rounded object-cover shrink-0"
            />
          ) : (
            <div className="h-6 w-6 rounded bg-muted flex items-center justify-center shrink-0">
              <ImageIcon className="h-3 w-3 text-muted-foreground" />
            </div>
          )}
          
          <span className="flex-1 text-xs font-medium truncate" title={selectedItem.itemName}>
            {selectedItem.itemName}
          </span>
          
          {/* Menu Part Toggle */}
          {onMenuPartToggle && (
            <MenuPartToggle
              offerItemId={selectedItem.offerItemId}
              isMenuPart={selectedItem.isMenuPart}
              menuRole={selectedItem.menuRole ?? null}
              categoryName={categoryName}
              onToggle={onMenuPartToggle}
            />
          )}
          
          {/* Edit Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100 hover:bg-primary/10 hover:text-primary"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(selectedItem.itemId);
            }}
            title="Szerkesztés"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          
          {/* Quick Price Edit */}
          {onPriceChange && selectedItem.price !== undefined && (
            <QuickPriceEdit
              itemId={selectedItem.itemId}
              itemName={selectedItem.itemName}
              currentPrice={selectedItem.price}
              onPriceChange={onPriceChange}
            />
          )}
          
          {/* Quick Image Upload */}
          <QuickImageUpload
            itemId={selectedItem.itemId}
            itemName={selectedItem.itemName}
            currentImageUrl={selectedItem.imageUrl || null}
            onImageUploaded={() => onImageUpdated?.()}
          />
          
          {/* Remove Button */}
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              onRemoveItem(selectedItem.offerItemId);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Add Item Button */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-full justify-start h-7 text-xs text-muted-foreground hover:text-foreground",
              selectedItems.length === 0 && "border border-dashed"
            )}
          >
            <Plus className="h-3 w-3 mr-1" />
            {selectedItems.length === 0 ? "Válassz..." : "Hozzáadás"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder={`Keresés: ${categoryName}...`} className="h-9" />
            <CommandList>
              <CommandEmpty>Nincs találat.</CommandEmpty>
              <CommandGroup>
                {availableItems.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => handleSelect(item.id)}
                    className="text-sm"
                  >
                    {item.image_url && (
                      <img
                        src={item.image_url}
                        alt=""
                        className="h-6 w-6 rounded object-cover mr-2 shrink-0"
                      />
                    )}
                    <span className="flex-1 truncate">{item.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {item.price_huf} Ft
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Edit Dialog */}
      <MenuItemEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        itemId={editingItemId}
        onSaved={handleEditSaved}
      />
    </div>
  );
}
