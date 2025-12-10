import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
}

const GallerySection = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    }
  });

  // Don't render section if no images
  if (!isLoading && images.length === 0) {
    return null;
  }

  return (
    <section className="py-12 md:py-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-center text-foreground mb-8">
          Galéria
        </h2>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image) => (
              <div
                key={image.id}
                className="cursor-pointer group"
                onClick={() => setSelectedImage(image.image_url)}
              >
                <AspectRatio ratio={4/3}>
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover rounded-xl transition-transform duration-200 group-hover:scale-105"
                    loading="lazy"
                  />
                </AspectRatio>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 text-white hover:bg-white/20 z-10 bg-black/20 backdrop-blur-sm"
              onClick={() => setSelectedImage(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            <img
              src={selectedImage}
              alt="Nagyított kép"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onError={() => setSelectedImage(null)}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default GallerySection;