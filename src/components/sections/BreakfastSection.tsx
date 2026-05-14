import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/components/ui/use-toast";
import { capitalizeFirst } from "@/lib/utils";
import { Coffee, Clock, ShoppingCart } from "lucide-react";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";

interface BreakfastItem {
  id: string;
  name: string;
  description: string | null;
  price_huf: number;
  image_url: string | null;
  display_order: number;
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
        .select("id, name, description, price_huf, image_url, display_order")
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
    });
    toast({
      title: "Kosárba téve",
      description: `${capitalizeFirst(item.name)} hozzáadva`,
    });
  };

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    variant === "homepage" ? (
      <section className="py-10 md:py-14">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
      </section>
    ) : (
      <div className="space-y-4">{children}</div>
    );

  return (
    <Wrapper>
      <div className="rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5 md:p-7 space-y-5 shadow-lg">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-primary/20 flex items-center justify-center">
              <Coffee className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-sofia font-bold text-foreground leading-tight">
                Reggeli
              </h2>
              <p className="text-sm text-muted-foreground">Friss, házias reggeli ajánlatunk</p>
            </div>
          </div>
          <Badge className="bg-primary text-primary-foreground gap-1.5 px-3 py-1.5 text-xs font-semibold">
            <Clock className="h-3.5 w-3.5" />
            Hétköznap 7 – 10
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
          {items.map((item) => (
            <Card
              key={item.id}
              className="group border-0 bg-card/95 backdrop-blur-sm shadow-md rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
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
                    <div className="w-full h-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <img
                        src={kiscsibeLogo}
                        alt="Kiscsibe"
                        className="h-[60%] w-auto object-contain opacity-70"
                      />
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-2">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                    {capitalizeFirst(item.name)}
                  </h3>
                  {item.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <Badge
                      variant="secondary"
                      className="bg-primary/15 text-primary font-bold text-xs shrink-0"
                    >
                      {item.price_huf} Ft
                    </Badge>
                    <Button
                      onClick={() => handleAdd(item)}
                      size="sm"
                      className="h-8 px-2.5 text-xs"
                    >
                      <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                      Kosárba
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Wrapper>
  );
};

export default BreakfastSection;
