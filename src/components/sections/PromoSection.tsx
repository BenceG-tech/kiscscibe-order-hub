import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const PromoSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card className="bg-gradient-to-r from-primary/10 to-warmth/10 border-primary/20 shadow-cozy">
          <CardHeader>
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-warmth rounded-full flex items-center justify-center">
                <Receipt className="h-6 w-6 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl md:text-3xl text-center">
              Napi menü helyben: 2 200 Ft
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-6">
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span className="text-muted-foreground">Elvitel doboz: +200 Ft/doboz</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-primary rounded-full"></span>
                <span className="text-muted-foreground">Diák/nyugdíjas: –10% 11:30–13:00</span>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground w-full sm:w-auto"
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