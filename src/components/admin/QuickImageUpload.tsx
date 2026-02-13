import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImageIcon, Upload, Loader2, X, Sparkles, RefreshCw } from "lucide-react";
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Csak képfájl tölthető fel");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A fájl túl nagy (max 5MB)");
      return;
    }

    setIsUploading(true);
    
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${itemId}-${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

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

  const handleGenerateAI = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-food-image", {
        body: { item_id: itemId, item_name: itemName },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        return;
      }

      if (data?.image_url) {
        setPreviewUrl(data.image_url);
        onImageUploaded(data.image_url);
        toast.success("AI kép generálva!");
      }
    } catch (error) {
      console.error("Error generating AI image:", error);
      toast.error("Hiba az AI kép generálásakor");
    } finally {
      setIsGenerating(false);
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
                  disabled={isUploading || isGenerating}
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

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading || isGenerating}
              variant="outline"
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
                  Saját kép
                </>
              )}
            </Button>

            <Button
              onClick={handleGenerateAI}
              disabled={isUploading || isGenerating}
              className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generálás...
                </>
              ) : previewUrl ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Újragenerálás
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  AI generálás
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
