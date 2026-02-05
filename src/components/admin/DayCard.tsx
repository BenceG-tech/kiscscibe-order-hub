 import { Card } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { format } from "date-fns";
 import { hu } from "date-fns/locale";
 import { Edit2, Soup, UtensilsCrossed, Package } from "lucide-react";
 import { capitalizeFirst } from "@/lib/utils";
 import { useState, useEffect } from "react";
 
 interface DayCardProps {
   date: Date;
   price: number | null;
   soupItem: { name: string; id: string } | null;
   mainItem: { name: string; id: string } | null;
   extraCount: number;
   isToday: boolean;
   isPast: boolean;
   onEdit: () => void;
   onPriceChange: (price: number | null) => void;
   isPricePending?: boolean;
 }
 
 const WEEKDAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek", "Szombat", "Vasárnap"];
 
 export default function DayCard({
   date,
   price,
   soupItem,
   mainItem,
   extraCount,
   isToday,
   isPast,
   onEdit,
   onPriceChange,
   isPricePending,
 }: DayCardProps) {
   const [localPrice, setLocalPrice] = useState<string>(price?.toString() || "");
   const [isEditingPrice, setIsEditingPrice] = useState(false);
   
   // Sync local price with prop
   useEffect(() => {
     if (!isEditingPrice) {
       setLocalPrice(price?.toString() || "");
     }
   }, [price, isEditingPrice]);
 
   const dayOfWeek = date.getDay();
   const weekdayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
   const weekdayName = WEEKDAY_NAMES[weekdayIndex];
 
   const handlePriceBlur = () => {
     setIsEditingPrice(false);
     const numericPrice = localPrice ? parseInt(localPrice, 10) : null;
     if (numericPrice !== price) {
       onPriceChange(numericPrice);
     }
   };
 
   const handlePriceKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter") {
       (e.target as HTMLInputElement).blur();
     }
   };
 
   const hasMenu = soupItem || mainItem;
   const isEmpty = !hasMenu && extraCount === 0;
 
   return (
     <Card
       className={`relative flex flex-col overflow-hidden transition-all duration-200 ${
         isToday
           ? "ring-2 ring-primary shadow-lg"
           : isPast
           ? "opacity-60"
           : "hover:shadow-md"
       }`}
     >
       {/* Header */}
       <div
         className={`px-4 py-3 text-center border-b ${
           isToday
             ? "bg-primary text-primary-foreground"
             : "bg-muted/50"
         }`}
       >
         <div className="font-bold text-base">{weekdayName}</div>
         <div className={`text-sm ${isToday ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
           {format(date, "MM.dd.", { locale: hu })}
         </div>
       </div>
 
       {/* Price Section */}
       <div className="px-4 py-3 border-b bg-background">
         <div className="flex items-center justify-center gap-2">
           <Input
             type="number"
             value={localPrice}
             onChange={(e) => {
               setIsEditingPrice(true);
               setLocalPrice(e.target.value);
             }}
             onBlur={handlePriceBlur}
             onKeyDown={handlePriceKeyDown}
             placeholder="Ár"
             className="w-24 h-9 text-center font-bold text-lg"
             disabled={isPricePending}
           />
           <span className="text-muted-foreground font-medium">Ft</span>
         </div>
       </div>
 
       {/* Menu Items */}
       <div className="flex-1 p-4 space-y-3">
         {/* Soup */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
             <Soup className="h-3.5 w-3.5" />
             Leves
           </div>
           {soupItem ? (
             <div className="text-sm font-medium truncate" title={soupItem.name}>
               {capitalizeFirst(soupItem.name)}
             </div>
           ) : (
             <div className="text-sm text-muted-foreground italic">Nincs kiválasztva</div>
           )}
         </div>
 
         {/* Main Course */}
         <div className="space-y-1">
           <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium uppercase tracking-wide">
             <UtensilsCrossed className="h-3.5 w-3.5" />
             Főétel
           </div>
           {mainItem ? (
             <div className="text-sm font-medium truncate" title={mainItem.name}>
               {capitalizeFirst(mainItem.name)}
             </div>
           ) : (
             <div className="text-sm text-muted-foreground italic">Nincs kiválasztva</div>
           )}
         </div>
 
         {/* Extra Items Badge */}
         {extraCount > 0 && (
           <div className="pt-2">
             <Badge variant="secondary" className="text-xs">
               <Package className="h-3 w-3 mr-1" />
               +{extraCount} extra
             </Badge>
           </div>
         )}
 
         {/* Empty State */}
         {isEmpty && (
           <div className="flex items-center justify-center h-16 text-sm text-muted-foreground">
             Üres nap
           </div>
         )}
       </div>
 
       {/* Edit Button */}
       <div className="p-3 pt-0">
         <Button
           variant="outline"
           size="sm"
           onClick={onEdit}
           className="w-full"
         >
           <Edit2 className="h-4 w-4 mr-2" />
           Szerkesztés
         </Button>
       </div>
     </Card>
   );
 }