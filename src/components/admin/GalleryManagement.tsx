import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Pencil, Image as ImageIcon, Loader2, Utensils, Building2, ArrowRightLeft } from "lucide-react";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import MultiImageUpload from "./MultiImageUpload";

type GalleryType = "food" | "interior";

interface GalleryImage {
  id: string;
  image_url: string;
  alt_text: string;
  title: string | null;
  gallery_type: GalleryType;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

const GalleryManagement = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<GalleryType>("food");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [addGalleryType, setAddGalleryType] = useState<GalleryType>("food");
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);

  const { data: allImages = [], isLoading } = useQuery({
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

  const foodImages = allImages.filter(img => img.gallery_type === 'food');
  const interiorImages = allImages.filter(img => img.gallery_type === 'interior');
  const currentImages = activeTab === 'food' ? foodImages : interiorImages;

  const addMultipleImagesMutation = useMutation({
    mutationFn: async (newImages: { url: string; altText: string }[]) => {
      const targetImages = activeTab === 'food' ? foodImages : interiorImages;
      const maxSortOrder = targetImages.length > 0 ? Math.max(...targetImages.map(i => i.sort_order)) : -1;
      
      const inserts = newImages.map((img, index) => ({
        image_url: img.url,
        alt_text: img.altText,
        title: null,
        gallery_type: addGalleryType,
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
    mutationFn: async ({ id, alt_text, title, is_active, gallery_type }: { 
      id: string; 
      alt_text?: string; 
      title?: string | null;
      is_active?: boolean;
      gallery_type?: GalleryType;
    }) => {
      const updates: Record<string, unknown> = {};
      if (alt_text !== undefined) updates.alt_text = alt_text;
      if (title !== undefined) updates.title = title;
      if (is_active !== undefined) updates.is_active = is_active;
      if (gallery_type !== undefined) updates.gallery_type = gallery_type;
      
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
      const currentIndex = currentImages.findIndex(i => i.id === id);
      if (currentIndex === -1) return;
      
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      if (newIndex < 0 || newIndex >= currentImages.length) return;
      
      const currentImage = currentImages[currentIndex];
      const swapImage = currentImages[newIndex];
      
      // Swap sort orders
      await supabase.from('gallery_images').update({ sort_order: swapImage.sort_order }).eq('id', currentImage.id);
      await supabase.from('gallery_images').update({ sort_order: currentImage.sort_order }).eq('id', swapImage.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
    }
  });

  const moveToOtherGalleryMutation = useMutation({
    mutationFn: async ({ id, currentType }: { id: string; currentType: GalleryType }) => {
      const newType: GalleryType = currentType === 'food' ? 'interior' : 'food';
      const targetImages = newType === 'food' ? foodImages : interiorImages;
      const maxSortOrder = targetImages.length > 0 ? Math.max(...targetImages.map(i => i.sort_order)) : -1;
      
      const { error } = await supabase
        .from('gallery_images')
        .update({ gallery_type: newType, sort_order: maxSortOrder + 1 })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-gallery-images'] });
      queryClient.invalidateQueries({ queryKey: ['gallery-images'] });
      toast.success("Kép áthelyezve!");
    },
    onError: () => toast.error("Hiba az áthelyezéskor")
  });

  const handleOpenAddDialog = () => {
    setAddGalleryType(activeTab);
    setIsAddDialogOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const renderImageGrid = (images: GalleryImage[]) => {
    if (images.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Még nincsenek képek ebben a galériában.</p>
          <p className="text-sm">Kattintson a "Képek hozzáadása" gombra.</p>
        </div>
      );
    }

    return (
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
                title={image.gallery_type === 'food' ? 'Áthelyezés az Étterem galériába' : 'Áthelyezés az Ételek galériába'}
                onClick={() => moveToOtherGalleryMutation.mutate({ 
                  id: image.id, 
                  currentType: image.gallery_type 
                })}
              >
                <ArrowRightLeft className="h-4 w-4" />
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
            
            {/* Title/alt text label */}
            <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
              {image.title || image.alt_text}
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
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <CardTitle className="text-lg">Galéria kezelése</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={handleOpenAddDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Képek hozzáadása
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Képek hozzáadása a galériához</DialogTitle>
            </DialogHeader>
            <div className="pt-4 space-y-4">
              <div>
                <Label>Galéria típus</Label>
                <Select value={addGalleryType} onValueChange={(v) => setAddGalleryType(v as GalleryType)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="food">
                      <span className="flex items-center gap-2">
                        <Utensils className="h-4 w-4" />
                        Ételek
                      </span>
                    </SelectItem>
                    <SelectItem value="interior">
                      <span className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Étterem
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as GalleryType)}>
          <TabsList className="mb-4">
            <TabsTrigger value="food" className="flex items-center gap-2">
              <Utensils className="h-4 w-4" />
              Ételek ({foodImages.length})
            </TabsTrigger>
            <TabsTrigger value="interior" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Étterem ({interiorImages.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="food">
            {renderImageGrid(foodImages)}
          </TabsContent>
          
          <TabsContent value="interior">
            {renderImageGrid(interiorImages)}
          </TabsContent>
        </Tabs>

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
                  <Label htmlFor="edit-title">Cím</Label>
                  <Input
                    id="edit-title"
                    placeholder="Kép címe (opcionális)"
                    value={editingImage.title || ""}
                    onChange={(e) => setEditingImage({ ...editingImage, title: e.target.value || null })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-alt-text">Kép leírása (SEO)</Label>
                  <Input
                    id="edit-alt-text"
                    value={editingImage.alt_text}
                    onChange={(e) => setEditingImage({ ...editingImage, alt_text: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Galéria típus</Label>
                  <Select 
                    value={editingImage.gallery_type} 
                    onValueChange={(v) => setEditingImage({ ...editingImage, gallery_type: v as GalleryType })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="food">
                        <span className="flex items-center gap-2">
                          <Utensils className="h-4 w-4" />
                          Ételek
                        </span>
                      </SelectItem>
                      <SelectItem value="interior">
                        <span className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Étterem
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
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
                    title: editingImage.title,
                    is_active: editingImage.is_active,
                    gallery_type: editingImage.gallery_type
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
