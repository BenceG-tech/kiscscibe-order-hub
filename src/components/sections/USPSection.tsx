import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, Users, Banknote, Star, Leaf, Award, Coffee, Utensils, MapPin, ThumbsUp, ChefHat, CalendarDays, type LucideIcon } from "lucide-react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const ICON_MAP: Record<string, LucideIcon> = {
  Heart, Clock, Users, Banknote, Star, Leaf, Award, Coffee,
  Utensils, MapPin, ThumbsUp, ChefHat, CalendarDays,
};

const DEFAULT_FEATURES = [
  { icon: "Heart", title: "Házias ízek", description: "Minden ételt szeretettel, hagyományos receptek alapján készítünk" },
  { icon: "Clock", title: "Gyors kiszolgálás", description: "15-25 perces átfutási idő, hogy ne késs el semmilyen programból" },
  { icon: "Users", title: "Nagy adagok", description: "Kiadós porciók, amelyek biztosan jóllaknak" },
  { icon: "Banknote", title: "Kedvező árak", description: "Minőségi ételek megfizethető áron" },
];

const USPSection = () => {
  const { ref, isVisible } = useScrollFadeIn();

  const { data: dbValues } = useQuery({
    queryKey: ["usp-values"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "about_page")
        .maybeSingle();
      if (error) throw error;
      const content = data?.value_json as any;
      return content?.values as { id?: string; icon: string; title: string; description: string }[] | undefined;
    },
    staleTime: 5 * 60 * 1000,
  });

  const features = (dbValues && dbValues.length > 0 ? dbValues : DEFAULT_FEATURES).map(f => ({
    ...f,
    IconComponent: ICON_MAP[f.icon] || Heart,
  }));

  return (
    <section className="py-8 text-editorial-foreground md:py-20" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-8 md:mb-12">
          <span className="section-kicker">
            Miért minket válassz?
          </span>
          <h2 className="mt-3 max-w-2xl font-sofia text-3xl font-bold leading-tight text-editorial-foreground md:text-5xl">
            Házias étel. Egyenes válasz.
          </h2>
        </div>
        
        {/* Mobile: compact 2x2 grid */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {features.map((feature, index) => (
            <Card 
              key={index} 
               className={cn(
                 "border border-editorial-foreground/10 bg-editorial-foreground/5 text-left",
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
              )}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-4">
                <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-xl shadow-soft mb-2 group">
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-warmth/30 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />
                  <feature.IconComponent className="h-5 w-5 text-primary relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                </div>
                 <h3 className="font-bold text-editorial-foreground text-base mb-1 font-sofia">{feature.title}</h3>
                 <p className="text-editorial-muted text-xs leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className={cn(
                 "group cursor-default border-l border-editorial-foreground/15 bg-transparent text-left",
                "transition-all duration-500",
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              )}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
               <CardContent className="p-6 md:p-8">
                <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-2xl shadow-soft mb-5 overflow-hidden">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-conic from-primary/40 via-transparent to-primary/40 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <feature.IconComponent className="h-8 w-8 text-primary relative z-10 transition-transform duration-300 group-hover:scale-125" strokeWidth={1.5} />
                </div>
                 <h3 className="font-bold text-editorial-foreground text-xl mb-3 font-sofia">{feature.title}</h3>
                 <p className="text-editorial-muted text-base leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default USPSection;
