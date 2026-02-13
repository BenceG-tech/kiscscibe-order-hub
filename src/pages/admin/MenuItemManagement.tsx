import { useState, useEffect, useMemo } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { capitalizeFirst } from "@/lib/utils";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save,
  Image as ImageIcon,
  Star,
  Eye,
  EyeOff,
  Search,
  Filter,
  ArrowUpDown,
  Calendar,
  ChevronDown
} from "lucide-react";
import ImageUpload from "@/components/admin/ImageUpload";
import AIBatchImageGenerator from "@/components/admin/AIBatchImageGenerator";

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
  requires_side_selection: boolean;
  image_url?: string;
  allergens: string[];
  created_at: string;
  usage_info?: {
    is_in_daily_offer: boolean;
    usage_count: number;
    last_used: string | null;
  };
}

const MenuItemManagement = () => {
  const { toast } = useToast();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [featuredFilter, setFeaturedFilter] = useState<string>("all");
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: "", max: "" });
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    price_huf: "",
    category_id: "",
    is_active: true,
    is_featured: false,
    requires_side_selection: false,
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

    // Fetch usage information for items
    const usageResult = await supabase
      .from('daily_offer_items')
      .select(`
        item_id,
        daily_offer_id,
        daily_offers!inner(date)
      `)
      .gte('daily_offers.date', new Date().toISOString().split('T')[0]);

    if (itemsResult.error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az ételeket",
        variant: "destructive"
      });
    } else {
      const items = itemsResult.data || [];
      const usageData = usageResult.data || [];
      
      // Enhance items with usage information
      const enhancedItems = items.map(item => {
        const itemUsage = usageData.filter(usage => usage.item_id === item.id);
        return {
          ...item,
          usage_info: {
            is_in_daily_offer: itemUsage.length > 0,
            usage_count: itemUsage.length,
            last_used: itemUsage.length > 0 ? itemUsage[0].daily_offers?.date : null
          }
        };
      });
      
      setMenuItems(enhancedItems);
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
        requires_side_selection: item.requires_side_selection || false,
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
        requires_side_selection: false,
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
        name: capitalizeFirst(itemForm.name.trim()),
        description: itemForm.description,
        price_huf: parseInt(itemForm.price_huf),
        category_id: itemForm.category_id,
        is_active: itemForm.is_active,
        is_featured: itemForm.is_featured,
        requires_side_selection: itemForm.requires_side_selection,
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

  // Filtered and sorted items
  const filteredItems = useMemo(() => {
    let filtered = menuItems.filter(item => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!item.name.toLowerCase().includes(query) && 
            !item.description.toLowerCase().includes(query)) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== "all" && item.category_id !== selectedCategory) {
        return false;
      }

      // Status filter
      if (statusFilter === "active" && !item.is_active) return false;
      if (statusFilter === "inactive" && item.is_active) return false;

      // Featured filter
      if (featuredFilter === "featured" && !item.is_featured) return false;
      if (featuredFilter === "not-featured" && item.is_featured) return false;

      // Allergen filter
      if (selectedAllergens.length > 0) {
        const hasAnyAllergen = selectedAllergens.some(allergen => 
          item.allergens.includes(allergen)
        );
        if (!hasAnyAllergen) return false;
      }

      // Price range filter
      if (priceRange.min && item.price_huf < parseInt(priceRange.min)) return false;
      if (priceRange.max && item.price_huf > parseInt(priceRange.max)) return false;

      return true;
    });

    // Sort items
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case "name":
          comparison = a.name.localeCompare(b.name);
          break;
        case "price":
          comparison = a.price_huf - b.price_huf;
          break;
        case "category":
          comparison = getCategoryName(a.category_id).localeCompare(getCategoryName(b.category_id));
          break;
        case "created":
          comparison = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          break;
        case "usage":
          comparison = (b.usage_info?.usage_count || 0) - (a.usage_info?.usage_count || 0);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === "asc" ? comparison : -comparison;
    });

    return filtered;
  }, [menuItems, searchQuery, selectedCategory, statusFilter, featuredFilter, selectedAllergens, priceRange, sortBy, sortOrder]);

  // Bulk operations
  const handleSelectAll = () => {
    if (selectedItems.size === filteredItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredItems.map(item => item.id)));
    }
  };

  const handleItemSelect = (itemId: string) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const bulkToggleStatus = async (active: boolean) => {
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_active: active })
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast({
        title: "Siker",
        description: `${selectedItems.size} étel állapota ${active ? 'aktiválva' : 'deaktiválva'}`
      });

      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk toggle error:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült az állapot módosítás",
        variant: "destructive"
      });
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`Biztosan törölni szeretné a kijelölt ${selectedItems.size} ételt?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .in('id', Array.from(selectedItems));

      if (error) throw error;

      toast({
        title: "Siker",
        description: `${selectedItems.size} étel törölve`
      });

      setSelectedItems(new Set());
      fetchData();
    } catch (error) {
      console.error('Bulk delete error:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni az ételeket",
        variant: "destructive"
      });
    }
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

        {/* AI Batch Image Generator */}
        <AIBatchImageGenerator
          items={menuItems.map(item => ({ id: item.id, name: item.name, image_url: item.image_url || null }))}
          onComplete={fetchData}
        />

        {/* Search and Filter Section */}
        <Card className="p-6">
          <div className="space-y-4">
            {/* Search and basic filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Keresés név vagy leírás alapján..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Kategória" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden kategória</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Állapot" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden állapot</SelectItem>
                  <SelectItem value="active">Aktív</SelectItem>
                  <SelectItem value="inactive">Inaktív</SelectItem>
                </SelectContent>
              </Select>

              <Select value={featuredFilter} onValueChange={setFeaturedFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Kiemelt" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden</SelectItem>
                  <SelectItem value="featured">Kiemelt</SelectItem>
                  <SelectItem value="not-featured">Nem kiemelt</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Advanced filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Ár tartomány (Ft)</Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    value={priceRange.min}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, min: e.target.value }))}
                    className="w-20"
                  />
                  <Input
                    type="number"
                    placeholder="Max"
                    value={priceRange.max}
                    onChange={(e) => setPriceRange(prev => ({ ...prev, max: e.target.value }))}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Rendezés</Label>
                <div className="flex gap-2">
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Név</SelectItem>
                      <SelectItem value="price">Ár</SelectItem>
                      <SelectItem value="category">Kategória</SelectItem>
                      <SelectItem value="created">Létrehozás dátuma</SelectItem>
                      <SelectItem value="usage">Használat gyakorisága</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Allergének szűrése</Label>
                <div className="flex flex-wrap gap-1">
                  {commonAllergens.slice(0, 3).map((allergen) => (
                    <Button
                      key={allergen}
                      variant={selectedAllergens.includes(allergen) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedAllergens.includes(allergen)) {
                          setSelectedAllergens(prev => prev.filter(a => a !== allergen));
                        } else {
                          setSelectedAllergens(prev => [...prev, allergen]);
                        }
                      }}
                      className="text-xs"
                    >
                      {allergen}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results and bulk actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  {filteredItems.length} étel ({menuItems.length} összes)
                </div>
                
                {selectedItems.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedItems.size} kijelölve
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleStatus(true)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Aktiválás
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => bulkToggleStatus(false)}
                    >
                      <EyeOff className="h-3 w-3 mr-1" />
                      Deaktiválás
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={bulkDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Törlés
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  checked={selectedItems.size === filteredItems.length && filteredItems.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <Label className="text-sm">Összes kijelölése</Label>
              </div>
            </div>
          </div>
        </Card>

        {/* Menu Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <Card key={item.id} className={`rounded-2xl shadow-md border-primary/20 ${selectedItems.has(item.id) ? 'ring-2 ring-primary' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Checkbox
                      checked={selectedItems.has(item.id)}
                      onCheckedChange={() => handleItemSelect(item.id)}
                    />
                    <div className="flex-1">
                      <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
                        {capitalizeFirst(item.name)}
                        {item.is_featured && <Star className="h-4 w-4 text-yellow-500 fill-current" />}
                        {item.usage_info?.is_in_daily_offer && (
                          <Badge variant="secondary" className="text-xs">
                            <Calendar className="h-3 w-3 mr-1" />
                            Napi ajánlatban
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">
                          {getCategoryName(item.category_id)}
                        </Badge>
                        {item.usage_info && item.usage_info.usage_count > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {item.usage_info.usage_count}× használva
                          </Badge>
                        )}
                      </div>
                    </div>
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
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="requires_side_selection"
                      checked={itemForm.requires_side_selection}
                      onCheckedChange={(checked) => setItemForm({...itemForm, requires_side_selection: checked})}
                    />
                    <Label htmlFor="requires_side_selection" className="text-sm font-medium">
                      Kötelező köret választás
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