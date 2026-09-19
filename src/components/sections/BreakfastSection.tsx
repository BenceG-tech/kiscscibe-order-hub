import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { capitalizeFirst } from "@/lib/utils";
import { Coffee, Clock, Plus } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
import { PortionBadge } from "@/components/PortionBadge";

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
      <div className="border-y border-foreground/20 py-5 md:py-7">
      <div className="space-y-6">
        {/* Compact header */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="h-11 w-11 bg-accent text-accent-foreground flex items-center justify-center">
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

        {/* Compact horizontal list */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {items.map((item) => (
            <div
              key={item.id}
               className="group grid grid-cols-[5.5rem_1fr_auto] items-center gap-3 overflow-hidden border-t border-foreground/20 bg-transparent py-3 transition-colors duration-300 hover:bg-secondary/40"
            >
              {/* Small image */}
               <div className="h-24 w-[5.5rem] shrink-0 overflow-hidden bg-muted">
                {item.image_url ? (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/5">
                    <img
                      src={kiscsibeLogo}
                      alt="Kiscsibe"
                      className="h-[60%] w-auto object-contain opacity-70"
                    />
                  </div>
                )}
              </div>

              {/* Name + description */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-tight truncate flex items-center gap-1.5">
                  <span className="truncate">{capitalizeFirst(item.name)}</span>
                  <PortionBadge size={item.portion_size} unit={item.portion_unit} />
                </h3>
                {item.description && (
                  <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                )}
                <p className="text-sm font-bold text-accent mt-1">
                  {item.price_huf} Ft
                </p>
              </div>

              {/* Icon-only add button */}
              <Button
                onClick={() => handleAdd(item)}
                size="icon"
                 className="mr-2 h-11 w-11 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
                aria-label={`${item.name} kosárba`}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      </div>
    </Wrapper>
  );
};

export default BreakfastSection;
