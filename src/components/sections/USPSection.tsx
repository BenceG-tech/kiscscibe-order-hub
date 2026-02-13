import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, Users, Banknote } from "lucide-react";
import { useScrollFadeIn } from "@/hooks/useScrollFadeIn";
import { cn } from "@/lib/utils";

const USPSection = () => {
  const { ref, isVisible } = useScrollFadeIn();

  const features = [
    {
      icon: Heart,
      title: "Házias ízek",
      description: "Minden ételt szeretettel, hagyományos receptek alapján készítünk"
    },
    {
      icon: Clock,
      title: "Gyors kiszolgálás", 
      description: "15-25 perces átfutási idő, hogy ne késs el semmilyen programból"
    },
    {
      icon: Users,
      title: "Nagy adagok",
      description: "Kiadós porciók, amelyek biztosan jóllaknak"
    },
    {
      icon: Banknote,
      title: "Kedvező árak",
      description: "Minőségi ételek megfizethető áron"
    }
  ];

  return (
    <section className="py-8 md:py-20" ref={ref}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="text-center mb-6 md:mb-12">
          <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Miért minket válassz?
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mt-2 font-sofia">
            Értékeink
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto mt-3 md:mt-4 rounded-full" />
        </div>
        
        {/* Mobile: compact 2x2 grid */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className={cn(
                  "rounded-2xl shadow-soft border-0 bg-card text-center glow-border",
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
                )}
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-4">
                  <div className="relative inline-flex items-center justify-center w-10 h-10 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-xl shadow-soft mb-2 group">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/30 to-warmth/30 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity" />
                    <IconComponent className="h-5 w-5 text-primary relative z-10 transition-transform duration-300 group-hover:scale-110" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-base mb-1 font-sofia">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className={cn(
                  "rounded-3xl shadow-soft border-0 bg-card text-center glow-border group cursor-default",
                  "transition-all duration-500",
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                )}
                style={{ transitionDelay: `${index * 150}ms` }}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="relative inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-2xl shadow-soft mb-5 overflow-hidden">
                    <div className="absolute inset-0 rounded-2xl bg-gradient-conic from-primary/40 via-transparent to-primary/40 animate-spin-slow opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <IconComponent className="h-8 w-8 text-primary relative z-10 transition-transform duration-300 group-hover:scale-125" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-xl mb-3 font-sofia">{feature.title}</h3>
                  <p className="text-muted-foreground text-base leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default USPSection;
