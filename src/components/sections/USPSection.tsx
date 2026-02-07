import { Card, CardContent } from "@/components/ui/card";
import { Heart, Clock, Users, Banknote } from "lucide-react";

const USPSection = () => {
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
    <section className="py-8 md:py-20">
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
        
        {/* Mobile: horizontal snap-scroll ribbon */}
        <div className="md:hidden flex overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-4 px-4 gap-4 pb-2">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={index} 
                className="min-w-[260px] snap-center rounded-3xl shadow-soft border-0 bg-card text-center flex-shrink-0"
              >
                <CardContent className="p-5">
                  <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-2xl shadow-soft mb-4">
                    <IconComponent className="h-7 w-7 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2 font-sofia">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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
                className="rounded-3xl shadow-soft border-0 bg-card text-center hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-6 md:p-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary/20 to-warmth/20 rounded-2xl shadow-soft mb-5">
                    <IconComponent className="h-8 w-8 text-primary" strokeWidth={1.5} />
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
