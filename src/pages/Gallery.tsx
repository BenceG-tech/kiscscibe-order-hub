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
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      {/* Hero section */}
      <section className="pt-24 pb-8 md:pt-32 md:pb-12 bg-gradient-to-b from-primary/5 to-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-3">
            Galéria
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
            Fedezze fel ételeinket és hangulatos éttermünket
          </p>
        </div>
      </section>

      {/* Gallery content */}
      <section className="py-8 md:py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {isMobile ? (
            // Mobile: Tabs
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full mb-6">
                <TabsTrigger value="food" className="flex-1 flex items-center gap-2">
                  <Utensils className="h-4 w-4" />
                  Ételek
                </TabsTrigger>
                <TabsTrigger value="interior" className="flex-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Étterem
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="food">
                <FoodGallery />
              </TabsContent>
              
              <TabsContent value="interior">
                <InteriorGallery />
              </TabsContent>
            </Tabs>
          ) : (
            // Desktop: Both galleries stacked
            <div className="space-y-16">
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
