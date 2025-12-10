import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check } from 'lucide-react';
import { TemporaryItemsLibrary } from './TemporaryItemsLibrary';
import { TemporaryItemCreator } from './TemporaryItemCreator';
import { capitalizeFirst } from '@/lib/utils';

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


interface EnhancedItemSelectionProps {
  menuItems: MenuItem[];
  categories: MenuCategory[];
  selectedItems: string[];
  onItemToggle: (itemId: string) => void;
  onRefreshData: () => void;
}

export const EnhancedItemSelection: React.FC<EnhancedItemSelectionProps> = ({
  menuItems,
  categories,
  selectedItems,
  onItemToggle,
  onRefreshData
}) => {
  const [activeTab, setActiveTab] = useState("permanent");

  const permanentItems = menuItems.filter(item => !item.is_temporary);
  const temporaryItems = menuItems.filter(item => item.is_temporary);
  
  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = permanentItems.filter(item => item.category_id === category.id);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const selectedPermanentCount = selectedItems.filter(id => 
    permanentItems.some(item => item.id === id)
  ).length;
  
  const selectedTemporaryCount = selectedItems.filter(id => 
    temporaryItems.some(item => item.id === id)
  ).length;
  
  const totalSelectedCount = selectedPermanentCount + selectedTemporaryCount;

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="permanent">
            Állandó ({selectedPermanentCount})
          </TabsTrigger>
          <TabsTrigger value="temporary">
            Ideiglenes ({selectedTemporaryCount})
          </TabsTrigger>
          <TabsTrigger value="create">
            Új létrehozása
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
                        <div className="font-medium">{capitalizeFirst(item.name)}</div>
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

        <TabsContent value="temporary" className="space-y-4">
          <TemporaryItemsLibrary
            categories={categories}
            selectedItems={selectedItems}
            onItemToggle={onItemToggle}
            onRefreshData={onRefreshData}
          />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <TemporaryItemCreator
            categories={categories}
            onItemCreated={(itemId) => {
              onItemToggle(itemId);
              setActiveTab("preview");
            }}
            onRefreshLibrary={onRefreshData}
          />
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
                        {selectedItems
                          .filter(itemId => permanentItems.some(item => item.id === itemId))
                          .map(itemId => {
                            const item = permanentItems.find(i => i.id === itemId);
                            if (!item) return null;
                            const category = categories.find(c => c.id === item.category_id);
                            return (
                              <div key={itemId} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium">{capitalizeFirst(item.name)}</div>
                                  <Badge variant="outline" className="text-xs">{category?.name}</Badge>
                                </div>
                                <div className="text-sm font-medium">{item.price_huf} Ft</div>
                              </div>
                            );
                        })}
                      </div>
                    </div>
                  )}

                  {selectedTemporaryCount > 0 && (
                    <div>
                      <h4 className="font-medium text-sm text-muted-foreground mb-2">IDEIGLENES ELEMEK</h4>
                      <div className="space-y-2">
                        {selectedItems
                          .filter(itemId => temporaryItems.some(item => item.id === itemId))
                          .map(itemId => {
                            const item = temporaryItems.find(i => i.id === itemId);
                            if (!item) return null;
                            const category = categories.find(c => c.id === item.category_id);
                            return (
                              <div key={itemId} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-3">
                                  {item.image_url && (
                                    <img 
                                      src={item.image_url} 
                                      alt={item.name}
                                      className="w-10 h-10 object-cover rounded"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{capitalizeFirst(item.name)}</div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant="outline" className="text-xs">{category?.name}</Badge>
                                      <Badge variant="secondary" className="text-xs">Ideiglenes</Badge>
                                    </div>
                                  </div>
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