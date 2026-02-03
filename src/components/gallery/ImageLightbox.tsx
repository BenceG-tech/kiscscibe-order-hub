import { useEffect, useCallback, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  title?: string | null;
}

interface ImageLightboxProps {
  images: GalleryImage[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
}

const ImageLightbox = ({ images, initialIndex, isOpen, onClose }: ImageLightboxProps) => {
  const [currentSlide, setCurrentSlide] = useState(initialIndex);
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    startIndex: initialIndex,
    loop: true 
  });

  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  // Track current slide
  useEffect(() => {
    if (!emblaApi) return;
    
    const onSelect = () => {
      setCurrentSlide(emblaApi.selectedScrollSnap());
    };
    
    emblaApi.on("select", onSelect);
    onSelect();
    
    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  // Reset to initial index when opening
  useEffect(() => {
    if (isOpen && emblaApi) {
      emblaApi.scrollTo(initialIndex, true);
      setCurrentSlide(initialIndex);
    }
  }, [isOpen, initialIndex, emblaApi]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowLeft") {
        scrollPrev();
      } else if (e.key === "ArrowRight") {
        scrollNext();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose, scrollPrev, scrollNext]);

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const currentImage = images[currentSlide];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Modal Container - ACAIA style white modal */}
      <div 
        className="relative bg-card rounded-2xl md:rounded-3xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Counter Badge - centered top */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-foreground text-background px-4 py-1.5 rounded-full text-sm font-medium">
          {currentSlide + 1} / {images.length}
        </div>

        {/* Close Button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4 z-20 bg-background/80 hover:bg-background rounded-full shadow-md h-10 w-10"
          onClick={onClose}
        >
          <X className="h-5 w-5 text-foreground" />
        </Button>

        {/* Main Content Area */}
        <div className="relative flex items-center justify-center pt-16 pb-4 px-4 md:px-16">
          {/* Previous button - outside image on desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background rounded-full shadow-lg h-10 w-10 md:h-12 md:w-12"
            onClick={scrollPrev}
          >
            <ChevronLeft className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
          </Button>

          {/* Embla viewport */}
          <div className="overflow-hidden w-full max-w-3xl mx-auto" ref={emblaRef}>
            <div className="flex">
              {images.map((image) => (
                <div 
                  key={image.id}
                  className="flex-[0_0_100%] min-w-0 flex items-center justify-center px-2"
                >
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl"
                    draggable={false}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Next button - outside image on desktop */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/90 hover:bg-background rounded-full shadow-lg h-10 w-10 md:h-12 md:w-12"
            onClick={scrollNext}
          >
            <ChevronRight className="h-5 w-5 md:h-6 md:w-6 text-foreground" />
          </Button>
        </div>

        {/* Title and Info - below image */}
        <div className="px-6 pb-6 text-center">
          {currentImage?.title && (
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
              {currentImage.title}
            </h3>
          )}
          
          {/* Dot indicators for mobile */}
          <div className="flex justify-center gap-1.5 mt-4 md:hidden">
            {images.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentSlide
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          
          {/* Desktop hint */}
          <p className="text-sm text-muted-foreground hidden md:block mt-2">
            Nyilakkal vagy swipe-pal navigálhatsz • ESC a bezáráshoz
          </p>
        </div>
      </div>
    </div>
  );
};

export default ImageLightbox;
