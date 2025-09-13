import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-breakfast.jpg";

const HeroSection = () => {

  return (
    <section className="relative min-h-[70vh] md:min-h-[80vh] flex items-center justify-center">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Kiscsibe Reggeliző friss ételek"
          className="w-full h-full object-cover"
          loading="eager"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
          Kiscsibe Reggeliző
          <span className="block text-2xl md:text-4xl lg:text-5xl mt-2 text-primary">
            házias ízek minden nap
          </span>
        </h1>
        
        <p className="text-lg md:text-xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Friss levesek, kiadós főételek, gyors átvétel Zuglóban.
        </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in">
              <Button 
                asChild
                size="lg"
                className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-primary-foreground font-semibold px-8 hover-scale"
              >
                <Link to="/etlap">Mai ajánlat</Link>
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                asChild
                className="border-2 border-white/90 text-white bg-white/10 hover:bg-white hover:text-gray-900 font-semibold backdrop-blur-md px-8 hover-scale shadow-lg"
              >
                <Link to="/etlap">Teljes étlap</Link>
              </Button>
            </div>
      </div>
    </section>
  );
};

export default HeroSection;