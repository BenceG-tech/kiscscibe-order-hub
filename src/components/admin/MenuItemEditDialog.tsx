 import { useState, useEffect } from "react";
 import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import {
   Dialog,
   DialogContent,
   DialogHeader,
   DialogTitle,
 } from "@/components/ui/dialog";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Textarea } from "@/components/ui/textarea";
 import { Switch } from "@/components/ui/switch";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { toast } from "sonner";
import { Loader2, Upload, X, ImageIcon } from "lucide-react";
import { capitalizeFirst } from "@/lib/utils";
 
 const ALLERGENS = [
   "Glutén",
   "Tej",
   "Tojás",
   "Hal",
   "Szója",
   "Mogyoró",
   "Zeller",
   "Mustár",
   "Szezám",
   "Kéndioxid",
   "Csillagfürt",
   "Puhatestű",
 ];
 
 interface MenuItemEditDialogProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   itemId: string | null;
   onSaved?: () => void;
 }
 
 export function MenuItemEditDialog({
   open,
   onOpenChange,
   itemId,
   onSaved,
 }: MenuItemEditDialogProps) {
   const queryClient = useQueryClient();
   const [name, setName] = useState("");
   const [description, setDescription] = useState("");
   const [price, setPrice] = useState("");
   const [categoryId, setCategoryId] = useState<string | null>(null);
   const [imageUrl, setImageUrl] = useState<string | null>(null);
   const [allergens, setAllergens] = useState<string[]>([]);
   const [isActive, setIsActive] = useState(true);
   const [isFeatured, setIsFeatured] = useState(false);
   const [requiresSideSelection, setRequiresSideSelection] = useState(false);
 
   // Fetch categories
   const { data: categories = [] } = useQuery({
     queryKey: ["menu-categories"],
     queryFn: async () => {
       const { data, error } = await supabase
         .from("menu_categories")
         .select("id, name, sort")
         .order("sort", { ascending: true });
       if (error) throw error;
       return data;
     },
   });
 
   // Fetch item data
   const { data: item, isLoading: itemLoading } = useQuery({
     queryKey: ["menu-item", itemId],
     queryFn: async () => {
       if (!itemId) return null;
       const { data, error } = await supabase
         .from("menu_items")
         .select("*")
         .eq("id", itemId)
         .single();
       if (error) throw error;
       return data;
     },
     enabled: !!itemId && open,
   });
 
  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `menu-items/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("menu-images")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("menu-images")
        .getPublicUrl(filePath);

      setImageUrl(data.publicUrl);
      toast.success("Kép feltöltve");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Hiba a kép feltöltésekor");
    }
  };

   // Reset form when item changes
   useEffect(() => {
     if (item) {
       setName(item.name || "");
       setDescription(item.description || "");
       setPrice(item.price_huf?.toString() || "");
       setCategoryId(item.category_id || null);
       setImageUrl(item.image_url || null);
       setAllergens(item.allergens || []);
       setIsActive(item.is_active ?? true);
       setIsFeatured(item.is_featured ?? false);
       setRequiresSideSelection(item.requires_side_selection ?? false);
     }
   }, [item]);
 
   // Save mutation
   const saveMutation = useMutation({
     mutationFn: async () => {
       if (!itemId) throw new Error("No item ID");
 
       const { error } = await supabase
         .from("menu_items")
         .update({
            name: capitalizeFirst(name.trim()),
           description: description || null,
           price_huf: parseInt(price) || 0,
           category_id: categoryId,
           image_url: imageUrl,
           allergens,
           is_active: isActive,
           is_featured: isFeatured,
           requires_side_selection: requiresSideSelection,
         })
         .eq("id", itemId);
 
       if (error) throw error;
     },
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ["menu-items-all"] });
       queryClient.invalidateQueries({ queryKey: ["daily-offers-week"] });
       queryClient.invalidateQueries({ queryKey: ["menu-item", itemId] });
       toast.success("Étel mentve");
       onSaved?.();
       onOpenChange(false);
     },
     onError: (error) => {
       console.error("Error saving menu item:", error);
       toast.error("Hiba történt a mentéskor");
     },
   });
 
   const toggleAllergen = (allergen: string) => {
     setAllergens((prev) =>
       prev.includes(allergen)
         ? prev.filter((a) => a !== allergen)
         : [...prev, allergen]
     );
   };
 
   const handleSave = () => {
     if (!name.trim()) {
       toast.error("A név megadása kötelező");
       return;
     }
     saveMutation.mutate();
   };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
       <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
         <DialogHeader>
           <DialogTitle>Étel szerkesztése</DialogTitle>
         </DialogHeader>
 
         {itemLoading ? (
           <div className="flex justify-center py-8">
             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
           </div>
         ) : (
           <div className="space-y-4 py-2">
             {/* Name */}
             <div className="space-y-2">
               <Label htmlFor="name">Név *</Label>
               <Input
                 id="name"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="Étel neve"
               />
             </div>
 
             {/* Description */}
             <div className="space-y-2">
               <Label htmlFor="description">Leírás</Label>
               <Textarea
                 id="description"
                 value={description}
                 onChange={(e) => setDescription(e.target.value)}
                 placeholder="Rövid leírás"
                 rows={2}
               />
             </div>
 
             {/* Price */}
             <div className="space-y-2">
               <Label htmlFor="price">Ár (Ft) *</Label>
               <Input
                 id="price"
                 type="number"
                 value={price}
                 onChange={(e) => setPrice(e.target.value)}
                 placeholder="0"
               />
             </div>
 
             {/* Category */}
             <div className="space-y-2">
               <Label>Kategória</Label>
               <Select
                 value={categoryId || ""}
                 onValueChange={(val) => setCategoryId(val || null)}
               >
                 <SelectTrigger>
                   <SelectValue placeholder="Válassz kategóriát" />
                 </SelectTrigger>
                 <SelectContent>
                   {categories.map((cat) => (
                     <SelectItem key={cat.id} value={cat.id}>
                       {cat.name}
                     </SelectItem>
                   ))}
                 </SelectContent>
               </Select>
             </div>
 
             {/* Image */}
             <div className="space-y-2">
               <Label>Kép</Label>
              <div className="space-y-2">
                {imageUrl ? (
                  <div className="relative inline-block">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="h-24 w-24 rounded-lg object-cover border"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -top-2 -right-2 h-6 w-6"
                      onClick={() => setImageUrl(null)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="h-24 w-24 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                </div>
              </div>
             </div>
 
             {/* Allergens */}
             <div className="space-y-2">
               <Label>Allergének</Label>
               <div className="flex flex-wrap gap-2">
                 {ALLERGENS.map((allergen) => (
                   <Button
                     key={allergen}
                     type="button"
                     variant={allergens.includes(allergen) ? "default" : "outline"}
                     size="sm"
                     onClick={() => toggleAllergen(allergen)}
                     className="text-xs"
                   >
                     {allergen}
                   </Button>
                 ))}
               </div>
             </div>
 
             {/* Switches */}
             <div className="space-y-3 pt-2">
               <div className="flex items-center justify-between">
                 <Label htmlFor="active">Aktív</Label>
                 <Switch
                   id="active"
                   checked={isActive}
                   onCheckedChange={setIsActive}
                 />
               </div>
               <div className="flex items-center justify-between">
                 <Label htmlFor="featured">Kiemelt</Label>
                 <Switch
                   id="featured"
                   checked={isFeatured}
                   onCheckedChange={setIsFeatured}
                 />
               </div>
               <div className="flex items-center justify-between">
                 <Label htmlFor="sides">Köret választás kötelező</Label>
                 <Switch
                   id="sides"
                   checked={requiresSideSelection}
                   onCheckedChange={setRequiresSideSelection}
                 />
               </div>
             </div>
 
             {/* Save Button */}
             <div className="pt-4">
               <Button
                 onClick={handleSave}
                 disabled={saveMutation.isPending}
                 className="w-full"
               >
                 {saveMutation.isPending ? (
                   <>
                     <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                     Mentés...
                   </>
                 ) : (
                   "Mentés"
                 )}
               </Button>
             </div>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }