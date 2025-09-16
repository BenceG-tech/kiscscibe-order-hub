import { Badge } from "@/components/ui/badge";
import { UtensilsCrossed } from "lucide-react";

const SideSelectionBadge = () => {
  return (
    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
      <UtensilsCrossed className="h-3 w-3" />
      Köret
    </Badge>
  );
};

export default SideSelectionBadge;