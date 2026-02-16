import { Card, CardContent } from "@/components/ui/card";
import { Wheat, Milk, Egg, Nut, Leaf, Fish, Bean, Droplets, Grip, FlaskConical, Flower2, Shell, CircleDot } from "lucide-react";

const AllergenSection = () => {
  const allergens = [
    { icon: Wheat, label: "Glutén", color: "text-orange-600", num: 1 },
    { icon: Shell, label: "Rákfélék", color: "text-red-600", num: 2 },
    { icon: Egg, label: "Tojás", color: "text-yellow-600", num: 3 },
    { icon: Fish, label: "Hal", color: "text-blue-500", num: 4 },
    { icon: CircleDot, label: "Földimogyoró", color: "text-amber-700", num: 5 },
    { icon: Bean, label: "Szója", color: "text-green-700", num: 6 },
    { icon: Milk, label: "Tej (laktóz)", color: "text-blue-600", num: 7 },
    { icon: Nut, label: "Diófélék", color: "text-amber-800", num: 8 },
    { icon: Leaf, label: "Zeller", color: "text-green-600", num: 9 },
    { icon: Droplets, label: "Mustár", color: "text-yellow-700", num: 10 },
    { icon: Grip, label: "Szezámmag", color: "text-stone-600", num: 11 },
    { icon: FlaskConical, label: "Szulfitok", color: "text-purple-600", num: 12 },
    { icon: Flower2, label: "Csillagfürt", color: "text-pink-600", num: 13 },
    { icon: Shell, label: "Puhatestűek", color: "text-teal-600", num: 14 },
  ];

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-center text-foreground mb-6 md:mb-8">
          Allergén jelmagyarázat
        </h2>
        
        <Card className="rounded-2xl shadow-md border-0 bg-card">
          <CardContent className="p-4 md:p-6">
            {/* Mobile: 2 columns */}
            <div className="grid grid-cols-2 gap-3 md:hidden">
              {allergens.map((allergen) => {
                const IconComponent = allergen.icon;
                return (
                  <div key={allergen.num} className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-full bg-muted ${allergen.color} shrink-0`}>
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
            <div className="hidden md:flex flex-wrap justify-center gap-6 md:gap-8">
              {allergens.map((allergen) => {
                const IconComponent = allergen.icon;
                return (
                  <div key={allergen.num} className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-muted ${allergen.color}`}>
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
