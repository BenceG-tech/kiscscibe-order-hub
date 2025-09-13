import Navigation from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Users, Award, Clock } from "lucide-react";
import restaurantInterior from "@/assets/restaurant-interior.jpg";

const About = () => {
  const values = [
    {
      icon: Heart,
      title: "Szeretettel készítjük",
      description: "Minden ételt frissen, házi módszerekkel készítünk el, hogy a legjobbat adhassuk vendégeinknek."
    },
    {
      icon: Users,
      title: "Családias hangulat",
      description: "Nálunk mindenki családtag. Barátságos csapatunk minden vendéget szívesen fogad."
    },
    {
      icon: Award,
      title: "Minőségi alapanyagok",
      description: "Csak a legjobb, friss alapanyagokat használjuk, helyi beszállítóktól."
    },
    {
      icon: Clock,
      title: "Több mint 10 éve",
      description: "Már több mint egy évtizede szolgáljuk ki vendégeinket ugyanazzal a lelkesedéssel."
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
              Rólunk
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              A Kiscscibe Reggeliző története, küldetése és az a csapat, 
              amely minden napot egy mosollyal kezd.
            </p>
          </div>

          {/* Main Story Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">A mi történetünk</h2>
              <div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
                <p>
                  A Kiscscibe Reggeliző 2013-ban nyitotta meg kapuit, amikor Kovács Mária és családja 
                  úgy döntött, hogy megvalósítja álmát: egy olyan helyet teremt, ahol az emberek 
                  jól érezhetik magukat, és minőségi házi ételeket fogyaszthatnak.
                </p>
                <p>
                  Kezdetben egy kis 8 asztatos étteremként működtünk, de a vendégek szeretete és 
                  visszajelzései hamar növekedésre ösztönöztek minket. Ma már egy 25 fős csapat 
                  dolgozik azért, hogy minden nap friss, ízletes ételeket szolgáljunk fel.
                </p>
                <p>
                  Filozófiánk egyszerű: minden étel legyen friss, minden vendég érezze magát 
                  családtagnak, és minden nap kezdődjön egy mosollyal. Ez az, ami megkülönböztet 
                  minket a többitől.
                </p>
              </div>
            </div>
            <div>
              <img
                src={restaurantInterior}
                alt="Kiscscibe Reggeliző belső tere"
                className="rounded-lg shadow-cozy w-full h-96 object-cover"
              />
            </div>
          </div>

          {/* Values Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center mb-12 text-foreground">
              Miben hiszünk?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {values.map((value, index) => {
                const IconComponent = value.icon;
                return (
                  <Card key={index} className="text-center shadow-soft hover:shadow-cozy transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <IconComponent className="h-12 w-12 text-primary mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold mb-3 text-foreground">
                        {value.title}
                      </h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {value.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Team Section */}
          <Card className="bg-gradient-to-r from-primary/5 to-warmth/5 border-primary/20">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-4 text-foreground">A mi csapatunk</h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  Szakképzett szakácsaink és barátságos kiszolgálóink minden napot azzal kezdenek, 
                  hogy a legjobb élményt nyújtsák vendégeinknek.
                </p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-8 text-center">
                <div>
                  <div className="w-24 h-24 bg-gradient-to-br from-primary to-warmth rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    M
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Kovács Mária</h3>
                  <p className="text-muted-foreground mb-2">Tulajdonos és főszakács</p>
                  <p className="text-sm text-muted-foreground">
                    25 éves tapasztalat a vendéglátásban
                  </p>
                </div>
                
                <div>
                  <div className="w-24 h-24 bg-gradient-to-br from-accent to-comfort rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    J
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Nagy János</h3>
                  <p className="text-muted-foreground mb-2">Sous chef</p>
                  <p className="text-sm text-muted-foreground">
                    Szakértő a magyaros ételek területén
                  </p>
                </div>
                
                <div>
                  <div className="w-24 h-24 bg-gradient-to-br from-fresh to-comfort rounded-full mx-auto mb-4 flex items-center justify-center text-white text-2xl font-bold">
                    E
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Szabó Eszter</h3>
                  <p className="text-muted-foreground mb-2">Vezető pincér</p>
                  <p className="text-sm text-muted-foreground">
                    Mindig mosolygós és segítőkész
                  </p>
                </div>
              </div>
              
              <div className="text-center mt-8">
                <p className="text-muted-foreground italic">
                  "Minden napunk azzal kezdődik, hogy hogyan tehetjük jobbá vendégeink napját."
                </p>
                <p className="text-sm text-muted-foreground mt-2">- Kovács Mária, tulajdonos</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default About;