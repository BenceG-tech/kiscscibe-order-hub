import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Calendar,
  DollarSign,
  CheckCircle,
  X,
  Package,
  Coffee
} from "lucide-react";
import AdminDailyOfferCalendar from "@/components/admin/AdminDailyOfferCalendar";
import AdminDailyMenuCalendar from "@/components/admin/AdminDailyMenuCalendar";
import ImageUpload from "@/components/admin/ImageUpload";

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  created_at: string;
}

interface DailyMenu {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  max_portions: number;
  remaining_portions: number;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
  category_id: string;
  is_active: boolean;
  image_url?: string;
}

interface DailyOfferItem {
  id: string;
  daily_offer_id: string;
  item_id: string;
  menu_items?: MenuItem;
}

interface DailyMenuItems {
  id: string;
  daily_menu_id: string;
  item_id: string;
  menu_items?: MenuItem;
}

const DailyMenuManagement = () => {
  const { toast } = useToast();
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [dailyMenus, setDailyMenus] = useState<DailyMenu[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Dialog states
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [isMenuDialogOpen, setIsMenuDialogOpen] = useState(false);
  
  // Editing states
  const [editingOffer, setEditingOffer] = useState<DailyOffer | null>(null);
  const [editingMenu, setEditingMenu] = useState<DailyMenu | null>(null);
  
  // Form states
  const [offerForm, setOfferForm] = useState({
    date: new Date().toISOString().split('T')[0],
    price_huf: "2200",
    note: "",
    max_portions: "50",
    remaining_portions: "50",
    selectedItems: [] as string[]
  });

  const [menuForm, setMenuForm] = useState({
    date: new Date().toISOString().split('T')[0],
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
    const [offersResult, menusResult, itemsResult] = await Promise.all([
      supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (
            id,
            item_id,
            menu_items (
              id,
              name,
              description,
              price_huf,
              image_url
            )
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
            menu_items (
              id,
              name,
              description,
              price_huf,
              image_url
            )
          )
        `)
        .order('date', { ascending: false }),
      supabase
        .from('menu_items')
        .select('*')
        .eq('is_active', true)
        .order('name')
    ]);

    if (offersResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a napi ajánlatokat",
        variant: "destructive"
      });
    } else {
      setDailyOffers(offersResult.data || []);
    }

    if (menusResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a napi menüket",
        variant: "destructive"
      });
    } else {
      setDailyMenus(menusResult.data || []);
    }

    if (itemsResult.error) {
      toast({
        title: "Hiba", 
        description: "Nem sikerült betölteni az ételeket",
        variant: "destructive"
      });
    } else {
      setMenuItems(itemsResult.data || []);
    }

    setLoading(false);
  };

  const openOfferDialog = (offer?: any, defaultDate?: string) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        date: offer.date,
        price_huf: offer.price_huf.toString(),
        note: offer.note || "",
        max_portions: offer.max_portions?.toString() || "50",
        remaining_portions: offer.remaining_portions?.toString() || "50",
        selectedItems: offer.daily_offer_items?.map((item: any) => item.item_id) || []
      });
    } else {
      setEditingOffer(null);
      setOfferForm({
        date: defaultDate || new Date().toISOString().split('T')[0],
        price_huf: "2200",
        note: "",
        max_portions: "50",
        remaining_portions: "50",
        selectedItems: []
      });
    }
    setIsOfferDialogOpen(true);
  };

  const openMenuDialog = (menu?: any, defaultDate?: string) => {
    if (menu) {
      setEditingMenu(menu);
      setMenuForm({
        date: menu.date,
        price_huf: menu.price_huf.toString(),
        note: menu.note || "",
        max_portions: menu.max_portions?.toString() || "30",
        remaining_portions: menu.remaining_portions?.toString() || "30",
        selectedItems: menu.daily_menu_items?.map((item: any) => item.item_id) || []
      });
    } else {
      setEditingMenu(null);
      setMenuForm({
        date: defaultDate || new Date().toISOString().split('T')[0],
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
    setSaving(true);
    try {
      const offerData = {
        date: offerForm.date,
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

      if (result.error) {
        throw result.error;
      }

      // Delete existing items for this offer
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

        if (itemsResult.error) {
          throw itemsResult.error;
        }
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
    setSaving(true);
    try {
      const menuData = {
        date: menuForm.date,
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

      if (result.error) {
        throw result.error;
      }

      // Delete existing items for this menu
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

        if (itemsResult.error) {
          throw itemsResult.error;
        }
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

  const deleteOffer = async (id: string) => {
    // First delete related items
    await supabase
      .from('daily_offer_items')
      .delete()
      .eq('daily_offer_id', id);

    // Then delete the offer
    const { error } = await supabase
      .from('daily_offers')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni a napi ajánlatot",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Siker",
      description: "Napi ajánlat törölve"
    });
    
    fetchData();
  };

  const toggleOfferItemSelection = (itemId: string) => {
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Napi ajánlatok & menük kezelése</h1>
        </div>

        {/* Tabs for Offers and Menus */}
        <Tabs defaultValue="offers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="offers" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Napi ajánlatok
            </TabsTrigger>
            <TabsTrigger value="menus" className="flex items-center gap-2">
              <Coffee className="h-4 w-4" />
              Napi menük (olcsóbb)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="offers" className="space-y-6">
            <AdminDailyOfferCalendar 
              onCreateOffer={(date) => openOfferDialog(undefined, date)}
              onEditOffer={(offer) => openOfferDialog(offer)}
            />
          </TabsContent>
          
          <TabsContent value="menus" className="space-y-6">
            <AdminDailyMenuCalendar 
              onCreateMenu={(date) => openMenuDialog(undefined, date)}
              onEditMenu={(menu) => openMenuDialog(menu)}
            />
          </TabsContent>
        </Tabs>

        {/* Dialog for creating/editing offers */}
        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {editingOffer ? "Napi ajánlat szerkesztése" : "Új napi ajánlat létrehozása"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Dátum</label>
                  <Input
                    type="date"
                    value={offerForm.date}
                    onChange={(e) => setOfferForm({...offerForm, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ár (Ft)</label>
                  <Input
                    type="number"
                    value={offerForm.price_huf}
                    onChange={(e) => setOfferForm({...offerForm, price_huf: e.target.value})}
                    placeholder="2200"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max adagok</label>
                  <Input
                    type="number"
                    value={offerForm.max_portions}
                    onChange={(e) => setOfferForm({...offerForm, max_portions: e.target.value})}
                    placeholder="50"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Maradék adagok</label>
                  <Input
                    type="number"
                    value={offerForm.remaining_portions}
                    onChange={(e) => setOfferForm({...offerForm, remaining_portions: e.target.value})}
                    placeholder="50"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Megjegyzés</label>
                <Input
                  value={offerForm.note}
                  onChange={(e) => setOfferForm({...offerForm, note: e.target.value})}
                  placeholder="pl: 11:30-tól elérhető"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-3 block">Ételek kiválasztása</label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {menuItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        offerForm.selectedItems.includes(item.id) 
                          ? "bg-primary/10 border border-primary" 
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      onClick={() => toggleOfferItemSelection(item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {offerForm.selectedItems.includes(item.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveOffer} className="flex-1" disabled={saving}>
                  {saving ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Mentés..." : "Mentés"}
                </Button>
                <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)} disabled={saving}>
                  Mégse
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Dialog for creating/editing menus */}
        <Dialog open={isMenuDialogOpen} onOpenChange={setIsMenuDialogOpen}>
          <DialogContent className="sm:max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Coffee className="h-5 w-5 text-secondary" />
                {editingMenu ? "Napi menü szerkesztése" : "Új napi menü létrehozása"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Dátum</label>
                  <Input
                    type="date"
                    value={menuForm.date}
                    onChange={(e) => setMenuForm({...menuForm, date: e.target.value})}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Ár (Ft)</label>
                  <Input
                    type="number"
                    value={menuForm.price_huf}
                    onChange={(e) => setMenuForm({...menuForm, price_huf: e.target.value})}
                    placeholder="1800"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Max adagok</label>
                  <Input
                    type="number"
                    value={menuForm.max_portions}
                    onChange={(e) => setMenuForm({...menuForm, max_portions: e.target.value})}
                    placeholder="30"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Maradék adagok</label>
                  <Input
                    type="number"
                    value={menuForm.remaining_portions}
                    onChange={(e) => setMenuForm({...menuForm, remaining_portions: e.target.value})}
                    placeholder="30"
                  />
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">Megjegyzés</label>
                <Input
                  value={menuForm.note}
                  onChange={(e) => setMenuForm({...menuForm, note: e.target.value})}
                  placeholder="pl: 11:30-tól elérhető"
                />
              </div>
              
              <div>
                <label className="text-sm font-medium mb-3 block">Ételek kiválasztása</label>
                <div className="max-h-60 overflow-y-auto border rounded-lg p-3 space-y-2">
                  {menuItems.map((item) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                        menuForm.selectedItems.includes(item.id) 
                          ? "bg-secondary/10 border border-secondary" 
                          : "bg-muted/50 hover:bg-muted"
                      }`}
                      onClick={() => toggleMenuItemSelection(item.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {item.image_url && (
                          <img 
                            src={item.image_url} 
                            alt={item.name}
                            className="w-12 h-12 object-cover rounded-lg"
                          />
                        )}
                        <div className="flex-1">
                          <h4 className="font-medium">{item.name}</h4>
                          <p className="text-sm text-muted-foreground">{item.description}</p>
                        </div>
                      </div>
                      {menuForm.selectedItems.includes(item.id) && (
                        <CheckCircle className="h-5 w-5 text-secondary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveMenu} className="flex-1" disabled={saving}>
                  {saving ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Mentés..." : "Mentés"}
                </Button>
                <Button variant="outline" onClick={() => setIsMenuDialogOpen(false)} disabled={saving}>
                  Mégse
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default DailyMenuManagement;