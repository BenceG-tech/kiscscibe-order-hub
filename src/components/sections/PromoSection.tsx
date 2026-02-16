import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Package, GraduationCap, ArrowRight, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import soupBg from "@/assets/hungarian-soup.jpg";

const useCountdown = () => {
  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number } | null>(null);

  useEffect(() => {
    const calculate = () => {
      const now = new Date();
      const day = now.getDay(); // 0=Sun, 6=Sat
      if (day === 0 || day === 6) return null;

      const closing = new Date(now);
      closing.setHours(16, 0, 0, 0);
      const diff = closing.getTime() - now.getTime();
      if (diff <= 0) return null;

      return {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
      };
    };

    setTimeLeft(calculate());
    const id = setInterval(() => setTimeLeft(calculate()), 60000);
    return () => clearInterval(id);
  }, []);

  return timeLeft;
};

const PromoSection = () => {
  const countdown = useCountdown();

  const { data: menuPrice } = useQuery({
    queryKey: ["promo-menu-price"],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase.rpc('get_daily_data', { target_date: today });
      return data?.[0]?.menu_price_huf || 2200;
    },
    staleTime: 5 * 60 * 1000,
  });

  const actualPrice = menuPrice ?? 2200;
  const displayPrice = actualPrice.toLocaleString('hu-HU');

  return (
    <section className="py-8 md:py-10">
      <div className="max-w-5xl mx-auto px-4">
        <div className="relative overflow-hidden rounded-2xl animate-glow-pulse">
          
          {/* Background image with blur */}
          <div className="absolute inset-0" style={{ transform: 'translateZ(0)' }}>
            <img
              src={soupBg}
              alt=""
              aria-hidden="true"
              className="w-full h-full object-cover blur-sm opacity-50 scale-105"
              loading="lazy"
            />
          </div>

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/80 to-background/60 dark:from-background/95 dark:via-background/85 dark:to-background/70" />

          {/* Content */}
          <div className="relative z-10 p-5 md:p-8">

            {/* Desktop layout */}
            <div className="hidden md:flex items-center justify-between gap-6">
              
              {/* Left: Icon + Price */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-primary to-warmth rounded-2xl flex items-center justify-center shadow-lg">
                  <UtensilsCrossed className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Napi menü helyben</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-bold text-primary font-sofia">{displayPrice} Ft</p>
                  </div>
                </div>
              </div>

              {/* Middle: Countdown + Badges */}
              <div className="flex flex-col items-center gap-2">
                {countdown && (
                  <div className="flex items-center gap-2 bg-primary/15 rounded-xl px-4 py-2 border border-primary/30">
                    <Clock className="h-4 w-4 text-primary" />
                    <span className="text-sm font-semibold text-primary">
                      Mai ajánlat még {countdown.hours} óra {countdown.minutes} percig!
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="bg-primary/10 rounded-xl px-4 py-2 flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">+200 Ft elvitel</span>
                  </div>
                  <div className="bg-primary/10 rounded-xl px-4 py-2 flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">-10% diák 11:30-13:00</span>
                  </div>
                </div>
              </div>

              {/* Right: CTA */}
              <Button variant="outline" className="group border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <a href="/etlap">
                  Részletek
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>

            {/* Mobile layout */}
            <div className="md:hidden space-y-4">
              {/* Icon + Price */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary to-warmth rounded-xl flex items-center justify-center">
                  <UtensilsCrossed className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Napi menü helyben</p>
                  <div className="flex items-baseline gap-2">
                    <p className="text-xl font-bold text-primary font-sofia">{displayPrice} Ft</p>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              {countdown && (
                <div className="flex items-center gap-2 bg-primary/15 rounded-xl px-3 py-2 border border-primary/30">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-xs font-semibold text-primary">
                    Mai ajánlat még {countdown.hours} óra {countdown.minutes} percig!
                  </span>
                </div>
              )}

              {/* Badges */}
              <div className="flex gap-2">
                <div className="bg-primary/10 rounded-xl px-3 py-2 flex items-center gap-1.5 flex-1">
                  <Package className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <p className="text-xs font-medium">+200 Ft elvitel</p>
                </div>
                <div className="bg-primary/10 rounded-xl px-3 py-2 flex items-center gap-1.5 flex-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  <p className="text-xs font-medium">-10% 11:30-13:00</p>
                </div>
              </div>

              {/* CTA */}
              <Button variant="outline" className="w-full group border-primary text-primary hover:bg-primary hover:text-primary-foreground" asChild>
                <a href="/etlap">
                  Részletek
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoSection;
