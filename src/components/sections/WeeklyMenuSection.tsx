import { Card, CardContent } from "@/components/ui/card";

const WeeklyMenuSection = () => {
  const weekDays = [
    {
      day: "Hétfő",
      date: "13",
      items: ["Gulyásleves", "Schnitzel", "Rántott gomba"]
    },
    {
      day: "Kedd", 
      date: "14",
      items: ["Tárkonyos leves", "Pörkölt", "Nudli"]
    },
    {
      day: "Szerda",
      date: "15", 
      items: ["Zöldségleves", "Roston sült", "Köretek"]
    },
    {
      day: "Csütörtök",
      date: "16",
      items: ["Húsleves", "Borsos tokány", "Rétes"]
    },
    {
      day: "Péntek",
      date: "17",
      items: ["Halászlé", "Rántott hal", "Főzelék"]
    }
  ];

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Heti menü
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {weekDays.map((day, index) => (
            <Card 
              key={index} 
              className="rounded-2xl shadow-md cursor-pointer hover:shadow-lg transition-shadow duration-200 border-primary/10 hover:border-primary/30"
              onClick={() => window.location.href = '/etlap'}
            >
              <CardContent className="p-4 text-center">
                <div className="mb-3">
                  <h3 className="font-bold text-foreground text-base">{day.day}</h3>
                  <div className="text-2xl font-bold text-primary">{day.date}</div>
                </div>
                <div className="space-y-1">
                  {day.items.map((item, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground leading-tight">
                      {item}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeeklyMenuSection;