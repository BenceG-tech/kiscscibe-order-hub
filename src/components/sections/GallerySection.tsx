import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Utensils, Building2 } from "lucide-react";

const GallerySection = () => {
  const isMobile = useIsMobile();

  return (
    <section className="relative overflow-hidden py-10 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="mb-6 max-w-xl md:mb-8">
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
           <div className="space-y-10 md:space-y-12">
            <div><h3 className="mb-4 font-sofia text-2xl font-bold">Ételek &amp; italok</h3><FoodGallery compact={false} noHeader maxImages={6} /></div>
            <div><h3 className="mb-4 font-sofia text-2xl font-bold">Éttermünk</h3><InteriorGallery compact={false} noHeader maxImages={6} /></div>
          </div>
        )}
      </div>
    </section>
  );
};

export default GallerySection;
