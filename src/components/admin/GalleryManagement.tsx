import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Image as ImageIcon, Loader2 } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import MultiImageUpload from "./MultiImageUpload";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const GalleryManagement = () => {
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  const { data: images = [], isLoading } = useQuery({
    queryKey: ['admin-gallery-images'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('gallery_images')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (error) throw error;
      return data as GalleryImage[];
    }
  });

  const addMultipleImagesMutation = useMutation({
    mutationFn: async (newImages: { url: string; altText: string }[]) => {
      const maxSortOrder = images.length > 0 ? Math.max(...images.map(i => i.sort_order)) : -1;
      
      const inserts = newImages.map((img, index) => ({
        image_url: img.url,
        alt_text: img.altText,
        sort_order: maxSortOrder + 1 + index
      }));
      
      const { error } = await supabase
        .from('gallery_images')
        .insert(inserts);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success("Képek hozzáadva!");
      setIsAddDialogOpen(false);
    },
    onError: () => toast.error("Hiba a képek hozzáadásakor")
  });

  const updateImageMutation = useMutation({
    mutationFn: async ({ id, alt_text, is_active }: { id: string; alt_text?: string; is_active?: boolean }) => {
      const updates: Record<string, unknown> = {};
      if (alt_text !== undefined) updates.alt_text = alt_text;
      if (is_active !== undefined) updates.is_active = is_active;
      
      const { error } = await supabase
        .from('gallery_images')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success("Kép frissítve!");
      setEditingImage(null);
    },
    onError: () => toast.error("Hiba a frissítéskor")
  });

  const deleteImageMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success("Kép törölve!");
    },
    onError: () => toast.error("Hiba a törléskor")
  });

  const reorderMutation = useMutation({
    mutationFn: async ({ id, direction }: { id: string; direction: 'up' | 'down' }) => {
      const currentIndex = images.findIndex(i => i.id === id);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= images.length) return;
      
      const currentImage = images[currentIndex];
      const swapImage = images[newIndex];
      
      // Swap sort orders
      await supabase.from('gallery_images').update({ sort_order: swapImage.sort_order }).eq('id', currentImage.id);
      await supabase.from('gallery_images').update({ sort_order: currentImage.sort_order }).eq('id', swapImage.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    }
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Galéria kezelése</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Képek hozzáadása
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Képek hozzáadása a galériához</DialogTitle>
            </DialogHeader>
            <div className="pt-4">
              <MultiImageUpload
                onImagesUploaded={(imgs) => addMultipleImagesMutation.mutate(imgs)}
                bucketName="menu-images"
                isUploading={addMultipleImagesMutation.isPending}
              />
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {images.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Még nincsenek galéria képek.</p>
            <p className="text-sm">Kattintson az "Új kép" gombra a hozzáadáshoz.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {images.map((image, index) => (
              <div 
                key={image.id} 
                className={`relative group rounded-lg border overflow-hidden ${!image.is_active ? 'opacity-50' : ''}`}
              >
                <AspectRatio ratio={4/3}>
                  <img
                    src={image.image_url}
                    alt={image.alt_text}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                
                {/* Overlay controls */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={() => reorderMutation.mutate({ id: image.id, direction: 'up' })}
                    disabled={index === 0}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={() => reorderMutation.mutate({ id: image.id, direction: 'down' })}
                    disabled={index === images.length - 1}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    onClick={() => setEditingImage(image)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button 
                    size="icon" 
                    variant="destructive" 
                    onClick={() => {
                      if (confirm("Biztosan törli ezt a képet?")) {
                        deleteImageMutation.mutate(image.id);
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Alt text label */}
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                  {image.alt_text}
                </div>
                
                {/* Active badge */}
                {!image.is_active && (
                  <div className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-xs px-2 py-0.5 rounded">
                    Rejtett
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={!!editingImage} onOpenChange={(open) => !open && setEditingImage(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Kép szerkesztése</DialogTitle>
            </DialogHeader>
            {editingImage && (
              <div className="space-y-4 pt-4">
                <AspectRatio ratio={4/3} className="bg-muted rounded-lg overflow-hidden">
                  <img
                    src={editingImage.image_url}
                    alt={editingImage.alt_text}
                    className="w-full h-full object-cover"
                  />
                </AspectRatio>
                <div>
                  <Label htmlFor="edit-alt-text">Kép leírása</Label>
                  <Input
                    id="edit-alt-text"
                    defaultValue={editingImage.alt_text}
                    onChange={(e) => setEditingImage({ ...editingImage, alt_text: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="edit-active">Megjelenítés a galériában</Label>
                  <Switch
                    id="edit-active"
                    checked={editingImage.is_active}
                    onCheckedChange={(checked) => setEditingImage({ ...editingImage, is_active: checked })}
                  />
                </div>
                <Button 
                  onClick={() => updateImageMutation.mutate({ 
                    id: editingImage.id, 
                    alt_text: editingImage.alt_text,
                    is_active: editingImage.is_active 
                  })}
                  disabled={updateImageMutation.isPending}
                  className="w-full"
                >
                  {updateImageMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Mentés
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default GalleryManagement;
