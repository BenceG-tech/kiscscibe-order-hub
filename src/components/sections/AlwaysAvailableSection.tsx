import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { capitalizeFirst } from "@/lib/utils";
import { ShoppingCart, Package, Plus } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";

interface AlwaysAvailableItem {
  id: string;
  name: string;
  description: string | null;
  price_huf: number;
  image_url: string | null;
  allergens: string[] | null;
  category_id: string | null;
  display_order: number;
}

interface Category {
  id: string;
  name: string;
  sort: number;
}

type DisplaySettings = Record<string, { showImages: boolean }>;

interface AlwaysAvailableSectionProps {
  featuredOnly?: boolean;
  maxItems?: number;
  title?: string;
  excludeCategoryNames?: string[];
}

const AlwaysAvailableSection = ({
  featuredOnly = false,
  maxItems,
  title = "Mindig elérhető",
  excludeCategoryNames = [],
}: AlwaysAvailableSectionProps) => {
  const { toast } = useToast();
  const { addItem } = useCart();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["always-available-items", featuredOnly],
    queryFn: async () => {
      let query = supabase
        .from("menu_items")
        .select("id, name, description, price_huf, image_url, allergens, category_id, display_order")
        .eq("is_active", true)
        .eq("is_always_available", true)
        .order("display_order")
        .order("name");

      if (featuredOnly) query = query.eq("is_featured", true);

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

  const { data: displaySettings = {} } = useQuery({
    queryKey: ["always-available-display-settings"],
    queryFn: async () => {
      const { data } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "always_available_display")
        .maybeSingle();
      return (data?.value_json as DisplaySettings) || {};
    },
  });

  if (isLoading || items.length === 0) return null;

  const displayItems = maxItems ? items.slice(0, maxItems) : items;

  const excludeSet = new Set(excludeCategoryNames.map((n) => n.toLowerCase()));
  const grouped = categories
    .filter((cat) => !excludeSet.has(cat.name.toLowerCase()))
    .map((cat) => ({
      category: cat,
      items: displayItems.filter((item) => item.category_id === cat.id),
    }))
    .filter((g) => g.items.length > 0);

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

      {grouped.map((group) => {
        const showImages = displaySettings[group.category.id]?.showImages !== false; // default ON

        return (
          <div key={group.category.id} className="space-y-3">
            {grouped.length > 1 && (
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.category.name}
                </h4>
                {group.category.name.toLowerCase() === "reggeli" && (
                  <p className="text-xs text-primary/90 font-medium">
                    Hétköznap 7 – 10 óra között elérhető
                  </p>
                )}
              </div>
            )}

            {showImages ? (
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
                        <h4 className="font-semibold text-sm leading-tight">
                          {capitalizeFirst(item.name)}
                        </h4>
                        {item.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                        )}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <Badge variant="secondary" className="self-start shrink-0 bg-primary/10 text-primary font-semibold text-xs">
                            {item.price_huf} Ft
                          </Badge>
                          <Button onClick={() => handleAddToCart(item)} size="sm" className="h-8 px-2 text-xs w-full sm:w-auto min-w-0">
                            <ShoppingCart className="h-3 w-3 mr-1 shrink-0" />
                            <span className="truncate">Kosárba</span>
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border/50 bg-card/95 backdrop-blur-sm divide-y divide-border/40 overflow-hidden">
                {group.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-sm leading-tight truncate">
                        {capitalizeFirst(item.name)}
                      </div>
                      {item.description && (
                        <div className="text-xs text-muted-foreground truncate">{item.description}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-sm font-semibold text-primary tabular-nums">{item.price_huf} Ft</span>
                      <Button
                        onClick={() => handleAddToCart(item)}
                        size="sm"
                        variant="outline"
                        className="h-8 w-8 p-0"
                        aria-label="Kosárba"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AlwaysAvailableSection;
