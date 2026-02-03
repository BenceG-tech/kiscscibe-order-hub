import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Coins, Check, X } from "lucide-react";

interface QuickPriceEditProps {
  itemId: string;
  itemName: string;
  currentPrice: number;
  onPriceChange: (itemId: string, newPrice: number) => void;
}

export function QuickPriceEdit({
  itemId,
  itemName,
  currentPrice,
  onPriceChange,
}: QuickPriceEditProps) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState(currentPrice.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPrice(currentPrice.toString());
  }, [currentPrice]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  const handleSave = () => {
    const numPrice = parseInt(price, 10);
    if (!isNaN(numPrice) && numPrice > 0 && numPrice !== currentPrice) {
      onPriceChange(itemId, numPrice);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    setPrice(currentPrice.toString());
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-5 px-1.5 text-xs text-muted-foreground hover:text-foreground shrink-0"
          title={`Ár szerkesztése: ${itemName}`}
        >
          <Coins className="h-3 w-3 mr-0.5" />
          {currentPrice} Ft
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2" align="start">
        <div className="space-y-2">
          <p className="text-xs font-medium truncate" title={itemName}>
            {itemName}
          </p>
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onKeyDown={handleKeyDown}
              className="h-8 text-sm"
              min={1}
              placeholder="Ár"
            />
            <span className="text-xs text-muted-foreground">Ft</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              size="sm"
              className="h-7 flex-1 text-xs"
              onClick={handleSave}
            >
              <Check className="h-3 w-3 mr-1" />
              Mentés
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs"
              onClick={handleCancel}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
