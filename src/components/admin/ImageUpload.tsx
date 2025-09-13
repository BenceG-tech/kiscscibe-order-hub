import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, X, Image } from "lucide-react";
import { LoadingSpinner } from "@/components/ui/loading";

interface ImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (url: string) => void;
  onImageRemoved: () => void;
  bucketName?: string;
  maxSize?: number; // in MB
}

const ImageUpload = ({ 
  currentImageUrl, 
  onImageUploaded, 
  onImageRemoved,
  bucketName = "menu-images",
  maxSize = 5
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);

  const uploadImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      toast.error(`A fájl mérete nem lehet nagyobb ${maxSize}MB-nál`);
      return;
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      toast.error('Csak képfájlokat lehet feltölteni');
      return;
    }

    setUploading(true);

    try {
      // Create a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success('Kép feltöltve');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Hiba történt a kép feltöltésekor');
    } finally {
      setUploading(false);
    }
  };

  const removeImage = async () => {
    if (currentImageUrl) {
      try {
        // Extract filename from URL
        const urlParts = currentImageUrl.split('/');
        const filename = urlParts[urlParts.length - 1];

        // Delete from storage
        const { error } = await supabase.storage
          .from(bucketName)
          .remove([filename]);

        if (error) {
          console.error('Error deleting image:', error);
        }
      } catch (error) {
        console.error('Error removing image:', error);
      }
    }

    setPreviewUrl(null);
    onImageRemoved();
    toast.success('Kép eltávolítva');
  };

  return (
    <div className="space-y-4">
      <Label className="text-sm font-medium">Kép feltöltése</Label>
      
      {previewUrl ? (
        <div className="relative">
          <div className="w-full max-w-xs mx-auto">
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="w-full h-48 object-cover rounded-lg border border-border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={removeImage}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
          <Image className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <div className="space-y-2">
            <Label htmlFor="image-upload" className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                {uploading ? (
                  <LoadingSpinner className="h-4 w-4" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Feltöltés...' : 'Kép kiválasztása'}
              </div>
            </Label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={uploadImage}
              disabled={uploading}
              className="hidden"
            />
            <p className="text-xs text-muted-foreground">
              JPG, PNG, max {maxSize}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;