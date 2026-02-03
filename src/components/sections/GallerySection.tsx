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
        {/* Section header */}
        <div className="text-center mb-12 md:mb-16">
          <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium">
            Képek & Élmények
          </span>
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mt-2">
            Galéria
          </h2>
          <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
        </div>
        
        <div className="space-y-16 md:space-y-20">
          <FoodGallery compact={isMobile} />
          <InteriorGallery compact={isMobile} />
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
