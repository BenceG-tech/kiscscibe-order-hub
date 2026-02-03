import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DailyPriceInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  isPending?: boolean;
  className?: string;
}

export function DailyPriceInput({ 
  value, 
  onChange, 
  isPending = false,
  className 
}: DailyPriceInputProps) {
  const [localValue, setLocalValue] = useState(value?.toString() || "");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value?.toString() || "");
    }
  }, [value, isFocused]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    const numValue = parseInt(localValue, 10);
    if (!isNaN(numValue) && numValue > 0) {
      if (numValue !== value) {
        onChange(numValue);
      }
    } else if (localValue === "" && value !== null) {
      onChange(null);
    }
  }, [localValue, value, onChange]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        type="number"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Ár"
        className={cn(
          "h-8 w-full text-center text-sm pr-6",
          isPending && "opacity-50"
        )}
        min={0}
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
        Ft
      </span>
    </div>
  );
}
