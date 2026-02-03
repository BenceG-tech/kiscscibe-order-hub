import { useState, useRef, useEffect } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useIsMobile } from "@/hooks/use-mobile";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  title?: string | null;
}

interface GalleryGridProps {
  images: GalleryImage[];
  onImageClick: (index: number) => void;
  compact?: boolean;
}

const GalleryGrid = ({ images, onImageClick, compact = false }: GalleryGridProps) => {
  const isMobile = useIsMobile();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [visibleItems, setVisibleItems] = useState<Set<number>>(new Set());
  const gridRef = useRef<HTMLDivElement>(null);

  // Scroll fade-in animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = Number(entry.target.getAttribute("data-index"));
          if (entry.isIntersecting) {
            // Staggered animation delay
            setTimeout(() => {
              setVisibleItems((prev) => new Set([...prev, index]));
            }, index * 50);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: "0px 0px -30px 0px"
      }
    );

    const items = gridRef.current?.querySelectorAll("[data-index]");
    items?.forEach((item) => observer.observe(item));

    return () => observer.disconnect();
  }, [images]);

  // Handle tap-to-reveal on mobile
  const handleClick = (index: number) => {
    if (isMobile) {
      if (activeIndex === index) {
        // Second tap - open lightbox
        onImageClick(index);
        setActiveIndex(null);
      } else {
        // First tap - show overlay
        setActiveIndex(index);
      }
    } else {
      // Desktop - direct open
      onImageClick(index);
    }
  };

  // Clear active on outside tap
  useEffect(() => {
    const handleOutsideClick = (e: TouchEvent) => {
      if (gridRef.current && !gridRef.current.contains(e.target as Node)) {
        setActiveIndex(null);
      }
    };

    document.addEventListener("touchstart", handleOutsideClick);
    return () => document.removeEventListener("touchstart", handleOutsideClick);
  }, []);

  return (
    <div
      ref={gridRef}
      className={`grid ${compact ? "gap-3" : "gap-4 md:gap-6"} ${
        compact 
          ? "grid-cols-2 md:grid-cols-4" 
          : "grid-cols-2 md:grid-cols-3"
      }`}
    >
      {images.map((image, index) => (
        <div
          key={image.id}
          data-index={index}
          className={`relative group cursor-pointer overflow-hidden rounded-2xl md:rounded-3xl shadow-lg hover:shadow-xl transition-all duration-700 ${
            visibleItems.has(index)
              ? "opacity-100 translate-y-0"
              : "opacity-0 translate-y-4"
          }`}
          onClick={() => handleClick(index)}
        >
          <AspectRatio ratio={compact || isMobile ? 1 : 4 / 3}>
            <img
              src={image.image_url}
              alt={image.alt_text}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              loading="lazy"
            />
            
            {/* Overlay - ACAIA style with warm gradient */}
            <div
              className={`absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex flex-col justify-end p-4 md:p-5 transition-opacity duration-300 ${
                isMobile
                  ? activeIndex === index
                    ? "opacity-100"
                    : "opacity-0"
                  : "opacity-0 group-hover:opacity-100"
              }`}
            >
              {image.title && (
                <h4 className="text-white font-semibold text-base md:text-lg line-clamp-2 mb-1">
                  {image.title}
                </h4>
              )}
              <span className="text-white/80 text-sm underline underline-offset-2 hover:text-white transition-colors">
                {isMobile ? "Érintsd meg újra →" : "Kattints a nagyításhoz →"}
              </span>
            </div>
          </AspectRatio>
        </div>
      ))}
    </div>
  );
};

export default GalleryGrid;
