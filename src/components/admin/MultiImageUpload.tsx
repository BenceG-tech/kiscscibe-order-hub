import { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Upload, X, Loader2, ImagePlus } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";

interface UploadingImage {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
}

interface MultiImageUploadProps {
  onImagesUploaded: (images: { url: string; altText: string }[]) => void;
  bucketName?: string;
  maxSizeMB?: number;
  isUploading?: boolean;
}

const MultiImageUpload = ({ 
  onImagesUploaded,
  bucketName = "menu-images",
  maxSizeMB = 5,
  isUploading = false
}: MultiImageUploadProps) => {
  const [images, setImages] = useState<UploadingImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: UploadingImage[] = [];
    
    Array.from(files).forEach((file) => {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} nem kép fájl`);
        return;
      }
      
      // Validate file size
      if (file.size > maxSizeMB * 1024 * 1024) {
        toast.error(`${file.name} túl nagy (max ${maxSizeMB}MB)`);
        return;
      }

      const previewUrl = URL.createObjectURL(file);
      newImages.push({
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        previewUrl,
        altText: file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        status: 'pending'
      });
    });

    setImages(prev => [...prev, ...newImages]);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
      const image = prev.find(img => img.id === id);
      if (image) {
        URL.revokeObjectURL(image.previewUrl);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const updateAltText = (id: string, altText: string) => {
    setImages(prev => prev.map(img => 
      img.id === id ? { ...img, altText } : img
    ));
  };

  const uploadAll = async () => {
    const pendingImages = images.filter(img => img.status === 'pending');
    if (pendingImages.length === 0) {
      toast.error("Nincs feltöltendő kép");
      return;
    }

    // Validate all have alt text
    const missingAlt = pendingImages.some(img => !img.altText.trim());
    if (missingAlt) {
      toast.error("Minden képhez adjon meg leírást!");
      return;
    }

    setUploading(true);
    setProgress(0);

    const uploadedImages: { url: string; altText: string }[] = [];
    let completed = 0;

    for (const image of pendingImages) {
      setImages(prev => prev.map(img => 
        img.id === image.id ? { ...img, status: 'uploading' } : img
      ));

      try {
        const fileExt = image.file.name.split('.').pop();
        const fileName = `gallery/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(fileName, image.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);

        uploadedImages.push({
          url: publicUrl,
          altText: image.altText.trim()
        });

        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'done' } : img
        ));

        completed++;
        setProgress(completed);

      } catch (error) {
        console.error('Upload error:', error);
        setImages(prev => prev.map(img => 
          img.id === image.id ? { ...img, status: 'error' } : img
        ));
      }
    }

    setUploading(false);

    if (uploadedImages.length > 0) {
      onImagesUploaded(uploadedImages);
      // Clean up preview URLs
      images.forEach(img => URL.revokeObjectURL(img.previewUrl));
      setImages([]);
    }
  };

  const pendingCount = images.filter(img => img.status === 'pending').length;
  const totalCount = images.length;

  return (
    <div className="space-y-4">
      {/* File picker */}
      <div 
        className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFilesSelected}
          className="hidden"
        />
        <ImagePlus className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Kattintson vagy húzza ide a képeket
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Több kép is kiválasztható egyszerre
        </p>
      </div>

      {/* Preview grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 max-h-[400px] overflow-y-auto p-1">
          {images.map((image) => (
            <div 
              key={image.id} 
              className={`relative rounded-lg border overflow-hidden ${
                image.status === 'error' ? 'border-destructive' : 
                image.status === 'done' ? 'border-green-500' : 
                'border-border'
              }`}
            >
              <AspectRatio ratio={4/3}>
                <img
                  src={image.previewUrl}
                  alt={image.altText}
                  className="w-full h-full object-cover"
                />
              </AspectRatio>
              
              {/* Status overlay */}
              {image.status === 'uploading' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-white" />
                </div>
              )}
              
              {image.status === 'done' && (
                <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
              )}
              
              {/* Remove button */}
              {image.status === 'pending' && (
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              
              {/* Alt text input */}
              <div className="p-2 bg-background">
                <Input
                  value={image.altText}
                  onChange={(e) => updateAltText(image.id, e.target.value)}
                  placeholder="Kép leírása"
                  className="h-8 text-xs"
                  disabled={image.status !== 'pending'}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {images.length > 0 && (
        <Button 
          onClick={uploadAll} 
          disabled={uploading || isUploading || pendingCount === 0}
          className="w-full"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Feltöltés ({progress}/{totalCount})...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              {pendingCount} kép feltöltése
            </>
          )}
        </Button>
      )}
    </div>
  );
};

export default MultiImageUpload;
