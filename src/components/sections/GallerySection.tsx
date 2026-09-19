import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Building2 } from "lucide-react";

const GallerySection = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-8 max-w-xl">
          <span className="section-kicker">A pultból</span>
          <h2 className="section-title">Ilyen nálunk az ebéd</h2>
          <p className="mt-3 text-muted-foreground">Valódi adagok, frissen készült ételek és a Kiscsibe mindennapi hangulata.</p>
        </div>
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
