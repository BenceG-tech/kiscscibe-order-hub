import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";

const MapSection = () => {
  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Megközelítés
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* Térkép */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.4692819165434!2d19.1213!3d47.5597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDMzJzM1LjAiTiAxOcKwMDcnMTYuNyJF!5e0!3m2!1shu!2shu!4v1642782234567!5m2!1shu!2shu"
                width="100%"
                height="300"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kiscsibe Reggeliző helye"
              />
            </div>
          </div>
          
          {/* Információk */}
          <Card className="rounded-2xl shadow-md border-primary/10">
            <CardContent className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Kiscsibe Reggeliző</h3>
                  <p className="text-muted-foreground mb-1">1141 Budapest</p>
                  <p className="text-muted-foreground mb-4">Vezér u. 110.</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-foreground leading-relaxed">
                  XIV. kerület szíve – könnyű parkolás a környező utcákban, 7-es busz megállója 2 percre.
                </p>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px]"
                asChild
              >
                <a 
                  href="https://maps.google.com/?q=1141+Budapest,+Vezér+u.+110" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2"
                >
                  Útvonalterv
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default MapSection;