import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Package, GraduationCap, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

const PromoSection = () => {
  const { data: menuPrice } = useQuery({
    queryKey: ["promo-menu-price"],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await supabase.rpc('get_daily_data', { target_date: today });
      return data?.[0]?.menu_price_huf || 2200;
    },
    staleTime: 5 * 60 * 1000,
  });

  const displayPrice = menuPrice ? menuPrice.toLocaleString('hu-HU') : '2 200';

  return (
     <section className="py-8 md:py-10">
       <div className="max-w-5xl mx-auto px-4">
         <div className="bg-card/80 backdrop-blur-sm rounded-2xl shadow-lg border border-border/50 p-4 md:p-6">
           
           {/* Desktop: flex row */}
           <div className="hidden md:flex items-center justify-between gap-6">
             
             {/* Left: Icon + Title */}
             <div className="flex items-center gap-4">
               <div className="w-14 h-14 bg-gradient-to-br from-primary to-warmth rounded-2xl flex items-center justify-center shadow-lg">
                 <UtensilsCrossed className="h-7 w-7 text-white" />
              </div>
               <div>
                 <p className="text-sm text-muted-foreground">Napi menü helyben</p>
                 <p className="text-2xl font-bold text-primary">{displayPrice} Ft</p>
               </div>
            </div>
             
             {/* Middle: Info Badges */}
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
             
             {/* Right: CTA */}
             <Button variant="outline" className="group" asChild>
               <a href="/etlap">
                 Részletek
                 <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </a>
             </Button>
             
           </div>
           
           {/* Mobile: vertical compact layout */}
           <div className="md:hidden space-y-4">
             {/* Icon + Title row */}
             <div className="flex items-center gap-3">
               <div className="w-12 h-12 bg-gradient-to-br from-primary to-warmth rounded-xl flex items-center justify-center">
                 <UtensilsCrossed className="h-6 w-6 text-white" />
               </div>
               <div>
                 <p className="text-sm text-muted-foreground">Napi menü helyben</p>
                 <p className="text-xl font-bold text-primary">{displayPrice} Ft</p>
               </div>
            </div>
             
              {/* Info badges row */}
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
             
             {/* CTA Button */}
             <Button variant="outline" className="w-full group" asChild>
               <a href="/etlap">
                 Részletek
                 <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
               </a>
             </Button>
           </div>
           
         </div>
      </div>
    </section>
  );
};

export default PromoSection;
