import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  UtensilsCrossed,
  BookOpen,
  Sun,
  ShoppingBag,
  MapPin,
  Coffee,
  ChefHat,
  Cake,
  ChevronRight,
} from "lucide-react";
import heroDesktop from "@/assets/hero-desktop.png";
import heroMobile from "@/assets/hero-mobile.png";

const infoChips = [
  { icon: Sun, title: "Friss reggeli", subtitle: "Minden nap frissen" },
  { icon: ShoppingBag, title: "Helyben & elvitel", subtitle: "Gyors átvétel" },
  { icon: MapPin, title: "Zugló", subtitle: "Közel hozzád" },
];

const categoryCards = [
  {
    icon: Coffee,
    title: "Reggeli",
    desc: "Indítsd a napod finom reggelivel!",
    href: "#reggeli",
    isExternal: false,
  },
  {
    icon: ChefHat,
    title: "Napi menü",
    desc: "Kiadós ételek elérhető áron!",
    href: "#napi-ajanlat",
    isExternal: false,
  },
  {
    icon: Cake,
    title: "Desszertek",
    desc: "Édes finomságok minden ízhez!",
    href: "/etlap#desszertek",
    isExternal: true,
  },
];

const HeroSection = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative bg-background overflow-hidden">
      {/* Subtle ambient glow */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-60 pointer-events-none"
        style={{
          background:
            "radial-gradient(60% 50% at 10% 30%, hsl(var(--primary) / 0.08), transparent 60%), radial-gradient(50% 40% at 90% 70%, hsl(var(--primary) / 0.05), transparent 60%)",
        }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 pb-24 lg:pb-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-stretch min-h-[560px] lg:min-h-[640px]">
          {/* LEFT — Glass content panel */}
          <div
            className="lg:col-span-6 relative rounded-3xl border border-primary/20 bg-background/50 backdrop-blur-xl shadow-2xl p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-2 lg:order-1 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.1s", animationFillMode: "forwards" }}
          >
            <h1 className="font-sofia font-bold text-foreground text-4xl sm:text-5xl lg:text-6xl leading-[1.05] tracking-tight">
              Kiscsibe Reggeliző
              <br />
              &amp; Étterem
            </h1>

            <div className="mt-4 flex items-end gap-2">
              <p className="font-sofia text-primary text-2xl sm:text-3xl lg:text-4xl leading-tight">
                házias ízek minden hétköznap
              </p>
              {/* hand-drawn gold heart */}
              <svg
                aria-hidden
                viewBox="0 0 32 28"
                className="w-7 h-6 sm:w-8 sm:h-7 text-primary shrink-0 mb-1"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M16 25 C 6 18, 2 12, 6 7 C 10 2, 15 5, 16 9 C 17 5, 22 2, 26 7 C 30 12, 26 18, 16 25 Z" />
              </svg>
            </div>

            <p className="mt-5 text-base sm:text-lg text-foreground/80 max-w-xl leading-relaxed">
              Friss levesek, kiadós főételek, gyors átvétel Zuglóban.
            </p>

            {/* CTA buttons */}
            <div className="mt-7 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button
                size="lg"
                onClick={() => scrollTo("napi-ajanlat")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-warm font-sofia font-bold rounded-xl px-8 min-h-[48px] w-full sm:w-auto"
              >
                <UtensilsCrossed className="mr-1" />
                Mai ajánlat
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="border-2 border-primary/60 text-foreground bg-background/40 hover:bg-primary hover:text-primary-foreground font-sofia font-bold rounded-xl px-8 min-h-[48px] w-full sm:w-auto"
              >
                <Link to="/etlap">
                  <BookOpen className="mr-1" />
                  Teljes étlap
                </Link>
              </Button>
            </div>

            {/* Info chips */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              {infoChips.map(({ icon: Icon, title, subtitle }) => (
                <div
                  key={title}
                  className="flex items-center gap-3 rounded-xl border border-primary/25 bg-background/60 px-3 py-2.5"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground leading-tight truncate">
                      {title}
                    </div>
                    <div className="text-[11px] text-foreground/60 leading-tight truncate">
                      {subtitle}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — Food photo */}
          <div
            className="lg:col-span-6 relative rounded-3xl overflow-hidden border border-primary/15 shadow-2xl order-1 lg:order-2 min-h-[280px] sm:min-h-[360px] lg:min-h-0 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
          >
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet="/images/hero-desktop.webp"
                type="image/webp"
              />
              <source srcSet="/images/hero-mobile.webp" type="image/webp" />
              <source media="(min-width: 768px)" srcSet={heroDesktop} />
              <img
                src={heroMobile}
                alt="Kiscsibe Reggeliző & Étterem prémium ételek"
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
                decoding="async"
                width={1920}
                height={1080}
              />
            </picture>
            {/* gradient blending toward left panel on desktop */}
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/10 to-transparent hidden lg:block"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent lg:hidden"
            />
          </div>
        </div>

        {/* Category cards — overlap bottom of hero */}
        <div className="relative -mt-12 lg:-mt-16 grid grid-cols-1 md:grid-cols-3 gap-4">
          {categoryCards.map(({ icon: Icon, title, desc, href, isExternal }, i) => {
            const content = (
              <>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-sofia text-primary text-xl leading-tight">
                    {title}
                  </div>
                  <div className="text-sm text-foreground/70 leading-snug mt-0.5">
                    {desc}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-primary/70 group-hover:translate-x-1 transition-transform" />
              </>
            );

            const cls =
              "group flex items-center gap-4 rounded-2xl border border-primary/25 bg-background/85 backdrop-blur p-4 shadow-lg hover:border-primary hover:shadow-warm transition-all animate-fade-in-up opacity-0";
            const style = {
              animationDelay: `${0.35 + i * 0.1}s`,
              animationFillMode: "forwards" as const,
            };

            if (isExternal) {
              return (
                <Link key={title} to={href} className={cls} style={style}>
                  {content}
                </Link>
              );
            }
            return (
              <button
                key={title}
                onClick={() => scrollTo(href.replace("#", ""))}
                className={cls + " text-left"}
                style={style}
              >
                {content}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
