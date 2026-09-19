import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowDown, ArrowRight, ChevronLeft, ChevronRight, Clock3, MapPin, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSmartInitialDate } from "@/lib/dateUtils";
import { capitalizeFirst } from "@/lib/utils";
import { formatOpeningHoursOneLiner, useRestaurantSettings } from "@/hooks/useRestaurantSettings";
import heroBreakfast from "@/assets/hero-breakfast.jpg";
import heroSchnitzel from "@/assets/hero-schnitzel.jpg";
import heroGoulash from "@/assets/hero-goulash.jpg";
import heroRestaurant from "@/assets/hero-desktop.png";

interface HeroMenuItem {
  item_name?: string;
  is_menu_part?: boolean;
  menu_role?: string;
}

interface HeroDailyRow {
  items?: unknown;
  menu_price_huf?: number | null;
}

const slides = [
  { src: heroSchnitzel, alt: "Frissen sült rántott hús petrezselymes burgonyával" },
  { src: heroGoulash, alt: "Gőzölgő, házias gulyásleves friss kenyérrel" },
  { src: heroBreakfast, alt: "Friss reggeli a Kiscsibe Étteremben" },
  { src: heroRestaurant, alt: "A Kiscsibe Reggeliző és Étterem hangulata" },
];

const HeroSection = () => {
  const [activeSlide, setActiveSlide] = useState(0);
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

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % slides.length);
    }, 6500);
    return () => window.clearInterval(interval);
  }, []);

  const menuLines = useMemo(
    () => [dailyMenu?.soup, dailyMenu?.main].filter((item): item is string => Boolean(item)),
    [dailyMenu],
  );

  const changeSlide = (direction: number) => {
    setActiveSlide((current) => (current + direction + slides.length) % slides.length);
  };

  return (
    <section className="relative isolate min-h-[72svh] md:min-h-[78svh] overflow-hidden bg-editorial text-editorial-foreground">
      <div className="absolute inset-0" aria-hidden="true">
        {slides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt=""
            className={`absolute inset-0 h-full w-full object-cover object-center transition-[opacity,transform] duration-[1800ms] ease-out motion-reduce:transition-none ${
               index === activeSlide ? "scale-[1.03] opacity-100" : "scale-[1.08] opacity-0"
            }`}
            loading={index === 0 ? "eager" : "lazy"}
            decoding="async"
            width={1920}
            height={1080}
          />
        ))}
        <div className="absolute inset-0 bg-hero-shade" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-[72svh] max-w-7xl items-end px-4 pb-20 pt-40 sm:px-6 md:min-h-[78svh] md:items-center md:pb-16 md:pt-36 lg:px-8">
        <div className="grid w-full items-end gap-10 md:grid-cols-[minmax(0,1fr)_22rem] lg:gap-20">
          <div className="max-w-3xl animate-fade-in-up motion-reduce:animate-none">
            <p className="mb-5 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-primary sm:text-sm">
              <span className="h-px w-10 bg-primary" />
              Zugló házias konyhája
            </p>
            <h1 className="font-sofia text-[clamp(2.75rem,7vw,6.75rem)] font-bold leading-[0.94] tracking-normal text-editorial-foreground">
              Kiscsibe
              <span className="mt-2 block text-[0.52em] leading-tight text-primary">Reggeliző &amp; Étterem</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-editorial-muted sm:text-lg md:text-xl">
              Friss reggeli, kiadós napi menü és ismerős, házias ízek minden hétköznap.
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

           <button
            type="button"
            onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
             className="chalkboard gingham-edge group hidden min-h-64 rotate-[-1.5deg] border border-editorial-foreground/20 p-6 text-left backdrop-blur-md transition-transform duration-500 hover:rotate-0 hover:-translate-y-2 md:block"
            aria-label="Ugrás a mai ajánlathoz"
          >
            <div className="flex items-center justify-between border-b border-editorial-foreground/15 pb-4">
               <span className="inline-flex items-center gap-2 font-sofia text-xl font-bold text-primary"><UtensilsCrossed className="h-4 w-4" /> Mai menü</span>
              {dailyMenu?.price ? <span className="text-lg font-bold text-editorial-foreground">{dailyMenu.price.toLocaleString("hu-HU")} Ft</span> : null}
            </div>
            <div className="space-y-4 py-6">
              {isLoading ? (
                <p className="text-sm text-editorial-muted">A mai ajánlat betöltése…</p>
              ) : menuLines.length > 0 ? (
                menuLines.map((line, index) => (
                  <div key={line} className="flex gap-3">
                    <span className="font-sofia text-2xl text-primary">0{index + 1}</span>
                    <p className="pt-1 font-sofia text-xl font-bold leading-tight text-editorial-foreground">{capitalizeFirst(line)}</p>
                  </div>
                ))
              ) : (
                <p className="font-sofia text-xl leading-snug text-editorial-foreground">Nézd meg a következő elérhető napi ajánlatunkat.</p>
              )}
            </div>
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">Megnézem <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></span>
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
        className="chalkboard gingham-edge absolute inset-x-4 bottom-4 z-20 flex items-center justify-between border border-editorial-foreground/20 px-4 py-3 text-left md:hidden"
        aria-label="Ugrás a mai ajánlathoz"
      >
        <span>
          <span className="block font-sofia text-lg font-bold text-primary">Mai menü</span>
          <span className="block max-w-[15rem] truncate text-xs text-editorial-muted">{menuLines[0] ?? "Nézd meg a következő ajánlatot"}</span>
        </span>
        <ArrowRight className="h-5 w-5 text-primary" />
      </button>

      <div className="absolute bottom-5 left-4 z-20 flex items-center gap-2 sm:left-6 lg:left-8">
        <Button variant="outline" size="icon" onClick={() => changeSlide(-1)} className="h-9 w-9 border-editorial-foreground/30 bg-editorial/40 text-editorial-foreground backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" aria-label="Előző kép">
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1.5" aria-label={`Kép ${activeSlide + 1} / ${slides.length}`}>
          {slides.map((slide, index) => (
            <button key={slide.alt} type="button" onClick={() => setActiveSlide(index)} className={`h-1.5 transition-all ${index === activeSlide ? "w-8 bg-primary" : "w-3 bg-editorial-foreground/40"}`} aria-label={`${index + 1}. kép`} />
          ))}
        </div>
        <Button variant="outline" size="icon" onClick={() => changeSlide(1)} className="h-9 w-9 border-editorial-foreground/30 bg-editorial/40 text-editorial-foreground backdrop-blur-sm hover:bg-primary hover:text-primary-foreground" aria-label="Következő kép">
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <button type="button" onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })} className="absolute bottom-5 right-4 z-20 hidden items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-editorial-muted sm:flex sm:right-6 lg:right-8">
        Fedezd fel <ArrowDown className="h-4 w-4 motion-safe:animate-bounce" />
      </button>
    </section>
  );
};

export default HeroSection;
