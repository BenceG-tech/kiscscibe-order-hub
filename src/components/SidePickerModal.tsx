import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { capitalizeFirst } from '@/lib/utils';

// Köretek kategória ID-k
const SIDE_CATEGORY_IDS = [
  'a4c74b22-3789-45e0-b09d-24315e43b8a2', // Köretek
  '7e4e0f97-e553-43f1-bf05-40a36dd176d7', // Extra köretek
  '49ea156d-3cc7-4f08-9b3d-083f7049cb88', // Hagyományos köretek
];

interface SideItem {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  price_huf: number;
}

interface SideConfig {
  side_item_id: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  is_default: boolean;
}

interface SidePickerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mainItemId: string;
  mainItemName: string;
  mainItemRequiresSideSelection?: boolean;
  onSideSelected: (selectedSides: SideItem[]) => void;
}

export const SidePickerModal: React.FC<SidePickerModalProps> = ({
  open,
  onOpenChange,
  mainItemId,
  mainItemName,
  mainItemRequiresSideSelection = false,
  onSideSelected
}) => {
  const [sideConfigs, setSideConfigs] = useState<SideConfig[]>([]);
  const [sideItems, setSideItems] = useState<SideItem[]>([]);
  const [selectedSides, setSelectedSides] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [minSelect, setMinSelect] = useState(1);
  const [maxSelect, setMaxSelect] = useState(1);
  const [isRequired, setIsRequired] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open && mainItemId) {
      fetchSideConfiguration();
    }
  }, [open, mainItemId]);

  const fetchSideConfiguration = async () => {
    setLoading(true);
    try {
      // Fetch side configurations for this main item
      const { data: configs, error: configError } = await supabase
        .from('menu_item_sides')
        .select(`
          side_item_id,
          is_required,
          min_select,
          max_select,
          is_default,
          menu_items!menu_item_sides_side_item_id_fkey (
            id,
            name,
            description,
            image_url,
            price_huf
          )
        `)
        .eq('main_item_id', mainItemId);

      if (configError) {
        console.error('Error fetching side configurations:', configError);
        toast({
          variant: "destructive",
          title: "Hiba",
          description: "Nem sikerült betölteni a köret konfigurációt."
        });
        return;
      }

      if (!configs || configs.length === 0) {
        // No specific side configurations - fetch general sides from Köretek categories
        const { data: generalSides, error: sidesError } = await supabase
          .from('menu_items')
          .select('id, name, description, image_url, price_huf')
          .in('category_id', SIDE_CATEGORY_IDS)
          .eq('is_active', true)
          .order('name');
        
        if (sidesError) {
          console.error('Error fetching general sides:', sidesError);
          onOpenChange(false);
          return;
        }
        
        if (!generalSides || generalSides.length === 0) {
          // No sides available at all
          onOpenChange(false);
          return;
        }
        
        setSideItems(generalSides);
        setMinSelect(0); // Optional
        setMaxSelect(1); // Max 1 side
        setIsRequired(false);
        setLoading(false);
        return;
      }

      // Extract side items and configuration
      const items = configs.map(config => config.menu_items as unknown as SideItem);
      const firstConfig = configs[0];
      
      setSideConfigs(configs);
      setSideItems(items);
      setMinSelect(firstConfig.min_select);
      setMaxSelect(firstConfig.max_select);
      
      // Check if required either from config or from main item setting
      const isRequiredSelection = firstConfig.is_required || mainItemRequiresSideSelection;
      setIsRequired(isRequiredSelection);

      // Set default selections
      const defaultSelections = configs
        .filter(config => config.is_default)
        .map(config => config.side_item_id);
      
      setSelectedSides(defaultSelections);
    } catch (error) {
      console.error('Error in fetchSideConfiguration:', error);
      toast({
        variant: "destructive",
        title: "Hiba",
        description: "Váratlan hiba történt."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSideSelection = (sideId: string) => {
    if (maxSelect === 1) {
      // Single selection (radio behavior)
      setSelectedSides([sideId]);
    } else {
      // Multiple selection (checkbox behavior)
      setSelectedSides(prev => {
        if (prev.includes(sideId)) {
          return prev.filter(id => id !== sideId);
        } else if (prev.length < maxSelect) {
          return [...prev, sideId];
        } else {
          // Replace first selected if at max
          return [...prev.slice(1), sideId];
        }
      });
    }
  };

  const handleConfirm = () => {
    if (selectedSides.length < minSelect) {
      toast({
        variant: "destructive",
        title: "Köret választása szükséges",
        description: `Legalább ${minSelect} köretet kell választani.`
      });
      return;
    }

    const selectedSideItems = sideItems.filter(item => selectedSides.includes(item.id));
    onSideSelected(selectedSideItems);
    onOpenChange(false);
  };

  const handleCancel = () => {
    // Only allow cancel if not required
    if (!isRequired && !mainItemRequiresSideSelection) {
      setSelectedSides([]);
      onOpenChange(false);
    }
  };

  const isValidSelection = selectedSides.length >= minSelect && selectedSides.length <= maxSelect;

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={!isRequired && !mainItemRequiresSideSelection ? onOpenChange : undefined}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isRequired || mainItemRequiresSideSelection ? "Köret választása szükséges" : "Válassz köretet"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            <strong>{mainItemName}</strong> főételhez köret választása {isRequired || mainItemRequiresSideSelection ? 'kötelező' : 'opcionális'}.
            {minSelect === maxSelect ? (
              ` Válassz ${minSelect} köretet.`
            ) : (
              ` Válassz ${minSelect}–${maxSelect} köretet.`
            )}
          </p>

          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {sideItems.map((side) => (
                <Card
                  key={side.id}
                  className={`p-4 cursor-pointer transition-colors ${
                    selectedSides.includes(side.id)
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted'
                  }`}
                  onClick={() => handleSideSelection(side.id)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {maxSelect === 1 ? (
                        <div className={`w-4 h-4 rounded-full border-2 ${
                          selectedSides.includes(side.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedSides.includes(side.id) && (
                            <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5" />
                          )}
                        </div>
                      ) : (
                        <div className={`w-4 h-4 rounded border-2 ${
                          selectedSides.includes(side.id)
                            ? 'bg-primary border-primary'
                            : 'border-muted-foreground'
                        }`}>
                          {selectedSides.includes(side.id) && (
                            <div className="text-white text-xs flex justify-center">✓</div>
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium">{capitalizeFirst(side.name)}</h4>
                      {side.description && (
                        <p className="text-sm text-muted-foreground">{side.description}</p>
                      )}
                      <p className="text-sm font-medium text-primary">0 Ft</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            {!isRequired && !mainItemRequiresSideSelection && (
              <Button variant="outline" onClick={handleCancel} className="flex-1">
                Mégse
              </Button>
            )}
            <Button 
              onClick={handleConfirm} 
              disabled={!isValidSelection}
              className={!isRequired && !mainItemRequiresSideSelection ? "flex-1" : "w-full"}
            >
              Hozzáadás
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};