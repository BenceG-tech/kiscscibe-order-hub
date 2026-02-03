import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Building2 } from "lucide-react";
import GalleryGrid from "./GalleryGrid";
import ImageLightbox from "./ImageLightbox";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  title: string | null;
  sort_order: number;
}

interface InteriorGalleryProps {
  compact?: boolean;
}

const InteriorGallery = ({ compact = false }: InteriorGalleryProps) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['gallery-images', 'interior'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .eq('is_active', true)
        .eq('gallery_type', 'interior')
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
        <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
        <p>Még nincsenek étterem fotók a galériában.</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Decorative background elements */}
      {!compact && (
        <>
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-2xl pointer-events-none" />
        </>
      )}
      
      {!compact && (
        <div className="mb-6 relative z-10">
          <h3 className="text-xl md:text-2xl font-bold text-foreground flex items-center gap-2">
            <Building2 className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Éttermünk
          </h3>
          <p className="text-muted-foreground text-sm mt-1">
            Ismerje meg hangulatos belső terünket
          </p>
        </div>
      )}
      
      <div className="relative z-10">
        <GalleryGrid
          images={images}
          onImageClick={setLightboxIndex}
          compact={compact}
        />
      </div>

      <ImageLightbox
        images={images}
        initialIndex={lightboxIndex ?? 0}
        isOpen={lightboxIndex !== null}
        onClose={() => setLightboxIndex(null)}
      />
    </div>
  );
};

export default InteriorGallery;
