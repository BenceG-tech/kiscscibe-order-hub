import { Dialog, DialogContent } from "@/components/ui/dialog";

interface ImagePreviewLightboxProps {
  src: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  alt?: string;
}

const ImagePreviewLightbox = ({ src, open, onOpenChange, alt = "Kép előnézet" }: ImagePreviewLightboxProps) => {
  if (!src) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-3xl p-2 sm:p-4 bg-background/95 border-border">
        <div className="w-full flex items-center justify-center">
          <img
            src={src}
            alt={alt}
            className="max-h-[85vh] max-w-full object-contain rounded-md"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImagePreviewLightbox;
