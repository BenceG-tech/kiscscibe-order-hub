import { useState } from "react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const images = [
    {
      src: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=600&h=450&fit=crop",
      alt: "Rántott karaj tálalva"
    },
    {
      src: "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=450&fit=crop", 
      alt: "Borsos tokány"
    },
    {
      src: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=600&h=450&fit=crop",
      alt: "Rántott sajt tányéron"
    },
    {
      src: "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=450&fit=crop",
      alt: "Napi menü"
    },
    {
      src: "https://images.unsplash.com/photo-1547592180-85f173990554?w=600&h=450&fit=crop",
      alt: "Leves tálalva"
    },
    {
      src: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&h=450&fit=crop",
      alt: "Étterem belső tér"
    },
    {
      src: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=450&fit=crop",
      alt: "Friss saláta"
    },
    {
      src: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=450&fit=crop",
      alt: "Főzés közben"
    },
    {
      src: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=600&h=450&fit=crop",
      alt: "Finom desszert"
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Galéria
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => (
            <div
              key={index}
              className="cursor-pointer group"
              onClick={() => setSelectedImage(image.src)}
            >
              <AspectRatio ratio={4/3}>
                <img
                  src={image.src}
                  alt={image.alt}
                  className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                  loading="lazy"
                />
              </AspectRatio>
            </div>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-full">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Nagyított kép"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;