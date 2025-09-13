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
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card key={index} className="rounded-2xl shadow-soft border-0 bg-card text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-4">
                    <IconComponent className="h-6 w-6 text-primary" strokeWidth={1.5} />
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{feature.description}</p>
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