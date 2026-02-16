import { Heart, ShoppingCart, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useFavoriteOrders } from "@/hooks/useFavoriteOrders";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const FavoriteOrdersPanel = () => {
  const { favorites, removeFavorite, validateFavorite } = useFavoriteOrders();
  const { addItem } = useCart();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<string | null>(null);

  if (favorites.length === 0) return null;

  const handleReorder = async (favId: string) => {
    const fav = favorites.find(f => f.id === favId);
    if (!fav) return;

    setLoading(favId);
    try {
      const { valid, unavailable } = await validateFavorite(fav);
      if (!valid) {
        toast({
          title: "Néhány tétel már nem elérhető",
          description: `Nem elérhető: ${unavailable.join(", ")}`,
          variant: "destructive",
        });
        setLoading(null);
        return;
      }

      for (const item of fav.items) {
        addItem({
          id: item.item_id,
          name: item.name,
          price_huf: item.price_huf,
          modifiers: item.modifiers,
          sides: item.sides,
        });
      }

      toast({ title: "Kosárba téve! 🛒", description: "A kedvenc rendelésed betöltöttük." });
      navigate("/checkout");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 rounded-2xl">
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="h-5 w-5 text-red-500 fill-current" />
          <h3 className="font-semibold text-lg">Kedvenc rendeléseid</h3>
        </div>
        <div className="space-y-3">
          {favorites.map(fav => (
            <div key={fav.id} className="flex items-center justify-between gap-3 p-3 bg-background rounded-xl">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{fav.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {fav.items.map(i => i.name).join(", ")}
                </p>
                <p className="text-xs font-semibold text-primary mt-1">{fav.total_huf.toLocaleString()} Ft</p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  onClick={() => handleReorder(fav.id)}
                  disabled={loading === fav.id}
                >
                  <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                  {loading === fav.id ? "..." : "Rendelés"}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => removeFavorite(fav.id)}
                >
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default FavoriteOrdersPanel;
