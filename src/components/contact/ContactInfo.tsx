import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Mail, Clock, Car, Bus, ExternalLink, Facebook, Instagram } from "lucide-react";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.12z"/>
  </svg>
);

const openingHours = [
  { day: "Hétfő", hours: "7:00 - 16:00", isOpen: true },
  { day: "Kedd", hours: "7:00 - 16:00", isOpen: true },
  { day: "Szerda", hours: "7:00 - 16:00", isOpen: true },
  { day: "Csütörtök", hours: "7:00 - 16:00", isOpen: true },
  { day: "Péntek", hours: "7:00 - 16:00", isOpen: true },
  { day: "Szombat", hours: "Zárva", isOpen: false },
  { day: "Vasárnap", hours: "Zárva", isOpen: false },
];

const ContactInfo = () => {
  return (
    <div className="space-y-6">
      {/* Basic Info */}
      <Card className="border-0 bg-card shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <MapPin className="h-5 w-5 text-primary" />
            </div>
            Elérhetőségek
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Kiscsibe Reggeliző & Étterem</p>
              <p className="text-muted-foreground">1145 Budapest, Vezér utca 12.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <a href="mailto:kiscsibeetterem@gmail.com" className="hover:text-primary transition-colors">
              kiscsibeetterem@gmail.com
            </a>
          </div>
          
          {/* Social Media */}
          <div className="pt-2 border-t border-border">
            <p className="text-sm font-semibold mb-3">Kövess minket</p>
            <div className="flex items-center gap-3">
              <a 
                href="https://www.facebook.com/kiscsibeetteremXIV/?locale=hu_HU" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors opacity-60"
                aria-label="Instagram (hamarosan)"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-colors opacity-60"
                aria-label="TikTok (hamarosan)"
              >
                <TikTokIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Opening Hours */}
      <Card className="border-0 bg-card shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            Nyitvatartás
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {openingHours.map((day, index) => (
              <div key={index} className="flex justify-between items-center py-2 px-3 rounded-xl bg-muted/30">
                <span className="font-medium">{day.day}</span>
                <span className={`${day.isOpen ? 'text-primary' : 'text-muted-foreground'} font-semibold`}>
                  {day.hours}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Transportation */}
      <Card className="border-0 bg-card shadow-lg rounded-3xl">
        <CardHeader>
          <CardTitle>Megközelítés</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3">
            <Car className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Autóval</p>
              <p className="text-muted-foreground text-sm">
                Ingyenes parkolási lehetőség a környező utcákban
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Bus className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="font-semibold">Tömegközlekedéssel</p>
              <p className="text-muted-foreground text-sm">
                7-es busz megállója 2 perc sétára
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Button */}
      <Button
        className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm rounded-xl"
        asChild
      >
        <a
          href="https://maps.google.com/?q=1145+Budapest+Vezér+utca+12"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Megnyitás Google Térképen
        </a>
      </Button>
    </div>
  );
};

export default ContactInfo;
