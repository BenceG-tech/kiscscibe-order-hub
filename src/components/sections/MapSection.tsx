import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

const MapSection = () => {
  const { address } = useRestaurantSettings();
  const mapsQuery = encodeURIComponent(address.full);

  return (
    <section className="py-8 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-xl md:text-3xl font-bold text-center text-foreground mb-6 md:mb-8">
          Megközelítés
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-center">
          {/* Térkép - mobile: order-2 (after info) */}
          <div className="relative order-2 lg:order-none">
            <div className="rounded-2xl overflow-hidden shadow-lg">
                <iframe
                  src={`https://www.google.com/maps?q=${mapsQuery}&hl=hu&z=17&output=embed`}
                width="100%"
                height="300"
                className="h-[220px] md:h-[300px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kiscsibe Reggeliző & Étterem helye"
              />
            </div>
          </div>
          
          {/* Információk - mobile: order-1 (before map) */}
          <Card className="rounded-2xl shadow-md border-primary/10 order-1 lg:order-none">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-foreground text-lg mb-2">Kiscsibe Reggeliző & Étterem</h3>
                  <p className="text-muted-foreground mb-1">{address.zip} {address.city}</p>
                  <p className="text-muted-foreground mb-4">{address.street}</p>
                </div>
              </div>
              
              <div className="mb-5 md:mb-6">
                <p className="text-foreground text-sm md:text-base leading-relaxed">
                  Könnyű megközelítés és ingyenes parkolás.
                </p>
              </div>
              
              <Button 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold min-h-[44px]"
                asChild
              >
                <a 
                  href={`https://maps.google.com/?q=${mapsQuery}`}
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