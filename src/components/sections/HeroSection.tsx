import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroDesktop from "@/assets/hero-desktop.png";
import heroMobile from "@/assets/hero-mobile.png";

const HeroSection = () => {

  return (
    <section className="relative min-h-[55vh] md:min-h-[80vh] flex items-center justify-center overflow-hidden">
      {/* Background Image with responsive desktop/mobile versions + WebP */}
      <div className="absolute inset-0">
        <picture>
          {/* WebP sources (optimized, ~200-400KB) */}
          <source media="(min-width: 768px)" srcSet="/images/hero-desktop.webp" type="image/webp" />
          <source srcSet="/images/hero-mobile.webp" type="image/webp" />
          {/* PNG fallback */}
          <source media="(min-width: 768px)" srcSet={heroDesktop} />
          <img
            src={heroMobile}
            alt="Kiscsibe Reggeliző & Étterem friss ételek"
            className="w-full h-full object-cover transform-gpu scale-105 motion-safe:animate-subtle-zoom"
            loading="eager"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/50 pointer-events-none" />
      </div>

      {/* Content with staggered animations */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 
          className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-sofia font-bold mb-6 leading-tight animate-fade-in-up opacity-0"
          style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}
        >
          Kiscsibe Reggeliző & Étterem
          <span className="block text-lg sm:text-2xl md:text-4xl lg:text-5xl mt-2 text-primary font-sofia">
            házias ízek minden hétköznap
          </span>
        </h1>
        
        <p 
          className="text-sm sm:text-lg md:text-xl mb-6 md:mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed animate-fade-in-up opacity-0"
          style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}
        >
          Friss levesek, kiadós főételek, gyors átvétel Zuglóban.
        </p>

        <div 
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up opacity-0"
          style={{ animationDelay: '0.5s', animationFillMode: 'forwards' }}
        >
          <Button 
            size="lg"
            className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-sofia font-bold px-8 hover-scale min-h-[44px]"
            onClick={() => document.getElementById('napi-ajanlat')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Mai ajánlat
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            asChild
            className="border-2 border-white/90 text-white bg-white/10 hover:bg-white hover:text-gray-900 font-sofia font-bold backdrop-blur-md px-8 hover-scale shadow-lg min-h-[44px]"
          >
            <Link to="/etlap">Teljes étlap</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
