import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const PromoSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="rounded-2xl shadow-lg border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                Napi menü helyben: 2 200 Ft
              </CardTitle>
              <Badge className="bg-primary text-primary-foreground text-lg px-4 py-2 rounded-full font-bold w-fit">
                Kiváló ár!
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-foreground mb-3 text-lg">Kiegészítő szolgáltatások:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg mt-0.5">•</span>
                    <span className="text-foreground">Elvitel doboz: +200 Ft/doboz</span>
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-semibold text-foreground mb-3 text-lg">Kedvezmények:</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-primary font-bold text-lg mt-0.5">•</span>
                    <span className="text-foreground">Diák/nyugdíjas: –10% (11:30–13:00)</span>
                  </li>
                </ul>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
                asChild
              >
                <a href="/etlap">Részletek</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default PromoSection;