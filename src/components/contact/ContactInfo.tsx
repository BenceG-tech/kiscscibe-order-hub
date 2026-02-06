import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Phone, Mail, Clock, Car, Bus, ExternalLink } from "lucide-react";

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
            <Phone className="h-5 w-5 text-primary" />
            <a href="tel:+3612345678" className="hover:text-primary transition-colors">
              +36 1 234 5678
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-primary" />
            <a href="mailto:kiscsibeetterem@gmail.com" className="hover:text-primary transition-colors">
              kiscsibeetterem@gmail.com
            </a>
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
