 import { useState, useMemo } from "react";
 import {
   Sheet,
   SheetContent,
   SheetHeader,
   SheetTitle,
 } from "@/components/ui/sheet";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Badge } from "@/components/ui/badge";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { format } from "date-fns";
 import { hu } from "date-fns/locale";
 import {
   Search,
   X,
   Plus,
   Trash2,
   Soup,
   UtensilsCrossed,
   ChefHat,
 } from "lucide-react";
 import { capitalizeFirst } from "@/lib/utils";
 
 interface MenuItem {
   id: string;
   name: string;
   category_id: string | null;
   price_huf: number;
   image_url?: string | null;
 }
 
 interface Category {
   id: string;
   name: string;
   sort: number;
 }
 
 interface SelectedItem {
   itemId: string;
   itemName: string;
   offerId: string;
   offerItemId: string;
   imageUrl?: string | null;
   price?: number;
   isMenuPart: boolean;
   menuRole?: string | null;
 }
 
 interface DayDetailSheetProps {
   open: boolean;
   onOpenChange: (open: boolean) => void;
   date: Date | null;
   categories: Category[];
   menuItems: MenuItem[];
   selectedItems: SelectedItem[];
   onAddItem: (date: string, itemId: string) => void;
   onRemoveItem: (offerItemId: string) => void;
   onMenuPartToggle: (offerItemId: string, isMenuPart: boolean, menuRole: string | null) => void;
 }
 
 // Role icon helper
 const RoleIcon = ({ role }: { role: string | null }) => {
   if (role === "leves") return <Soup className="h-4 w-4 text-amber-600" />;
   if (role === "foetel") return <UtensilsCrossed className="h-4 w-4 text-green-600" />;
   return null;
 };
 
 export default function DayDetailSheet({
   open,
   onOpenChange,
   date,
   categories,
   menuItems,
   selectedItems,
   onAddItem,
   onRemoveItem,
   onMenuPartToggle,
 }: DayDetailSheetProps) {
   const [searchTerm, setSearchTerm] = useState("");
   const [activeCategory, setActiveCategory] = useState<string | null>(null);
 
   // Normalize text for accent-insensitive search
   const normalizeText = (text: string) => {
     return text
       .toLowerCase()
       .normalize("NFD")
       .replace(/[\u0300-\u036f]/g, "")
       .replace(/ő/g, "o")
       .replace(/ű/g, "u");
   };
 
   // Get selected item IDs for quick lookup
   const selectedItemIds = useMemo(() => {
     return new Set(selectedItems.map((s) => s.itemId));
   }, [selectedItems]);
 
   // Filter menu items
   const filteredItems = useMemo(() => {
     return menuItems.filter((item) => {
       const matchesSearch =
         !searchTerm ||
         normalizeText(item.name).includes(normalizeText(searchTerm));
       const matchesCategory =
         !activeCategory || item.category_id === activeCategory;
       return matchesSearch && matchesCategory;
     });
   }, [menuItems, searchTerm, activeCategory]);
 
   // Group filtered items by category
   const groupedItems = useMemo(() => {
     const grouped: Record<string, MenuItem[]> = {};
     filteredItems.forEach((item) => {
       if (item.category_id) {
         if (!grouped[item.category_id]) {
           grouped[item.category_id] = [];
         }
         grouped[item.category_id].push(item);
       }
     });
     return grouped;
   }, [filteredItems]);
 
   // Get soup and main course from selected items
   const soupItem = selectedItems.find((i) => i.menuRole === "leves");
   const mainItem = selectedItems.find((i) => i.menuRole === "foetel");
   const extraItems = selectedItems.filter((i) => !i.isMenuPart);
 
   const dateStr = date ? format(date, "yyyy-MM-dd") : "";
 
   const handleToggleMenuRole = (item: SelectedItem, role: "leves" | "foetel") => {
     if (item.menuRole === role) {
       // Remove from menu
       onMenuPartToggle(item.offerItemId, false, null);
     } else {
       // Set as menu part with role
       onMenuPartToggle(item.offerItemId, true, role);
     }
   };
 
   if (!date) return null;
 
   const dayOfWeek = date.getDay();
   const weekdayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
   const WEEKDAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
 
   return (
     <Sheet open={open} onOpenChange={onOpenChange}>
       <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
         <SheetHeader className="px-6 py-4 border-b">
           <SheetTitle className="flex items-center gap-3">
             <ChefHat className="h-5 w-5 text-primary" />
             <span>
               {WEEKDAY_NAMES[weekdayIndex]} – {format(date, "MMMM d.", { locale: hu })}
             </span>
           </SheetTitle>
         </SheetHeader>
 
         {/* Menu Summary */}
         <div className="px-6 py-4 bg-muted/30 border-b space-y-3">
           <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
             Napi menü összetétele
           </h3>
           <div className="grid grid-cols-2 gap-3">
             {/* Soup */}
             <div className="p-3 rounded-lg bg-background border">
               <div className="flex items-center gap-2 text-xs text-amber-600 font-medium mb-1">
                 <Soup className="h-3.5 w-3.5" />
                 LEVES
               </div>
               {soupItem ? (
                 <div className="text-sm font-medium truncate">
                   {capitalizeFirst(soupItem.itemName)}
                 </div>
               ) : (
                 <div className="text-sm text-muted-foreground italic">—</div>
               )}
             </div>
 
             {/* Main */}
             <div className="p-3 rounded-lg bg-background border">
               <div className="flex items-center gap-2 text-xs text-green-600 font-medium mb-1">
                 <UtensilsCrossed className="h-3.5 w-3.5" />
                 FŐÉTEL
               </div>
               {mainItem ? (
                 <div className="text-sm font-medium truncate">
                   {capitalizeFirst(mainItem.itemName)}
                 </div>
               ) : (
                 <div className="text-sm text-muted-foreground italic">—</div>
               )}
             </div>
           </div>
         </div>
 
         {/* Selected Items List */}
         {selectedItems.length > 0 && (
           <div className="px-6 py-4 border-b">
             <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
               Mai ételek ({selectedItems.length})
             </h3>
             <div className="space-y-2 max-h-48 overflow-y-auto">
               {selectedItems.map((item) => (
                 <div
                   key={item.offerItemId}
                   className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                 >
                   <div className="flex items-center gap-2 min-w-0">
                     <RoleIcon role={item.menuRole} />
                     <span className="text-sm font-medium truncate">
                       {capitalizeFirst(item.itemName)}
                     </span>
                   </div>
                   <div className="flex items-center gap-1">
                     {/* Menu role toggles */}
                     <Button
                       variant={item.menuRole === "leves" ? "default" : "ghost"}
                       size="sm"
                       className="h-7 w-7 p-0"
                       title="Leves"
                       onClick={() => handleToggleMenuRole(item, "leves")}
                     >
                       <Soup className="h-3.5 w-3.5" />
                     </Button>
                     <Button
                       variant={item.menuRole === "foetel" ? "default" : "ghost"}
                       size="sm"
                       className="h-7 w-7 p-0"
                       title="Főétel"
                       onClick={() => handleToggleMenuRole(item, "foetel")}
                     >
                       <UtensilsCrossed className="h-3.5 w-3.5" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                       onClick={() => onRemoveItem(item.offerItemId)}
                     >
                       <Trash2 className="h-3.5 w-3.5" />
                     </Button>
                   </div>
                 </div>
               ))}
             </div>
           </div>
         )}
 
         {/* Search */}
         <div className="px-6 py-3 border-b">
           <div className="relative">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
             <Input
               placeholder="Étel keresése..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="pl-10 pr-10"
             />
             {searchTerm && (
               <Button
                 variant="ghost"
                 size="sm"
                 className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                 onClick={() => setSearchTerm("")}
               >
                 <X className="h-4 w-4" />
               </Button>
             )}
           </div>
 
           {/* Category Filter */}
           <div className="flex flex-wrap gap-1.5 mt-3">
             <Badge
               variant={activeCategory === null ? "default" : "outline"}
               className="cursor-pointer"
               onClick={() => setActiveCategory(null)}
             >
               Mind
             </Badge>
             {categories.map((cat) => (
               <Badge
                 key={cat.id}
                 variant={activeCategory === cat.id ? "default" : "outline"}
                 className="cursor-pointer"
                 onClick={() => setActiveCategory(cat.id)}
               >
                 {cat.name}
               </Badge>
             ))}
           </div>
         </div>
 
         {/* Available Items */}
         <ScrollArea className="flex-1">
           <div className="px-6 py-4 space-y-6">
             {categories
               .filter((cat) => groupedItems[cat.id]?.length > 0)
               .map((cat) => (
                 <div key={cat.id}>
                   <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                     {cat.name}
                   </h4>
                   <div className="space-y-1">
                     {groupedItems[cat.id].map((item) => {
                       const isSelected = selectedItemIds.has(item.id);
                       return (
                         <div
                           key={item.id}
                           className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                             isSelected
                               ? "bg-primary/10 border border-primary/30"
                               : "hover:bg-muted"
                           }`}
                         >
                           <div className="flex items-center gap-2 min-w-0">
                             <span className="text-sm font-medium truncate">
                               {capitalizeFirst(item.name)}
                             </span>
                             <span className="text-xs text-muted-foreground">
                               {item.price_huf} Ft
                             </span>
                           </div>
                           {isSelected ? (
                             <Badge variant="secondary" className="text-xs">
                               Hozzáadva
                             </Badge>
                           ) : (
                             <Button
                               variant="ghost"
                               size="sm"
                               className="h-7 px-2"
                               onClick={() => onAddItem(dateStr, item.id)}
                             >
                               <Plus className="h-3.5 w-3.5 mr-1" />
                               Hozzáad
                             </Button>
                           )}
                         </div>
                       );
                     })}
                   </div>
                 </div>
               ))}
 
             {filteredItems.length === 0 && (
               <div className="text-center py-8 text-muted-foreground">
                 Nincs találat
               </div>
             )}
           </div>
         </ScrollArea>
       </SheetContent>
     </Sheet>
   );
 }