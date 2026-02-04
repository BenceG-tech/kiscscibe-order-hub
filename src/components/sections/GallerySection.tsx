import FoodGallery from "@/components/gallery/FoodGallery";
import InteriorGallery from "@/components/gallery/InteriorGallery";
import { useIsMobile } from "@/hooks/use-mobile";

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
        {/* No redundant header - FoodGallery and InteriorGallery have their own headers */}
        <div className="space-y-16 md:space-y-20">
          <FoodGallery compact={isMobile} />
          <InteriorGallery compact={isMobile} />
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
