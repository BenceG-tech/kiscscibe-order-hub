import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Users, Clock, Award } from "lucide-react";

const About = () => {
  const teamMembers = [
    {
      name: "Nagy Péter",
      role: "Tulajdonos & Főszakács",
      description: "20+ éves tapasztalat a vendéglátásban",
      image: "👨‍🍳"
    },
    {
      name: "Kiss Mária",
      role: "Konyhafőnök",
      description: "Hagyományos magyar konyha specialistája",
      image: "👩‍🍳"
    },
    {
      name: "Szabó Anna",
      role: "Pincér & Ügyfélszolgálat",
      description: "Barátságos kiszolgálás és vendégélmény",
      image: "👩‍💼"
    }
  ];

  const values = [
    {
      icon: Heart,
      title: "Szeretettel főzünk",
      description: "Minden ételt családi receptek alapján, gondosan készítünk el"
    },
    {
      icon: Users,
      title: "Közösség",
      description: "Vendégeink visszatérő családtagjaink, akikre mindig számítunk"
    },
    {
      icon: Clock,
      title: "Friss alapanyagok",
      description: "Napi friss beszerzés a legjobb minőségért"
    },
    {
      icon: Award,
      title: "Minőség",
      description: "Hagyományos magyar ízek modern körülmények között"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <div className="pt-20 pb-12">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary/10 to-warmth/10 py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Rólunk
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              A Kiscsibe Reggeliző családi vállalkozásként indult, és azóta is 
              a hagyományos magyar ízeket képviseljük a XIV. kerületben.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Story Section */}
          <section className="py-16">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-6">Történetünk</h2>
                <div className="space-y-4 text-muted-foreground leading-relaxed">
                  <p>
                    2018-ban nyitottuk meg első éttermünket a Vezér utcában, azzal a küldetéssel, 
                    hogy minőségi, otthonos ételeket kínáljunk kedvező áron.
                  </p>
                  <p>
                    Kezdetben csak reggeliket és könnyű ebédeket szolgáltunk fel, de vendégeink 
                    kérésére bővítettük kínálatunkat. Ma már teljes értékű napi menüket és 
                    változatos à la carte ételeket készítünk.
                  </p>
                  <p>
                    Büszkék vagyunk arra, hogy sok vendégünk már családtagként kezel minket, 
                    és nap mint nap visszatér hozzánk egy-egy finom falatra.
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="aspect-square bg-gradient-to-br from-primary/20 to-warmth/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🍳</div>
                    <p className="font-semibold text-sm">2018-ban</p>
                    <p className="text-xs text-muted-foreground">megnyitás</p>
                  </div>
                </Card>
                <Card className="aspect-square bg-gradient-to-br from-warmth/20 to-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">👥</div>
                    <p className="font-semibold text-sm">500+</p>
                    <p className="text-xs text-muted-foreground">elégedett vendég</p>
                  </div>
                </Card>
                <Card className="aspect-square bg-gradient-to-br from-primary/20 to-warmth/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">🥘</div>
                    <p className="font-semibold text-sm">50+</p>
                    <p className="text-xs text-muted-foreground">különböző étel</p>
                  </div>
                </Card>
                <Card className="aspect-square bg-gradient-to-br from-warmth/20 to-primary/20 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-4xl mb-2">⭐</div>
                    <p className="font-semibold text-sm">4.8/5</p>
                    <p className="text-xs text-muted-foreground">értékelés</p>
                  </div>
                </Card>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-16 bg-primary/5 rounded-2xl mb-16">
            <div className="px-8">
              <h2 className="text-3xl font-bold text-center text-foreground mb-12">Értékeink</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {values.map((value, index) => (
                  <Card key={index} className="text-center hover:shadow-cozy transition-shadow duration-300">
                    <CardContent className="p-6">
                      <div className="w-16 h-16 bg-gradient-to-br from-primary to-warmth rounded-full mx-auto mb-4 flex items-center justify-center text-white">
                        <value.icon className="h-8 w-8" />
                      </div>
                      <h3 className="font-bold text-lg mb-2">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-16">
            <h2 className="text-3xl font-bold text-center text-foreground mb-12">Csapatunk</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <Card key={index} className="text-center hover:shadow-cozy transition-all duration-300 hover-scale">
                  <CardContent className="p-8">
                    <div className="text-6xl mb-4">{member.image}</div>
                    <h3 className="font-bold text-xl mb-2">{member.name}</h3>
                    <Badge variant="secondary" className="mb-4">{member.role}</Badge>
                    <p className="text-muted-foreground">{member.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Mission Section */}
          <section className="py-16">
            <Card className="bg-gradient-to-br from-primary/10 to-warmth/10 border-primary/20">
              <CardContent className="p-12 text-center">
                <h2 className="text-3xl font-bold text-foreground mb-6">Küldetésünk</h2>
                <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                  Célunk, hogy minden vendégünk úgy érezze magát nálunk, mintha otthon lenne. 
                  Friss alapanyagokból, szeretettel készített ételekkel szeretnénk boldoggá tenni 
                  a mindennapi életét, legyen szó egy gyors reggeliről vagy egy kiadós ebédről.
                </p>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
};

export default About;