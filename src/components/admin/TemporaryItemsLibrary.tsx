import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Check, Clock, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSpinner } from '@/components/ui/loading';

interface MenuItem {
  id: string;
  name: string;
  description?: string;
  price_huf: number;
  category_id?: string;
  image_url?: string;
  is_temporary?: boolean;
  created_at: string;
}

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface TemporaryItemsLibraryProps {
  categories: MenuCategory[];
  selectedItems: string[];
  onItemToggle: (itemId: string) => void;
}

export const TemporaryItemsLibrary: React.FC<TemporaryItemsLibraryProps> = ({
  categories,
  selectedItems,
  onItemToggle
}) => {
  const [temporaryItems, setTemporaryItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchTemporaryItems();
  }, []);

  const fetchTemporaryItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_temporary', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTemporaryItems(data || []);
    } catch (error) {
      console.error('Error fetching temporary items:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = temporaryItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'all' || item.category_id === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const groupedItems = categories.reduce((acc, category) => {
    acc[category.id] = filteredItems.filter(item => item.category_id === category.id);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Ideiglenes elemek könyvtára
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Korábban létrehozott ideiglenes ételek, amelyeket újra felhasználhat
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Keresés név vagy leírás alapján..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
            >
              <option value="all">Minden kategória</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {temporaryItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Még nincsenek ideiglenes elemek</p>
              <p className="text-sm">Az első ideiglenes elem létrehozása után itt jelennek meg</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nincs találat a keresési feltételeknek</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories.map(category => {
                const categoryItems = groupedItems[category.id] || [];
                if (categoryItems.length === 0) return null;

                return (
                  <div key={category.id}>
                    <h4 className="font-medium text-sm text-muted-foreground mb-2 uppercase tracking-wide">
                      {category.name}
                    </h4>
                    <div className="space-y-2">
                      {categoryItems.map(item => (
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
                          
                          {item.image_url && (
                            <img 
                              src={item.image_url} 
                              alt={item.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <div className="font-medium">{item.name}</div>
                                {item.description && (
                                  <div className="text-sm text-muted-foreground line-clamp-2">
                                    {item.description}
                                  </div>
                                )}
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-sm font-medium text-primary">
                                    {item.price_huf} Ft
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    <Clock className="w-3 h-3 mr-1" />
                                    Ideiglenes
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};