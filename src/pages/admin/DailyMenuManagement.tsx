import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Calendar,
  DollarSign,
  CheckCircle,
  X
} from "lucide-react";
import AdminDailyOfferCalendar from "@/components/admin/AdminDailyOfferCalendar";

interface DailyOffer {
  id: string;
  date: string;
  price_huf: number;
  note?: string;
  created_at: string;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
  category_id: string;
  is_active: boolean;
}

interface DailyOfferItem {
  id: string;
  daily_offer_id: string;
  item_id: string;
  menu_items?: MenuItem;
}

const DailyMenuManagement = () => {
  const { toast } = useToast();
  const [dailyOffers, setDailyOffers] = useState<DailyOffer[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<DailyOffer | null>(null);
  const [selectedOfferItems, setSelectedOfferItems] = useState<DailyOfferItem[]>([]);

  const [offerForm, setOfferForm] = useState({
    date: new Date().toISOString().split('T')[0],
    price_huf: "2200",
    note: "",
    selectedItems: [] as string[]
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [offersResult, itemsResult] = await Promise.all([
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
              price_huf
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
        selectedItems: offer.daily_offer_items?.map((item: any) => item.item_id) || []
      });
      setSelectedOfferItems(offer.daily_offer_items || []);
    } else {
      setEditingOffer(null);
      setOfferForm({
        date: defaultDate || new Date().toISOString().split('T')[0],
        price_huf: "2200",
        note: "",
        selectedItems: []
      });
      setSelectedOfferItems([]);
    }
    setIsOfferDialogOpen(true);
  };

  const saveOffer = async () => {
    const offerData = {
      date: offerForm.date,
      price_huf: parseInt(offerForm.price_huf),
      note: offerForm.note || null
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
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a napi ajánlatot",
        variant: "destructive"
      });
      return;
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
        toast({
          title: "Hiba",
          description: "Nem sikerült menteni az ételeket",
          variant: "destructive"
        });
        return;
      }
    }

    toast({
      title: "Siker",
      description: editingOffer ? "Napi ajánlat frissítve" : "Új napi ajánlat létrehozva"
    });

    setIsOfferDialogOpen(false);
    fetchData();
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

  const toggleItemSelection = (itemId: string) => {
    setOfferForm(prev => ({
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
          <h1 className="text-3xl font-bold">Napi menü kezelés</h1>
        </div>

        {/* Admin Calendar */}
        <AdminDailyOfferCalendar 
          onCreateOffer={(date) => openOfferDialog(undefined, date)}
          onEditOffer={(offer) => openOfferDialog(offer)}
        />

        {/* Dialog for creating/editing offers */}
        <Dialog open={isOfferDialogOpen} onOpenChange={setIsOfferDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? "Napi menü szerkesztése" : "Új napi menü létrehozása"}
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
                      onClick={() => toggleItemSelection(item.id)}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium">{item.name}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                      </div>
                      {offerForm.selectedItems.includes(item.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveOffer} className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Mentés
                </Button>
                <Button variant="outline" onClick={() => setIsOfferDialogOpen(false)}>
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