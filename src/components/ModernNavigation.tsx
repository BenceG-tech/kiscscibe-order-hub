import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, Phone, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { CartDialog } from "@/components/CartDialog";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

const ModernNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [visible, setVisible] = useState(true);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const location = useLocation();
  const { state: cart } = useCart();
  const { isAdmin, isStaff, canViewOrders } = useAuth();

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Always keep header visible, just adjust styles based on scroll
      setVisible(true);
      setScrolled(currentScrollY > 20);
      lastScrollY = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const closeMenu = () => setIsOpen(false);

  // Navigation links - admin access is hidden in footer (5 clicks on logo)
  const navLinks = [
    { href: "/", label: "Főoldal" },
    { href: "/etlap", label: "Napi Ajánlat" },
    { href: "/about", label: "Rólunk" },
    { href: "/contact", label: "Kapcsolat" },
  ];

  return (
    <>
      {/* Skip to main content link for accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:outline-none"
      >
        Ugrás a tartalomra
      </a>
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out transform ${
      visible 
        ? "translate-y-0 opacity-100" 
        : "-translate-y-full opacity-0"
    } ${
      scrolled 
        ? "bg-background/95 backdrop-blur-md shadow-lg border-b border-border" 
        : "bg-background/90 backdrop-blur-sm"
    }`}>
      {/* Top info bar - Thinner */}
      <div className={`bg-primary/10 border-b border-primary/20 transition-all duration-300 ${
        scrolled ? "py-1.5" : "py-2"
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-1.5">
            <div className={`text-foreground font-medium text-center md:text-left transition-all duration-300 ${
              scrolled ? "text-xs" : "text-sm"
            }`}>
              Ma nyitva: H–P 7:00–16:00 • Szo-V Zárva
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <Button 
                onClick={() => document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' })}
                size={scrolled ? "sm" : "default"}
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-sofia font-bold text-base transition-all duration-300"
                asChild
              >
                <Link to="/etlap">Rendelj most</Link>
              </Button>
              
              <Button 
                variant="outline" 
                size={scrolled ? "sm" : "default"}
                className="border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                asChild
              >
                <a href="tel:+3612345678" className="inline-flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span className="hidden sm:inline">Hívás</span>
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className={`transition-all duration-300 ${scrolled ? "py-2" : "py-4"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link 
              to="/" 
              className="font-sofia font-bold text-xl md:text-2xl text-primary hover:text-primary/80 transition-all duration-300"
            >
              Kiscsibe Reggeliző & Étterem
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`font-medium transition-all duration-300 hover:text-primary relative group ${
                    location.pathname === link.href 
                      ? "text-primary" 
                      : "text-foreground/80"
                  }`}
                >
                  {link.label}
                  <div className={`absolute -bottom-1 left-0 h-0.5 bg-primary transition-all duration-300 ${
                    location.pathname === link.href ? "w-full" : "w-0 group-hover:w-full"
                  }`} />
                </Link>
              ))}
              
              {/* Theme toggle for desktop */}
              <ThemeToggle />
              
              {/* Cart icon for desktop */}
              <div className="relative group">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-primary/10"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.itemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs"
                    >
                      {cart.itemCount}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>

            {/* Mobile Cart and Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              {/* Mobile Cart Icon */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="hover:bg-primary/10"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cart.itemCount > 0 && (
                    <Badge 
                      className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 bg-primary text-primary-foreground text-xs"
                    >
                      {cart.itemCount}
                    </Badge>
                  )}
                </Button>
              </div>
              
              {/* Mobile Menu Button */}
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="hover:bg-primary/10"
                  >
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px]">
                  <div className="flex flex-col space-y-4 mt-8">
                    <div className="pb-4 border-b">
                      <h2 className="font-sofia font-bold text-lg text-primary">Kiscsibe Reggeliző & Étterem</h2>
                    </div>
                    
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        to={link.href}
                        onClick={closeMenu}
                        className={`font-medium text-lg py-2 px-3 rounded-lg transition-all duration-300 hover:bg-primary/10 hover:text-primary ${
                          location.pathname === link.href 
                            ? "text-primary bg-primary/10" 
                            : "text-foreground"
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                    
                    <div className="pt-4 border-t space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Téma váltás</span>
                        <ThemeToggle />
                      </div>
                      
                      <Button 
                        asChild
                        className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm font-sofia font-bold text-base"
                        onClick={closeMenu}
                      >
                         <Link to="/etlap">Rendelj most</Link>
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        className="w-full border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                        asChild
                      >
                        <a href="tel:+3612345678" className="inline-flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Hívás: +36 1 234 5678
                        </a>
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cart Dialog */}
      <CartDialog open={isCartOpen} onOpenChange={setIsCartOpen} />
    </nav>
    </>
  );
};

export default ModernNavigation;
export { ModernNavigation };