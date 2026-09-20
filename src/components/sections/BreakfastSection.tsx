import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { capitalizeFirst } from "@/lib/utils";
import { Coffee, Clock } from "lucide-react";
import { PortionBadge } from "@/components/PortionBadge";
import FoodCard from "@/components/FoodCard";

interface BreakfastItem {
  id: string;
  name: string;
  description: string | null;
  price_huf: number;
  image_url: string | null;
  display_order: number;
  portion_size: number | null;
  portion_unit: string | null;
}

interface BreakfastSectionProps {
  variant?: "page" | "homepage";
}

const BreakfastSection = ({ variant = "page" }: BreakfastSectionProps) => {
  const { toast } = useToast();
  const { addItem } = useCart();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["breakfast-items"],
    queryFn: async () => {
      const { data: cat } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("name", "Reggeli")
        .maybeSingle();
      if (!cat?.id) return [] as BreakfastItem[];

      const { data, error } = await supabase
        .from("menu_items")
        .select("id, name, description, price_huf, image_url, display_order, portion_size, portion_unit")
        .eq("is_active", true)
        .eq("is_always_available", true)
        .eq("category_id", cat.id)
        .order("display_order")
        .order("name");
      if (error) throw error;
      return (data || []) as BreakfastItem[];
    },
  });

  if (isLoading || items.length === 0) return null;

  const handleAdd = (item: BreakfastItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price_huf: item.price_huf,
      modifiers: [],
      sides: [],
      image_url: item.image_url || undefined,
      is_breakfast: true,
    });
    toast({
      title: "Kosárba téve",
      description: `${capitalizeFirst(item.name)} hozzáadva`,
    });
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    variant === "homepage" ? (
      <section className="py-6 md:py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    ) : (
      <div className="space-y-3">{children}</div>
    );

  return (
    <Wrapper>
      <div className="border-y border-foreground/20 py-4 md:py-6">
      <div className="space-y-4 md:space-y-5">
        {/* Compact header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-warm">
              <Coffee className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-sofia font-bold text-foreground leading-tight">
                Reggeli
              </h2>
              <p className="hidden sm:block text-xs text-muted-foreground">
                Friss, házias reggeli ajánlatunk
              </p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground gap-1 px-3 py-1.5 text-[11px] font-bold">
            <Clock className="h-3 w-3" />
            H–P 7–10
          </Badge>
        </div>

        <div className="grid grid-cols-1 items-stretch gap-3 sm:grid-cols-2">
          {items.map((item) => (
            <FoodCard
              key={item.id}
              name={capitalizeFirst(item.name)}
              description={item.description}
              priceHuf={item.price_huf}
              imageUrl={item.image_url}
              onAdd={() => handleAdd(item)}
              meta={<PortionBadge size={item.portion_size} unit={item.portion_unit} />}
              variant="compact"
            />
          ))}
        </div>
      </div>
      </div>
    </Wrapper>
  );
};

export default BreakfastSection;
