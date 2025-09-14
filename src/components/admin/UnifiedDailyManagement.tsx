import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { Plus, Edit, Trash2, Save, X, Package, Coffee } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

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

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_offer_items?: Array<{
    id: string;
    item_id: string;
    menu_items?: MenuItem;
  }>;
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  daily_menu_items?: Array<{
    id: string;
    item_id: string;
    menu_items?: MenuItem;
  }>;
}

const UnifiedDailyManagement = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Data states
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  
  // Dialog states
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<DailyOffer | null>(null);
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);

  // Form states
  const [offerForm, setOfferForm] = useState({
    price_huf: "2200",
    note: "",
    max_portions: "50",
    remaining_portions: "50",
    selectedItems: [] as string[]
  });

  const [menuForm, setMenuForm] = useState({
    price_huf: "1800",
    note: "",
    max_portions: "30",
    remaining_portions: "30",
    selectedItems: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [offersResult, menusResult, itemsResult, categoriesResult] = await Promise.all([
      supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (
            id,
            item_id,
            menu_items (id, name, description, price_huf, image_url)
          )
        `)
        .order('date', { ascending: false }),
      supabase
        .from('daily_menus')
        .select(`
          *,
          daily_menu_items (
            id,
            item_id,
            menu_items (id, name, description, price_huf, image_url)
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
    if (menusResult.data) setDailyMenus(menusResult.data);
    if (itemsResult.data) setMenuItems(itemsResult.data);
    if (categoriesResult.data) setCategories(categoriesResult.data);

    setLoading(false);
  };

  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');
  const selectedDateOffers = dailyOffers.filter(offer => offer.date === selectedDateString);
  const selectedDateMenus = dailyMenus.filter(menu => menu.date === selectedDateString);

  const getOffersForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyOffers.filter(offer => offer.date === dateString);
  };

  const getMenusForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return dailyMenus.filter(menu => menu.date === dateString);
  };

  const hasOfferOnDate = (date: Date) => getOffersForDate(date).length > 0;
  const hasMenuOnDate = (date: Date) => getMenusForDate(date).length > 0;
  const hasAnyOnDate = (date: Date) => hasOfferOnDate(date) || hasMenuOnDate(date);

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const openOfferDialog = (offer?: DailyOffer) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        price_huf: offer.price_huf.toString(),
        note: offer.note || "",
        max_portions: offer.max_portions.toString(),
        remaining_portions: offer.remaining_portions.toString(),
        selectedItems: offer.daily_offer_items?.map(item => item.item_id) || []
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        price_huf: "2200",
        note: "",
        max_portions: "50",
        remaining_portions: "50",
        selectedItems: []
      });
    }
    setIsOfferDialogOpen(true);
  };

  const openMenuDialog = (menu?: DailyMenu) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        price_huf: menu.price_huf.toString(),
        note: menu.note || "",
        max_portions: menu.max_portions.toString(),
        remaining_portions: menu.remaining_portions.toString(),
        selectedItems: menu.daily_menu_items?.map(item => item.item_id) || []
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        price_huf: "1800",
        note: "",
        max_portions: "30",
        remaining_portions: "30",
        selectedItems: []
      });
    }
    setIsMenuDialogOpen(true);
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

      // Delete existing items
      if (editingOffer) {
        await supabase
          .from('daily_offer_items')
          .delete()
          .eq('daily_offer_id', offerId);
      }

      // Insert new items
      if (offerForm.selectedItems.length > 0) {
        const itemsToInsert = offerForm.selectedItems.map(itemId => ({
          daily_offer_id: offerId,
          item_id: itemId
        }));

        const itemsResult = await supabase
          .from('daily_offer_items')
          .insert(itemsToInsert);

        if (itemsResult.error) throw itemsResult.error;
      }

      toast({
        title: "Siker",
        description: editingOffer ? "Napi ajánlat frissítve" : "Új napi ajánlat létrehozva"
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

  const saveMenu = async () => {
    if (isWeekend(selectedDate)) {
      toast({
        title: "Hiba",
        description: "Hétvégén a vendéglő zárva tart",
        variant: "destructive"
      });
      return;
    }

    setSaving(true);
    try {
      const menuData = {
        date: selectedDateString,
        price_huf: parseInt(menuForm.price_huf),
        note: menuForm.note || null,
        max_portions: parseInt(menuForm.max_portions),
        remaining_portions: parseInt(menuForm.remaining_portions)
      };

      let result;
      let menuId;

      if (editingMenu) {
        result = await supabase
          .from('daily_menus')
          .update(menuData)
          .eq('id', editingMenu.id);
        menuId = editingMenu.id;
      } else {
        result = await supabase
          .from('daily_menus')
          .insert(menuData)
          .select()
          .single();
        menuId = result.data?.id;
      }

      if (result.error) throw result.error;

      // Delete existing items
      if (editingMenu) {
        await supabase
          .from('daily_menu_items')
          .delete()
          .eq('daily_menu_id', menuId);
      }

      // Insert new items
      if (menuForm.selectedItems.length > 0) {
        const itemsToInsert = menuForm.selectedItems.map(itemId => ({
          daily_menu_id: menuId,
          item_id: itemId
        }));

        const itemsResult = await supabase
          .from('daily_menu_items')
          .insert(itemsToInsert);

        if (itemsResult.error) throw itemsResult.error;
      }

      toast({
        title: "Siker",
        description: editingMenu ? "Napi menü frissítve" : "Új napi menü létrehozva"
      });

      setIsMenuDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving menu:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a napi menüt",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (offerId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a napi ajánlatot?')) return;

    try {
      await supabase.from('daily_offer_items').delete().eq('daily_offer_id', offerId);
      await supabase.from('daily_offers').delete().eq('id', offerId);
      toast({ title: "Siker", description: "Napi ajánlat törölve" });
      fetchData();
    } catch (error) {
      toast({ title: "Hiba", description: "Hiba történt a törlés során", variant: "destructive" });
    }
  };

  const deleteMenu = async (menuId: string) => {
    if (!confirm('Biztosan törölni szeretné ezt a napi menüt?')) return;

    try {
      await supabase.from('daily_menu_items').delete().eq('daily_menu_id', menuId);
      await supabase.from('daily_menus').delete().eq('id', menuId);
      toast({ title: "Siker", description: "Napi menü törölve" });
      fetchData();
    } catch (error) {
      toast({ title: "Hiba", description: "Hiba történt a törlés során", variant: "destructive" });
    }
  };

  const toggleOfferItem = (itemId: string) => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }));
  };

  const toggleMenuItemSelection = (itemId: string) => {
    setMenuForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.includes(itemId)
        ? prev.selectedItems.filter(id => id !== itemId)
        : [...prev.selectedItems, itemId]
    }));
  };

  const removeOfferItem = (itemId: string) => {
    setOfferForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(id => id !== itemId)
    }));
  };

  const removeMenuItem = (itemId: string) => {
    setMenuForm(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(id => id !== itemId)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

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
                hasContent: (date) => hasAnyOnDate(date),
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
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 bg-primary rounded"></span>
                Ajánlat/menü beállítva
              </span>
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
              <CardTitle className="text-xl font-bold text-foreground">
                {format(selectedDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
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
              ) : (
                <div className="space-y-6">
                  {/* Daily Offers Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Package className="h-5 w-5 text-primary" />
                        <h3 className="text-lg font-semibold">Napi ajánlatok</h3>
                      </div>
                      <Button
                        onClick={() => openOfferDialog()}
                        size="sm"
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Új ajánlat
                      </Button>
                    </div>
                    
                    {selectedDateOffers.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateOffers.map((offer) => (
                          <div key={offer.id} className="p-4 border rounded-lg border-border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Badge className="bg-primary text-primary-foreground mb-2">
                                  {offer.price_huf} Ft
                                </Badge>
                                <div className="flex gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Max: {offer.max_portions} adag
                                  </Badge>
                                  <Badge variant={offer.remaining_portions > 0 ? "default" : "destructive"} className="text-xs">
                                    Maradt: {offer.remaining_portions}
                                  </Badge>
                                </div>
                                {offer.note && (
                                  <p className="text-sm text-muted-foreground">{offer.note}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openOfferDialog(offer)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteOffer(offer.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {offer.daily_offer_items?.map((item) => (
                                <li key={item.id} className="text-sm">
                                  • {item.menu_items?.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">Nincs napi ajánlat beállítva</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Daily Menus Section */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Coffee className="h-5 w-5 text-secondary" />
                        <h3 className="text-lg font-semibold">Napi menük</h3>
                      </div>
                      <Button
                        onClick={() => openMenuDialog()}
                        size="sm"
                        className="bg-secondary hover:bg-secondary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Új menü
                      </Button>
                    </div>
                    
                    {selectedDateMenus.length > 0 ? (
                      <div className="space-y-3">
                        {selectedDateMenus.map((menu) => (
                          <div key={menu.id} className="p-4 border rounded-lg border-border">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <Badge className="bg-secondary text-secondary-foreground mb-2">
                                  {menu.price_huf} Ft
                                </Badge>
                                <div className="flex gap-2 mb-2">
                                  <Badge variant="outline" className="text-xs">
                                    Max: {menu.max_portions} adag
                                  </Badge>
                                  <Badge variant={menu.remaining_portions > 0 ? "default" : "destructive"} className="text-xs">
                                    Maradt: {menu.remaining_portions}
                                  </Badge>
                                </div>
                                {menu.note && (
                                  <p className="text-sm text-muted-foreground">{menu.note}</p>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => openMenuDialog(menu)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => deleteMenu(menu.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <ul className="space-y-1">
                              {menu.daily_menu_items?.map((item) => (
                                <li key={item.id} className="text-sm">
                                  • {item.menu_items?.name}
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-muted/20 rounded-lg">
                        <p className="text-muted-foreground">Nincs napi menü beállítva</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Offer Dialog */}
      <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingOffer ? 'Napi ajánlat szerkesztése' : 'Új napi ajánlat'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
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
            </div>
            
            <div className="space-y-2">
              <Label>Megjegyzés</Label>
              <Textarea
                value={offerForm.note}
                onChange={(e) => setOfferForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Opcionális megjegyzés..."
              />
            </div>

            {/* Selected Items Display */}
            {offerForm.selectedItems.length > 0 && (
              <div className="space-y-2">
                <Label>Kiválasztott ételek ({offerForm.selectedItems.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {offerForm.selectedItems.map(itemId => {
                    const item = menuItems.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <Badge key={itemId} variant="secondary" className="flex items-center gap-2">
                        {item.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeOfferItem(itemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Food Selection */}
            <div className="space-y-4">
              <Label>Ételek kiválasztása</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {categories.map(category => {
                  const categoryItems = menuItems.filter(item => item.category_id === category.id && !item.is_temporary);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">{category.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryItems.map(item => (
                          <div
                            key={item.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              offerForm.selectedItems.includes(item.id)
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => toggleOfferItem(item.id)}
                          >
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.price_huf} Ft</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsOfferDialogOpen(false)}
              >
                Mégse
              </Button>
              <Button
                onClick={saveOffer}
                disabled={saving || offerForm.selectedItems.length === 0}
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Mentés...' : 'Mentés'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Dialog */}
      <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingMenu ? 'Napi menü szerkesztése' : 'Új napi menü'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ár (Ft)</Label>
                <Input
                  type="number"
                  value={menuForm.price_huf}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, price_huf: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Maximum adag</Label>
                <Input
                  type="number"
                  value={menuForm.max_portions}
                  onChange={(e) => setMenuForm(prev => ({ ...prev, max_portions: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Megjegyzés</Label>
              <Textarea
                value={menuForm.note}
                onChange={(e) => setMenuForm(prev => ({ ...prev, note: e.target.value }))}
                placeholder="Opcionális megjegyzés..."
              />
            </div>

            {/* Selected Items Display */}
            {menuForm.selectedItems.length > 0 && (
              <div className="space-y-2">
                <Label>Kiválasztott ételek ({menuForm.selectedItems.length})</Label>
                <div className="flex flex-wrap gap-2">
                  {menuForm.selectedItems.map(itemId => {
                    const item = menuItems.find(i => i.id === itemId);
                    if (!item) return null;
                    return (
                      <Badge key={itemId} variant="secondary" className="flex items-center gap-2">
                        {item.name}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeMenuItem(itemId)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Food Selection */}
            <div className="space-y-4">
              <Label>Ételek kiválasztása (jellemzően leves + főétel)</Label>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {categories.map(category => {
                  const categoryItems = menuItems.filter(item => item.category_id === category.id && !item.is_temporary);
                  if (categoryItems.length === 0) return null;
                  
                  return (
                    <div key={category.id} className="space-y-2">
                      <h4 className="font-medium text-sm text-muted-foreground">{category.name}</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {categoryItems.map(item => (
                          <div
                            key={item.id}
                            className={`p-2 border rounded cursor-pointer transition-colors ${
                              menuForm.selectedItems.includes(item.id)
                                ? 'border-secondary bg-secondary/5'
                                : 'border-border hover:bg-muted/50'
                            }`}
                            onClick={() => toggleMenuItemSelection(item.id)}
                          >
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-muted-foreground">{item.price_huf} Ft</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setIsMenuDialogOpen(false)}
              >
                Mégse
              </Button>
              <Button
                onClick={saveMenu}
                disabled={saving || menuForm.selectedItems.length === 0}
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