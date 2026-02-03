import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface MenuPartToggleProps {
  offerItemId: string;
  isMenuPart: boolean;
  menuRole: string | null;
  categoryName: string;
  onToggle: (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => void;
}

export function MenuPartToggle({
  offerItemId,
  isMenuPart,
  menuRole,
  categoryName,
  onToggle,
}: MenuPartToggleProps) {
  // Determine which role this category should default to
  const isSoupCategory = categoryName.toLowerCase().includes("leves");
  
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isMenuPart) {
      // Turn on: default to appropriate role based on category
      const defaultRole = isSoupCategory ? "leves" : "főétel";
      onToggle(offerItemId, true, defaultRole);
    } else if (menuRole === "leves") {
      // Leves -> Főétel
      onToggle(offerItemId, true, "főétel");
    } else {
      // Főétel -> Off
      onToggle(offerItemId, false, null);
    }
  };

  const getButtonStyle = () => {
    if (!isMenuPart) {
      return "bg-muted text-muted-foreground hover:bg-muted/80 border border-dashed";
    }
    if (menuRole === "leves") {
      return "bg-orange-500 text-white hover:bg-orange-600 border-orange-500";
    }
    return "bg-green-500 text-white hover:bg-green-600 border-green-500";
  };

  const getLabel = () => {
    if (!isMenuPart) return "M";
    if (menuRole === "leves") return "L";
    return "F";
  };

  const getTooltip = () => {
    if (!isMenuPart) return "Kattints a menühöz adáshoz";
    if (menuRole === "leves") return "Leves - kattints a főételre váltáshoz";
    return "Főétel - kattints a menüből eltávolításhoz";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-5 w-5 shrink-0 text-[10px] font-bold p-0",
            getButtonStyle()
          )}
          onClick={handleClick}
        >
          {getLabel()}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top" className="text-xs">
        {getTooltip()}
      </TooltipContent>
    </Tooltip>
  );
}
