import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ImageUpload from "@/components/admin/ImageUpload";
import { capitalizeFirst, normalizeText } from "@/lib/utils";
import kiscsibeLogo from "@/assets/kiscsibe_logo_round.png";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  X,
  Package,
  DollarSign,
  Search
} from "lucide-react";
import InfoTip from "@/components/admin/InfoTip";

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
  image_url?: string;
  allergens: string[];
  category_id: string;
  is_active: boolean;
  is_featured: boolean;
  is_always_available: boolean;
}

const MenuManagement = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price_huf: "",
    category_id: "",
    allergens: "",
    image_url: "",
    is_active: true,
    is_featured: false,
    is_always_available: false
  });

  // Filter menu items based on search and category
  const filteredMenuItems = menuItems.filter(item => {
    const normalizedSearch = normalizeText(searchTerm);
    const matchesSearch = searchTerm === "" || 
      normalizeText(item.name).includes(normalizedSearch) ||
      (item.description && normalizeText(item.description).includes(normalizedSearch));
    const matchesCategory = selectedCategory === "all" 
      ? true 
      : selectedCategory === "fix" 
        ? item.is_always_available 
        : item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [categoriesResult, itemsResult] = await Promise.all([
      supabase.from('menu_categories').select('*').order('sort'),
      supabase.from('menu_items').select('*').order('name')
    ]);

    if (categoriesResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a kategóriákat",
        variant: "destructive"
      });
    } else {
      setCategories(categoriesResult.data || []);
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

  const openItemDialog = (item?: MenuItem) => {
    if (item) {
      setEditingItem(item);
      setItemForm({
        name: item.name,
        description: item.description,
        price_huf: item.price_huf.toString(),
        category_id: item.category_id,
        allergens: item.allergens.join(', '),
        image_url: item.image_url || "",
        is_active: item.is_active,
        is_featured: item.is_featured,
        is_always_available: item.is_always_available
      });
    } else {
      setEditingItem(null);
      setItemForm({
        name: "",
        description: "",
        price_huf: "",
        category_id: "",
        allergens: "",
        image_url: "",
        is_active: true,
        is_featured: false,
        is_always_available: false
      });
    }
    setIsItemDialogOpen(true);
  };

  const saveItem = async () => {
    const allergensArray = itemForm.allergens
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    const itemData = {
      name: capitalizeFirst(itemForm.name.trim()),
      description: itemForm.description,
      price_huf: parseInt(itemForm.price_huf),
      category_id: itemForm.category_id,
      allergens: allergensArray,
      image_url: itemForm.image_url || null,
      is_active: itemForm.is_active,
      is_featured: itemForm.is_featured,
      is_always_available: itemForm.is_always_available
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
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az ételt",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Siker",
      description: editingItem ? "Étel frissítve" : "Új étel hozzáadva"
    });

    setIsItemDialogOpen(false);
    fetchData();
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni az ételt",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Siker",
      description: "Étel törölve"
    });
    
    fetchData();
  };

  const toggleItemStatus = async (item: MenuItem) => {
    const { error } = await supabase
      .from('menu_items')
      .update({ is_active: !item.is_active })
      .eq('id', item.id);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni az étel állapotát",
        variant: "destructive"
      });
      return;
    }

    fetchData();
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
          <h1 className="text-3xl font-bold flex items-center gap-2">
            Étlap kezelés
            <InfoTip text="Itt adhatod hozzá, szerkesztheted vagy törölheted az étlapon látható ételek listáját." />
          </h1>
          <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openItemDialog()} className="bg-gradient-to-r from-primary to-primary-glow">
                <Plus className="h-4 w-4 mr-2" />
                Új étel
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col overflow-hidden">
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? "Étel szerkesztése" : "Új étel hozzáadása"}
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <label className="text-sm font-medium">Név</label>
                  <Input
                    value={itemForm.name}
                    onChange={(e) => setItemForm({...itemForm, name: e.target.value})}
                    placeholder="Étel neve"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Leírás</label>
                  <Textarea
                    value={itemForm.description}
                    onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                    placeholder="Étel leírása"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Ár (Ft)</label>
                    <Input
                      type="number"
                      value={itemForm.price_huf}
                      onChange={(e) => setItemForm({...itemForm, price_huf: e.target.value})}
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">Kategória</label>
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
                </div>
                
                <div>
                  <label className="text-sm font-medium">Allergének (vesszővel elválasztva)</label>
                  <Input
                    value={itemForm.allergens}
                    onChange={(e) => setItemForm({...itemForm, allergens: e.target.value})}
                    placeholder="pl: tejtermék, glutén"
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Kép</label>
                  <ImageUpload
                    currentImageUrl={itemForm.image_url}
                    onImageUploaded={(url) => setItemForm({...itemForm, image_url: url})}
                    onImageRemoved={() => setItemForm({...itemForm, image_url: ""})}
                    bucketName="menu-images"
                  />
                </div>
                
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={itemForm.is_active}
                      onChange={(e) => setItemForm({...itemForm, is_active: e.target.checked})}
                    />
                    Aktív <InfoTip text="Csak az aktív ételek jelennek meg az étlapon." side="bottom" />
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={itemForm.is_featured}
                      onChange={(e) => setItemForm({...itemForm, is_featured: e.target.checked})}
                    />
                    Kiemelt <InfoTip text="A kiemelt ételek elöl jelennek meg a főoldal ajánlottjai között." side="bottom" />
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={itemForm.is_always_available}
                      onChange={(e) => setItemForm({...itemForm, is_always_available: e.target.checked})}
                    />
                    Fix tétel <InfoTip text="A fix tételek (pl. italok, savanyúság) mindig megjelennek a honlapon, függetlenül a napi ajánlattól." side="bottom" />
                  </label>
                </div>
              </div>
              
              <div className="flex-shrink-0 border-t pt-4">
                <div className="flex gap-2">
                  <Button onClick={saveItem} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    Mentés
                  </Button>
                  <Button variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                    Mégse
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search and Filters */}
        <Card className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés az ételek között... (pl. gulyás, pörkölt)"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-12 text-base"
              />
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Badge
                variant={selectedCategory === "all" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors"
                onClick={() => setSelectedCategory("all")}
              >
                Összes ({menuItems.length})
              </Badge>
              <Badge
                variant={selectedCategory === "fix" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80 transition-colors bg-blue-50 text-blue-700 border-blue-200"
                onClick={() => setSelectedCategory(selectedCategory === "fix" ? "all" : "fix")}
              >
                📌 Fix tételek ({menuItems.filter(i => i.is_always_available).length})
              </Badge>
              {categories.map(category => {
                const count = menuItems.filter(i => i.category_id === category.id).length;
                return (
                  <Badge
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name} ({count})
                  </Badge>
                );
              })}
            </div>
            
            {searchTerm && (
              <p className="text-sm text-muted-foreground">
                {filteredMenuItems.length} találat "{searchTerm}" keresésre
              </p>
            )}
          </div>
        </Card>

        <div className="grid gap-6">
          {categories.map((category) => {
            const categoryItems = filteredMenuItems.filter(item => item.category_id === category.id);
            
            // Hide empty categories when searching or filtering
            if (categoryItems.length === 0 && (searchTerm !== "" || selectedCategory !== "all")) {
              return null;
            }
            
            return (
              <Card key={category.id} className="animate-fade-in">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    {category.name}
                    <Badge variant="secondary">
                      {categoryItems.length} étel
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {categoryItems.map((item) => (
                       <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                           <div className="flex-1">
                           <div className="flex items-center gap-3">
                             <img 
                               src={item.image_url || kiscsibeLogo} 
                               alt={item.name}
                               className={`w-12 h-12 object-cover rounded-lg ${!item.image_url ? 'opacity-40' : ''}`}
                             />
                             <h4 className="font-medium">{capitalizeFirst(item.name)}</h4>
                             <div className="flex gap-2">
                               {!item.is_active && (
                                 <Badge variant="secondary">Inaktív</Badge>
                               )}
                               {item.is_featured && (
                                 <Badge className="bg-yellow-100 text-yellow-800">Kiemelt</Badge>
                               )}
                               {item.is_always_available && (
                                 <Badge className="bg-blue-100 text-blue-800">📌 Fix</Badge>
                               )}
                             </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {item.description}
                          </p>
                          {item.allergens.length > 0 && (
                            <div className="flex gap-1 mt-2">
                              {item.allergens.map((allergen) => (
                                <Badge key={allergen} variant="outline" className="text-xs">
                                  {allergen}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-primary text-lg">
                            {item.price_huf} Ft
                          </span>
                          
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleItemStatus(item)}
                            >
                              {item.is_active ? "Letiltás" : "Aktiválás"}
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => openItemDialog(item)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteItem(item.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {categoryItems.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">
                        Nincs étel ebben a kategóriában
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {filteredMenuItems.length === 0 && searchTerm !== "" && (
            <Card className="p-8 text-center">
              <Search className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">Nincs találat: "{searchTerm}"</p>
              <p className="text-sm text-muted-foreground mt-1">Próbálj más keresőszót használni</p>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default MenuManagement;