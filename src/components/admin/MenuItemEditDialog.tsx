 import { useState, useEffect } from "react";
 import InfoTip from "@/components/admin/InfoTip";
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
import AIGenerateImageButton from "./AIGenerateImageButton";
import DuplicateResolverDialog, { DuplicateCandidate } from "./DuplicateResolverDialog";
 
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
    const [isAlwaysAvailable, setIsAlwaysAvailable] = useState(false);
 
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
        setIsAlwaysAvailable((item as any).is_always_available ?? false);
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
            is_always_available: isAlwaysAvailable,
          } as any)
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
 
  const [duplicates, setDuplicates] = useState<DuplicateCandidate[]>([]);
  const [showResolver, setShowResolver] = useState(false);
  const [resolving, setResolving] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error("A név megadása kötelező");
      return;
    }

    // Check for duplicate names (case/whitespace tolerant via ilike)
    const { data: existing } = await supabase
      .from("menu_items")
      .select("id, name, category_id, price_huf, image_url, description, allergens, is_active, is_temporary, is_always_available")
      .neq("id", itemId || "")
      .ilike("name", name.trim());

    if (existing && existing.length > 0) {
      setDuplicates(existing as any);
      setShowResolver(true);
      return;
    }

    saveMutation.mutate();
  };

  const archiveOrDeleteDuplicate = async (dupId: string, dupName: string) => {
    // Check references — if referenced anywhere, archive instead of delete
    const [offerRefs, orderRefs] = await Promise.all([
      supabase.from("daily_offer_items").select("id", { count: "exact", head: true }).eq("item_id", dupId),
      supabase.from("order_items").select("id", { count: "exact", head: true }).eq("item_id", dupId),
    ]);
    const referenced = (offerRefs.count || 0) > 0 || (orderRefs.count || 0) > 0;

    if (referenced) {
      const { error } = await supabase
        .from("menu_items")
        .update({ is_active: false, name: `${dupName} (régi)` } as any)
        .eq("id", dupId);
      if (error) throw error;
      toast.warning("A régi étel hivatkozva van — inaktívvá tettük az adatok megőrzése érdekében.");
    } else {
      const { error } = await supabase.from("menu_items").delete().eq("id", dupId);
      if (error) throw error;
    }
  };

  const handleReplace = async (dupId: string) => {
    const dup = duplicates.find((d) => d.id === dupId);
    if (!dup) return;
    setResolving(true);
    try {
      await archiveOrDeleteDuplicate(dupId, dup.name);
      setShowResolver(false);
      saveMutation.mutate();
    } catch (e: any) {
      console.error(e);
      toast.error("Nem sikerült a meglévőt felülírni: " + (e?.message || ""));
    } finally {
      setResolving(false);
    }
  };

  const handleKeepBoth = () => {
    setShowResolver(false);
    saveMutation.mutate();
  };

  const handleKeepExisting = () => {
    setShowResolver(false);
  };
 
   return (
     <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
           <DialogTitle>Étel szerkesztése</DialogTitle>
         </DialogHeader>
 
         {itemLoading ? (
          <div className="flex justify-center py-8 flex-1">
             <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
           </div>
         ) : (
          <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">
             {/* Name */}
             <div className="space-y-2">
               <Label htmlFor="name">Név *</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setDuplicateWarning(null); }}
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
                <div className="space-y-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="w-full"
                  />
                  <AIGenerateImageButton
                    itemName={name}
                    itemId={itemId || undefined}
                    onGenerated={(url) => setImageUrl(url)}
                    fullWidth
                    hasExistingImage={!!imageUrl}
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
            <div className="space-y-3 pt-2 pb-2">
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Label htmlFor="always-available">Fix tétel</Label>
                    <InfoTip text="A fix tételek (pl. italok, savanyúság) mindig megjelennek a honlapon, függetlenül a napi ajánlattól." />
                  </div>
                  <Switch
                    id="always-available"
                    checked={isAlwaysAvailable}
                    onCheckedChange={setIsAlwaysAvailable}
                  />
                </div>
              </div>
           </div>
         )}

         {/* Save Button - Always visible */}
         {!itemLoading && (
           <div className="flex-shrink-0 pt-4 border-t space-y-2">
             {duplicateWarning && (
               <div className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 p-2 rounded-lg">
                 ⚠️ {duplicateWarning}
               </div>
             )}
             <Button
               onClick={handleSave}
               disabled={saveMutation.isPending}
               className="w-full"
               variant={duplicateWarning ? "destructive" : "default"}
             >
               {saveMutation.isPending ? (
                 <>
                   <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                   Mentés...
                 </>
               ) : duplicateWarning ? (
                 "Mentés mindenképp"
               ) : (
                 "Mentés"
               )}
             </Button>
           </div>
         )}
       </DialogContent>
     </Dialog>
   );
 }