import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { CalendarDays, Users, ChefHat, Star, Heart, Clock, Leaf, Award, Coffee, Utensils, MapPin, ThumbsUp, type LucideIcon } from "lucide-react";
import heroImage from "@/assets/hero-desktop.png";
import heroBreakfast from "@/assets/hero-breakfast.jpg";
import type { AboutPageContent } from "@/components/admin/AboutPageEditor";

const ICON_MAP: Record<string, LucideIcon> = {
  CalendarDays, Users, ChefHat, Star, Heart, Clock, Leaf,
  Award, Coffee, Utensils, MapPin, ThumbsUp,
};

const About = () => {
  const { data: content } = useQuery({
    queryKey: ["about-page-content"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("value_json")
        .eq("key", "about_page")
        .maybeSingle();
      if (error) throw error;
      return (data?.value_json as unknown) as AboutPageContent | null;
    },
  });

  // Fallback to hardcoded defaults
  const heroTitle = content?.heroTitle || "Rólunk";
  const heroSubtitle = content?.heroSubtitle || "Családi hagyományok, modern körülmények";
  const heroImg = content?.heroImageUrl || heroImage;
  const storyTitle = content?.storyTitle || "Történetünk";
  const storyImg = content?.storyImageUrl || heroBreakfast;
  const storyParagraphs = content?.storyParagraphs || [
    "2018-ban nyitottuk meg első éttermünket a Vezér utcában, azzal a küldetéssel, hogy minőségi, otthonos ételeket kínáljunk kedvező áron.",
    "Kezdetben csak reggeliket és könnyű ebédeket szolgáltunk fel, de vendégeink kérésére bővítettük kínálatunkat. Ma már teljes értékű napi menüket és változatos à la carte ételeket készítünk.",
    "Büszkék vagyunk arra, hogy sok vendégünk már családtagként kezel minket, és nap mint nap visszatér hozzánk egy-egy finom falatra.",
  ];
  const missionTitle = content?.missionTitle || "Küldetésünk";
  const missionText = content?.missionText || "Célunk, hogy minden vendégünk úgy érezze magát nálunk, mintha otthon lenne. Friss alapanyagokból, szeretettel készített ételekkel szeretnénk boldoggá tenni a mindennapi életét, legyen szó egy gyors reggeliről vagy egy kiadós ebédről.";

  const stats = content?.stats || [
    { id: "1", number: "2018", label: "Megnyitás éve", icon: "CalendarDays" },
    { id: "2", number: "500+", label: "Elégedett vendég", icon: "Users" },
    { id: "3", number: "50+", label: "Különböző étel", icon: "ChefHat" },
    { id: "4", number: "4.8", label: "Átlagos értékelés", icon: "Star" },
  ];

  const values = content?.values || [
    { id: "1", icon: "Heart", title: "Szeretettel főzünk", description: "Minden ételt családi receptek alapján, gondosan készítünk el" },
    { id: "2", icon: "Leaf", title: "Friss alapanyagok", description: "Napi friss beszerzés a legjobb minőségért" },
    { id: "3", icon: "Clock", title: "Gyors kiszolgálás", description: "Értékeljük az idődet, gyors és hatékony kiszolgálás" },
    { id: "4", icon: "Star", title: "Minőség", description: "Hagyományos magyar ízek modern körülmények között" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img src={heroImg} alt="Kiscsibe Reggeliző belső tere" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center text-white px-6">
              <h1 className="text-3xl md:text-5xl font-sofia font-bold mb-2 animate-fade-in-up">{heroTitle}</h1>
              <p className="text-lg md:text-xl text-gray-200 animate-fade-in-up opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                {heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        <div className="pt-12 pb-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            
            {/* Stats */}
            <section className="py-8 md:py-12 -mt-16 md:-mt-20 relative z-10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                {stats.map((stat, i) => {
                  const IconComp = ICON_MAP[stat.icon] || Star;
                  return (
                    <Card key={stat.id || i} className="border-0 bg-card/95 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-4 md:p-6 text-center">
                        <IconComp className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-2 md:mb-3 text-primary" />
                        <div className="text-2xl md:text-3xl font-bold text-foreground">{stat.number}</div>
                        <div className="text-xs md:text-sm text-muted-foreground mt-1">{stat.label}</div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Story */}
            <section className="py-12 md:py-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-center">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl order-2 lg:order-1">
                  <img src={storyImg} alt="Kiscsibe ételek" className="w-full aspect-[4/3] object-cover" />
                </div>
                <div className="space-y-6 order-1 lg:order-2">
                  <h2 className="text-3xl md:text-4xl font-sofia font-bold text-foreground">{storyTitle}</h2>
                  <div className="space-y-4 text-muted-foreground leading-relaxed">
                    {storyParagraphs.map((p, i) => (
                      <p key={i} className={i === 0 ? "text-lg" : ""}>{p}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Values */}
            <section className="py-12 md:py-16">
              <h2 className="text-3xl md:text-4xl font-sofia font-bold text-center text-foreground mb-8 md:mb-12">Értékeink</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {values.map((value, index) => {
                  const IconComp = ICON_MAP[value.icon] || Star;
                  return (
                    <Card key={value.id || index} className="border-0 bg-card shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                      <CardContent className="p-6 text-center">
                        <div className="w-14 h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary to-primary/70 rounded-2xl mx-auto mb-4 flex items-center justify-center text-primary-foreground shadow-lg">
                          <IconComp className="h-7 w-7 md:h-8 md:w-8" />
                        </div>
                        <h3 className="font-bold text-lg mb-2 text-foreground">{value.title}</h3>
                        <p className="text-muted-foreground text-sm">{value.description}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </section>

            {/* Mission */}
            <section className="py-12 md:py-16">
              <Card className="border-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-xl overflow-hidden">
                <CardContent className="p-8 md:p-12 text-center relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />
                  <div className="relative z-10">
                    <h2 className="text-3xl md:text-4xl font-sofia font-bold text-foreground mb-6">{missionTitle}</h2>
                    <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">{missionText}</p>
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
