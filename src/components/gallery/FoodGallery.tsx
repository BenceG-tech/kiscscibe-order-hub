import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Utensils } from "lucide-react";
import GalleryGrid from "./GalleryGrid";
import ImageLightbox from "./ImageLightbox";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  title: string | null;
  sort_order: number;
}

interface FoodGalleryProps {
  compact?: boolean;
}

const FoodGallery = ({ compact = false }: FoodGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images', 'food'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .eq('gallery_type', 'food')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Utensils className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Még nincsenek ételek a galériában.</p>
      </div>
    );
  }

  return (
    <>
      {!compact && (
        <div className="mb-6">
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Utensils className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Ételek & Italok
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Fedezze fel ízletes kínálatunkat
          </p>
        </div>
      )}
      
      <GalleryGrid
        images={images}
        onImageClick={setLightboxIndex}
        compact={compact}
      />

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </>
  );
};

export default FoodGallery;
