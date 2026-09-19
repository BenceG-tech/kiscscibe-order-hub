import { useState } from "react";
import SEO from "@/components/SEO";
import ModernNavigation from "@/components/ModernNavigation";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Utensils, Building2 } from "lucide-react";

const Gallery = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("food");

  return (
    <div className="homepage-editorial min-h-screen bg-background relative">
      <SEO
        title="Galéria — Ételeink és éttermünk fotói | Kiscsibe"
        description="Tekintsd meg a Kiscsibe Étterem fotóit: friss házi ételek, hangulatos belső tér Zuglóban. Ételek és éttermi galéria."
        path="/gallery"
      />
      <ModernNavigation />
      
      {/* Hero section */}
       <section className="gingham-edge bg-editorial pb-12 pt-28 text-editorial-foreground md:pb-16 md:pt-36 relative z-10">
         <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
           <span className="section-kicker">
            Képek & Élmények
          </span>
           <h1 className="mt-3 font-sofia text-4xl font-bold text-editorial-foreground md:text-6xl">
            Galéria
          </h1>
           <p className="text-editorial-muted text-base md:text-lg max-w-2xl mt-4">
            Fedezze fel ételeinket és hangulatos éttermünket
          </p>
        </div>
      </section>

      {/* Gallery content */}
      <section className="py-8 md:py-16 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isMobile ? (
            // Mobile: Pill-style Tabs
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <div className="flex justify-center mb-8">
                <TabsList className="inline-flex bg-transparent p-0 gap-2 h-auto border-none shadow-none">
                  <TabsTrigger 
                    value="food" 
                    className="rounded-full px-6 py-3 border-2 border-primary/30 bg-transparent text-foreground data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-primary-foreground shadow-none"
                  >
                    <Utensils className="h-4 w-4 mr-2" />
                    Ételek
                  </TabsTrigger>
                  <TabsTrigger 
                    value="interior" 
                    className="rounded-full px-6 py-3 border-2 border-primary/30 bg-transparent text-foreground data-[state=active]:bg-primary data-[state=active]:border-primary data-[state=active]:text-primary-foreground shadow-none"
                  >
                    <Building2 className="h-4 w-4 mr-2" />
                    Étterem
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="food" className="mt-0">
                <FoodGallery />
              </TabsContent>
              
              <TabsContent value="interior" className="mt-0">
                <InteriorGallery />
              </TabsContent>
            </Tabs>
          ) : (
            // Desktop: Both galleries stacked
            <div className="space-y-20">
              <FoodGallery />
              <InteriorGallery />
            </div>
          )}
        </div>
      </section>
      <Footer />
      <MobileBottomNav />
      <div className="h-16 md:h-0" />
    </div>
  );
};

export default Gallery;
