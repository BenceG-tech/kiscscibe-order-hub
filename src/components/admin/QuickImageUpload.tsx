import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface QuickImageUploadProps {
  itemId: string;
  itemName: string;
  currentImageUrl: string | null;
  onImageUploaded: (url: string) => void;
}

export function QuickImageUpload({
  itemId,
  itemName,
  currentImageUrl,
  onImageUploaded,
}: QuickImageUploadProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Csak képfájl tölthető fel");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("A fájl túl nagy (max 5MB)");
      return;
    }

    setIsUploading(true);
    
    try {
      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      // Update menu item with new image URL
      const { error: updateError } = await supabase
        .from("menu_items")
        .update({ image_url: publicUrl })
        .eq("id", itemId);

      if (updateError) throw updateError;

      setPreviewUrl(publicUrl);
      onImageUploaded(publicUrl);
      toast.success("Kép feltöltve");
      setOpen(false);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Hiba a kép feltöltésekor");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setIsUploading(true);
    try {
      const { error } = await supabase
        .from("menu_items")
        .update({ image_url: null })
        .eq("id", itemId);

      if (error) throw error;

      setPreviewUrl(null);
      onImageUploaded("");
      toast.success("Kép eltávolítva");
    } catch (error) {
      console.error("Error removing image:", error);
      toast.error("Hiba a kép eltávolításakor");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 shrink-0 opacity-60 hover:opacity-100"
          title="Kép kezelése"
        >
          <ImageIcon className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-base">{itemName} - Kép</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Current/Preview Image */}
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border bg-muted">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt={itemName}
                  className="h-full w-full object-cover"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute right-2 top-2 h-6 w-6"
                  onClick={handleRemoveImage}
                  disabled={isUploading}
                >
                  <X className="h-3 w-3" />
                </Button>
              </>
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <ImageIcon className="h-12 w-12 opacity-30" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Feltöltés...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                {previewUrl ? "Új kép feltöltése" : "Kép feltöltése"}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
