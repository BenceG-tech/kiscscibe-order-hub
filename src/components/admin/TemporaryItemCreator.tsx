import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import ImageUpload from './ImageUpload';
import { capitalizeFirst } from '@/lib/utils';

interface MenuCategory {
  id: string;
  name: string;
  sort: number;
}

interface TemporaryItemCreatorProps {
  categories: MenuCategory[];
  onItemCreated: (itemId: string) => void;
  onRefreshLibrary: () => void;
}

export const TemporaryItemCreator: React.FC<TemporaryItemCreatorProps> = ({
  categories,
  onItemCreated,
  onRefreshLibrary
}) => {
  const { toast } = useToast();
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price_huf: '',
    category_id: '',
    image_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.category_id || !formData.price_huf) {
      toast({
        title: "Hiba",
        description: "Kérjük, töltse ki az összes kötelező mezőt (név, kategória, ár).",
        variant: "destructive",
      });
      return;
    }

    const priceNum = parseInt(formData.price_huf);
    if (isNaN(priceNum) || priceNum <= 0) {
      toast({
        title: "Hiba",
        description: "Kérjük, adjon meg egy érvényes árat.",
        variant: "destructive",
      });
      return;
    }

    setCreating(true);
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .insert({
          name: capitalizeFirst(formData.name.trim()),
          description: formData.description.trim() || null,
          price_huf: priceNum,
          category_id: formData.category_id,
          image_url: formData.image_url || null,
          is_temporary: true,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Siker",
        description: `"${formData.name}" ideiglenes elem létrehozva és hozzáadva a kiválasztáshoz!`,
      });

      // Auto-select the newly created item
      onItemCreated(data.id);
      
      // Refresh the library to show the new item
      onRefreshLibrary();

      // Reset form
      setFormData({
        name: '',
        description: '',
        price_huf: '',
        category_id: '',
        image_url: ''
      });

    } catch (error) {
      console.error('Error creating temporary item:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült létrehozni az ideiglenes elemet.",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5" />
          Új ideiglenes elem létrehozása
        </CardTitle>
        <div className="text-sm text-muted-foreground">
          Hozzon létre egy új ételt, ami csak a mai ajánlatban szerepel, de később újra felhasználható
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="temp-name">
                Név <span className="text-destructive">*</span>
              </Label>
              <Input
                id="temp-name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="pl. Séf különleges gulyása"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temp-price">
                Ár (Ft) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="temp-price"
                type="number"
                value={formData.price_huf}
                onChange={(e) => setFormData(prev => ({ ...prev, price_huf: e.target.value }))}
                placeholder="2500"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="temp-category">
              Kategória <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.category_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              required
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
            <Label htmlFor="temp-description">Leírás</Label>
            <Textarea
              id="temp-description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Különleges összetevők, allergiás információk, stb..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Kép (opcionális)</Label>
            <ImageUpload
              currentImageUrl={formData.image_url}
              onImageUploaded={(url) => setFormData(prev => ({ ...prev, image_url: url }))}
              onImageRemoved={() => setFormData(prev => ({ ...prev, image_url: '' }))}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={creating}
          >
            <Plus className="w-4 h-4 mr-2" />
            {creating ? 'Létrehozás...' : 'Létrehozás és hozzáadás az ajánlathoz'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};