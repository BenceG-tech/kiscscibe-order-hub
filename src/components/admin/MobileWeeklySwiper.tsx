 import { useState, useRef } from "react";
 import { format, isToday, isBefore, startOfDay, addDays } from "date-fns";
 import { hu } from "date-fns/locale";
 import { Button } from "@/components/ui/button";
 import { Card } from "@/components/ui/card";
 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import {
   ChevronLeft,
   ChevronRight,
   Loader2,
   Check,
   Soup,
   UtensilsCrossed,
   Package,
   Edit2,
 } from "lucide-react";
 import { capitalizeFirst } from "@/lib/utils";
 
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
 
 interface DayData {
   price: number | null;
   offerId: string | null;
   items: SelectedItem[];
 }
 
 interface MobileWeeklySwiperProps {
   weekDates: Date[];
   dayData: Record<string, DayData>;
   onEditDay: (date: Date) => void;
   onPriceChange: (date: string, price: number | null) => void;
   onPreviousWeek: () => void;
   onNextWeek: () => void;
   onCurrentWeek: () => void;
   isCurrentWeek: boolean;
   isPending: boolean;
   isLoading: boolean;
 }
 
 const WEEKDAY_NAMES = ["Hétfő", "Kedd", "Szerda", "Csütörtök", "Péntek"];
 
 export default function MobileWeeklySwiper({
   weekDates,
   dayData,
   onEditDay,
   onPriceChange,
   onPreviousWeek,
   onNextWeek,
   onCurrentWeek,
   isCurrentWeek,
   isPending,
   isLoading,
 }: MobileWeeklySwiperProps) {
   // Find today's index or default to 0
   const todayIndex = weekDates.findIndex((d) => isToday(d));
   const [currentIndex, setCurrentIndex] = useState(todayIndex >= 0 ? todayIndex : 0);
   const [localPrice, setLocalPrice] = useState<string>("");
   const [isEditingPrice, setIsEditingPrice] = useState(false);
 
   const currentDate = weekDates[currentIndex];
   const dateStr = format(currentDate, "yyyy-MM-dd");
   const data = dayData[dateStr];
 
   const items = data?.items || [];
   const soupItem = items.find((i) => i.menuRole === "leves");
   const mainItem = items.find((i) => i.menuRole === "foetel");
   const extraItems = items.filter((i) => !i.isMenuPart);
 
   // Sync local price when date changes
   const prevDateRef = useRef(dateStr);
   if (prevDateRef.current !== dateStr) {
     prevDateRef.current = dateStr;
     setLocalPrice(data?.price?.toString() || "");
     setIsEditingPrice(false);
   }
 
   const handlePriceBlur = () => {
     setIsEditingPrice(false);
     const numericPrice = localPrice ? parseInt(localPrice, 10) : null;
     if (numericPrice !== data?.price) {
       onPriceChange(dateStr, numericPrice);
     }
   };
 
   const goToPrev = () => {
     if (currentIndex > 0) {
       setCurrentIndex(currentIndex - 1);
     }
   };
 
   const goToNext = () => {
     if (currentIndex < weekDates.length - 1) {
       setCurrentIndex(currentIndex + 1);
     }
   };
 
   const isTodayDate = isToday(currentDate);
   const isPast = isBefore(startOfDay(currentDate), startOfDay(new Date()));
 
   return (
     <div className="space-y-4">
       {/* Week Navigation */}
       <div className="flex items-center justify-between">
         <Button variant="outline" size="sm" onClick={onPreviousWeek}>
           <ChevronLeft className="h-4 w-4 mr-1" />
           Előző hét
         </Button>
 
         {!isCurrentWeek && (
           <Button variant="ghost" size="sm" onClick={onCurrentWeek}>
             Ma
           </Button>
         )}
 
         <Button variant="outline" size="sm" onClick={onNextWeek}>
           Következő hét
           <ChevronRight className="h-4 w-4 ml-1" />
         </Button>
       </div>
 
       {/* Status */}
       <div className="flex items-center justify-center gap-2 text-sm">
         {isPending ? (
           <>
             <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
             <span className="text-muted-foreground">Mentés...</span>
           </>
         ) : !isLoading ? (
           <>
             <Check className="h-4 w-4 text-green-600" />
             <span className="text-green-600">Mentve</span>
           </>
         ) : (
           <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
         )}
       </div>
 
       {/* Day Navigation */}
       <div className="flex items-center justify-between gap-4">
         <Button
           variant="ghost"
           size="icon"
           onClick={goToPrev}
           disabled={currentIndex === 0}
         >
           <ChevronLeft className="h-5 w-5" />
         </Button>
 
         <div className="text-center flex-1">
           <div className={`text-xl font-bold ${isTodayDate ? "text-primary" : ""}`}>
             {WEEKDAY_NAMES[currentIndex]}
           </div>
           <div className="text-sm text-muted-foreground">
             {format(currentDate, "MMMM d.", { locale: hu })}
           </div>
         </div>
 
         <Button
           variant="ghost"
           size="icon"
           onClick={goToNext}
           disabled={currentIndex === weekDates.length - 1}
         >
           <ChevronRight className="h-5 w-5" />
         </Button>
       </div>
 
       {/* Day Indicators */}
       <div className="flex justify-center gap-2">
         {weekDates.map((date, idx) => (
           <button
             key={idx}
             onClick={() => setCurrentIndex(idx)}
             className={`w-2.5 h-2.5 rounded-full transition-all ${
               idx === currentIndex
                 ? "bg-primary scale-125"
                 : isToday(date)
                 ? "bg-primary/40"
                 : "bg-muted-foreground/30"
             }`}
           />
         ))}
       </div>
 
       {/* Day Card */}
       <Card className={`p-4 ${isPast ? "opacity-60" : ""} ${isTodayDate ? "ring-2 ring-primary" : ""}`}>
         {/* Price */}
         <div className="flex items-center justify-center gap-2 py-4 border-b mb-4">
           <span className="text-muted-foreground">Menü ár:</span>
           <Input
             type="number"
             value={isEditingPrice ? localPrice : (data?.price?.toString() || "")}
             onChange={(e) => {
               setIsEditingPrice(true);
               setLocalPrice(e.target.value);
             }}
             onBlur={handlePriceBlur}
             placeholder="—"
             className="w-24 h-10 text-center font-bold text-lg"
           />
           <span className="font-medium">Ft</span>
         </div>
 
         {/* Soup */}
         <div className="mb-4">
           <div className="flex items-center gap-2 text-sm text-amber-600 font-medium mb-2">
             <Soup className="h-4 w-4" />
             LEVES
           </div>
           {soupItem ? (
             <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
               <span className="font-medium">{capitalizeFirst(soupItem.itemName)}</span>
             </div>
           ) : (
             <div className="p-3 rounded-lg bg-muted text-muted-foreground text-center italic">
               Nincs kiválasztva
             </div>
           )}
         </div>
 
         {/* Main */}
         <div className="mb-4">
           <div className="flex items-center gap-2 text-sm text-green-600 font-medium mb-2">
             <UtensilsCrossed className="h-4 w-4" />
             FŐÉTEL
           </div>
           {mainItem ? (
             <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
               <span className="font-medium">{capitalizeFirst(mainItem.itemName)}</span>
             </div>
           ) : (
             <div className="p-3 rounded-lg bg-muted text-muted-foreground text-center italic">
               Nincs kiválasztva
             </div>
           )}
         </div>
 
         {/* Extra Items */}
         {extraItems.length > 0 && (
           <div className="mb-4">
             <div className="flex items-center gap-2 text-sm text-muted-foreground font-medium mb-2">
               <Package className="h-4 w-4" />
               EXTRA ÉTELEK ({extraItems.length})
             </div>
             <div className="space-y-1">
               {extraItems.slice(0, 3).map((item) => (
                 <div
                   key={item.offerItemId}
                   className="p-2 rounded bg-muted/50 text-sm"
                 >
                   {capitalizeFirst(item.itemName)}
                 </div>
               ))}
               {extraItems.length > 3 && (
                 <div className="text-sm text-muted-foreground text-center">
                   +{extraItems.length - 3} további
                 </div>
               )}
             </div>
           </div>
         )}
 
         {/* Empty State */}
         {items.length === 0 && (
           <div className="py-8 text-center text-muted-foreground">
             Üres nap – kattints a szerkesztésre
           </div>
         )}
 
         {/* Edit Button */}
         <Button
           variant="default"
           className="w-full mt-4"
           onClick={() => onEditDay(currentDate)}
         >
           <Edit2 className="h-4 w-4 mr-2" />
           Szerkesztés
         </Button>
       </Card>
     </div>
   );
 }