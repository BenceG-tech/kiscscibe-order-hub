import { Button } from "@/components/ui/button";
import { Phone } from "lucide-react";

const StickyMobileCTA = () => {
  const scrollToNapiAjanlat = () => {
    document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border shadow-lg md:hidden">
      <div className="flex p-3 gap-3">
        <Button 
          onClick={scrollToNapiAjanlat}
          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px]"
        >
          Rendelj most
        </Button>
        <Button 
          variant="outline" 
          size="icon"
          className="border-primary text-primary hover:bg-primary hover:text-primary-foreground min-h-[44px] min-w-[44px]"
          asChild
        >
          <a href="tel:+3612345678" aria-label="Hívás">
            <Phone className="h-5 w-5" />
          </a>
        </Button>
      </div>
    </div>
  );
};

export default StickyMobileCTA;