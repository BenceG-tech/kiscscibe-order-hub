import { useEffect, useCallback } from "react";
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

  const currentIndex = emblaApi?.selectedScrollSnap() ?? initialIndex;

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

  // Force re-render when slide changes
  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", () => {
      // Force component update
    });
  }, [emblaApi]);

  if (!isOpen) return null;

  const currentImage = images[emblaApi?.selectedScrollSnap() ?? initialIndex];

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={onClose}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full text-sm font-medium">
          {(emblaApi?.selectedScrollSnap() ?? initialIndex) + 1} / {images.length}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/20"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X className="h-6 w-6" />
        </Button>
      </div>

      {/* Carousel */}
      <div 
        className="flex-1 flex items-center justify-center relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Previous button - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 z-10 text-white hover:bg-white/20 hidden md:flex h-12 w-12"
          onClick={scrollPrev}
        >
          <ChevronLeft className="h-8 w-8" />
        </Button>

        {/* Embla viewport */}
        <div className="overflow-hidden w-full h-full" ref={emblaRef}>
          <div className="flex h-full">
            {images.map((image) => (
              <div 
                key={image.id}
                className="flex-[0_0_100%] min-w-0 flex items-center justify-center p-4"
              >
                <img
                  src={image.image_url}
                  alt={image.alt_text}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Next button - desktop only */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 z-10 text-white hover:bg-white/20 hidden md:flex h-12 w-12"
          onClick={scrollNext}
        >
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      {/* Title and swipe indicator */}
      <div className="p-4 text-center text-white">
        {currentImage?.title && (
          <h3 className="text-lg font-semibold mb-2">{currentImage.title}</h3>
        )}
        
        {/* Swipe dots - mobile only */}
        <div className="flex justify-center gap-1.5 md:hidden">
          {images.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all ${
                index === (emblaApi?.selectedScrollSnap() ?? initialIndex)
                  ? "bg-white w-4"
                  : "bg-white/40"
              }`}
            />
          ))}
        </div>
        
        {/* Desktop hint */}
        <p className="text-sm text-white/60 hidden md:block">
          Nyilakkal vagy swipe-pal navigálhatsz • ESC a bezáráshoz
        </p>
      </div>
    </div>
  );
};

export default ImageLightbox;
