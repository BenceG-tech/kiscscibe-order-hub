import { Card, CardContent } from "@/components/ui/card";

const WeeklyMenuSection = () => {
  const weeklyMenu = [
    { day: "Hétfő", date: "jan 15", items: ["🍲 Gulyásleves", "🍖 Rántott szelet"] },
    { day: "Kedd", date: "jan 16", items: ["🥄 Húsleves", "🥩 Borsos tokány"] },
    { day: "Szerda", date: "jan 17", items: ["🥬 Zöldségleves", "🍗 Grillezett csirke"] },
    { day: "Csütörtök", date: "jan 18", items: ["🫘 Babgulyás", "🧀 Rántott sajt"] },
    { day: "Péntek", date: "jan 19", items: ["🐟 Halászlé", "🥩 Schnitzel"] },
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Heti menü
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {weeklyMenu.map((menu, index) => (
            <Card 
              key={index} 
              className="cursor-pointer hover:shadow-cozy transition-shadow duration-200 shadow-soft"
              onClick={() => window.location.href = '/etlap'}
            >
              <CardContent className="p-4">
                <div className="text-center">
                  <h3 className="font-semibold text-primary mb-1">{menu.day}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{menu.date}</p>
                  <div className="space-y-1">
                    {menu.items.map((item, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {item}
                      </p>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Kattints egy napra a részletes menüért
          </p>
        </div>
      </div>
    </section>
  );
};

export default WeeklyMenuSection;