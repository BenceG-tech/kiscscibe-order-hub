import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { Plus, Save, Trash2, Coffee, Utensils, Package, X, Clock, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { TemporaryItemCreator } from "./TemporaryItemCreator";
import { TemporaryItemsLibrary } from "./TemporaryItemsLibrary";

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price_huf: number;
  category_id?: string;
  image_url?: string;
  is_temporary?: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface DailyOfferItem {
  id: string;
  daily_offer_id?: string;
  item_id: string;
  is_menu_part: boolean;
  menu_role?: string;
  menu_items?: MenuItem;
}

interface DailyOfferMenu {
  id: string;
  daily_offer_id?: string;
  menu_price_huf: number;
  max_portions: number;
  remaining_portions: number;
}

interface DailyOffer {
  id: string;
  date: string;
  price_huf?: number;
  note?: string;
  max_portions?: number;
  remaining_portions?: number;
  daily_offer_items?: DailyOfferItem[];
  daily_offer_menus?: DailyOfferMenu;
}

interface SelectedItem {
  id: string;
  isMenuPart: boolean;
  menuRole?: 'leves' | 'főétel';
}

const StreamlinedDailyOffers = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  
  // Form states
  const [offerForm, setOfferForm] = useState({
    price_huf: "2200",
    note: "",
    max_portions: "50",
    remaining_portions: "50",
    selectedItems: [] as SelectedItem[],
    menuPrice: "1800",
    menuMaxPortions: "30",
    menuRemainingPortions: "30"
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    // Load existing offer for selected date
    loadOfferForDate();
  }, [selectedDate, dailyOffers]);

  const fetchData = async () => {
    const [offersResult, itemsResult, categoriesResult] = await Promise.all([
      supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (
            id,
            item_id,
            is_menu_part,
            menu_role,
            menu_items (id, name, description, price_huf, image_url, is_temporary)
          ),
          daily_offer_menus (
            id,
            menu_price_huf,
            max_portions,
            remaining_portions
          )
        `)
        .order('date', { ascending: false }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('name'),
      supabase
        .from('menu_categories')
        .select('*')
        .order('sort', { ascending: true })
    ]);

    if (offersResult.data) setDailyOffers(offersResult.data);
    if (itemsResult.data) setAvailableItems(itemsResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);

    setLoading(false);
  };

  const loadOfferForDate = () => {
    const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
    const existingOffer = dailyOffers.find(offer => offer.date === selectedDateString);
    
    if (existingOffer) {
      const selectedItems: SelectedItem[] = existingOffer.daily_offer_items?.map(item => ({
        id: item.item_id,
        isMenuPart: item.is_menu_part,
        menuRole: item.menu_role as 'leves' | 'főétel'
      })) || [];
      
      const offerMenu = existingOffer.daily_offer_menus;
      
      setOfferForm({
        price_huf: existingOffer.price_huf?.toString() || "2200",
        note: existingOffer.note || "",
        max_portions: existingOffer.max_portions?.toString() || "50",
        remaining_portions: existingOffer.remaining_portions?.toString() || "50",
        selectedItems,
        menuPrice: offerMenu?.menu_price_huf?.toString() || "1800",
        menuMaxPortions: offerMenu?.max_portions?.toString() || "30",
        menuRemainingPortions: offerMenu?.remaining_portions?.toString() || "30"
      });
    } else {
      // Reset form for new date
      setOfferForm({
        price_huf: "2200",
        note: "",
        max_portions: "50",
        remaining_portions: "50",
        selectedItems: [],
        menuPrice: "1800",
        menuMaxPortions: "30",
        menuRemainingPortions: "30"
      });
    }
  };

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const selectedOffer = dailyOffers.find(offer => offer.date === selectedDateString);

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => getOffersForDate(date).length > 0;

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const toggleItem = (itemId: string) => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.some(item => item.id === itemId)
        ? prev.selectedItems.filter(item => item.id !== itemId)
        : [...prev.selectedItems, { id: itemId, isMenuPart: false }]
    }));
  };

  const updateItemMenuSettings = (itemId: string, isMenuPart: boolean, menuRole?: 'leves' | 'főétel') => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.map(item =>
        item.id === itemId
          ? { ...item, isMenuPart, menuRole: isMenuPart ? menuRole : undefined }
          : item
      )
    }));
  };

  const removeItem = (itemId: string) => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(item => item.id !== itemId)
    }));
  };

  const onItemCreated = (itemId: string) => {
    // Auto-select the newly created temporary item
    setOfferForm(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, { id: itemId, isMenuPart: false }]
    }));
  };

  const saveOffer = async () => {
    if (isWeekend(selectedDate)) {
      toast({
        title: "Hiba",
        description: "Hétvégén a vendéglő zárva tart",
        variant: "destructive"
      });
      return;
    }

    // Validate menu composition if there are menu items
    const menuItems = offerForm.selectedItems.filter(item => item.isMenuPart);
    const soupItems = menuItems.filter(item => item.menuRole === 'leves');
    const mainItems = menuItems.filter(item => item.menuRole === 'főétel');

    if (menuItems.length > 0 && (soupItems.length !== 1 || mainItems.length !== 1)) {
      toast({
        title: "Hiba",
        description: "A menühöz pontosan 1 leves és 1 főétel szükséges",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const offerData = {
        date: selectedDateString,
        price_huf: parseInt(offerForm.price_huf),
        note: offerForm.note || null,
        max_portions: parseInt(offerForm.max_portions),
        remaining_portions: parseInt(offerForm.remaining_portions)
      };

      let result;
      let offerId;

      if (selectedOffer) {
        result = await supabase
          .from('daily_offers')
          .update(offerData)
          .eq('id', selectedOffer.id);
        offerId = selectedOffer.id;
      } else {
        result = await supabase
          .from('daily_offers')
          .insert(offerData)
          .select()
          .single();
        offerId = result.data?.id;
      }

      if (result.error) throw result.error;

      // Delete existing items and menu
      if (selectedOffer) {
        await Promise.all([
          supabase.from('daily_offer_items').delete().eq('daily_offer_id', offerId),
          supabase.from('daily_offer_menus').delete().eq('daily_offer_id', offerId)
        ]);
      }

      // Insert new items
      if (offerForm.selectedItems.length > 0) {
        const itemsToInsert = offerForm.selectedItems.map(item => ({
          daily_offer_id: offerId,
          item_id: item.id,
          is_menu_part: item.isMenuPart,
          menu_role: item.menuRole || null
        }));

        const itemsResult = await supabase
          .from('daily_offer_items')
          .insert(itemsToInsert);

        if (itemsResult.error) throw itemsResult.error;
      }

      // Insert menu if there are menu items
      if (menuItems.length > 0) {
        const menuData = {
          daily_offer_id: offerId,
          menu_price_huf: parseInt(offerForm.menuPrice),
          max_portions: parseInt(offerForm.menuMaxPortions),
          remaining_portions: parseInt(offerForm.menuRemainingPortions)
        };

        const menuResult = await supabase
          .from('daily_offer_menus')
          .insert(menuData);

        if (menuResult.error) throw menuResult.error;
      }

      toast({
        title: "Siker",
        description: selectedOffer ? "Napi ajánlat frissítve" : "Új napi ajánlat létrehozva"
      });

      fetchData();
    } catch (error) {
      console.error('Error saving offer:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a napi ajánlatot",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async () => {
    if (!selectedOffer) return;
    if (!confirm('Biztosan törölni szeretné ezt a napi ajánlatot?')) return;

    try {
      await Promise.all([
        supabase.from('daily_offer_items').delete().eq('daily_offer_id', selectedOffer.id),
        supabase.from('daily_offer_menus').delete().eq('daily_offer_id', selectedOffer.id),
        supabase.from('daily_offers').delete().eq('id', selectedOffer.id)
      ]);
      toast({ title: "Siker", description: "Napi ajánlat törölve" });
      fetchData();
    } catch (error) {
      toast({ title: "Hiba", description: "Hiba történt a törlés során", variant: "destructive" });
    }
  };

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    const notSelected = !offerForm.selectedItems.some(selected => selected.id === item.id);
    return matchesSearch && matchesCategory && notSelected;
  });

  const menuItems = offerForm.selectedItems.filter(item => item.isMenuPart);
  const soupItems = menuItems.filter(item => item.menuRole === 'leves');
  const mainItems = menuItems.filter(item => item.menuRole === 'főétel');
  const isValidMenu = menuItems.length === 0 || (soupItems.length === 1 && mainItems.length === 1);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 lg:gap-6 min-h-0 p-1 lg:p-0">
      {/* Calendar - Compact Mobile / Sidebar Desktop */}
      <div className="w-full lg:w-auto">
        <Card className="rounded-xl lg:rounded-2xl shadow-sm lg:shadow-md border-primary/10 lg:border-primary/20">
          <CardHeader className="pb-2 lg:pb-3 px-3 py-3 lg:px-6 lg:py-4">
            <CardTitle className="text-base lg:text-xl font-semibold lg:font-bold text-foreground">
              Naptár
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 lg:p-6">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={hu}
              className="rounded-md border-0 p-0 w-full mx-auto scale-90 lg:scale-100"
              classNames={{
                months: "flex flex-col space-y-2",
                month: "space-y-2",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm lg:text-base font-medium",
                nav: "space-x-1 flex items-center",
                nav_button: "h-7 w-7 lg:h-8 lg:w-8 bg-transparent p-0 opacity-50 hover:opacity-100 rounded-md",
                nav_button_previous: "absolute left-1",
                nav_button_next: "absolute right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex justify-center",
                head_cell: "text-muted-foreground rounded-md w-7 lg:w-9 font-normal text-xs lg:text-sm text-center",
                row: "flex w-full mt-1 justify-center",
                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: "h-7 w-7 lg:h-9 lg:w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md text-xs lg:text-sm flex items-center justify-center",
                day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                day_today: "bg-accent text-accent-foreground font-semibold",
                day_outside: "text-muted-foreground opacity-50",
                day_disabled: "text-muted-foreground opacity-50",
                day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
                day_hidden: "invisible",
              }}
              modifiers={{
                hasContent: (date) => hasOfferOnDate(date),
                weekend: (date) => isWeekend(date)
              }}
              modifiersStyles={{
                hasContent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                },
                weekend: {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  textDecoration: 'line-through',
                  opacity: 0.6
                }
              }}
            />
            <div className="mt-2 lg:mt-3 text-xs text-muted-foreground space-y-1">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 lg:w-3 lg:h-3 bg-primary rounded"></span>
                <span>Ajánlat beállítva</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 lg:w-3 lg:h-3 bg-muted rounded"></span>
                <span>Hétvége - zárva</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content - Mobile Optimized / Desktop Right Side */}
      <div className="w-full flex-1 min-h-0">
        <div className="space-y-3 lg:space-y-6">
          <Card className="rounded-xl lg:rounded-2xl shadow-sm lg:shadow-md border-primary/10 lg:border-primary/20">
            <CardHeader className="pb-3 lg:pb-6 px-3 py-3 lg:px-6 lg:py-4">
              <CardTitle className="text-base lg:text-xl font-semibold lg:font-bold text-foreground flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <span>Napi Ajánlat + Menü</span>
                <div className="text-xs lg:text-sm font-normal text-muted-foreground">
                  {format(selectedDate, 'MM. dd. (EEE)', { locale: hu })}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 lg:space-y-6 px-3 lg:px-6 pb-4 lg:pb-6">{isWeekend(selectedDate) ? (
              <div className="text-center py-8">
                <div className="p-6 bg-muted/50 rounded-lg">
                  <p className="text-muted-foreground text-lg font-medium mb-2">
                    Hétvégén zárva
                  </p>
                  <p className="text-muted-foreground/70 text-sm">
                    A vendéglő szombaton és vasárnap zárva tart
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Daily Offer Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <h3 className="text-lg font-semibold">Napi ajánlat beállításai</h3>
                    </div>
                    {selectedOffer && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={deleteOffer}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Törlés
                      </Button>
                    )}
                  </div>
                  
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                     <div className="space-y-2">
                       <Label className="text-sm font-medium">Ár (Ft)</Label>
                       <Input
                         type="number"
                         value={offerForm.price_huf}
                         onChange={(e) => setOfferForm(prev => ({ ...prev, price_huf: e.target.value }))}
                         className="h-10 text-base"
                         inputMode="numeric"
                       />
                     </div>
                     <div className="space-y-2">
                       <Label className="text-sm font-medium">Maximum adag</Label>
                       <Input
                         type="number"
                         value={offerForm.max_portions}
                         onChange={(e) => setOfferForm(prev => ({ ...prev, max_portions: e.target.value }))}
                         className="h-10 text-base"
                         inputMode="numeric"
                       />
                     </div>
                     <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                       <Label className="text-sm font-medium">Maradék adag</Label>
                       <Input
                         type="number"
                         value={offerForm.remaining_portions}
                         onChange={(e) => setOfferForm(prev => ({ ...prev, remaining_portions: e.target.value }))}
                         className="h-10 text-base"
                         inputMode="numeric"
                       />
                     </div>
                   </div>
                  
                 <div className="space-y-2">
                   <Label className="text-sm font-medium">Megjegyzés</Label>
                   <Textarea
                     value={offerForm.note}
                     onChange={(e) => setOfferForm(prev => ({ ...prev, note: e.target.value }))}
                     placeholder="Opcionális megjegyzés..."
                     className="min-h-[80px] resize-none"
                   />
                 </div>
                </div>

                <Separator />

                 {/* Selected Items List */}
                 {offerForm.selectedItems.length > 0 && (
                   <div className="space-y-3 lg:space-y-4">
                     <h4 className="font-medium text-xs lg:text-sm text-muted-foreground uppercase tracking-wide">KIVÁLASZTOTT ÉTELEK</h4>
                     <div className="space-y-2 lg:space-y-3">
                       {offerForm.selectedItems.map(selectedItem => {
                         const item = availableItems.find(i => i.id === selectedItem.id);
                         if (!item) return null;

                         return (
                              <div
                                key={item.id}
                                className="p-3 lg:p-4 border rounded-lg bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors"
                              >
                                <div className="flex flex-col gap-3">
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="flex-1 min-w-0">
                                      <div className="font-medium text-sm lg:text-base truncate">{item.name}</div>
                                      <div className="text-xs lg:text-sm text-muted-foreground">{item.price_huf} Ft</div>
                                      {item.is_temporary && (
                                        <Badge variant="secondary" className="mt-1 text-xs">Ideiglenes</Badge>
                                      )}
                                    </div>
                                    
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 hover:bg-destructive/10 shrink-0"
                                      onClick={() => removeItem(item.id)}
                                    >
                                      <X className="h-4 w-4 text-destructive" />
                                    </Button>
                                  </div>
                                  
                                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                                    <div className="flex items-center gap-2">
                                      <Checkbox
                                        id={`menu-${item.id}`}
                                        checked={selectedItem.isMenuPart}
                                        onCheckedChange={(checked) => 
                                          updateItemMenuSettings(item.id, !!checked, selectedItem.menuRole)
                                        }
                                      />
                                      <Label htmlFor={`menu-${item.id}`} className="text-sm cursor-pointer">
                                        Menü része
                                      </Label>
                                    </div>
                                    
                                    {selectedItem.isMenuPart && (
                                      <Select
                                        value={selectedItem.menuRole || ''}
                                        onValueChange={(value) => 
                                          updateItemMenuSettings(item.id, true, value as 'leves' | 'főétel')
                                        }
                                      >
                                        <SelectTrigger className="w-full sm:w-28 h-9">
                                          <SelectValue placeholder="Szerep" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="leves">Leves</SelectItem>
                                          <SelectItem value="főétel">Főétel</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    )}
                                  </div>
                                </div>
                              </div>
                         );
                       })}
                     </div>
                   </div>
                 )}

                {/* Menu Configuration */}
                {menuItems.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Utensils className="h-5 w-5 text-secondary" />
                        <h3 className="text-lg font-semibold">Menü beállításai</h3>
                        {!isValidMenu && (
                          <Badge variant="destructive" className="ml-2">
                            Hibás összeállítás
                          </Badge>
                        )}
                      </div>

                      {!isValidMenu && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                          <p className="text-sm text-destructive">
                            A menühöz pontosan 1 leves és 1 főétel szükséges. 
                            Jelenleg: {soupItems.length} leves, {mainItems.length} főétel
                          </p>
                        </div>
                      )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Ár (Ft)</Label>
                            <Input
                              type="number"
                              value={offerForm.menuPrice}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, menuPrice: e.target.value }))}
                              className="h-10 text-base"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-medium">Max adag</Label>
                            <Input
                              type="number"
                              value={offerForm.menuMaxPortions}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, menuMaxPortions: e.target.value }))}
                              className="h-10 text-base"
                              inputMode="numeric"
                            />
                          </div>
                          <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                            <Label className="text-sm font-medium">Maradt adag</Label>
                            <Input
                              type="number"
                              value={offerForm.menuRemainingPortions}
                              onChange={(e) => setOfferForm(prev => ({ ...prev, menuRemainingPortions: e.target.value }))}
                              className="h-10 text-base"
                              inputMode="numeric"
                            />
                          </div>
                        </div>
                    </div>
                  </>
                )}

                <Separator />

                 {/* Food Selection */}
                 <div className="space-y-3 lg:space-y-4">
                   <h3 className="text-base lg:text-lg font-semibold">Ételek kiválasztása</h3>
                   
                   {/* Search and Filter */}
                   <div className="flex flex-col gap-2 lg:gap-3">
                     <Input
                       placeholder="Keresés ételek között..."
                       value={searchTerm}
                       onChange={(e) => setSearchTerm(e.target.value)}
                       className="h-10 text-base"
                     />
                     <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                       <SelectTrigger className="h-10 text-base">
                         <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                         <SelectItem value="all">Minden kategória</SelectItem>
                         {categories.map(category => (
                           <SelectItem key={category.id} value={category.id}>
                             {category.name}
                           </SelectItem>
                         ))}
                       </SelectContent>
                     </Select>
                   </div>

                   {/* Available Items */}
                   <div className="border rounded-lg max-h-48 lg:max-h-64 overflow-y-auto">
                     {filteredItems.length === 0 ? (
                       <div className="text-center py-6 lg:py-8 text-muted-foreground text-sm">
                         Nincs több elérhető étel
                       </div>
                     ) : (
                       <div className="p-1 lg:p-2 space-y-1">
                         {filteredItems.map(item => (
                           <div
                             key={item.id}
                             className="flex items-center justify-between p-3 hover:bg-muted/50 rounded cursor-pointer transition-colors"
                             onClick={() => toggleItem(item.id)}
                           >
                             <div className="flex items-center gap-3">
                               {item.image_url && (
                                 <img src={item.image_url} alt={item.name} className="w-8 h-8 object-cover rounded" />
                               )}
                               <div className="min-w-0 flex-1">
                                 <div className="font-medium text-sm truncate">{item.name}</div>
                                 <div className="text-xs text-muted-foreground">{item.price_huf} Ft</div>
                               </div>
                             </div>
                             <Button size="sm" variant="outline" className="h-8 w-8 p-0 shrink-0">
                               <Plus className="h-4 w-4" />
                             </Button>
                           </div>
                         ))}
                       </div>
                     )}
                   </div>

                  {/* Temporary Items */}
                  <div className="space-y-4">
                    <TemporaryItemCreator
                      categories={categories}
                      onItemCreated={onItemCreated}
                      onRefreshLibrary={fetchData}
                    />
                    
                    <TemporaryItemsLibrary
                      categories={categories}
                      selectedItems={offerForm.selectedItems.map(item => item.id)}
                      onItemToggle={toggleItem}
                    />
                  </div>
                </div>

                <Separator />

                 {/* Save Button */}
                 <div className="flex justify-center lg:justify-end pt-2 lg:pt-4">
                   <Button
                     onClick={saveOffer}
                     disabled={saving || offerForm.selectedItems.length === 0 || (menuItems.length > 0 && !isValidMenu)}
                     className="w-full sm:w-auto min-w-32 h-12 text-base font-medium"
                     size="lg"
                   >
                     <Save className="h-4 w-4 mr-2" />
                     {saving ? 'Mentés...' : 'Mentés'}
                   </Button>
                 </div>
              </>
            )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default StreamlinedDailyOffers;