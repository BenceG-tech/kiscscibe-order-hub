import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, Phone } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  const scrollToNapiAjanlat = () => {
    document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-primary">Kiscsibe Reggeliző</h1>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6">
            <a href="/" className="text-foreground hover:text-primary transition-colors">
              Főoldal
            </a>
            <a href="/etlap" className="text-foreground hover:text-primary transition-colors">
              Étlap
            </a>
            <a href="/rolunk" className="text-foreground hover:text-primary transition-colors">
              Rólunk
            </a>
            <a href="/kapcsolat" className="text-foreground hover:text-primary transition-colors">
              Kapcsolat
            </a>
            <Button 
              onClick={scrollToNapiAjanlat}
              className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold"
            >
              Rendelj most
            </Button>
            
            {/* Kosár ikon - csak akkor mutass badge-et, ha van tétel */}
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {/* Badge csak akkor jelenik meg, ha cartItems > 0 - itt placeholder logika */}
              {false && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                  0
                </Badge>
              )}
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="text-foreground"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-full left-0 right-0 bg-background border-t border-border shadow-lg z-40">
            <div className="p-4 space-y-4">
              {/* Menu links */}
              <div className="space-y-3">
                <a 
                  href="/" 
                  className="block text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Főoldal
                </a>
                <a 
                  href="/etlap" 
                  className="block text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Étlap
                </a>
                <a 
                  href="/rolunk" 
                  className="block text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Rólunk
                </a>
                <a 
                  href="/kapcsolat" 
                  className="block text-foreground hover:text-primary transition-colors py-2"
                  onClick={() => setIsOpen(false)}
                >
                  Kapcsolat
                </a>
                
                {/* Kiemelt rendelés gomb */}
                <Button 
                  onClick={() => {
                    scrollToNapiAjanlat();
                    setIsOpen(false);
                  }}
                  className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold mt-4"
                >
                  Rendelj most
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;