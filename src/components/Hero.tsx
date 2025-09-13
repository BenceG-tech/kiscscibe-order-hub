import { Button } from "@/components/ui/button";
import { Clock, MapPin, Phone } from "lucide-react";
import heroImage from "@/assets/hero-breakfast.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <img
          src={heroImage}
          alt="Kiscscibe Reggeliző ételek"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
          Kiscscibe
          <span className="block bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Reggeliző
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl mb-8 text-gray-200 max-w-2xl mx-auto leading-relaxed">
          Friss, házi készítésű reggelik és ebédek a szívében. 
          Kezdd a napot velünk egy meleg, barátságos környezetben!
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <Button size="lg" className="bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm text-lg px-8 py-3">
            Napi Menü
          </Button>
          <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-foreground text-lg px-8 py-3">
            Rendelj Online
          </Button>
        </div>

        {/* Quick Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <Clock className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Nyitvatartás</h3>
            <p className="text-sm text-gray-200">
              Hétfő-Péntek: 7:00-15:00<br />
              Szombat: 8:00-14:00
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Helyszín</h3>
            <p className="text-sm text-gray-200">
              1051 Budapest,<br />
              Példa utca 12.
            </p>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <Phone className="h-8 w-8 text-primary mx-auto mb-3" />
            <h3 className="font-semibold mb-2">Telefon</h3>
            <p className="text-sm text-gray-200">
              +36 1 234 5678<br />
              Hívj bármikor!
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;