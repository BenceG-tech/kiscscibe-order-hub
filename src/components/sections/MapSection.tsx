import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, ExternalLink } from "lucide-react";
import { useRestaurantSettings } from "@/hooks/useRestaurantSettings";

const MapSection = () => {
  const { address } = useRestaurantSettings();
  const mapsQuery = encodeURIComponent(address.full);

  return (
    <section className="py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <span className="section-kicker">{address.full}</span>
        <h2 className="section-title mb-5 md:mb-7">Találkozzunk a Kiscsibében</h2>
        
        <div className="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-5">
          {/* Térkép - mobile: order-2 (after info) */}
           <div className="relative order-2 lg:order-none">
             <div className="h-full overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-1.5 shadow-soft">
                <iframe
                  src={`https://www.google.com/maps?q=${mapsQuery}&hl=hu&z=17&output=embed`}
                width="100%"
                height="300"
                className="h-[220px] rounded-xl md:h-[300px]"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kiscsibe Reggeliző & Étterem helye"
              />
            </div>
          </div>
          
          {/* Információk - mobile: order-1 (before map) */}
            <Card className="order-1 rounded-2xl border border-border/60 bg-card/75 text-card-foreground shadow-soft lg:order-none">
            <CardContent className="p-5 md:p-6">
              <div className="flex items-start gap-3 mb-4">
                 <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
                <div>
                   <h3 className="mb-2 text-lg font-bold text-card-foreground">Kiscsibe Reggeliző & Étterem</h3>
                   <p className="mb-1 text-muted-foreground">{address.zip} {address.city}</p>
                   <p className="mb-4 text-muted-foreground">{address.street}</p>
                </div>
              </div>
              
              <div className="mb-5 md:mb-6">
                  <p className="text-sm leading-relaxed text-card-foreground md:text-base">
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