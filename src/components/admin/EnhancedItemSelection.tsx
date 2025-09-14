import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ImageUpload from './ImageUpload';
import { Plus, X, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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

interface CustomItem {
  tempId: string;
  name: string;
  description: string;
  price_huf: number;
  category_id: string;
  image_url?: string;
}

interface EnhancedItemSelectionProps {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  selectedItems: string[];
  customItems: CustomItem[];
  onItemToggle: (itemId: string) => void;
  onCustomItemAdd: (item: Omit<CustomItem, 'tempId'>) => void;
  onCustomItemRemove: (tempId: string) => void;
  onCustomItemUpdate: (tempId: string, item: Partial<CustomItem>) => void;
}

export const EnhancedItemSelection: React.FC<EnhancedItemSelectionProps> = ({
  menuItems,
  categories,
  selectedItems,
  customItems,
  onItemToggle,
  onCustomItemAdd,
  onCustomItemRemove,
  onCustomItemUpdate
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("permanent");
  const [customItemForm, setCustomItemForm] = useState({
    name: '',
    description: '',
    price_huf: 0,
    category_id: '',
    image_url: ''
  });

  const permanentItems = menuItems.filter(item => !item.is_temporary);
  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = permanentItems.filter(item => item.category_id === category.id);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const handleAddCustomItem = () => {
    if (!customItemForm.name.trim() || !customItemForm.category_id || customItemForm.price_huf <= 0) {
      toast({
        title: "Hiba",
        description: "Kérjük, töltse ki az összes kötelező mezőt (név, kategória, ár).",
        variant: "destructive",
      });
      return;
    }

    onCustomItemAdd({
      name: customItemForm.name.trim(),
      description: customItemForm.description.trim(),
      price_huf: Math.round(customItemForm.price_huf),
      category_id: customItemForm.category_id,
      image_url: customItemForm.image_url
    });

    setCustomItemForm({
      name: '',
      description: '',
      price_huf: 0,
      category_id: '',
      image_url: ''
    });

    toast({
      title: "Siker",
      description: "Egyedi elem hozzáadva!",
    });
  };

  const selectedPermanentCount = selectedItems.length;
  const totalSelectedCount = selectedPermanentCount + customItems.length;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="permanent">
            Állandó menü ({selectedPermanentCount})
          </TabsTrigger>
          <TabsTrigger value="custom">
            Egyedi elemek ({customItems.length})
          </TabsTrigger>
          <TabsTrigger value="preview">
            Előnézet ({totalSelectedCount})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="permanent" className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Válasszon az állandó menü elemeiből:
          </div>
          
          {categories.map((category) => {
            const categoryItems = groupedItems[category.id] || [];
            if (categoryItems.length === 0) return null;

            return (
              <Card key={category.id}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categoryItems.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedItems.includes(item.id)
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:bg-muted/50'
                      }`}
                      onClick={() => onItemToggle(item.id)}
                    >
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                        selectedItems.includes(item.id)
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}>
                        {selectedItems.includes(item.id) && (
                          <Check className="w-3 h-3 text-primary-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                        <div className="text-sm font-medium text-primary">
                          {item.price_huf} Ft
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="custom" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Új egyedi elem hozzáadása</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="custom-name">Név *</Label>
                  <Input
                    id="custom-name"
                    value={customItemForm.name}
                    onChange={(e) => setCustomItemForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="pl. Házi limonádé"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="custom-price">Ár (Ft) *</Label>
                  <Input
                    id="custom-price"
                    type="number"
                    value={customItemForm.price_huf || ''}
                    onChange={(e) => setCustomItemForm(prev => ({ ...prev, price_huf: parseInt(e.target.value) || 0 }))}
                    placeholder="590"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-category">Kategória *</Label>
                <Select 
                  value={customItemForm.category_id} 
                  onValueChange={(value) => setCustomItemForm(prev => ({ ...prev, category_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Válasszon kategóriát" />
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

              <div className="space-y-2">
                <Label htmlFor="custom-description">Leírás</Label>
                <Textarea
                  id="custom-description"
                  value={customItemForm.description}
                  onChange={(e) => setCustomItemForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="További információ az ételről..."
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Kép (opcionális)</Label>
                <ImageUpload
                  currentImageUrl={customItemForm.image_url}
                  onImageUploaded={(url) => setCustomItemForm(prev => ({ ...prev, image_url: url }))}
                  onImageRemoved={() => setCustomItemForm(prev => ({ ...prev, image_url: '' }))}
                />
              </div>

              <Button onClick={handleAddCustomItem} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Elem hozzáadása
              </Button>
            </CardContent>
          </Card>

          {customItems.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Hozzáadott egyedi elemek</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {customItems.map((item) => {
                  const category = categories.find(c => c.id === item.category_id);
                  return (
                    <div key={item.tempId} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        {item.description && (
                          <div className="text-sm text-muted-foreground">{item.description}</div>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary">{category?.name}</Badge>
                          <span className="text-sm font-medium text-primary">{item.price_huf} Ft</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCustomItemRemove(item.tempId)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="preview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Kiválasztott elemek összesítése</CardTitle>
            </CardHeader>
            <CardContent>
              {totalSelectedCount === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  Még nincs kiválasztott elem
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedPermanentCount > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">ÁLLANDÓ MENÜ ELEMEI</h4>
                      <div className="space-y-2">
                        {selectedItems.map(itemId => {
                          const item = permanentItems.find(i => i.id === itemId);
                          if (!item) return null;
                          const category = categories.find(c => c.id === item.category_id);
                          return (
                            <div key={itemId} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <Badge variant="outline" className="text-xs">{category?.name}</Badge>
                              </div>
                              <div className="text-sm font-medium">{item.price_huf} Ft</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {customItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">EGYEDI ELEMEK</h4>
                      <div className="space-y-2">
                        {customItems.map(item => {
                          const category = categories.find(c => c.id === item.category_id);
                          return (
                            <div key={item.tempId} className="flex items-center justify-between p-2 border rounded">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                <Badge variant="outline" className="text-xs">{category?.name}</Badge>
                              </div>
                              <div className="text-sm font-medium">{item.price_huf} Ft</div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t">
                    <div className="flex justify-between items-center font-medium">
                      <span>Összes elem:</span>
                      <span>{totalSelectedCount} db</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};