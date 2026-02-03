import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Car, Bus, ExternalLink } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast({
      title: "Üzenet elküldve",
      description: "Köszönjük megkeresését! Hamarosan válaszolunk."
    });
    
    setFormData({ name: "", email: "", phone: "", message: "" });
    setIsSubmitting(false);
  };

  const openingHours = [
    { day: "Hétfő", hours: "7:00 - 16:00", isOpen: true },
    { day: "Kedd", hours: "7:00 - 16:00", isOpen: true },
    { day: "Szerda", hours: "7:00 - 16:00", isOpen: true },
    { day: "Csütörtök", hours: "7:00 - 16:00", isOpen: true },
    { day: "Péntek", hours: "7:00 - 16:00", isOpen: true },
    { day: "Szombat", hours: "Zárva", isOpen: false },
    { day: "Vasárnap", hours: "Zárva", isOpen: false }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <div className="pt-20 pb-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-warmth/10 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Kapcsolat
            </h1>
            <p className="text-xl text-muted-foreground">
              Vegye fel velünk a kapcsolatot! Szívesen válaszolunk kérdéseire.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            {/* Contact Information */}
            <div className="space-y-8">
              {/* Basic Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <MapPin className="h-6 w-6 text-primary" />
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
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <Clock className="h-6 w-6 text-primary" />
                    Nyitvatartás
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {openingHours.map((day, index) => (
                      <div key={index} className="flex justify-between items-center py-1">
                        <span className="font-medium">{day.day}</span>
                        <span className={`${day.isOpen ? 'text-green-600' : 'text-red-500'} font-semibold`}>
                          {day.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Transportation */}
              <Card>
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
                className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm" 
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

            {/* Contact Form */}
            <Card>
              <CardHeader>
                <CardTitle>Írjon nekünk!</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Név *</Label>
                      <Input 
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({...prev, name: e.target.value}))}
                        required
                        placeholder="Az Ön neve"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input 
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({...prev, phone: e.target.value}))}
                        placeholder="+36 30 123 4567"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email cím *</Label>
                    <Input 
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                      required
                      placeholder="pelda@email.com"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Üzenet *</Label>
                    <Textarea 
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({...prev, message: e.target.value}))}
                      required
                      placeholder="Írja ide kérdését vagy üzenetét..."
                      rows={5}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Küldés..." : "Üzenet küldése"}
                  </Button>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    * Kötelező mezők. Általában 24 órán belül válaszolunk.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Embedded Map */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">Találjon meg minket!</h2>
            <div className="rounded-2xl overflow-hidden shadow-lg">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2695.4692819165434!2d19.1213!3d47.5597!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNDfCsDMzJzM1LjAiTiAxOcKwMDcnMTYuNyJF!5e0!3m2!1shu!2shu!4v1642782234567!5m2!1shu!2shu"
                width="100%"
                height="400"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Kiscsibe Reggeliző & Étterem térképe"
              />
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Contact;