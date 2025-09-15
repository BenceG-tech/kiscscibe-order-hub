import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Edit, Trash2, Clock, Users, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
}

interface MenuTemplate {
  id: string;
  name: string;
  description?: string;
  items: string[];
  menu_config?: {
    soup?: string;
    main?: string;
  };
  default_price_huf?: number;
  default_max_portions?: number;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
  tags?: string[];
  is_active: boolean;
}

interface SupabaseTemplate {
  id: string;
  name: string;
  description?: string;
  items: any; // Json type from Supabase
  menu_config?: any; // Json type from Supabase
  default_price_huf?: number;
  default_max_portions?: number;
  created_at: string;
  updated_at: string;
  usage_count: number;
  last_used_at?: string;
  tags?: string[];
  is_active: boolean;
}

interface TemplateFormData {
  name: string;
  description: string;
  items: string[];
  menu_config: {
    soup?: string;
    main?: string;
  };
  default_price_huf: number;
  default_max_portions: number;
  tags: string[];
}

const TemplateManagement = () => {
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MenuTemplate | null>(null);
  const [deleteTemplate, setDeleteTemplate] = useState<MenuTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>({
    name: '',
    description: '',
    items: [],
    menu_config: {},
    default_price_huf: 0,
    default_max_portions: 30,
    tags: []
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('daily_offer_templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (templatesError) throw templatesError;

      // Fetch menu items
      const { data: itemsData, error: itemsError } = await supabase
        .from('menu_items')
        .select('id, name, price_huf')
        .eq('is_active', true);

      if (itemsError) throw itemsError;

      // Transform templates data to proper format
      const transformedTemplates: MenuTemplate[] = (templatesData as SupabaseTemplate[] || []).map(template => ({
        ...template,
        items: Array.isArray(template.items) ? template.items : [],
        menu_config: template.menu_config || {},
        tags: Array.isArray(template.tags) ? template.tags : []
      }));

      setTemplates(transformedTemplates);
      setMenuItems(itemsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az adatokat.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      items: [],
      menu_config: {},
      default_price_huf: 0,
      default_max_portions: 30,
      tags: []
    });
  };

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        name: formData.name,
        description: formData.description,
        items: formData.items,
        menu_config: formData.menu_config,
        default_price_huf: formData.default_price_huf,
        default_max_portions: formData.default_max_portions,
        tags: formData.tags,
        is_active: true
      };

      if (editingTemplate) {
        // Update existing template
        const { error } = await supabase
          .from('daily_offer_templates')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;

        toast({
          title: "Sikeres frissítés",
          description: "A sablon sikeresen frissítve lett.",
        });
      } else {
        // Create new template
        const { error } = await supabase
          .from('daily_offer_templates')
          .insert([templateData]);

        if (error) throw error;

        toast({
          title: "Sikeres létrehozás",
          description: "A sablon sikeresen létrehozva.",
        });
      }

      setIsCreateDialogOpen(false);
      setEditingTemplate(null);
      resetForm();
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a sablont.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplate) return;

    try {
      const { error } = await supabase
        .from('daily_offer_templates')
        .delete()
        .eq('id', deleteTemplate.id);

      if (error) throw error;

      toast({
        title: "Sikeres törlés",
        description: "A sablon sikeresen törölve lett.",
      });

      setDeleteTemplate(null);
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült törölni a sablont.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicateTemplate = async (template: MenuTemplate) => {
    try {
      const duplicatedTemplate = {
        name: `${template.name} (másolat)`,
        description: template.description,
        items: template.items,
        menu_config: template.menu_config,
        default_price_huf: template.default_price_huf,
        default_max_portions: template.default_max_portions,
        tags: template.tags,
        is_active: true
      };

      const { error } = await supabase
        .from('daily_offer_templates')
        .insert([duplicatedTemplate]);

      if (error) throw error;

      toast({
        title: "Sikeres másolás",
        description: "A sablon sikeresen lemásolva.",
      });

      fetchData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült lemásolni a sablont.",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (template: MenuTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      items: template.items,
      menu_config: template.menu_config || {},
      default_price_huf: template.default_price_huf || 0,
      default_max_portions: template.default_max_portions || 30,
      tags: template.tags || []
    });
    setIsCreateDialogOpen(true);
  };

  const getItemName = (itemId: string) => {
    const item = menuItems.find(i => i.id === itemId);
    return item ? item.name : 'Ismeretlen tétel';
  };

  if (isLoading) {
    return <div className="flex justify-center py-8">Betöltés...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sablon kezelés</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setEditingTemplate(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Új sablon
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingTemplate ? 'Sablon szerkesztése' : 'Új sablon létrehozása'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Sablon neve</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Sablon neve"
                />
              </div>

              <div>
                <Label htmlFor="description">Leírás</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Sablon leírása"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Alapértelmezett ár (Ft)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.default_price_huf}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_price_huf: parseInt(e.target.value) || 0 }))}
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label htmlFor="portions">Alapértelmezett adag</Label>
                  <Input
                    id="portions"
                    type="number"
                    value={formData.default_max_portions}
                    onChange={(e) => setFormData(prev => ({ ...prev, default_max_portions: parseInt(e.target.value) || 30 }))}
                    placeholder="30"
                  />
                </div>
              </div>

              <div>
                <Label>Tételek kiválasztása</Label>
                <div className="border rounded-lg p-4 max-h-40 overflow-y-auto">
                  {menuItems.map((item) => (
                    <div key={item.id} className="flex items-center space-x-2 py-1">
                      <input
                        type="checkbox"
                        id={`item-${item.id}`}
                        checked={formData.items.includes(item.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData(prev => ({ ...prev, items: [...prev.items, item.id] }));
                          } else {
                            setFormData(prev => ({ ...prev, items: prev.items.filter(id => id !== item.id) }));
                          }
                        }}
                      />
                      <label htmlFor={`item-${item.id}`} className="text-sm">
                        {item.name} ({item.price_huf} Ft)
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Mégse
                </Button>
                <Button onClick={handleSaveTemplate}>
                  {editingTemplate ? 'Frissítés' : 'Létrehozás'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Még nincsenek sablonok létrehozva.</p>
            </CardContent>
          </Card>
        ) : (
          templates.map((template) => (
            <Card key={template.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {template.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {template.usage_count} használat
                      </div>
                      {template.last_used_at && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Utoljára: {new Date(template.last_used_at).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDuplicateTemplate(template)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(template)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setDeleteTemplate(template)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    {template.default_price_huf && (
                      <Badge variant="secondary">
                        {template.default_price_huf} Ft
                      </Badge>
                    )}
                    <Badge variant="outline">
                      {template.default_max_portions} adag
                    </Badge>
                    <Badge variant="outline">
                      {template.items.length} tétel
                    </Badge>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">Tételek:</h4>
                    <div className="text-sm text-muted-foreground">
                      {template.items.map(itemId => getItemName(itemId)).join(', ')}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteTemplate} onOpenChange={() => setDeleteTemplate(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sablon törlése</AlertDialogTitle>
            <AlertDialogDescription>
              Biztosan törölni szeretnéd a "{deleteTemplate?.name}" sablont?
              Ez a művelet nem vonható vissza.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Mégse</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTemplate}>
              Törlés
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TemplateManagement;