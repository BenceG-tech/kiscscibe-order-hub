import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const TopOrderBar = () => {
  const scrollToNapiAjanlat = () => {
    document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="sticky top-16 z-40 bg-primary/10 border-b border-primary/20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Nyitvatartás */}
          <div className="text-sm text-foreground font-medium text-center md:text-left">
            Ma nyitva: H–P 7:00–16:00 • Szo-V Zárva
          </div>
          
          {/* Rendelési gomb - teljes szélesség mobilon */}
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
            <Button 
              onClick={scrollToNapiAjanlat}
              className="w-full md:w-auto bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
            >
              Rendelj most
            </Button>
            
            {/* Hívás gomb */}
            <Button 
              variant="outline" 
              className="w-full md:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              asChild
            >
              <a href="tel:+3612345678" className="inline-flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Hívás: +36 1 234 5678
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TopOrderBar;