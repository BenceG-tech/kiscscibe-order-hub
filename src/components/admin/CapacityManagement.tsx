import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, getDay, addDays } from "date-fns";
import { hu } from "date-fns/locale";
import { 
  Users, 
  Clock, 
  Plus,
  Edit,
  TrendingUp,
  AlertTriangle,
  Settings,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface CapacitySlot {
  id: string;
  date: string;
  timeslot: string;
  max_orders: number;
  booked_orders: number;
}

interface DailyCapacity {
  date: string;
  total_capacity: number;
  used_capacity: number;
  slots: CapacitySlot[];
}

interface CapacitySettings {
  default_daily_capacity: number;
  time_slots: {
    time: string;
    capacity: number;
  }[];
  warning_threshold: number; // percentage
}

const CapacityManagement = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [capacityData, setCapacityData] = useState<DailyCapacity[]>([]);
  const [capacitySettings, setCapacitySettings] = useState<CapacitySettings>({
    default_daily_capacity: 100,
    time_slots: [
      { time: "07:00", capacity: 20 },
      { time: "08:00", capacity: 25 },
      { time: "09:00", capacity: 30 },
      { time: "10:00", capacity: 25 },
      { time: "11:00", capacity: 20 },
      { time: "12:00", capacity: 35 },
      { time: "13:00", capacity: 30 },
      { time: "14:00", capacity: 15 }
    ],
    warning_threshold: 80
  });
  
  // Dialog states
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<CapacitySlot | null>(null);
  
  // Form states
  const [slotForm, setSlotForm] = useState({
    timeslot: "12:00",
    max_orders: 30
  });

  useEffect(() => {
    fetchCapacityData();
  }, [selectedDate]);

  const fetchCapacityData = async () => {
    try {
      const startDate = format(addDays(selectedDate, -7), 'yyyy-MM-dd');
      const endDate = format(addDays(selectedDate, 7), 'yyyy-MM-dd');

      const { data: slotsData, error } = await supabase
        .from('capacity_slots')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('timeslot');

      if (error) {
        console.error('Error fetching capacity data:', error);
        return;
      }

      // Group by date
      const groupedData: { [key: string]: DailyCapacity } = {};
      
      slotsData?.forEach(slot => {
        if (!groupedData[slot.date]) {
          groupedData[slot.date] = {
            date: slot.date,
            total_capacity: 0,
            used_capacity: 0,
            slots: []
          };
        }
        
        groupedData[slot.date].slots.push(slot);
        groupedData[slot.date].total_capacity += slot.max_orders;
        groupedData[slot.date].used_capacity += slot.booked_orders;
      });

      setCapacityData(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching capacity data:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a kapacitás adatokat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getCapacityForDate = (date: Date) => {
    const dateString = format(date, 'yyyy-MM-dd');
    return capacityData.find(cap => cap.date === dateString);
  };

  const getUtilizationPercentage = (capacity: DailyCapacity) => {
    if (capacity.total_capacity === 0) return 0;
    return Math.round((capacity.used_capacity / capacity.total_capacity) * 100);
  };

  const isWeekend = (date: Date) => {
    const day = getDay(date);
    return day === 0 || day === 6;
  };

  const isNearCapacity = (capacity: DailyCapacity) => {
    const utilization = getUtilizationPercentage(capacity);
    return utilization >= capacitySettings.warning_threshold;
  };

  const openSlotDialog = (slot?: CapacitySlot) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({
        timeslot: slot.timeslot,
        max_orders: slot.max_orders
      });
    } else {
      setEditingSlot(null);
      setSlotForm({
        timeslot: "12:00",
        max_orders: 30
      });
    }
    setIsSlotDialogOpen(true);
  };

  const saveCapacitySlot = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      const slotData = {
        date: dateString,
        timeslot: slotForm.timeslot,
        max_orders: slotForm.max_orders,
        booked_orders: editingSlot?.booked_orders || 0
      };

      if (editingSlot) {
        const { error } = await supabase
          .from('capacity_slots')
          .update(slotData)
          .eq('id', editingSlot.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('capacity_slots')
          .insert(slotData);
        
        if (error) throw error;
      }

      toast({
        title: "Siker",
        description: editingSlot ? "Időslot frissítve" : "Új időslot létrehozva"
      });

      setIsSlotDialogOpen(false);
      fetchCapacityData();
    } catch (error) {
      console.error('Error saving capacity slot:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült menteni az időslotot",
        variant: "destructive"
      });
    }
  };

  const applyDefaultSlots = async () => {
    try {
      const dateString = format(selectedDate, 'yyyy-MM-dd');
      
      // Delete existing slots for this date
      await supabase
        .from('capacity_slots')
        .delete()
        .eq('date', dateString);

      // Insert default slots
      const defaultSlots = capacitySettings.time_slots.map(slot => ({
        date: dateString,
        timeslot: slot.time,
        max_orders: slot.capacity,
        booked_orders: 0
      }));

      const { error } = await supabase
        .from('capacity_slots')
        .insert(defaultSlots);

      if (error) throw error;

      toast({
        title: "Siker",
        description: "Alapértelmezett időslotok alkalmazva"
      });

      fetchCapacityData();
    } catch (error) {
      console.error('Error applying default slots:', error);
      toast({
        title: "Hiba",
        description: "Nem sikerült alkalmazni az alapértelmezett beállításokat",
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

  const selectedDateCapacity = getCapacityForDate(selectedDate);
  const selectedDateString = format(selectedDate, 'yyyy-MM-dd');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Kapacitás kezelés</h2>
          <p className="text-sm text-muted-foreground">
            Kezelje a napi kapacitásokat és időslotokat
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={() => setIsSettingsDialogOpen(true)}
            variant="outline"
            size={isMobile ? "sm" : "default"}
            className="w-full sm:w-auto"
          >
            <Settings className="h-4 w-4 mr-2" />
            Beállítások
          </Button>
          {!isWeekend(selectedDate) && (
            <Button
              onClick={applyDefaultSlots}
              size={isMobile ? "sm" : "default"}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Alapértelmezett
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <Card className="rounded-2xl shadow-md border-primary/20">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Users className="h-5 w-5 text-foreground" />
              Kapacitás naptár
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={hu}
              className="rounded-md border-0 p-0"
              modifiers={{
                hasCapacity: (date) => !!getCapacityForDate(date),
                nearCapacity: (date) => {
                  const cap = getCapacityForDate(date);
                  return cap ? isNearCapacity(cap) : false;
                },
                weekend: (date) => isWeekend(date)
              }}
              modifiersStyles={{
                hasCapacity: {
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  color: 'hsl(var(--primary))',
                  fontWeight: '600'
                },
                nearCapacity: {
                  backgroundColor: 'hsl(var(--destructive) / 0.1)',
                  color: 'hsl(var(--destructive))',
                  fontWeight: 'bold'
                },
                weekend: {
                  backgroundColor: 'hsl(var(--muted))',
                  color: 'hsl(var(--muted-foreground))',
                  opacity: 0.6
                }
              }}
            />
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-primary/20 border border-primary rounded-sm" />
                <span className="text-muted-foreground">Kapacitás beállítva</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-destructive/20 border border-destructive rounded-sm" />
                <span className="text-muted-foreground">Majdnem tele</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Capacity Overview */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="rounded-2xl shadow-md border-primary/20">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  {format(selectedDate, 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
                </div>
                {selectedDateCapacity && !isWeekend(selectedDate) && (
                  <Badge 
                    variant={isNearCapacity(selectedDateCapacity) ? "destructive" : "default"}
                    className="ml-2"
                  >
                    {getUtilizationPercentage(selectedDateCapacity)}% foglalt
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isWeekend(selectedDate) ? (
                <div className="text-center py-8">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      Hétvégén zárva
                    </p>
                    <p className="text-muted-foreground/70 text-sm">
                      A vendéglő szombaton és vasárnap zárva tart
                    </p>
                  </div>
                </div>
              ) : selectedDateCapacity ? (
                <div className="space-y-6">
                  {/* Overall Progress */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Napi kapacitás kihasználtság</span>
                      <span className="font-medium">
                        {selectedDateCapacity.used_capacity} / {selectedDateCapacity.total_capacity}
                      </span>
                    </div>
                    <Progress 
                      value={getUtilizationPercentage(selectedDateCapacity)} 
                      className="h-3"
                    />
                    {isNearCapacity(selectedDateCapacity) && (
                      <div className="flex items-center gap-2 text-sm text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Figyelem: Közel a kapacitáshatárhoz!</span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  {/* Time Slots */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium">Időslotok</h3>
                      <Button
                        size="sm"
                        onClick={() => openSlotDialog()}
                        className="h-8"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Új slot
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedDateCapacity.slots
                        .sort((a, b) => a.timeslot.localeCompare(b.timeslot))
                        .map((slot) => {
                          const utilization = slot.max_orders > 0 
                            ? Math.round((slot.booked_orders / slot.max_orders) * 100) 
                            : 0;
                          const isNearLimit = utilization >= capacitySettings.warning_threshold;
                          
                          return (
                            <Card 
                              key={slot.id} 
                              className={`p-3 cursor-pointer transition-colors ${
                                isNearLimit 
                                  ? 'border-destructive/50 bg-destructive/5' 
                                  : 'hover:border-primary/50'
                              }`}
                              onClick={() => openSlotDialog(slot)}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{slot.timeslot}</span>
                                </div>
                                <Badge 
                                  variant={isNearLimit ? "destructive" : "secondary"}
                                  className="text-xs"
                                >
                                  {utilization}%
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm text-muted-foreground">
                                  <span>Foglalások:</span>
                                  <span>{slot.booked_orders} / {slot.max_orders}</span>
                                </div>
                                <Progress value={utilization} className="h-2" />
                              </div>
                            </Card>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="p-6 bg-muted/50 rounded-lg">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50 text-muted-foreground" />
                    <p className="text-muted-foreground text-lg font-medium mb-2">
                      Nincs kapacitás beállítva
                    </p>
                    <p className="text-muted-foreground/70 text-sm mb-4">
                      Állítsa be a napi kapacitást és időslotokat
                    </p>
                    <Button onClick={applyDefaultSlots}>
                      <Plus className="h-4 w-4 mr-2" />
                      Alapértelmezett alkalmazása
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Capacity Slot Dialog */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-md'}`}>
          <DialogHeader>
            <DialogTitle>
              {editingSlot ? 'Időslot szerkesztése' : 'Új időslot létrehozása'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Időpont</Label>
              <Select
                value={slotForm.timeslot}
                onValueChange={(value) => setSlotForm(prev => ({ ...prev, timeslot: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 16 }, (_, i) => {
                    const hour = Math.floor(i / 2) + 7;
                    const minute = (i % 2) * 30;
                    const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                    return (
                      <SelectItem key={time} value={time}>
                        {time}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>Maximális rendelések</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={slotForm.max_orders}
                onChange={(e) => setSlotForm(prev => ({ 
                  ...prev, 
                  max_orders: parseInt(e.target.value) || 0 
                }))}
              />
            </div>
            
            {editingSlot && (
              <div>
                <Label>Jelenlegi foglalások</Label>
                <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
                  {editingSlot.booked_orders} rendelés
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsSlotDialogOpen(false)}>
                Mégsem
              </Button>
              <Button onClick={saveCapacitySlot}>
                {editingSlot ? 'Frissítés' : 'Létrehozás'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>Kapacitás beállítások</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            <div>
              <Label>Figyelmeztetési küszöb (%)</Label>
              <Input
                type="number"
                min="50"
                max="100"
                value={capacitySettings.warning_threshold}
                onChange={(e) => setCapacitySettings(prev => ({
                  ...prev,
                  warning_threshold: parseInt(e.target.value) || 80
                }))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Ennél a kihasználtságnál jelennek meg a figyelmeztető jelzések
              </p>
            </div>
            
            <div>
              <Label>Alapértelmezett napi kapacitás</Label>
              <Input
                type="number"
                min="10"
                max="500"
                value={capacitySettings.default_daily_capacity}
                onChange={(e) => setCapacitySettings(prev => ({
                  ...prev,
                  default_daily_capacity: parseInt(e.target.value) || 100
                }))}
              />
            </div>
            
            <div>
              <Label>Alapértelmezett időslotok</Label>
              <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                {capacitySettings.time_slots.map((slot, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) => {
                        const newSlots = [...capacitySettings.time_slots];
                        newSlots[index].time = e.target.value;
                        setCapacitySettings(prev => ({ ...prev, time_slots: newSlots }));
                      }}
                      className="w-24"
                    />
                    <Input
                      type="number"
                      min="1"
                      max="100"
                      value={slot.capacity}
                      onChange={(e) => {
                        const newSlots = [...capacitySettings.time_slots];
                        newSlots[index].capacity = parseInt(e.target.value) || 0;
                        setCapacitySettings(prev => ({ ...prev, time_slots: newSlots }));
                      }}
                      className="w-20"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSlots = capacitySettings.time_slots.filter((_, i) => i !== index);
                        setCapacitySettings(prev => ({ ...prev, time_slots: newSlots }));
                      }}
                      className="text-destructive"
                    >
                      ×
                    </Button>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCapacitySettings(prev => ({
                      ...prev,
                      time_slots: [...prev.time_slots, { time: "12:00", capacity: 30 }]
                    }));
                  }}
                  className="w-full mt-2"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Időslot hozzáadása
                </Button>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                Mégsem
              </Button>
              <Button onClick={() => {
                localStorage.setItem('capacity_settings', JSON.stringify(capacitySettings));
                toast({
                  title: "Siker",
                  description: "Beállítások mentve"
                });
                setIsSettingsDialogOpen(false);
              }}>
                Mentés
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CapacityManagement;