import { Link, useLocation } from "react-router-dom";
import { Home, ChefHat, ImageIcon, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useCart } from "@/contexts/CartContext";

const MobileBottomNav = () => {
  const location = useLocation();
  const [moreOpen, setMoreOpen] = useState(false);
  const { state: cart } = useCart();

  const tabs = [
    { href: "/", label: "Főoldal", icon: Home },
    { href: "/etlap", label: "Napi Ajánlat", icon: ChefHat },
    { href: "/gallery", label: "Galéria", icon: ImageIcon },
  ];

  const moreLinks = [
    { href: "/about", label: "Rólunk" },
    { href: "/contact", label: "Kapcsolat" },
  ];

  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border shadow-lg md:hidden pb-safe">
      <nav className="flex items-stretch h-14">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          const Icon = tab.icon;
          const showBadge = tab.href === "/etlap" && cart.itemCount > 0;

          return (
            <Link
              key={tab.href}
              to={tab.href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors relative ${
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold px-1">
                    {cart.itemCount}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* More tab with sheet */}
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetTrigger asChild>
            <button
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors ${
                moreOpen
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MoreHorizontal className="h-5 w-5" />
              <span>Több</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="rounded-t-2xl pb-20">
            <div className="space-y-2 pt-2">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMoreOpen(false)}
                  className={`block px-4 py-3 rounded-xl text-base font-medium transition-colors hover:bg-primary/10 ${
                    location.pathname === link.href
                      ? "text-primary bg-primary/10"
                      : "text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-base font-medium">Téma váltás</span>
                <ThemeToggle />
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>
    </div>
  );
};

export default MobileBottomNav;
