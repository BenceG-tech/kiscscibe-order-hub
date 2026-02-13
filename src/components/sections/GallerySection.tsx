import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Building2 } from "lucide-react";

const GallerySection = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 bg-secondary/5 rounded-full blur-3xl" />
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {isMobile ? (
          /* Mobile: Tab-based navigation - limited preview */
          <Tabs defaultValue="food" className="w-full">
            <TabsList className="w-full grid grid-cols-2 mb-6">
              <TabsTrigger value="food" className="flex items-center gap-2">
                <Utensils className="h-4 w-4" />
                Ételek
              </TabsTrigger>
              <TabsTrigger value="interior" className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Éttermünk
              </TabsTrigger>
            </TabsList>
            <TabsContent value="food">
              <FoodGallery compact noHeader maxImages={4} />
            </TabsContent>
            <TabsContent value="interior">
              <InteriorGallery compact noHeader maxImages={4} />
            </TabsContent>
          </Tabs>
        ) : (
          /* Desktop: Stacked layout with headers - limited preview */
          <div className="space-y-16 md:space-y-20">
            <FoodGallery compact={false} maxImages={6} />
            <InteriorGallery compact={false} maxImages={6} />
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
