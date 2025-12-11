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
import { Plus, Edit, Trash2, Save, X, Package, Coffee, Utensils } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { EnhancedItemSelection } from "./EnhancedItemSelection";
import { MenuItemSelection } from "./MenuItemSelection";

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

interface OfferFormItem {
  id: string;
  isMenuPart: boolean;
  menuRole?: 'leves' | 'főétel';
}

const UnifiedDailyManagement = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  
  // Dialog states
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<DailyOffer | null>(null);

  // Form states
  const [offerForm, setOfferForm] = useState({
    price_huf: "2200",
    note: "",
    max_portions: "50",
    remaining_portions: "50",
    selectedItems: [] as OfferFormItem[],
    menuPrice: "2200",
    menuMaxPortions: "30",
    menuRemainingPortions: "30"
  });

  useEffect(() => {
    fetchData();
  }, []);

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
            menu_items (id, name, description, price_huf, image_url)
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

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateOffers = dailyOffers.filter(offer => offer.date === selectedDateString);

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => getOffersForDate(date).length > 0;

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const openOfferDialog = (offer?: DailyOffer) => {
    if (offer) {
      setEditingOffer(offer);
      const selectedItems: OfferFormItem[] = offer.daily_offer_items?.map(item => ({
        id: item.item_id,
        isMenuPart: item.is_menu_part,
        menuRole: item.menu_role as 'leves' | 'főétel'
      })) || [];
      
      const offerMenu = offer.daily_offer_menus;
      
      setOfferForm({
        price_huf: offer.price_huf?.toString() || "2200",
        note: offer.note || "",
        max_portions: offer.max_portions?.toString() || "50",
        remaining_portions: offer.remaining_portions?.toString() || "50",
        selectedItems,
        menuPrice: offerMenu?.menu_price_huf?.toString() || "2200",
        menuMaxPortions: offerMenu?.max_portions?.toString() || "30",
        menuRemainingPortions: offerMenu?.remaining_portions?.toString() || "30"
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        price_huf: "2200",
        note: "",
        max_portions: "50",
        remaining_portions: "50",
        selectedItems: [],
        menuPrice: "2200",
        menuMaxPortions: "30",
        menuRemainingPortions: "30"
      });
    }
    setIsOfferDialogOpen(true);
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

      if (editingOffer) {
        result = await supabase
          .from('daily_offers')
          .update(offerData)
          .eq('id', editingOffer.id);
        offerId = editingOffer.id;
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
      if (editingOffer) {
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
        description: editingOffer ? "Napi ajánlat és menü frissítve" : "Új napi ajánlat és menü létrehozva"
      });

      setIsOfferDialogOpen(false);
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

  const deleteOffer = async (offerId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a napi ajánlatot és menüt?')) return;

    try {
      await Promise.all([
        supabase.from('daily_offer_items').delete().eq('daily_offer_id', offerId),
        supabase.from('daily_offer_menus').delete().eq('daily_offer_id', offerId),
        supabase.from('daily_offers').delete().eq('id', offerId)
      ]);
      toast({ title: "Siker", description: "Napi ajánlat törölve" });
      fetchData();
    } catch (error) {
      toast({ title: "Hiba", description: "Hiba történt a törlés során", variant: "destructive" });
    }
  };

  const toggleOfferItem = (itemId: string) => {
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

  const removeOfferItem = (itemId: string) => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(item => item.id !== itemId)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  const selectedOffer = selectedDateOffers[0];
  const menuItems = offerForm.selectedItems.filter(item => item.isMenuPart);
  const soupItems = menuItems.filter(item => item.menuRole === 'leves');
  const mainItems = menuItems.filter(item => item.menuRole === 'főétel');
  const isValidMenu = menuItems.length === 0 || (soupItems.length === 1 && mainItems.length === 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-foreground">
              Napi ajánlatok és menük
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={hu}
              className="rounded-md border-0 p-0"
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
            <div className="mt-4 text-sm text-muted-foreground space-y-2">
              <div className="inline-flex items-center gap-2">
                <span className="w-4 h-4 bg-primary rounded"></span>
                Ajánlat/menü beállítva
              </div>
              <div className="inline-flex items-center gap-2">
                <span className="w-4 h-4 bg-muted rounded"></span>
                Hétvége - zárva
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Date Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-foreground flex items-center justify-between">
                <span>{format(selectedDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}</span>
                {!isWeekend(selectedDate) && (
                  <Button
                    onClick={() => openOfferDialog(selectedOffer)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {selectedOffer ? 'Szerkesztés' : 'Új ajánlat'}
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isWeekend(selectedDate) ? (
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
              ) : selectedOffer ? (
                <div className="space-y-6">
                  {/* Daily Offer Section */}
                  <div className="p-4 border rounded-lg border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Napi ajánlat</h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openOfferDialog(selectedOffer)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteOffer(selectedOffer.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <Badge className="bg-primary text-primary-foreground mb-2">
                        {selectedOffer.price_huf} Ft
                      </Badge>
                      <div className="flex gap-2 mb-2">
                        <Badge variant="outline" className="text-xs">
                          Max: {selectedOffer.max_portions} adag
                        </Badge>
                        <Badge variant={selectedOffer.remaining_portions! > 0 ? "default" : "destructive"} className="text-xs">
                          Maradt: {selectedOffer.remaining_portions}
                        </Badge>
                      </div>
                      {selectedOffer.note && (
                        <p className="text-sm text-muted-foreground">{selectedOffer.note}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Ajánlatban szereplő ételek:</h4>
                      <ul className="space-y-1">
                        {selectedOffer.daily_offer_items
                          ?.filter(item => !item.is_menu_part)
                          .map((item) => (
                            <li key={item.id} className="text-sm flex items-center gap-2">
                              • {item.menu_items?.name}
                            </li>
                          ))}
                      </ul>
                    </div>
                  </div>

                  {/* Daily Menu Section */}
                  {selectedOffer.daily_offer_menus && (
                    <>
            <Separator />

            {/* Selected Items Configuration */}
            <MenuItemSelection
              selectedItems={offerForm.selectedItems}
              onUpdateItemMenuSettings={updateItemMenuSettings}
              onRemoveOfferItem={removeOfferItem}
              availableItems={availableItems}
            />
                      <div className="p-4 border rounded-lg border-border">
                        <div className="flex items-center gap-2 mb-3">
                          <Utensils className="h-5 w-5 text-secondary" />
                          <h3 className="text-lg font-semibold">Napi menü</h3>
                        </div>
                        
                        <div className="mb-3">
                          <Badge className="bg-secondary text-secondary-foreground mb-2">
                            {selectedOffer.daily_offer_menus.menu_price_huf} Ft
                          </Badge>
                          <div className="flex gap-2 mb-2">
                            <Badge variant="outline" className="text-xs">
                              Max: {selectedOffer.daily_offer_menus.max_portions} adag
                            </Badge>
                            <Badge variant={selectedOffer.daily_offer_menus.remaining_portions > 0 ? "default" : "destructive"} className="text-xs">
                              Maradt: {selectedOffer.daily_offer_menus.remaining_portions}
                            </Badge>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Menü összetétele:</h4>
                          <ul className="space-y-1">
                            {selectedOffer.daily_offer_items
                              ?.filter(item => item.is_menu_part)
                              .map((item) => (
                                <li key={item.id} className="text-sm flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {item.menu_role}
                                  </Badge>
                                  {item.menu_items?.name}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-6 bg-muted/20 rounded-lg">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      Nincs napi ajánlat beállítva
                    </p>
                    <p className="text-muted-foreground/70 text-sm mb-4">
                      Kattintson az "Új ajánlat" gombra a napi ajánlat és menü létrehozásához
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Unified Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? 'Napi ajánlat és menü szerkesztése' : 'Új napi ajánlat és menü'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Daily Offer Settings */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Napi ajánlat beállításai</h3>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Ár (Ft)</Label>
                  <Input
                    type="number"
                    value={offerForm.price_huf}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, price_huf: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maximum adag</Label>
                  <Input
                    type="number"
                    value={offerForm.max_portions}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, max_portions: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Maradék adag</Label>
                  <Input
                    type="number"
                    value={offerForm.remaining_portions}
                    onChange={(e) => setOfferForm(prev => ({ ...prev, remaining_portions: e.target.value }))}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Megjegyzés</Label>
                <Textarea
                  value={offerForm.note}
                  onChange={(e) => setOfferForm(prev => ({ ...prev, note: e.target.value }))}
                  placeholder="Opcionális megjegyzés..."
                />
              </div>
            </div>

            <Separator />

            {/* Food Selection */}
            <div className="space-y-4">
              <Label>Ételek kiválasztása</Label>
              <EnhancedItemSelection
                menuItems={availableItems}
                categories={categories}
                selectedItems={offerForm.selectedItems.map(item => item.id)}
                onItemToggle={toggleOfferItem}
                onRefreshData={fetchData}
              />
            </div>

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

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Menü ár (Ft)</Label>
                      <Input
                        type="number"
                        value={offerForm.menuPrice}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, menuPrice: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maximum adag</Label>
                      <Input
                        type="number"
                        value={offerForm.menuMaxPortions}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, menuMaxPortions: e.target.value }))}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maradék adag</Label>
                      <Input
                        type="number"
                        value={offerForm.menuRemainingPortions}
                        onChange={(e) => setOfferForm(prev => ({ ...prev, menuRemainingPortions: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Menü összetétele</Label>
                    <div className="p-3 bg-muted/20 rounded-lg">
                      {menuItems.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Nincs kiválasztva menüelem</p>
                      ) : (
                        <div className="space-y-1">
                          {menuItems.map(item => {
                            const menuItem = availableItems.find(mi => mi.id === item.id);
                            return (
                              <div key={item.id} className="text-sm flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  {item.menuRole}
                                </Badge>
                                {menuItem?.name}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setIsOfferDialogOpen(false)}
              >
                Mégse
              </Button>
              <Button
                onClick={saveOffer}
                disabled={saving || offerForm.selectedItems.length === 0 || (menuItems.length > 0 && !isValidMenu)}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UnifiedDailyManagement;