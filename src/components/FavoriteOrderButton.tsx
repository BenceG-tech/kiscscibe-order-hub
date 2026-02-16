import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavoriteOrders, FavoriteOrderItem } from "@/hooks/useFavoriteOrders";
import { useToast } from "@/components/ui/use-toast";
import { useState } from "react";

interface Props {
  orderName: string;
  items: FavoriteOrderItem[];
  totalHuf: number;
}

const FavoriteOrderButton = ({ orderName, items, totalHuf }: Props) => {
  const { saveFavorite } = useFavoriteOrders();
  const { toast } = useToast();
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    saveFavorite({ name: orderName, items, total_huf: totalHuf });
    setSaved(true);
    toast({
      title: "Kedvencekhez mentve! ❤️",
      description: "Legközelebb egy kattintással újrarendelheted.",
    });
  };

  return (
    <Button
      variant={saved ? "secondary" : "outline"}
      onClick={handleSave}
      disabled={saved}
      className="flex-1"
    >
      <Heart className={`mr-2 h-4 w-4 ${saved ? "fill-current text-red-500" : ""}`} />
      {saved ? "Elmentve" : "Mentés kedvencnek"}
    </Button>
  );
};

export default FavoriteOrderButton;
