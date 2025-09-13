import { Card, CardContent } from "@/components/ui/card";
import { Wheat, Milk, Egg, Nut, Leaf } from "lucide-react";

const AllergenSection = () => {
  const allergens = [
    {
      icon: Wheat,
      label: "Glutén",
      color: "text-orange-600"
    },
    {
      icon: Milk,
      label: "Laktóz", 
      color: "text-blue-600"
    },
    {
      icon: Egg,
      label: "Tojás",
      color: "text-yellow-600"
    },
    {
      icon: Nut,
      label: "Diófélék",
      color: "text-amber-700"
    },
    {
      icon: Leaf,
      label: "Vegetáriánus",
      color: "text-green-600"
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Allergén jelmagyarázat
        </h2>
        
        <Card className="rounded-2xl shadow-md border-0 bg-card">
          <CardContent className="p-6">
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              {allergens.map((allergen, index) => {
                const IconComponent = allergen.icon;
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className={`p-2 rounded-full bg-gray-100 ${allergen.color}`}>
                      <IconComponent className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="text-foreground font-medium">{allergen.label}</span>
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