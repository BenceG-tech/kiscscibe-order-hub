import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, ChefHat, Star, Heart, Clock, Leaf } from "lucide-react";
import heroImage from "@/assets/hero-desktop.png";
import heroBreakfast from "@/assets/hero-breakfast.jpg";

const About = () => {
  const stats = [
    { number: "2018", label: "Megnyitás éve", icon: CalendarDays },
    { number: "500+", label: "Elégedett vendég", icon: Users },
    { number: "50+", label: "Különböző étel", icon: ChefHat },
    { number: "4.8", label: "Átlagos értékelés", icon: Star },
  ];

  const values = [
    {
      icon: Heart,
      title: "Szeretettel főzünk",
      description: "Minden ételt családi receptek alapján, gondosan készítünk el"
    },
    {
      icon: Leaf,
      title: "Friss alapanyagok",
      description: "Napi friss beszerzés a legjobb minőségért"
    },
    {
      icon: Clock,
      title: "Gyors kiszolgálás",
      description: "Értékeljük az idődet, gyors és hatékony kiszolgálás"
    },
    {
      icon: Star,
      title: "Minőség",
      description: "Hagyományos magyar ízek modern körülmények között"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <main className="pt-20">
        {/* Hero Section - Full width image */}
        <section className="relative h-[50vh] md:h-[60vh] overflow-hidden">
          <img 
            src={heroImage} 
            alt="Kiscsibe Reggeliző belső tere"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12 lg:p-16">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-sofia font-bold text-white mb-3 animate-fade-in-up">
                Rólunk
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-white/90 max-w-2xl animate-fade-in-up" 
                 style={{ animationDelay: '0.15s' }}>
                Családi hagyományok, modern körülmények
              </p>
            </div>
          </div>
        </section>

        <div className="pt-12 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Stats Section - Modern Bento Grid */}
            <section className="py-8 md:py-12 -mt-16 md:-mt-20 relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, i) => (
                  <Card 
                    key={i}
                    className="border-0 bg-card/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-4 md:p-6 text-center">
                      <stat.icon className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-primary" />
                      <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.number}</div>
                      <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Story Section - Image + Text */}
            <section className="py-12 md:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                {/* Image */}
                <div className="relative rounded-3xl overflow-hidden shadow-2xl order-2 lg:order-1">
                  <img 
                    src={heroBreakfast} 
                    alt="Kiscsibe ételek"
                    className="w-full aspect-[4/3] object-cover"
                  />
                </div>
                
                {/* Text */}
                <div className="space-y-6 order-1 lg:order-2">
                  <h2 className="text-3xl md:text-4xl font-sofia font-bold text-foreground">
                    Történetünk
                  </h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    <p className="text-lg">
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
              </div>
            </section>

            {/* Values Section */}
            <section className="py-12 md:py-16">
              <h2 className="text-3xl md:text-4xl font-sofia font-bold text-center text-foreground mb-8 md:mb-12">
                Értékeink
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {values.map((value, index) => (
                  <Card 
                    key={index} 
                    className="border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mx-auto mb-4 flex items-center justify-center text-primary-foreground shadow-lg">
                        <value.icon className="h-7 w-7 md:h-8 md:w-8" />
                      </div>
                      <h3 className="font-bold text-lg mb-2 text-foreground">{value.title}</h3>
                      <p className="text-muted-foreground text-sm">{value.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Mission Section */}
            <section className="py-12 md:py-16">
              <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-xl overflow-hidden">
                <CardContent className="p-8 md:p-12 text-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-sofia font-bold text-foreground mb-6">
                      Küldetésünk
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                      Célunk, hogy minden vendégünk úgy érezze magát nálunk, mintha otthon lenne. 
                      Friss alapanyagokból, szeretettel készített ételekkel szeretnénk boldoggá tenni 
                      a mindennapi életét, legyen szó egy gyors reggeliről vagy egy kiadós ebédről.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default About;
