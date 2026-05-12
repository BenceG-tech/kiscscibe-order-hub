import { useState } from "react";
import { Maximize2 } from "lucide-react";
import ImagePreviewLightbox from "./ImagePreviewLightbox";
import { cn } from "@/lib/utils";

interface ZoomableImageProps {
  src: string;
  alt?: string;
  className?: string;
  showHint?: boolean;
}

const ZoomableImage = ({ src, alt = "Kép", className, showHint = true }: ZoomableImageProps) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="relative group focus:outline-none focus:ring-2 focus:ring-primary rounded-md inline-block"
        title="Kép nagyítása"
        aria-label="Kép nagyítása"
      >
        <img
          src={src}
          alt={alt}
          className={cn("cursor-zoom-in transition-transform group-hover:scale-[1.02]", className)}
        />
        {showHint && (
          <span className="absolute bottom-1 left-1 bg-background/80 backdrop-blur-sm rounded p-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Maximize2 className="h-3.5 w-3.5 text-foreground" />
          </span>
        )}
      </button>
      <ImagePreviewLightbox src={src} open={open} onOpenChange={setOpen} alt={alt} />
    </>
  );
};

export default ZoomableImage;
