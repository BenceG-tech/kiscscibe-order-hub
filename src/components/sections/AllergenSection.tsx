import { Card, CardContent } from "@/components/ui/card";
import { Wheat, Milk, Egg, Nut, Leaf, Fish, Bean, Droplets, Grip, FlaskConical, Flower2, Shell, CircleDot } from "lucide-react";

const AllergenSection = () => {
  const allergens = [
    { icon: Wheat, label: "Glutén", num: 1 },
    { icon: Shell, label: "Rákfélék", num: 2 },
    { icon: Egg, label: "Tojás", num: 3 },
    { icon: Fish, label: "Hal", num: 4 },
    { icon: CircleDot, label: "Földimogyoró", num: 5 },
    { icon: Bean, label: "Szója", num: 6 },
    { icon: Milk, label: "Tej (laktóz)", num: 7 },
    { icon: Nut, label: "Diófélék", num: 8 },
    { icon: Leaf, label: "Zeller", num: 9 },
    { icon: Droplets, label: "Mustár", num: 10 },
    { icon: Grip, label: "Szezámmag", num: 11 },
    { icon: FlaskConical, label: "Szulfitok", num: 12 },
    { icon: Flower2, label: "Csillagfürt", num: 13 },
    { icon: Shell, label: "Puhatestűek", num: 14 },
  ];

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="section-kicker">Biztonságos választás</span>
        <h2 className="section-title mb-6 md:mb-8">Allergén jelmagyarázat</h2>
        
         <Card className="border-y border-border/60 bg-transparent shadow-none">
          <CardContent className="p-4 md:p-6">
            {/* Mobile: 2 columns */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {allergens.map((allergen) => {
                const IconComponent = allergen.icon;
                return (
                  <div key={allergen.num} className="flex items-center gap-2">
                     <div className="p-1.5 bg-primary/10 text-primary shrink-0">
                      <IconComponent className="h-4 w-4" strokeWidth={2} />
                    </div>
                    <span className="text-foreground font-medium text-xs">
                      {allergen.num}. {allergen.label}
                    </span>
                  </div>
                );
              })}
            </div>
            {/* Desktop: flex wrap */}
             <div className="hidden md:grid grid-cols-4 gap-6 lg:grid-cols-7">
              {allergens.map((allergen) => {
                const IconComponent = allergen.icon;
                return (
                  <div key={allergen.num} className="flex items-center gap-3">
                     <div className="p-2 bg-primary/10 text-primary">
                      <IconComponent className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-foreground font-medium">
                      {allergen.num}. {allergen.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default AllergenSection;
