import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

const DailyMenuSection = () => {
  const today = new Date().toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  const dailyItems = [
    "Tárkonyos raguleves",
    "Roston csirkeragu grillezett zöldséggel", 
    "Natúr karaj paradicsommal, sajttal borítva",
    "Lasagne",
    "Rántott gomba",
    "Kelkáposzta-főzelék"
  ];

  return (
    <section id="napi-ajanlat" className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                Ma mit főzünk?
              </CardTitle>
              <Badge className="bg-primary text-primary-foreground text-base px-4 py-2 rounded-full font-semibold w-fit">
                Napi menü helyben: 2 200 Ft
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">{today}</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {dailyItems.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg mt-0.5">•</span>
                  <span className="text-foreground text-base md:text-lg leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex justify-end pt-4">
              <Button 
                variant="outline" 
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-scale"
                asChild
              >
                <Link to="/etlap">Részletek az étlapon</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default DailyMenuSection;