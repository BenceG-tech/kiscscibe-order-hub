import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, ImageIcon, Pencil, Ban } from "lucide-react";
import { cn, normalizeText } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { QuickImageUpload } from "./QuickImageUpload";
import { QuickPriceEdit } from "./QuickPriceEdit";
import { MenuPartToggle } from "./MenuPartToggle";
import { MenuItemEditDialog } from "./MenuItemEditDialog";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
  image_url?: string | null;
  category_id?: string | null;
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
  isSoldOut?: boolean;
}

interface WeeklyGridCellProps {
  date: string;
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
  /** All menu items (any category) so search is not limited to this row */
  allItems?: MenuItem[];
  /** Map of categoryId -> category name, used to label cross-category hits */
  categoryNames?: Record<string, string>;
  selectedItems: SelectedItem[];
  onAddItem: (itemId: string) => void;
  onRemoveItem: (offerItemId: string) => void;
  onImageUpdated?: () => void;
  onPriceChange?: (itemId: string, newPrice: number) => void;
  onMenuPartToggle?: (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => void;
  onItemEdit?: (itemId: string) => void;
}

export function WeeklyGridCell({
  categoryId,
  categoryName,
  items,
  allItems,
  categoryNames,
  selectedItems,
  onAddItem,
  onRemoveItem,
  onImageUpdated,
  onPriceChange,
  onMenuPartToggle,
  onItemEdit,
}: WeeklyGridCellProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);


  const handleSelect = (itemId: string) => {
    onAddItem(itemId);
    setQuery("");
    setOpen(false);
  };


  const handleEditClick = (itemId: string) => {
    setEditingItemId(itemId);
    setEditDialogOpen(true);
  };

  const handleEditSaved = () => {
    onImageUpdated?.();
  };

  const handleToggleSoldOut = async (offerItemId: string, currentSoldOut: boolean) => {
    try {
      const { error } = await supabase
        .from("daily_offer_items")
        .update({ is_sold_out: !currentSoldOut } as any)
        .eq("id", offerItemId);
      if (error) throw error;
      toast.success(!currentSoldOut ? "Elfogyottnak jelölve" : "Újra elérhető");
      onImageUpdated?.(); // triggers refetch
    } catch (err) {
      console.error("Error toggling sold out:", err);
      toast.error("Hiba történt");
    }
  };

  // Filter out already selected items from the dropdown
  const availableItems = items.filter(
    item => !selectedItems.some(sel => sel.itemId === item.id)
  );

  // When searching, look through ALL items (any category), not just this row's category
  const searchPool = allItems && allItems.length > 0 ? allItems : items;

  const visibleItems = useMemo(() => {
    const q = normalizeText(query.trim());
    if (!q) return availableItems.slice(0, 100);
    return searchPool
      .filter(item => !selectedItems.some(sel => sel.itemId === item.id))
      .filter(item => normalizeText(item.name || "").includes(q))
      .sort((a, b) => {
        // Items from this row's category first
        const aOwn = a.category_id === categoryId ? 0 : 1;
        const bOwn = b.category_id === categoryId ? 0 : 1;
        if (aOwn !== bOwn) return aOwn - bOwn;
        return (a.name || "").localeCompare(b.name || "", "hu");
      })
      .slice(0, 100);
  }, [query, availableItems, searchPool, selectedItems, categoryId]);



  return (
    <div className="space-y-1 min-h-[36px]">
      {/* Selected Items List */}
      {selectedItems.map((selectedItem) => (
        <div
          key={selectedItem.offerItemId}
          className={cn(
            "flex items-center gap-1 p-1 rounded border group",
            selectedItem.isSoldOut ? "bg-destructive/10 border-destructive/30 opacity-60" : "bg-background"
          )}
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
          
          <span className={cn("flex-1 text-xs font-medium truncate", selectedItem.isSoldOut && "line-through")} title={selectedItem.itemName}>
            {selectedItem.itemName}
          </span>
          
          {/* Sold Out Toggle */}
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-5 w-5 shrink-0",
              selectedItem.isSoldOut 
                ? "text-destructive opacity-100 hover:bg-destructive/10" 
                : "opacity-40 hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
            )}
            onClick={(e) => {
              e.stopPropagation();
              handleToggleSoldOut(selectedItem.offerItemId, !!selectedItem.isSoldOut);
            }}
            title={selectedItem.isSoldOut ? "Újra elérhetővé tesz" : "Elfogyottnak jelöl"}
          >
            <Ban className="h-3 w-3" />
          </Button>
          
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
        <PopoverContent className="w-[320px] p-0" align="start">
          <Command shouldFilter={false}>
            <CommandInput
              placeholder="Keresés az összes ételben..."
              className="h-9"
              value={query}
              onValueChange={setQuery}
            />
            <CommandList>
              <CommandEmpty>Nincs találat.</CommandEmpty>
              <CommandGroup
                heading={query ? `Találatok (${visibleItems.length})` : categoryName}
              >
                {visibleItems.map((item) => {
                  const otherCategory =
                    item.category_id && item.category_id !== categoryId
                      ? categoryNames?.[item.category_id]
                      : null;
                  return (
                    <CommandItem
                      key={item.id}
                      value={item.id}
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
                      <span className="flex-1 min-w-0">
                        <span className="block truncate">{item.name}</span>
                        {otherCategory && (
                          <span className="block text-[10px] text-muted-foreground truncate">
                            {otherCategory}
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {item.price_huf} Ft
                      </span>
                    </CommandItem>
                  );
                })}
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
