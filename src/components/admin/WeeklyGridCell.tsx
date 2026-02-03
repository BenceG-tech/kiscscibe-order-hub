import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
}

interface SelectedItem {
  itemId: string;
  itemName: string;
  offerId: string;
  offerItemId: string;
}

interface WeeklyGridCellProps {
  date: string;
  categoryId: string;
  categoryName: string;
  items: MenuItem[];
  selectedItem?: SelectedItem;
  onSelect: (itemId: string) => void;
  onRemove: () => void;
}

export function WeeklyGridCell({
  date,
  categoryId,
  categoryName,
  items,
  selectedItem,
  onSelect,
  onRemove,
}: WeeklyGridCellProps) {
  const [open, setOpen] = useState(false);

  const handleSelect = (itemId: string) => {
    onSelect(itemId);
    setOpen(false);
  };

  if (selectedItem) {
    return (
      <div className="flex items-center gap-1 p-1 bg-background rounded border min-h-[36px]">
        <span className="flex-1 text-xs font-medium truncate px-1" title={selectedItem.itemName}>
          {selectedItem.itemName}
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 hover:bg-destructive/10 hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-9 text-xs font-normal text-muted-foreground hover:text-foreground"
        >
          <span className="truncate">Válassz...</span>
          <ChevronDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Keresés: ${categoryName}...`} className="h-9" />
          <CommandList>
            <CommandEmpty>Nincs találat.</CommandEmpty>
            <CommandGroup>
              {items.map((item) => (
                <CommandItem
                  key={item.id}
                  value={item.name}
                  onSelect={() => handleSelect(item.id)}
                  className="text-sm"
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedItem?.itemId === item.id ? "opacity-100" : "opacity-0"
                    )}
                  />
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
  );
}
