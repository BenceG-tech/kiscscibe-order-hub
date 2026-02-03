import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { useIsMobile } from "@/hooks/use-mobile";

const GallerySection = () => {
  const isMobile = useIsMobile();

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Galéria
        </h2>
        
        <div className="space-y-12">
          <FoodGallery compact={isMobile} />
          <InteriorGallery compact={isMobile} />
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
