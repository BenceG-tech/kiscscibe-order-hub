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
  noHeader?: boolean;
  maxImages?: number;
}

const InteriorGallery = ({ compact = false, noHeader = false, maxImages }: InteriorGalleryProps) => {
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
      {!compact && !noHeader && (
        <>
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-secondary/10 rounded-full blur-3xl pointer-events-none" />
        </>
      )}
      
      {!noHeader && (
        <div className="text-center mb-10 md:mb-12 relative z-10">
          <span className="text-xs md:text-sm uppercase tracking-[0.2em] text-muted-foreground font-medium flex items-center justify-center gap-2">
            <Building2 className="h-4 w-4" />
            Ismerj meg minket
          </span>
          <h3 className="text-2xl md:text-4xl font-bold text-foreground mt-2">
            Éttermünk
          </h3>
          <div className="w-12 h-1 bg-primary mx-auto mt-4 rounded-full" />
          <p className="text-muted-foreground text-sm md:text-base mt-4 max-w-md mx-auto">
            Hangulatos belső tér, ahol minden vendég otthon érzi magát
          </p>
        </div>
      )}
      
      <div className="relative z-10">
        <GalleryGrid
          images={images}
          onImageClick={setLightboxIndex}
          compact={compact}
          maxImages={maxImages}
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
