import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price_huf: number;
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  image_url?: string;
  allergens: string[];
  created_at: string;
}

const MenuItemManagement = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price_huf: "",
    category_id: "",
    is_active: true,
    is_featured: false,
    image_url: "",
    allergens: [] as string[]
  });

  const commonAllergens = [
    "Glutén", "Tojás", "Tej", "Dió", "Szója", 
    "Hal", "Rákfélék", "Zeller", "Mustár", "Szezám"
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [itemsResult, categoriesResult] = await Promise.all([
      supabase
        .from('menu_items')
        .select('*')
        .order('name'),
      supabase
        .from('menu_categories')
        .select('*')
        .order('sort')
    ]);

    if (itemsResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az ételeket",
        variant: "destructive"
      });
    } else {
      setMenuItems(itemsResult.data || []);
    }

    if (categoriesResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a kategóriákat",
        variant: "destructive"
      });
    } else {
      setCategories(categoriesResult.data || []);
    }

    setLoading(false);
  };

  const openDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        price_huf: item.price_huf.toString(),
        category_id: item.category_id,
        is_active: item.is_active,
        is_featured: item.is_featured,
        image_url: item.image_url || "",
        allergens: item.allergens || []
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: "",
        description: "",
        price_huf: "",
        category_id: categories[0]?.id || "",
        is_active: true,
        is_featured: false,
        image_url: "",
        allergens: []
      });
    }
    setIsDialogOpen(true);
  };

  const saveItem = async () => {
    setSaving(true);
    try {
      const itemData = {
        name: itemForm.name,
        description: itemForm.description,
        price_huf: parseInt(itemForm.price_huf),
        category_id: itemForm.category_id,
        is_active: itemForm.is_active,
        is_featured: itemForm.is_featured,
        image_url: itemForm.image_url || null,
        allergens: itemForm.allergens
      };

      let result;

      if (editingItem) {
        result = await supabase
          .from('menu_items')
          .update(itemData)
          .eq('id', editingItem.id);
      } else {
        result = await supabase
          .from('menu_items')
          .insert(itemData);
      }

      if (result.error) {
        throw result.error;
      }

      toast({
        title: "Siker",
        description: editingItem ? "Étel frissítve" : "Új étel létrehozva"
      });

      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error saving item:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az ételt",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const deleteItem = async (id: string) => {
    if (!confirm('Biztosan törölni szeretné ezt az ételt?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      toast({
        title: "Siker",
        description: "Étel törölve"
      });
      
      fetchData();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni az ételt",
        variant: "destructive"
      });
    }
  };

  const toggleAllergen = (allergen: string) => {
    setItemForm(prev => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter(a => a !== allergen)
        : [...prev.allergens, allergen]
    }));
  };

  const getCategoryName = (categoryId: string) => {
    return categories.find(cat => cat.id === categoryId)?.name || "Ismeretlen";
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
          <h1 className="text-3xl font-bold">Étlap kezelés</h1>
          <Button onClick={() => openDialog()} className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            Új étel
          </Button>
        </div>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menuItems.map((item) => (
            <Card key={item.id} className="rounded-2xl shadow-md border-primary/20">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                      {item.name}
                      {item.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                    </CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {getCategoryName(item.category_id)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {item.is_active ? (
                      <Eye className="h-4 w-4 text-green-600" />
                    ) : (
                      <EyeOff className="h-4 w-4 text-red-600" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {item.image_url && (
                  <img 
                    src={item.image_url} 
                    alt={item.name}
                    className="w-full h-40 object-cover rounded-lg mb-3"
                  />
                )}
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {item.description}
                </p>
                <div className="flex items-center justify-between mb-3">
                  <Badge className="bg-primary text-primary-foreground">
                    {item.price_huf} Ft
                  </Badge>
                </div>
                {item.allergens.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {item.allergens.map(allergen => (
                        <Badge key={allergen} variant="secondary" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDialog(item)}
                    className="flex-1"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Szerkesztés
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => deleteItem(item.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Dialog for creating/editing items */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5 text-primary" />
                {editingItem ? "Étel szerkesztése" : "Új étel létrehozása"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Név</Label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    placeholder="Étel neve"
                  />
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Ár (Ft)</Label>
                  <Input
                    type="number"
                    value={itemForm.price_huf}
                    onChange={(e) => setItemForm({...itemForm, price_huf: e.target.value})}
                    placeholder="1500"
                  />
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Kategória</Label>
                <Select value={itemForm.category_id} onValueChange={(value) => setItemForm({...itemForm, category_id: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Válassz kategóriát" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Leírás</Label>
                <Textarea
                  value={itemForm.description}
                  onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                  placeholder="Étel leírása, összetevők..."
                  rows={3}
                />
              </div>

              <ImageUpload
                currentImageUrl={itemForm.image_url}
                onImageUploaded={(url) => setItemForm({...itemForm, image_url: url})}
                onImageRemoved={() => setItemForm({...itemForm, image_url: ""})}
              />
              
              <div>
                <Label className="text-sm font-medium mb-3 block">Allergének</Label>
                <div className="grid grid-cols-2 gap-2">
                  {commonAllergens.map((allergen) => (
                    <div key={allergen} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={allergen}
                        checked={itemForm.allergens.includes(allergen)}
                        onChange={() => toggleAllergen(allergen)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={allergen} className="text-sm">
                        {allergen}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={itemForm.is_active}
                      onCheckedChange={(checked) => setItemForm({...itemForm, is_active: checked})}
                    />
                    <Label htmlFor="is_active" className="text-sm font-medium">
                      Aktív (látható az étlapon)
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_featured"
                      checked={itemForm.is_featured}
                      onCheckedChange={(checked) => setItemForm({...itemForm, is_featured: checked})}
                    />
                    <Label htmlFor="is_featured" className="text-sm font-medium">
                      Kiemelt étel
                    </Label>
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={saveItem} className="flex-1" disabled={saving}>
                  {saving ? (
                    <LoadingSpinner className="h-4 w-4 mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {saving ? "Mentés..." : "Mentés"}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={saving}>
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

export default MenuItemManagement;