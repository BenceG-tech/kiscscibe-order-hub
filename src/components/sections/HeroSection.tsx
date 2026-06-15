import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroDesktop from "@/assets/hero-desktop.png";
import heroMobile from "@/assets/hero-mobile.png";

const HeroSection = () => {
  return (
    <section className="bg-background py-6 md:py-12 px-4 md:px-8">
      <div className="relative max-w-7xl mx-auto rounded-3xl overflow-hidden shadow-2xl bg-card flex flex-col md:flex-row min-h-[600px] md:min-h-[640px]">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-64 h-64 bg-primary rounded-full blur-[120px] opacity-10" />
        <div className="pointer-events-none absolute -bottom-32 -left-32 w-64 h-64 bg-primary rounded-full blur-[120px] opacity-5" />

        {/* Content side */}
        <div className="relative z-20 w-full md:w-1/2 p-8 md:p-14 lg:p-16 flex flex-col justify-center items-center md:items-start text-center md:text-left">
          {/* Top accent */}
          <div
            className="mb-6 flex items-center gap-3 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.05s", animationFillMode: "forwards" }}
          >
            <div className="h-1 w-12 bg-primary rounded-full" />
            <span className="text-primary text-xs md:text-sm font-bold tracking-[0.2em] uppercase">
              Zuglói kedvenc
            </span>
          </div>

          {/* Headline */}
          <div
            className="animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.15s", animationFillMode: "forwards" }}
          >
            <h1 className="font-sofia text-4xl md:text-6xl lg:text-7xl text-card-foreground leading-[1.05] mb-1">
              Kiscsibe
            </h1>
            <h2 className="font-sofia text-3xl md:text-5xl lg:text-6xl text-primary leading-[1.05] mb-6">
              Reggeliző & Étterem
            </h2>
          </div>

          <p
            className="font-sofia text-xl md:text-2xl text-card-foreground/90 mb-5 animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.25s", animationFillMode: "forwards" }}
          >
            házias ízek minden hétköznap
          </p>

          <p
            className="text-sm md:text-base lg:text-lg text-muted-foreground max-w-md mb-10 leading-relaxed animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.35s", animationFillMode: "forwards" }}
          >
            Friss alapanyagokból készült levesek, laktató főételek és felejthetetlen reggelik. Hagyományos receptek, gyors átvétel Zuglóban.
          </p>

          <div
            className="flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto animate-fade-in-up opacity-0"
            style={{ animationDelay: "0.45s", animationFillMode: "forwards" }}
          >
            <Button
              size="lg"
              onClick={() => document.getElementById("napi-ajanlat")?.scrollIntoView({ behavior: "smooth" })}
              className="px-8 md:px-10 py-5 md:py-6 bg-primary hover:bg-primary/90 text-primary-foreground font-sofia text-lg rounded-2xl shadow-xl hover:-translate-y-0.5 transition-all min-h-[48px]"
            >
              Mai ajánlat
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="px-8 md:px-10 py-5 md:py-6 border-2 border-card-foreground/20 hover:border-card-foreground/40 bg-transparent text-card-foreground hover:bg-card-foreground/5 font-sofia text-lg rounded-2xl min-h-[48px]"
            >
              <Link to="/etlap">Teljes étlap</Link>
            </Button>
          </div>

          {/* Status */}
          <div className="mt-10 md:mt-12 pt-8 border-t border-card-foreground/10 w-full flex justify-center md:justify-start">
            <div className="flex items-center gap-3">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-60 animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
              </span>
              <p className="text-xs md:text-sm text-muted-foreground tracking-wider uppercase font-semibold">
                Nyitva: H–P 07:00 — 16:00
              </p>
            </div>
          </div>
        </div>

        {/* Image side */}
        <div className="relative w-full md:w-1/2 min-h-[320px] md:min-h-full overflow-hidden">
          <picture>
            <source media="(min-width: 768px)" srcSet="/images/hero-desktop.webp" type="image/webp" />
            <source srcSet="/images/hero-mobile.webp" type="image/webp" />
            <source media="(min-width: 768px)" srcSet={heroDesktop} />
            <img
              src={heroMobile}
              alt="Kiscsibe Reggeliző & Étterem friss ételek"
              className="absolute inset-0 w-full h-full object-cover transform-gpu motion-safe:animate-subtle-zoom"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              width={1200}
              height={1600}
            />
          </picture>

          {/* Directional fade towards content side */}
          <div className="absolute inset-0 bg-gradient-to-l from-transparent to-card/80 hidden md:block" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent md:hidden" />

          {/* Floating badge */}
          <div className="absolute bottom-6 right-6 bg-primary px-5 py-4 rounded-3xl shadow-2xl rotate-3 hidden lg:block">
            <p className="font-sofia text-primary-foreground text-2xl leading-none">Frissen</p>
            <p className="font-sofia text-primary-foreground/80 text-base leading-none mt-1">készül minden nap</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
