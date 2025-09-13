import Navigation from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { MapPin, Phone, Mail, Clock, Facebook, Instagram } from "lucide-react";

const Contact = () => {
  const contactInfo = [
    {
      icon: MapPin,
      title: "Címünk",
      details: "1051 Budapest, Példa utca 12.",
      action: "Útvonalterv",
      href: "https://maps.google.com"
    },
    {
      icon: Phone,
      title: "Telefonszám",
      details: "+36 1 234 5678",
      action: "Hívás",
      href: "tel:+36123456789"
    },
    {
      icon: Mail,
      title: "E-mail",
      details: "info@kiscscibe.hu",
      action: "E-mail küldése",
      href: "mailto:info@kiscscibe.hu"
    },
    {
      icon: Clock,
      title: "Nyitvatartás",
      details: "Hétfő-Péntek: 7:00-15:00\nSzombat: 8:00-14:00\nVasárnap: Zárva",
      action: null
    }
  ];

  const socialLinks = [
    {
      icon: Facebook,
      name: "Facebook",
      href: "https://facebook.com/kiscscibereggelizo",
      color: "text-blue-600"
    },
    {
      icon: Instagram,
      name: "Instagram", 
      href: "https://instagram.com/kiscscibereggelizo",
      color: "text-pink-600"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Kapcsolat
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Lépj kapcsolatba velünk! Szívesen válaszolunk minden kérdésedre.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold mb-6 text-foreground">Elérhetőségeink</h2>
              
              <div className="space-y-6 mb-8">
                {contactInfo.map((info, index) => {
                  const IconComponent = info.icon;
                  return (
                    <Card key={index} className="shadow-soft">
                      <CardContent className="p-6">
                        <div className="flex items-start space-x-4">
                          <div className="flex-shrink-0">
                            <IconComponent className="h-6 w-6 text-primary mt-1" />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold mb-2 text-foreground">{info.title}</h3>
                            <p className="text-muted-foreground whitespace-pre-line mb-3">
                              {info.details}
                            </p>
                            {info.action && (
                              <Button 
                                variant="outline" 
                                size="sm"
                                asChild
                              >
                                <a href={info.href} target="_blank" rel="noopener noreferrer">
                                  {info.action}
                                </a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              {/* Social Media */}
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Kövess minket</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex space-x-4">
                    {socialLinks.map((social, index) => {
                      const IconComponent = social.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          asChild
                          className="flex items-center space-x-2"
                        >
                          <a href={social.href} target="_blank" rel="noopener noreferrer">
                            <IconComponent className={`h-4 w-4 ${social.color}`} />
                            <span>{social.name}</span>
                          </a>
                        </Button>
                      );
                    })}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4">
                    Napi menüink, különleges ajánlataink és kulisszatitkok a közösségi oldalakon!
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Írj nekünk üzenetet</CardTitle>
                </CardHeader>
                <CardContent>
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">Keresztnév *</Label>
                        <Input id="firstName" placeholder="pl. János" required />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Vezetéknév *</Label>
                        <Input id="lastName" placeholder="pl. Kovács" required />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail cím *</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="pelda@email.hu" 
                        required 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefonszám</Label>
                      <Input 
                        id="phone" 
                        type="tel" 
                        placeholder="+36 20 123 4567" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="subject">Tárgy</Label>
                      <Input 
                        id="subject" 
                        placeholder="Miben segíthetünk?" 
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="message">Üzenet *</Label>
                      <Textarea 
                        id="message" 
                        placeholder="Írj nekünk részletesen..."
                        rows={6}
                        required
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
                    >
                      Üzenet küldése
                    </Button>
                  </form>
                  
                  <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      <strong>Gyors válasz:</strong> Sürgős esetben hívj minket a 
                      <a href="tel:+36123456789" className="text-primary font-medium">
                        {" "}+36 1 234 5678{" "}
                      </a>
                      számon, vagy írj üzenetet a Facebook oldalunkon!
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Map Placeholder */}
              <Card className="mt-6 shadow-soft">
                <CardContent className="p-0">
                  <div className="h-64 bg-muted rounded-lg flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MapPin className="h-12 w-12 mx-auto mb-2" />
                      <p>Térkép helye</p>
                      <p className="text-sm">1051 Budapest, Példa utca 12.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;