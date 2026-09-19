import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDown, ArrowRight, Clock3, MapPin, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSmartInitialDate } from "@/lib/dateUtils";
import { capitalizeFirst } from "@/lib/utils";
import { formatOpeningHoursOneLiner, useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import heroServing from "@/assets/kiscsibe-hero-serving.jpg";

interface HeroMenuItem {
  item_name?: string;
  is_menu_part?: boolean;
  menu_role?: string;
}

interface HeroDailyRow {
  items?: unknown;
  menu_price_huf?: number | null;
}

const HeroSection = () => {
  const { openingHours, address } = useRestaurantSettings();

  const { data: dailyMenu, isLoading } = useQuery({
    queryKey: ["homepage-hero-menu"],
    queryFn: async () => {
      const targetDate = format(getSmartInitialDate(), "yyyy-MM-dd");
      const { data, error } = await supabase.rpc("get_daily_data", { target_date: targetDate });
      if (error) throw error;
      const row = (data?.[0] ?? null) as HeroDailyRow | null;
      if (!row) return null;

      const items = Array.isArray(row.items) ? (row.items as HeroMenuItem[]) : [];
      return {
        soup: items.find((item) => item.is_menu_part && item.menu_role === "leves")?.item_name,
        main: items.find((item) => item.is_menu_part && item.menu_role === "főétel")?.item_name,
        price: row.menu_price_huf ?? null,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const menuLines = useMemo(
    () => [dailyMenu?.soup, dailyMenu?.main].filter((item): item is string => Boolean(item)),
    [dailyMenu],
  );

  return (
    <section className="relative isolate min-h-[calc(100svh-5rem)] overflow-hidden bg-editorial text-editorial-foreground md:min-h-[82svh]">
      <div className="absolute inset-0" aria-hidden="true">
        <img src={heroServing} alt="Gőzölgő levest mernek a Kiscsibe kifőzde pultjánál" className="absolute inset-0 h-full w-full object-cover object-[62%_center] motion-safe:animate-[hero-breathe_14s_ease-in-out_infinite_alternate]" fetchPriority="high" decoding="async" width={1920} height={1088} />
        <div className="absolute inset-0 bg-hero-shade" />
        <div className="brand-orbit absolute -right-32 -top-40 h-[34rem] w-[34rem] opacity-40 motion-reduce:animate-none" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5rem)] max-w-7xl items-end px-4 pb-36 pt-36 sm:px-6 md:min-h-[82svh] md:items-center md:pb-24 md:pt-32 lg:px-8">
        <div className="w-full">
          <div className="max-w-2xl animate-fade-in-up motion-reduce:animate-none">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              <span className="h-px w-10 bg-primary" />
              Zugló házias konyhája
            </p>
            <h1 className="font-sofia text-[clamp(2.75rem,7vw,6.75rem)] font-bold leading-[0.94] tracking-normal text-editorial-foreground">
              Kiscsibe
              <span className="mt-2 block text-[0.52em] leading-tight text-primary">Reggeliző &amp; Étterem</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-editorial-muted sm:text-lg md:text-xl">
              Amit ma megfőztünk, azt ma adjuk. Bőséges, házias ebéd Zuglóban — gyors átvétellel.
            </p>

            <div className="mt-7 flex flex-wrap gap-3 text-xs text-editorial-muted sm:text-sm">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{formatOpeningHoursOneLiner(openingHours)}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{address.full}</span>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" asChild className="min-h-12 bg-primary px-7 font-bold text-primary-foreground shadow-warm hover:bg-primary/90">
                <Link to="/etlap">Rendelés leadása <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="min-h-12 border-editorial-foreground/40 bg-editorial/30 px-7 font-bold text-editorial-foreground backdrop-blur-sm hover:bg-editorial-foreground hover:text-editorial"
                onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
              >
                Mai ajánlat
              </Button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute inset-x-4 bottom-5 z-20 flex items-center justify-between border border-editorial-foreground/20 bg-editorial/90 px-4 py-3 text-left shadow-xl backdrop-blur-md md:hidden"
        aria-label="Ugrás a mai ajánlathoz"
      >
        <span>
          <span className="block font-sofia text-lg font-bold text-primary">Mai menü</span>
          <span className="block max-w-[15rem] truncate text-xs text-editorial-muted">{menuLines[0] ?? "Nézd meg a következő ajánlatot"}</span>
        </span>
        <ArrowRight className="h-5 w-5 text-primary" />
      </button>

      <button type="button" onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-6 left-1/2 z-20 hidden w-[min(44rem,calc(100%-3rem))] -translate-x-1/2 items-center gap-5 border border-editorial-foreground/20 bg-editorial/90 px-5 py-4 text-left shadow-2xl backdrop-blur-md transition-colors hover:border-primary/60 md:flex" aria-label="Ugrás a mai ajánlathoz">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><UtensilsCrossed className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-primary"><Sparkles className="h-3 w-3" /> Mai ajánlat</span>
          <span className="block truncate font-sofia text-lg font-bold text-editorial-foreground">{isLoading ? "A mai ajánlat betöltése…" : menuLines.map(capitalizeFirst).join(" · ") || "Nézd meg a következő elérhető ajánlatot"}</span>
        </span>
        {dailyMenu?.price ? <span className="shrink-0 text-lg font-bold text-editorial-foreground">{dailyMenu.price.toLocaleString("hu-HU")} Ft</span> : null}
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
      </button>

      <button type="button" onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-5 right-4 z-20 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-editorial-muted sm:flex sm:right-6 lg:right-8">
        Fedezd fel <ArrowDown className="h-4 w-4 motion-safe:animate-bounce" />
      </button>
    </section>
  );
};

export default HeroSection;
