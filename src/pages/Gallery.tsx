import { useState } from "react";
import ModernNavigation from "@/components/ModernNavigation";
import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIsMobile } from "@/hooks/use-mobile";
import { Utensils, Building2 } from "lucide-react";

const Gallery = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("food");

  return (
    <div className="min-h-screen bg-background relative">
      {/* Decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <ModernNavigation />
      
      {/* Hero section */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12 relative z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Képek & Élmények
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground mt-2 mb-4">
            Galéria
          </h1>
          <div className="w-16 h-1 bg-primary mx-auto rounded-full" />
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto mt-4">
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
    </div>
  );
};

export default Gallery;
