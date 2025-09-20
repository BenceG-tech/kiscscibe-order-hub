import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { useCart } from "@/contexts/CartContext";
import { ShoppingCart, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CartDialog } from "@/components/CartDialog";
import { SidePickerModal } from "@/components/SidePickerModal";

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
  image_url: string;
  allergens: string[];
  category_id: string;
  requires_side_selection?: boolean;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers: { label: string; price_delta: number }[];
}

const Etlap = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { state: cart, addItem, addItemWithSides } = useCart();
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [sidePickerOpen, setSidePickerOpen] = useState(false);
  const [selectedMainItem, setSelectedMainItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    fetchCategories();
    fetchMenuItems();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('menu_categories')
      .select('*')
      .order('sort');
    
    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a kategóriákat",
        variant: "destructive"
      });
      return;
    }
    
    setCategories(data || []);
  };

  const fetchMenuItems = async () => {
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('is_active', true);
    
    if (error) {
      toast({
        title: "Hiba", 
        description: "Nem sikerült betölteni az étlapot",
        variant: "destructive"
      });
      return;
    }
    
    setMenuItems(data || []);
  };

  const filteredItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "all" || item.category_id === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const checkSideRequirement = async (item: MenuItem) => {
    try {
      const { data: sideConfigs, error } = await supabase
        .from('menu_item_sides')
        .select('*')
        .eq('main_item_id', item.id);

      if (error) {
        console.error('Error checking side requirement:', error);
        return false;
      }

      return sideConfigs && sideConfigs.length > 0;
    } catch (error) {
      console.error('Error in checkSideRequirement:', error);
      return false;
    }
  };

  const handleAddToCart = async (item: MenuItem) => {
    // Check if side selection is required based on the new field
    if (item.requires_side_selection) {
      setSelectedMainItem(item);
      setSidePickerOpen(true);
      return;
    }
    
    // Legacy check for existing side configurations (fallback)
    const requiresSides = await checkSideRequirement(item);
    
    if (requiresSides) {
      setSelectedMainItem(item);
      setSidePickerOpen(true);
    } else {
      addItem({
        id: item.id,
        name: item.name,
        price_huf: item.price_huf,
        modifiers: [],
        sides: [],
        image_url: item.image_url
      });
      
      toast({
        title: "Kosárba tetve",
        description: `${item.name} hozzáadva a kosárhoz`
      });
    }
  };

  const handleSideSelected = (selectedSides: any[]) => {
    if (selectedMainItem) {
      const sides = selectedSides.map(side => ({
        id: side.id,
        name: side.name,
        price_huf: 0 // Sides are currently free
      }));

      addItemWithSides({
        id: selectedMainItem.id,
        name: selectedMainItem.name,
        price_huf: selectedMainItem.price_huf,
        modifiers: [],
        image_url: selectedMainItem.image_url
      }, sides);
      
      toast({
        title: "Kosárba tetve",
        description: `${selectedMainItem.name} hozzáadva a kosárhoz ${sides.map(s => s.name).join(', ')} körettel`
      });
    }
  };


  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <div className="pt-32 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-warmth bg-clip-text text-transparent">
              Étlapunk
            </h1>
            <p className="text-xl text-muted-foreground">
              Válassz kedvenc ételeid közül és rendeld meg online!
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Keresés az étlapon..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-8">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="all">Összes</TabsTrigger>
              {categories.map((category) => (
                <TabsTrigger key={category.id} value={category.id}>
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6 mb-8">
            {filteredItems.map((item, index) => (
              <Card key={item.id} className="group hover:shadow-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in border-0 shadow-md bg-card/95 backdrop-blur-sm" style={{ animationDelay: `${index * 0.05}s` }}>
                <CardContent className="p-0">
                  <div className="aspect-square bg-muted rounded-t-2xl overflow-hidden relative">
                    {item.image_url ? (
                      <img 
                        src={item.image_url} 
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/60">
                        <span className="text-sm">Kép nincs</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-primary/90 text-primary-foreground font-bold text-sm px-3 py-1 rounded-full backdrop-blur-sm">
                        {item.price_huf} Ft
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <h3 className="font-bold text-base text-foreground leading-tight line-clamp-2">{item.name}</h3>
                    
                    {item.description && (
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{item.description}</p>
                    )}

                    {item.allergens && item.allergens.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.allergens.slice(0, 3).map((allergen, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                            {allergen}
                          </Badge>
                        ))}
                        {item.allergens.length > 3 && (
                          <Badge variant="secondary" className="text-xs px-2 py-0.5 rounded-full">
                            +{item.allergens.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    <Button 
                      onClick={() => handleAddToCart(item)}
                      className="w-full rounded-xl font-semibold"
                      size="sm"
                    >
                      {item.requires_side_selection ? "Köretek választása" : "Kosárba"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.itemCount > 0 && (
        <div className="fixed bottom-4 right-4 z-40">
          <Button
            onClick={() => setIsCartOpen(true)}
            className="rounded-full h-14 w-14 bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm relative transition-all duration-300 hover-scale animate-bounce"
          >
            <ShoppingCart className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 bg-warmth text-white min-w-[20px] h-5 flex items-center justify-center text-xs animate-pulse">
              {cart.itemCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Cart Dialog */}
      <CartDialog open={isCartOpen} onOpenChange={setIsCartOpen} />
      
      {/* Side Picker Modal */}
      {selectedMainItem && (
        <SidePickerModal
          open={sidePickerOpen}
          onOpenChange={setSidePickerOpen}
          mainItemId={selectedMainItem.id}
          mainItemName={selectedMainItem.name}
          mainItemRequiresSideSelection={selectedMainItem.requires_side_selection}
          onSideSelected={handleSideSelected}
        />
      )}
    </div>
  );
};

export default Etlap;