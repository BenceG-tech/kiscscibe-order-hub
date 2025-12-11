import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, addDays, startOfWeek, endOfWeek, getDay } from "date-fns";
import { hu } from "date-fns/locale";
import { 
  Calendar as CalendarIcon, 
  Copy, 
  Save, 
  Trash2, 
  Plus,
  LayoutTemplate,
  RotateCcw,
  Repeat
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface MenuItem {
  id: string;
  name: string;
  price_huf: number;
  category_id?: string;
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
  created_at?: string;
  updated_at?: string;
  usage_count?: number;
  last_used_at?: string;
  tags?: string[];
  is_active?: boolean;
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

interface BulkScheduleData {
  dateRange: {
    start: Date;
    end: Date;
  };
  selectedDays: number[]; // 0 = Sunday, 1 = Monday, etc.
  template: MenuTemplate | null;
  offerPrice: number;
  menuPrice: number;
  maxPortions: number;
}

const MenuScheduling = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [availableItems, setAvailableItems] = useState<MenuItem[]>([]);
  const [templates, setTemplates] = useState<MenuTemplate[]>([]);
  const [existingOffers, setExistingOffers] = useState<any[]>([]);
  
  // Dialog states
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  
  // Form states
  const [bulkData, setBulkData] = useState<BulkScheduleData>({
    dateRange: {
      start: new Date(),
      end: addDays(new Date(), 7)
    },
    selectedDays: [1, 2, 3, 4, 5], // Monday to Friday
    template: null,
    offerPrice: 2200,
    menuPrice: 2200,
    maxPortions: 50
  });

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    selectedItems: [] as string[],
    default_price_huf: 0,
    default_max_portions: 30,
    menu_config: {
      soup: "",
      main: ""
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [itemsResult, offersResult, templatesResult] = await Promise.all([
        supabase
          .from('menu_items')
          .select('*')
          .eq('is_active', true)
          .order('name'),
        supabase
          .from('daily_offers')
          .select('*')
          .gte('date', format(new Date(), 'yyyy-MM-dd'))
          .order('date'),
        supabase
          .from('daily_offer_templates')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ]);

      if (itemsResult.data) setAvailableItems(itemsResult.data);
      if (offersResult.data) setExistingOffers(offersResult.data);
      
      // Transform templates data to proper format
      if (templatesResult.data) {
        const transformedTemplates: MenuTemplate[] = (templatesResult.data as SupabaseTemplate[]).map(template => ({
          ...template,
          items: Array.isArray(template.items) ? template.items : [],
          menu_config: template.menu_config || {},
          tags: Array.isArray(template.tags) ? template.tags : []
        }));
        setTemplates(transformedTemplates);
      }
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az adatokat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const hasOfferOnDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return existingOffers.some(offer => offer.date === dateString);
  };

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const dayNames = ['Vasárnap', 'Hétfő', 'Kedd', 'Szerda', 'Csütörtök', 'Péntek', 'Szombat'];

  const saveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({
        title: "Hiba",
        description: "Kérem adja meg a sablon nevét",
        variant: "destructive"
      });
      return;
    }

    try {
      const templateData = {
        name: templateForm.name,
        description: templateForm.description,
        items: templateForm.selectedItems,
        menu_config: templateForm.menu_config,
        default_price_huf: templateForm.default_price_huf,
        default_max_portions: templateForm.default_max_portions,
        is_active: true
      };

      const { error } = await supabase
        .from('daily_offer_templates')
        .insert([templateData]);

      if (error) throw error;
      
      // Increment usage count when template is used
      await supabase.rpc('increment_template_usage', { template_id: templateData.name });
      
      toast({
        title: "Siker",
        description: "Sablon mentve"
      });
      
      setIsTemplateDialogOpen(false);
      setTemplateForm({
        name: "",
        description: "",
        selectedItems: [],
        default_price_huf: 0,
        default_max_portions: 30,
        menu_config: {
          soup: "",
          main: ""
        }
      });
      
      fetchData();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni a sablont",
        variant: "destructive"
      });
    }
  };

  const scheduleBulkMenus = async () => {
    if (!bulkData.template) {
      toast({
        title: "Hiba",
        description: "Kérem válasszon sablont",
        variant: "destructive"
      });
      return;
    }

    try {
      const datesToSchedule: Date[] = [];
      let currentDate = new Date(bulkData.dateRange.start);
      const endDate = new Date(bulkData.dateRange.end);

      while (currentDate <= endDate) {
        const dayOfWeek = getDay(currentDate);
        if (bulkData.selectedDays.includes(dayOfWeek) && !isWeekend(currentDate)) {
          datesToSchedule.push(new Date(currentDate));
        }
        currentDate = addDays(currentDate, 1);
      }

      // Create offers for each selected date
      for (const date of datesToSchedule) {
        const dateString = format(date, 'yyyy-MM-dd');
        
        // Check if offer already exists
        const existingOffer = existingOffers.find(offer => offer.date === dateString);
        if (existingOffer) {
          console.log(`Skipping ${dateString} - offer already exists`);
          continue;
        }

        // Create daily offer
        const offerResult = await supabase
          .from('daily_offers')
          .insert({
            date: dateString,
            price_huf: bulkData.offerPrice,
            max_portions: bulkData.maxPortions,
            remaining_portions: bulkData.maxPortions,
            note: `Sablon alapján létrehozva: ${bulkData.template.name}`
          })
          .select()
          .single();

        if (offerResult.error) {
          console.error('Error creating offer:', offerResult.error);
          continue;
        }

        const offerId = offerResult.data.id;

        // Add items to offer
        const itemsToInsert = bulkData.template.items.map(itemId => ({
          daily_offer_id: offerId,
          item_id: itemId,
          is_menu_part: false,
          menu_role: null
        }));

        // If template has menu configuration, add menu items
        if (bulkData.template.menu_config && bulkData.template.menu_config.soup && bulkData.template.menu_config.main) {
          itemsToInsert.push({
            daily_offer_id: offerId,
            item_id: bulkData.template.menu_config.soup,
            is_menu_part: true,
            menu_role: 'leves'
          });
          itemsToInsert.push({
            daily_offer_id: offerId,
            item_id: bulkData.template.menu_config.main,
            is_menu_part: true,
            menu_role: 'főétel'
          });

          // Create menu
          await supabase
            .from('daily_offer_menus')
            .insert({
              daily_offer_id: offerId,
              menu_price_huf: bulkData.menuPrice,
              max_portions: bulkData.template.default_max_portions || 30,
              remaining_portions: bulkData.template.default_max_portions || 30
            });
        }

        await supabase
          .from('daily_offer_items')
          .insert(itemsToInsert);
      }

      toast({
        title: "Siker",
        description: `${datesToSchedule.length} napi menü sikeresen ütemezve`
      });

      setIsBulkDialogOpen(false);
      fetchData();
      
    } catch (error) {
      console.error('Error scheduling bulk menus:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt az ütemezés során",
        variant: "destructive"
      });
    }
  };

  const copyMenuFromDate = async (sourceDate: Date, targetDate: Date) => {
    try {
      const sourceDateString = format(sourceDate, 'yyyy-MM-dd');
      const targetDateString = format(targetDate, 'yyyy-MM-dd');

      // Get source offer
      const sourceOfferResult = await supabase
        .from('daily_offers')
        .select(`
          *,
          daily_offer_items (*),
          daily_offer_menus (*)
        `)
        .eq('date', sourceDateString)
        .single();

      if (sourceOfferResult.error || !sourceOfferResult.data) {
        toast({
          title: "Hiba",
          description: "Forrás menü nem található",
          variant: "destructive"
        });
        return;
      }

      const sourceOffer = sourceOfferResult.data;

      // Create new offer
      const newOfferResult = await supabase
        .from('daily_offers')
        .insert({
          date: targetDateString,
          price_huf: sourceOffer.price_huf,
          max_portions: sourceOffer.max_portions,
          remaining_portions: sourceOffer.max_portions,
          note: sourceOffer.note
        })
        .select()
        .single();

      if (newOfferResult.error) {
        throw newOfferResult.error;
      }

      const newOfferId = newOfferResult.data.id;

      // Copy items
      if (sourceOffer.daily_offer_items?.length > 0) {
        const itemsToInsert = sourceOffer.daily_offer_items.map(item => ({
          daily_offer_id: newOfferId,
          item_id: item.item_id,
          is_menu_part: item.is_menu_part,
          menu_role: item.menu_role
        }));

        await supabase
          .from('daily_offer_items')
          .insert(itemsToInsert);
      }

      // Copy menu if exists
      if (sourceOffer.daily_offer_menus) {
        await supabase
          .from('daily_offer_menus')
          .insert({
            daily_offer_id: newOfferId,
            menu_price_huf: sourceOffer.daily_offer_menus.menu_price_huf,
            max_portions: sourceOffer.daily_offer_menus.max_portions,
            remaining_portions: sourceOffer.daily_offer_menus.max_portions
          });
      }

      toast({
        title: "Siker",
        description: `Menü sikeresen másolva ${format(targetDate, 'yyyy.MM.dd')}-re`
      });

      fetchData();

    } catch (error) {
      console.error('Error copying menu:', error);
      toast({
        title: "Hiba",
        description: "Hiba történt a másolás során",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner className="h-8 w-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Menü ütemezés</h2>
          <p className="text-sm text-muted-foreground">
            Tervezze meg előre a napi ajánlatokat és menüket
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setIsTemplateDialogOpen(true)}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
          >
            <LayoutTemplate className="h-4 w-4 mr-2" />
            Új sablon
          </Button>
          <Button
            onClick={() => setIsBulkDialogOpen(true)}
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
          >
            <CalendarIcon className="h-4 w-4 mr-2" />
            Tömeges ütemezés
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Naptár nézet</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={hu}
              className="rounded-md border-0 p-0"
              modifiers={{
                hasContent: (date) => hasOfferOnDate(date),
                weekend: (date) => isWeekend(date)
              }}
              modifiersStyles={{
                hasContent: {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  fontWeight: 'bold'
                },
                weekend: {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  opacity: 0.6
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Quick Actions & Templates */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Gyors műveletek</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => {
                    const yesterday = addDays(selectedDate, -1);
                    copyMenuFromDate(yesterday, selectedDate);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4" />
                    <span className="font-medium">Tegnapi másolása</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Másolja át a tegnapi menüt
                  </span>
                </Button>
                
                <Button
                  variant="outline"
                  className="h-auto p-4 flex flex-col items-start gap-2"
                  onClick={() => {
                    const lastWeek = addDays(selectedDate, -7);
                    copyMenuFromDate(lastWeek, selectedDate);
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Repeat className="h-4 w-4" />
                    <span className="font-medium">Múlt hét másolása</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Másolja át a múlt heti menüt
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Mentett sablonok</CardTitle>
            </CardHeader>
            <CardContent>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <LayoutTemplate className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Még nincsenek mentett sablonok</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-4"
                    onClick={() => setIsTemplateDialogOpen(true)}
                  >
                    Első sablon létrehozása
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {templates.map((template) => (
                    <Card key={template.id} className="p-4 border border-border">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{template.name}</h4>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setBulkData(prev => ({ ...prev, template }));
                            setIsBulkDialogOpen(true);
                          }}
                        >
                          Használat
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline" className="text-xs">
                          {template.items.length} tétel
                        </Badge>
                        {template.menu_config && (template.menu_config.soup || template.menu_config.main) && (
                          <Badge variant="outline" className="text-xs">
                            Menü: {template.default_price_huf || 0} Ft
                          </Badge>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Bulk Scheduling Dialog */}
      <Dialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Tömeges menü ütemezés</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <Accordion type="single" collapsible defaultValue="template">
              <AccordionItem value="template">
                <AccordionTrigger>1. Sablon kiválasztása</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-2">
                    {templates.map((template) => (
                      <div
                        key={template.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          bulkData.template?.id === template.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setBulkData(prev => ({ ...prev, template }))}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{template.name}</span>
                          <Badge variant="outline">{template.items.length} tétel</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dates">
                <AccordionTrigger>2. Dátumok és napok</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Kezdő dátum</Label>
                      <Input
                        type="date"
                        value={format(bulkData.dateRange.start, 'yyyy-MM-dd')}
                        onChange={(e) => setBulkData(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, start: new Date(e.target.value) }
                        }))}
                      />
                    </div>
                    <div>
                      <Label>Záró dátum</Label>
                      <Input
                        type="date"
                        value={format(bulkData.dateRange.end, 'yyyy-MM-dd')}
                        onChange={(e) => setBulkData(prev => ({
                          ...prev,
                          dateRange: { ...prev.dateRange, end: new Date(e.target.value) }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label>Napok kiválasztása</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {dayNames.map((day, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${index}`}
                            checked={bulkData.selectedDays.includes(index)}
                            onCheckedChange={(checked) => {
                              setBulkData(prev => ({
                                ...prev,
                                selectedDays: checked
                                  ? [...prev.selectedDays, index]
                                  : prev.selectedDays.filter(d => d !== index)
                              }));
                            }}
                            disabled={index === 0 || index === 6} // Disable weekends
                          />
                          <Label htmlFor={`day-${index}`} className="text-sm">
                            {day}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="pricing">
                <AccordionTrigger>3. Árak és adagok</AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label>Ajánlat ára (Ft)</Label>
                      <Input
                        type="number"
                        value={bulkData.offerPrice}
                        onChange={(e) => setBulkData(prev => ({ ...prev, offerPrice: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Menü ára (Ft)</Label>
                      <Input
                        type="number"
                        value={bulkData.menuPrice}
                        onChange={(e) => setBulkData(prev => ({ ...prev, menuPrice: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                    <div>
                      <Label>Max adagszám</Label>
                      <Input
                        type="number"
                        value={bulkData.maxPortions}
                        onChange={(e) => setBulkData(prev => ({ ...prev, maxPortions: parseInt(e.target.value) || 0 }))}
                      />
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsBulkDialogOpen(false)}>
                Mégsem
              </Button>
              <Button onClick={scheduleBulkMenus} disabled={!bulkData.template}>
                Ütemezés
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Template Creation Dialog */}
      <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Új sablon létrehozása</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Sablon neve</Label>
              <Input
                value={templateForm.name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Hétfői menü, Különleges ajánlat, stb."
              />
            </div>
            
            <div>
              <Label>Válasszon ételeket</Label>
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                {availableItems.map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`template-item-${item.id}`}
                      checked={templateForm.selectedItems.includes(item.id)}
                      onCheckedChange={(checked) => {
                        setTemplateForm(prev => ({
                          ...prev,
                          selectedItems: checked
                            ? [...prev.selectedItems, item.id]
                            : prev.selectedItems.filter(id => id !== item.id)
                        }));
                      }}
                    />
                    <Label htmlFor={`template-item-${item.id}`} className="text-sm flex-1">
                      {item.name} - {item.price_huf} Ft
                    </Label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Mégsem
              </Button>
              <Button onClick={saveTemplate}>
                <Save className="h-4 w-4 mr-2" />
                Sablon mentése
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MenuScheduling;