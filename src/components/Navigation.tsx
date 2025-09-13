import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-xl md:text-2xl font-bold text-primary">Kiscsibe Reggeliző</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a href="/" className="text-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Főoldal
              </a>
              <a href="/etlap" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Étlap
              </a>
              <a href="/rolunk" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Rólunk
              </a>
              <a href="/kapcsolat" className="text-muted-foreground hover:text-primary px-3 py-2 rounded-md text-sm font-medium transition-colors">
                Kapcsolat
              </a>
              <Button size="sm" className="ml-4 bg-primary hover:bg-primary/90 text-primary-foreground">
                Rendelj most
              </Button>
            </div>
          </div>

          {/* Cart Icon */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <ShoppingCart className="h-6 w-6 text-foreground" />
              <span className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full text-xs h-5 w-5 flex items-center justify-center font-semibold">
                0
              </span>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-foreground"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-background border-t border-border">
              <a href="/" className="text-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Főoldal
              </a>
              <a href="/etlap" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Étlap
              </a>
              <a href="/rolunk" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Rólunk
              </a>
              <a href="/kapcsolat" className="text-muted-foreground hover:text-primary block px-3 py-2 rounded-md text-base font-medium">
                Kapcsolat
              </a>
              <div className="pt-2">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3">
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