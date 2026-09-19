import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowRight, Clock3, MapPin, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSmartInitialDate } from "@/lib/dateUtils";
import { capitalizeFirst } from "@/lib/utils";
import { formatOpeningHoursOneLiner, useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import desktopHeroAvif from "@/assets/kiscsibe-hero-gingham-desktop-v1.avif.asset.json";
import desktopHeroWebp from "@/assets/kiscsibe-hero-gingham-desktop-v1.webp.asset.json";
import mobileHeroAvif from "@/assets/kiscsibe-hero-gingham-mobile-v1.avif.asset.json";
import mobileHeroWebp from "@/assets/kiscsibe-hero-gingham-mobile-v1.webp.asset.json";
import heroMotion from "@/assets/kiscsibe-hero-motion-v2.mp4.asset.json";

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
    <section className="relative isolate min-h-[calc(100svh-5.25rem)] overflow-hidden bg-editorial text-editorial-foreground md:min-h-[min(850px,calc(100svh-6rem))]">
      <div className="absolute inset-0" aria-hidden="true">
        <picture className="md:hidden motion-reduce:block">
          <source media="(max-width: 767px)" type="image/avif" srcSet={mobileHeroAvif.url} />
          <source media="(max-width: 767px)" type="image/webp" srcSet={mobileHeroWebp.url} />
          <source type="image/avif" srcSet={desktopHeroAvif.url} />
          <source type="image/webp" srcSet={desktopHeroWebp.url} />
          <img
            src={desktopHeroWebp.url}
            alt="Házias Kiscsibe fogások piros-fehér kockás terítőn"
            className="hero-food-image absolute inset-0 h-full w-full object-cover motion-reduce:animate-none"
            fetchPriority="high"
            decoding="async"
            width={1365}
            height={768}
          />
        </picture>
        <video
          className="hero-motion-video absolute inset-0 hidden h-full w-full object-cover md:block"
          autoPlay
          muted
          loop
          playsInline
          preload="metadata"
          poster={desktopHeroWebp.url}
        >
          <source src={heroMotion.url} type="video/mp4" />
        </video>
        <picture className="hidden motion-reduce:block">
          <source type="image/avif" srcSet={desktopHeroAvif.url} />
          <source type="image/webp" srcSet={desktopHeroWebp.url} />
          <img src={desktopHeroWebp.url} alt="" className="absolute inset-0 h-full w-full object-cover" width={1365} height={768} />
        </picture>
        <div className="absolute inset-0 bg-hero-paper-shade" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-5.25rem)] max-w-7xl items-start px-4 pb-36 pt-9 sm:px-6 md:min-h-[min(850px,calc(100svh-6rem))] md:items-center md:pb-28 md:pt-20 lg:px-8">
        <div className="w-full">
          <div className="max-w-[39rem] animate-fade-in-up motion-reduce:animate-none">
            <p className="mb-4 flex items-center gap-3 text-[11px] font-extrabold uppercase tracking-[0.16em] text-primary sm:text-xs">
              <span className="h-1 w-9 bg-primary" />
              Zugló házias konyhája
            </p>
            <h1 className="max-w-xl font-sofia text-[clamp(3rem,6.2vw,6.5rem)] font-bold leading-[0.88] tracking-normal text-editorial-foreground">
              Ma főztük.
              <span className="block text-primary">Neked tálaljuk.</span>
            </h1>
            <p className="mt-5 max-w-lg text-sm font-medium leading-relaxed text-editorial-foreground/85 sm:text-lg md:mt-7 md:text-xl">
              Reggeli, napi menü és bőséges házias fogások — hétköznap, frissen.
            </p>

            <div className="mt-5 flex max-w-xl flex-col gap-2 border-y border-editorial-foreground/25 py-3 text-xs font-semibold text-editorial-foreground/80 sm:flex-row sm:flex-wrap sm:gap-x-6 sm:text-sm md:mt-7">
              <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{formatOpeningHoursOneLiner(openingHours)}</span>
              <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{address.full}</span>
            </div>

            <div className="mt-5 flex flex-row gap-2 sm:gap-3 md:mt-8">
              <Button size="lg" asChild className="min-h-12 flex-1 bg-primary px-4 font-bold text-primary-foreground shadow-none hover:bg-primary/90 sm:flex-none sm:px-7">
                <Link to="/etlap">Mai menü <ArrowRight className="ml-1 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="min-h-12 flex-1 border-editorial-foreground/55 bg-editorial/35 px-3 font-bold text-editorial-foreground backdrop-blur-sm hover:border-primary hover:bg-primary hover:text-primary-foreground sm:flex-none sm:px-7">
                <Link to="/etlap">Rendelés leadása</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute inset-x-4 bottom-4 z-20 flex min-h-14 items-center justify-between border border-editorial-foreground/20 bg-editorial/92 px-4 py-3 text-left text-editorial-foreground shadow-lg backdrop-blur-md md:hidden"
        aria-label="Ugrás a mai ajánlathoz"
      >
        <span>
          <span className="block font-sofia text-lg font-bold text-primary">Mai menü</span>
          <span className="block max-w-[15rem] truncate text-xs text-editorial-muted">{isLoading ? "Betöltés…" : menuLines[0] ?? "A napi ajánlat az étlapon érhető el"}</span>
        </span>
        <ArrowRight className="h-5 w-5 text-primary" />
      </button>

      <button type="button" onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-6 left-1/2 z-20 hidden w-[min(48rem,calc(100%-3rem))] -translate-x-1/2 items-center gap-5 border border-editorial-foreground/20 bg-editorial/95 px-5 py-4 text-left text-editorial-foreground shadow-xl backdrop-blur-md transition-colors hover:border-primary md:flex" aria-label="Ugrás a mai ajánlathoz">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center bg-primary text-primary-foreground"><UtensilsCrossed className="h-5 w-5" /></span>
        <span className="min-w-0 flex-1">
          <span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Mai ajánlat</span>
          <span className="block truncate font-sofia text-lg font-bold text-editorial-foreground">{isLoading ? "A mai ajánlat betöltése…" : menuLines.map(capitalizeFirst).join(" · ") || "A napi ajánlat az étlapon érhető el"}</span>
        </span>
        {dailyMenu?.price ? <span className="shrink-0 text-lg font-bold text-editorial-foreground">{dailyMenu.price.toLocaleString("hu-HU")} Ft</span> : null}
        <ArrowRight className="h-5 w-5 shrink-0 text-primary" />
      </button>
    </section>
  );
};

export default HeroSection;
