import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { Link } from "react-router-dom";
import menuImage from "@/assets/daily-menu-example.jpeg";

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
}

interface DailyOfferItem {
  id: string;
  menu_items?: MenuItem;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  daily_offer_items?: DailyOfferItem[];
}

const DailyMenuSection = () => {
  const [dailyOffer, setDailyOffer] = useState<DailyOffer | null>(null);
  const [loading, setLoading] = useState(true);

  const today = new Date().toLocaleDateString('hu-HU', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    weekday: 'long'
  });

  useEffect(() => {
    fetchTodaysOffer();
  }, []);

  const fetchTodaysOffer = async () => {
    const today = new Date().toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('daily_offers')
      .select(`
        *,
        daily_offer_items (
          id,
          menu_items (
            id,
            name,
            description,
            price_huf
          )
        )
      `)
      .eq('date', today)
      .single();

    if (!error && data) {
      setDailyOffer(data);
    }
    
    setLoading(false);
  };

  if (loading) {
    return (
      <section id="napi-ajanlat" className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardContent className="flex justify-center py-12">
              <LoadingSpinner className="h-8 w-8" />
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (!dailyOffer || !dailyOffer.daily_offer_items?.length) {
    return (
      <section id="napi-ajanlat" className="py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Menu Image */}
          <div className="mb-8 max-w-2xl mx-auto">
            <img 
              src={menuImage} 
              alt="Napi menü példa"
              className="w-full rounded-xl shadow-lg border border-primary/20"
            />
          </div>
          
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                Ma mit főzünk?
              </CardTitle>
              <p className="text-muted-foreground text-sm md:text-base">{today}</p>
            </CardHeader>
            <CardContent className="text-center py-8">
              <p className="text-muted-foreground text-lg">
                Mai napi menü még nem érhető el
              </p>
              <div className="flex justify-center pt-4">
                <Button 
                  variant="outline" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground hover-scale"
                  asChild
                >
                  <Link to="/etlap">Teljes étlap megtekintése</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="napi-ajanlat" className="py-12 md:py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Menu Image */}
        <div className="mb-8 max-w-2xl mx-auto">
          <img 
            src={menuImage} 
            alt="Napi menü példa"
            className="w-full rounded-xl shadow-lg border border-primary/20"
          />
        </div>
        
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-2xl md:text-3xl font-bold text-foreground">
                Ma mit főzünk?
              </CardTitle>
              <Badge className="bg-primary text-primary-foreground text-base px-4 py-2 rounded-full font-semibold w-fit">
                Napi menü helyben: {dailyOffer.price_huf} Ft
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm md:text-base">{today}</p>
            {dailyOffer.note && (
              <p className="text-primary text-sm font-medium">{dailyOffer.note}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <ul className="space-y-2">
              {dailyOffer.daily_offer_items.map((offerItem) => (
                <li key={offerItem.id} className="flex items-start gap-3">
                  <span className="text-primary font-bold text-lg mt-0.5">•</span>
                  <span className="text-foreground text-base md:text-lg leading-relaxed">
                    {offerItem.menu_items?.name}
                  </span>
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