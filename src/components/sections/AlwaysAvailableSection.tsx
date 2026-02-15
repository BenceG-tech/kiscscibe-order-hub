import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { capitalizeFirst } from "@/lib/utils";
import { ShoppingCart, Package } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";

interface AlwaysAvailableItem {
  id: string;
  name: string;
  description: string | null;
  price_huf: number;
  image_url: string | null;
  allergens: string[] | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  sort: number;
}

interface AlwaysAvailableSectionProps {
  /** Show only featured items (for homepage) */
  featuredOnly?: boolean;
  /** Max items to show (for homepage) */
  maxItems?: number;
  /** Custom title */
  title?: string;
}

const AlwaysAvailableSection = ({ 
  featuredOnly = false, 
  maxItems, 
  title = "Mindig elérhető" 
}: AlwaysAvailableSectionProps) => {
  const { toast } = useToast();
  const { addItem } = useCart();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["always-available-items", featuredOnly],
    queryFn: async () => {
      let query = supabase
        .from("menu_items")
        .select("id, name, description, price_huf, image_url, allergens, category_id")
        .eq("is_active", true)
        .eq("is_always_available", true)
        .order("name");

      if (featuredOnly) {
        query = query.eq("is_featured", true);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as AlwaysAvailableItem[];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["menu-categories-for-always"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("menu_categories")
        .select("id, name, sort")
        .order("sort");
      if (error) throw error;
      return (data || []) as Category[];
    },
  });

  if (isLoading || items.length === 0) return null;

  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  // Group by category
  const grouped = categories
    .map((cat) => ({
      category: cat,
      items: displayItems.filter((item) => item.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

  // Items without category
  const uncategorized = displayItems.filter(
    (item) => !item.category_id || !categories.find((c) => c.id === item.category_id)
  );
  if (uncategorized.length > 0) {
    grouped.push({
      category: { id: "other", name: "Egyéb", sort: 999 },
      items: uncategorized,
    });
  }

  const handleAddToCart = (item: AlwaysAvailableItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price_huf: item.price_huf,
      modifiers: [],
      sides: [],
      image_url: item.image_url || undefined,
    });
    toast({
      title: "Kosárba tetve",
      description: `${capitalizeFirst(item.name)} hozzáadva a kosárhoz`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Package className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">{title}</h3>
      </div>

      {grouped.map((group) => (
        <div key={group.category.id} className="space-y-3">
          {grouped.length > 1 && (
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
              {group.category.name}
            </h4>
          )}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {group.items.map((item) => (
              <Card
                key={item.id}
                className="group border-0 bg-card/95 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <CardContent className="p-0">
                  <div className="aspect-[4/3] overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center">
                        <img
                          src={kiscsibeLogo}
                          alt="Kiscsibe"
                          className="h-[60%] w-auto object-contain opacity-60"
                        />
                      </div>
                    )}
                  </div>
                  <div className="p-3 space-y-2">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="font-semibold text-sm leading-tight">
                        {capitalizeFirst(item.name)}
                      </h4>
                    </div>
                    {item.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2">
                      <Badge
                        variant="secondary"
                        className="shrink-0 bg-primary/10 text-primary font-semibold text-xs"
                      >
                        {item.price_huf} Ft
                      </Badge>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        size="sm"
                        className="h-8 px-3 text-xs"
                      >
                        <ShoppingCart className="h-3 w-3 mr-1" />
                        Kosárba
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default AlwaysAvailableSection;
