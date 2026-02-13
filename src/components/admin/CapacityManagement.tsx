import { useState, useEffect, useCallback } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { LoadingSpinner } from "@/components/ui/loading";
import { format, getDay, addDays, subWeeks, startOfWeek, endOfWeek } from "date-fns";
import { hu } from "date-fns/locale";
import {
  Users,
  Clock,
  Plus,
  TrendingUp,
  AlertTriangle,
  Settings,
  BarChart3,
  Flame,
  Snowflake,
  Save,
  Copy,
  Trash2,
  Star,
  CalendarOff,
  Timer
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface CapacitySlot {
  id: string;
  date: string;
  timeslot: string;
  max_orders: number;
  booked_orders: number;
  buffer_minutes: number;
}

interface DailyCapacity {
  date: string;
  total_capacity: number;
  used_capacity: number;
  slots: CapacitySlot[];
}

interface CapacitySettings {
  default_daily_capacity: number;
  time_slots: { time: string; capacity: number; buffer?: number }[];
  warning_threshold: number;
}

interface CapacityTemplate {
  id: string;
  name: string;
  description: string | null;
  slots: { time: string; capacity: number; buffer?: number }[];
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

interface BlackoutDate {
  id: string;
  date: string;
  reason: string | null;
  created_at: string;
}

interface HeatData {
  [key: string]: number; // "timeslot" -> avg utilization %
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

  // Templates
  const [templates, setTemplates] = useState<CapacityTemplate[]>([]);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({ name: "", description: "" });

  // Blackout dates
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [isBlackoutDialogOpen, setIsBlackoutDialogOpen] = useState(false);
  const [blackoutForm, setBlackoutForm] = useState({ date: "", reason: "" });

  // Heat data
  const [heatData, setHeatData] = useState<HeatData>({});

  // Dialog states
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState<CapacitySlot | null>(null);

  // Form states
  const [slotForm, setSlotForm] = useState({
    timeslot: "12:00",
    max_orders: 30,
    buffer_minutes: 0
  });

  useEffect(() => {
    fetchAll();
  }, [selectedDate]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([
      fetchCapacityData(),
      fetchTemplates(),
      fetchBlackoutDates(),
      fetchSettings(),
      fetchHeatData()
    ]);
    setLoading(false);
  }, [selectedDate]);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase
        .from('settings')
        .select('value_json')
        .eq('key', 'capacity_settings')
        .single();
      if (data?.value_json) {
        setCapacitySettings(data.value_json as unknown as CapacitySettings);
      }
    } catch (e) {
      console.error('Error fetching settings:', e);
    }
  };

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

      if (error) { console.error('Error fetching capacity data:', error); return; }

      const groupedData: { [key: string]: DailyCapacity } = {};
      slotsData?.forEach(slot => {
        if (!groupedData[slot.date]) {
          groupedData[slot.date] = { date: slot.date, total_capacity: 0, used_capacity: 0, slots: [] };
        }
        groupedData[slot.date].slots.push(slot as CapacitySlot);
        groupedData[slot.date].total_capacity += slot.max_orders;
        groupedData[slot.date].used_capacity += slot.booked_orders;
      });

      setCapacityData(Object.values(groupedData));
    } catch (error) {
      console.error('Error fetching capacity data:', error);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data } = await supabase
        .from('capacity_templates')
        .select('*')
        .order('is_default', { ascending: false })
        .order('name');
      if (data) setTemplates(data.map(t => ({ ...t, slots: (t.slots as any) || [] })));
    } catch (e) { console.error('Error fetching templates:', e); }
  };

  const fetchBlackoutDates = async () => {
    try {
      const { data } = await supabase
        .from('blackout_dates')
        .select('*')
        .gte('date', format(new Date(), 'yyyy-MM-dd'))
        .order('date');
      if (data) setBlackoutDates(data);
    } catch (e) { console.error('Error fetching blackout dates:', e); }
  };

  const fetchHeatData = async () => {
    try {
      const dayOfWeek = getDay(selectedDate);
      const fourWeeksAgo = format(subWeeks(selectedDate, 4), 'yyyy-MM-dd');
      const today = format(selectedDate, 'yyyy-MM-dd');

      const { data } = await supabase
        .from('capacity_slots')
        .select('timeslot, max_orders, booked_orders')
        .gte('date', fourWeeksAgo)
        .lte('date', today);

      if (!data || data.length === 0) return;

      // Group by timeslot and compute avg utilization
      const grouped: { [key: string]: { total: number; count: number } } = {};
      data.forEach(slot => {
        const key = slot.timeslot;
        if (!grouped[key]) grouped[key] = { total: 0, count: 0 };
        const util = slot.max_orders > 0 ? (slot.booked_orders / slot.max_orders) * 100 : 0;
        grouped[key].total += util;
        grouped[key].count += 1;
      });

      const heat: HeatData = {};
      Object.entries(grouped).forEach(([time, val]) => {
        heat[time] = Math.round(val.total / val.count);
      });
      setHeatData(heat);
    } catch (e) { console.error('Error fetching heat data:', e); }
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

  const isBlackout = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return blackoutDates.some(b => b.date === dateStr);
  };

  const isNearCapacity = (capacity: DailyCapacity) => {
    return getUtilizationPercentage(capacity) >= capacitySettings.warning_threshold;
  };

  const getHeatColor = (timeslot: string) => {
    const util = heatData[timeslot];
    if (util === undefined) return null;
    if (util < 40) return { color: "text-blue-500", icon: Snowflake, label: "Hideg" };
    if (util < 70) return { color: "text-yellow-500", icon: TrendingUp, label: "Közepes" };
    return { color: "text-red-500", icon: Flame, label: "Forró" };
  };

  // === SLOT OPERATIONS ===
  const openSlotDialog = (slot?: CapacitySlot) => {
    if (slot) {
      setEditingSlot(slot);
      setSlotForm({ timeslot: slot.timeslot, max_orders: slot.max_orders, buffer_minutes: slot.buffer_minutes });
    } else {
      setEditingSlot(null);
      setSlotForm({ timeslot: "12:00", max_orders: 30, buffer_minutes: 0 });
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
        booked_orders: editingSlot?.booked_orders || 0,
        buffer_minutes: slotForm.buffer_minutes
      };

      if (editingSlot) {
        const { error } = await supabase.from('capacity_slots').update(slotData).eq('id', editingSlot.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('capacity_slots').insert(slotData);
        if (error) throw error;
      }

      toast({ title: "Siker", description: editingSlot ? "Időslot frissítve" : "Új időslot létrehozva" });
      setIsSlotDialogOpen(false);
      fetchCapacityData();
    } catch (error) {
      console.error('Error saving capacity slot:', error);
      toast({ title: "Hiba", description: "Nem sikerült menteni az időslotot", variant: "destructive" });
    }
  };

  // === TEMPLATE OPERATIONS ===
  const applyTemplate = async (template: CapacityTemplate, wholeWeek = false) => {
    try {
      const dates: string[] = [];
      if (wholeWeek) {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        for (let i = 0; i < 6; i++) { // Mon-Sat
          const d = addDays(weekStart, i);
          if (!isWeekend(d) || getDay(d) === 6) dates.push(format(d, 'yyyy-MM-dd'));
        }
      } else {
        dates.push(format(selectedDate, 'yyyy-MM-dd'));
      }

      for (const dateStr of dates) {
        await supabase.from('capacity_slots').delete().eq('date', dateStr);
        const slots = template.slots.map(s => ({
          date: dateStr,
          timeslot: s.time,
          max_orders: s.capacity,
          booked_orders: 0,
          buffer_minutes: s.buffer || 0
        }));
        if (slots.length > 0) {
          const { error } = await supabase.from('capacity_slots').insert(slots);
          if (error) throw error;
        }
      }

      toast({ title: "Siker", description: wholeWeek ? "Sablon alkalmazva az egész hétre" : "Sablon alkalmazva a napra" });
      fetchCapacityData();
    } catch (error) {
      console.error('Error applying template:', error);
      toast({ title: "Hiba", description: "Nem sikerült alkalmazni a sablont", variant: "destructive" });
    }
  };

  const saveDayAsTemplate = async () => {
    const selectedDateCapacity = getCapacityForDate(selectedDate);
    if (!selectedDateCapacity || selectedDateCapacity.slots.length === 0) {
      toast({ title: "Hiba", description: "Nincs mentendő slot ezen a napon", variant: "destructive" });
      return;
    }
    setTemplateForm({ name: "", description: "" });
    setIsTemplateDialogOpen(true);
  };

  const confirmSaveTemplate = async () => {
    try {
      const selectedDateCapacity = getCapacityForDate(selectedDate);
      if (!selectedDateCapacity) return;

      const slots = selectedDateCapacity.slots.map(s => ({
        time: s.timeslot,
        capacity: s.max_orders,
        buffer: s.buffer_minutes
      }));

      const { error } = await supabase.from('capacity_templates').insert({
        name: templateForm.name,
        description: templateForm.description || null,
        slots: slots as any,
        is_default: false
      });
      if (error) throw error;

      toast({ title: "Siker", description: "Sablon mentve" });
      setIsTemplateDialogOpen(false);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      toast({ title: "Hiba", description: "Nem sikerült menteni a sablont", variant: "destructive" });
    }
  };

  const setDefaultTemplate = async (templateId: string) => {
    try {
      // Clear all defaults first
      await supabase.from('capacity_templates').update({ is_default: false } as any).neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('capacity_templates').update({ is_default: true } as any).eq('id', templateId);
      toast({ title: "Siker", description: "Alapértelmezett sablon beállítva" });
      fetchTemplates();
    } catch (error) {
      console.error('Error setting default template:', error);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    try {
      const { error } = await supabase.from('capacity_templates').delete().eq('id', templateId);
      if (error) throw error;
      toast({ title: "Siker", description: "Sablon törölve" });
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast({ title: "Hiba", description: "Nem sikerült törölni", variant: "destructive" });
    }
  };

  const applyDefaultSlots = async () => {
    const defaultTemplate = templates.find(t => t.is_default);
    if (defaultTemplate) {
      await applyTemplate(defaultTemplate);
    } else {
      // Fallback to settings-based slots
      try {
        const dateString = format(selectedDate, 'yyyy-MM-dd');
        await supabase.from('capacity_slots').delete().eq('date', dateString);
        const defaultSlots = capacitySettings.time_slots.map(slot => ({
          date: dateString,
          timeslot: slot.time,
          max_orders: slot.capacity,
          booked_orders: 0,
          buffer_minutes: slot.buffer || 0
        }));
        const { error } = await supabase.from('capacity_slots').insert(defaultSlots);
        if (error) throw error;
        toast({ title: "Siker", description: "Alapértelmezett időslotok alkalmazva" });
        fetchCapacityData();
      } catch (error) {
        console.error('Error applying default slots:', error);
        toast({ title: "Hiba", description: "Nem sikerült alkalmazni", variant: "destructive" });
      }
    }
  };

  // === BLACKOUT OPERATIONS ===
  const addBlackoutDate = async () => {
    try {
      if (!blackoutForm.date) return;
      const { error } = await supabase.from('blackout_dates').insert({
        date: blackoutForm.date,
        reason: blackoutForm.reason || null
      });
      if (error) throw error;
      toast({ title: "Siker", description: "Nap zárolva" });
      setIsBlackoutDialogOpen(false);
      setBlackoutForm({ date: "", reason: "" });
      fetchBlackoutDates();
    } catch (error: any) {
      console.error('Error adding blackout date:', error);
      toast({ title: "Hiba", description: error.message?.includes('unique') ? "Ez a dátum már zárolva van" : "Nem sikerült zárolni", variant: "destructive" });
    }
  };

  const removeBlackoutDate = async (id: string) => {
    try {
      const { error } = await supabase.from('blackout_dates').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Siker", description: "Zárolás feloldva" });
      fetchBlackoutDates();
    } catch (error) {
      console.error('Error removing blackout date:', error);
      toast({ title: "Hiba", description: "Nem sikerült feloldani", variant: "destructive" });
    }
  };

  // === SETTINGS SAVE ===
  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'capacity_settings', value_json: capacitySettings as any });
      if (error) throw error;
      toast({ title: "Siker", description: "Beállítások mentve az adatbázisba" });
      setIsSettingsDialogOpen(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({ title: "Hiba", description: "Nem sikerült menteni", variant: "destructive" });
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
  const selectedIsBlackout = isBlackout(selectedDate);

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-foreground">Kapacitás kezelés</h2>
            <p className="text-sm text-muted-foreground">Időslotok, sablonok, zárolások kezelése</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsSettingsDialogOpen(true)} variant="outline" size={isMobile ? "sm" : "default"}>
              <Settings className="h-4 w-4 mr-2" />Beállítások
            </Button>
            {!isWeekend(selectedDate) && !selectedIsBlackout && (
              <Button onClick={applyDefaultSlots} size={isMobile ? "sm" : "default"}>
                <Plus className="h-4 w-4 mr-2" />Alapértelmezett
              </Button>
            )}
          </div>
        </div>

        <Tabs defaultValue="slots" className="w-full">
          <TabsList className="w-full justify-start">
            <TabsTrigger value="slots"><Clock className="h-4 w-4 mr-1.5" />Időslotok</TabsTrigger>
            <TabsTrigger value="templates"><Copy className="h-4 w-4 mr-1.5" />Sablonok</TabsTrigger>
            <TabsTrigger value="blackout"><CalendarOff className="h-4 w-4 mr-1.5" />Zárolások</TabsTrigger>
          </TabsList>

          {/* === SLOTS TAB === */}
          <TabsContent value="slots">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Calendar */}
              <Card className="rounded-2xl shadow-md border-primary/20">
                <CardHeader className="pb-4">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Users className="h-5 w-5 text-foreground" />Kapacitás naptár
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
                      nearCapacity: (date) => { const cap = getCapacityForDate(date); return cap ? isNearCapacity(cap) : false; },
                      weekend: (date) => isWeekend(date),
                      blackout: (date) => isBlackout(date)
                    }}
                    modifiersStyles={{
                      hasCapacity: { backgroundColor: 'hsl(var(--primary) / 0.1)', color: 'hsl(var(--primary))', fontWeight: '600' },
                      nearCapacity: { backgroundColor: 'hsl(var(--destructive) / 0.1)', color: 'hsl(var(--destructive))', fontWeight: 'bold' },
                      weekend: { backgroundColor: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))', opacity: 0.6 },
                      blackout: { backgroundColor: 'hsl(0 84% 60% / 0.2)', color: 'hsl(0 84% 60%)', textDecoration: 'line-through' }
                    }}
                  />
                  <div className="mt-4 space-y-2 text-sm">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-primary/20 border border-primary rounded-sm" /><span className="text-muted-foreground">Kapacitás beállítva</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-destructive/20 border border-destructive rounded-sm" /><span className="text-muted-foreground">Majdnem tele</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 bg-red-500/20 border border-red-500 rounded-sm" /><span className="text-muted-foreground line-through">Zárolva</span></div>
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
                      {selectedDateCapacity && !isWeekend(selectedDate) && !selectedIsBlackout && (
                        <Badge variant={isNearCapacity(selectedDateCapacity) ? "destructive" : "default"} className="ml-2">
                          {getUtilizationPercentage(selectedDateCapacity)}% foglalt
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {selectedIsBlackout ? (
                      <div className="text-center py-8">
                        <div className="p-6 bg-destructive/5 rounded-lg border border-destructive/20">
                          <CalendarOff className="h-12 w-12 mx-auto mb-4 text-destructive opacity-60" />
                          <p className="text-destructive text-lg font-medium mb-2">Zárolva</p>
                          <p className="text-muted-foreground text-sm">
                            {blackoutDates.find(b => b.date === format(selectedDate, 'yyyy-MM-dd'))?.reason || "Ez a nap zárolva van"}
                          </p>
                        </div>
                      </div>
                    ) : isWeekend(selectedDate) ? (
                      <div className="text-center py-8">
                        <div className="p-6 bg-muted/50 rounded-lg">
                          <p className="text-muted-foreground text-lg font-medium mb-2">Hétvégén zárva</p>
                          <p className="text-muted-foreground/70 text-sm">A vendéglő szombaton és vasárnap zárva tart</p>
                        </div>
                      </div>
                    ) : selectedDateCapacity ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Napi kapacitás kihasználtság</span>
                            <span className="font-medium">{selectedDateCapacity.used_capacity} / {selectedDateCapacity.total_capacity}</span>
                          </div>
                          <Progress value={getUtilizationPercentage(selectedDateCapacity)} className="h-3" />
                          {isNearCapacity(selectedDateCapacity) && (
                            <div className="flex items-center gap-2 text-sm text-destructive">
                              <AlertTriangle className="h-4 w-4" /><span>Figyelem: Közel a kapacitáshatárhoz!</span>
                            </div>
                          )}
                        </div>
                        <Separator />
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="font-medium">Időslotok</h3>
                            <div className="flex gap-2">
                              <Button size="sm" variant="outline" onClick={saveDayAsTemplate} className="h-8">
                                <Save className="h-3 w-3 mr-1" />Mentés sablonként
                              </Button>
                              <Button size="sm" onClick={() => openSlotDialog()} className="h-8">
                                <Plus className="h-3 w-3 mr-1" />Új slot
                              </Button>
                            </div>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {selectedDateCapacity.slots
                              .sort((a, b) => a.timeslot.localeCompare(b.timeslot))
                              .map((slot) => {
                                const utilization = slot.max_orders > 0 ? Math.round((slot.booked_orders / slot.max_orders) * 100) : 0;
                                const isNearLimit = utilization >= capacitySettings.warning_threshold;
                                const heat = getHeatColor(slot.timeslot);

                                return (
                                  <Card
                                    key={slot.id}
                                    className={`p-3 cursor-pointer transition-colors ${isNearLimit ? 'border-destructive/50 bg-destructive/5' : 'hover:border-primary/50'}`}
                                    onClick={() => openSlotDialog(slot)}
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{slot.timeslot}</span>
                                        {slot.buffer_minutes > 0 && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="inline-flex items-center"><Timer className="h-3 w-3 text-muted-foreground" /></span>
                                            </TooltipTrigger>
                                            <TooltipContent>{slot.buffer_minutes} perc szünet utána</TooltipContent>
                                          </Tooltip>
                                        )}
                                        {heat && (
                                          <Tooltip>
                                            <TooltipTrigger asChild>
                                              <span className="inline-flex items-center"><heat.icon className={`h-3 w-3 ${heat.color}`} /></span>
                                            </TooltipTrigger>
                                            <TooltipContent>Az elmúlt 4 hétben átlagosan {heatData[slot.timeslot]}%-ban foglalt ({heat.label})</TooltipContent>
                                          </Tooltip>
                                        )}
                                      </div>
                                      <Badge variant={isNearLimit ? "destructive" : "secondary"} className="text-xs">{utilization}%</Badge>
                                    </div>
                                    <div className="space-y-2">
                                      <div className="flex justify-between text-sm text-muted-foreground">
                                        <span>Foglalások:</span><span>{slot.booked_orders} / {slot.max_orders}</span>
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
                          <p className="text-muted-foreground text-lg font-medium mb-2">Nincs kapacitás beállítva</p>
                          <p className="text-muted-foreground/70 text-sm mb-4">Állítsa be a napi kapacitást és időslotokat</p>
                          <Button onClick={applyDefaultSlots}><Plus className="h-4 w-4 mr-2" />Alapértelmezett alkalmazása</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* === TEMPLATES TAB === */}
          <TabsContent value="templates">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Kapacitás sablonok</h3>
              </div>
              {templates.length === 0 ? (
                <Card className="p-8 text-center">
                  <Copy className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground mb-2">Nincsenek sablonok</p>
                  <p className="text-sm text-muted-foreground/70 mb-4">Állítson be időslotokat egy napra, majd mentse sablonként</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map(template => (
                    <Card key={template.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">{template.name}</h4>
                          {template.is_default && <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => deleteTemplate(template.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                      {template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
                      <p className="text-xs text-muted-foreground">{template.slots.length} időslot</p>
                      <div className="flex flex-wrap gap-1">
                        {template.slots.slice(0, 4).map((s, i) => (
                          <Badge key={i} variant="outline" className="text-xs">{s.time} ({s.capacity})</Badge>
                        ))}
                        {template.slots.length > 4 && <Badge variant="outline" className="text-xs">+{template.slots.length - 4}</Badge>}
                      </div>
                      <Separator />
                      <div className="flex flex-wrap gap-2">
                        <Button size="sm" variant="outline" onClick={() => applyTemplate(template)}>Alkalmaz napra</Button>
                        <Button size="sm" variant="outline" onClick={() => applyTemplate(template, true)}>Egész hétre</Button>
                        {!template.is_default && (
                          <Button size="sm" variant="ghost" onClick={() => setDefaultTemplate(template.id)}>
                            <Star className="h-3 w-3 mr-1" />Alapértelmezett
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* === BLACKOUT TAB === */}
          <TabsContent value="blackout">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Zárollt napok</h3>
                <Button size="sm" onClick={() => { setBlackoutForm({ date: "", reason: "" }); setIsBlackoutDialogOpen(true); }}>
                  <Plus className="h-4 w-4 mr-2" />Nap zárolása
                </Button>
              </div>
              {blackoutDates.length === 0 ? (
                <Card className="p-8 text-center">
                  <CalendarOff className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nincsenek zárollt napok</p>
                </Card>
              ) : (
                <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Dátum</TableHead>
                        <TableHead>Ok</TableHead>
                        <TableHead className="w-20"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {blackoutDates.map(bd => (
                        <TableRow key={bd.id}>
                          <TableCell className="font-medium">
                            {format(new Date(bd.date + 'T00:00:00'), 'yyyy. MMMM dd. (EEEE)', { locale: hu })}
                          </TableCell>
                          <TableCell className="text-muted-foreground">{bd.reason || "—"}</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => removeBlackoutDate(bd.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Slot Dialog */}
        <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-md'}`}>
            <DialogHeader>
              <DialogTitle>{editingSlot ? 'Időslot szerkesztése' : 'Új időslot létrehozása'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Időpont</Label>
                <Select value={slotForm.timeslot} onValueChange={(value) => setSlotForm(prev => ({ ...prev, timeslot: value }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 16 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 7;
                      const minute = (i % 2) * 30;
                      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
                      return <SelectItem key={time} value={time}>{time}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Maximális rendelések</Label>
                <Input type="number" min="1" max="100" value={slotForm.max_orders} onChange={(e) => setSlotForm(prev => ({ ...prev, max_orders: parseInt(e.target.value) || 0 }))} />
              </div>
              <div>
                <Label>Szünet utána (perc)</Label>
                <Select value={String(slotForm.buffer_minutes)} onValueChange={(v) => setSlotForm(prev => ({ ...prev, buffer_minutes: parseInt(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 perc</SelectItem>
                    <SelectItem value="5">5 perc</SelectItem>
                    <SelectItem value="10">10 perc</SelectItem>
                    <SelectItem value="15">15 perc</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editingSlot && (
                <div>
                  <Label>Jelenlegi foglalások</Label>
                  <div className="text-sm text-muted-foreground p-2 bg-muted rounded">{editingSlot.booked_orders} rendelés</div>
                </div>
              )}
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsSlotDialogOpen(false)}>Mégsem</Button>
                <Button onClick={saveCapacitySlot}>{editingSlot ? 'Frissítés' : 'Létrehozás'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw] max-h-[90vh]' : 'max-w-2xl'} overflow-y-auto`}>
            <DialogHeader><DialogTitle>Kapacitás beállítások</DialogTitle></DialogHeader>
            <div className="space-y-6">
              <div>
                <Label>Figyelmeztetési küszöb (%)</Label>
                <Input type="number" min="50" max="100" value={capacitySettings.warning_threshold} onChange={(e) => setCapacitySettings(prev => ({ ...prev, warning_threshold: parseInt(e.target.value) || 80 }))} />
                <p className="text-xs text-muted-foreground mt-1">Ennél a kihasználtságnál jelennek meg a figyelmeztető jelzések</p>
              </div>
              <div>
                <Label>Alapértelmezett napi kapacitás</Label>
                <Input type="number" min="10" max="500" value={capacitySettings.default_daily_capacity} onChange={(e) => setCapacitySettings(prev => ({ ...prev, default_daily_capacity: parseInt(e.target.value) || 100 }))} />
              </div>
              <div>
                <Label>Alapértelmezett időslotok</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                  {capacitySettings.time_slots.map((slot, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input type="time" value={slot.time} onChange={(e) => { const n = [...capacitySettings.time_slots]; n[index].time = e.target.value; setCapacitySettings(prev => ({ ...prev, time_slots: n })); }} className="w-24" />
                      <Input type="number" min="1" max="100" value={slot.capacity} onChange={(e) => { const n = [...capacitySettings.time_slots]; n[index].capacity = parseInt(e.target.value) || 0; setCapacitySettings(prev => ({ ...prev, time_slots: n })); }} className="w-20" />
                      <Button variant="ghost" size="sm" onClick={() => { setCapacitySettings(prev => ({ ...prev, time_slots: prev.time_slots.filter((_, i) => i !== index) })); }} className="text-destructive">×</Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => setCapacitySettings(prev => ({ ...prev, time_slots: [...prev.time_slots, { time: "12:00", capacity: 30 }] }))} className="w-full mt-2">
                    <Plus className="h-4 w-4 mr-2" />Időslot hozzáadása
                  </Button>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>Mégsem</Button>
                <Button onClick={saveSettings}><Save className="h-4 w-4 mr-2" />Mentés</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Save as Template Dialog */}
        <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-md'}`}>
            <DialogHeader><DialogTitle>Nap mentése sablonként</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Sablon neve *</Label>
                <Input value={templateForm.name} onChange={(e) => setTemplateForm(prev => ({ ...prev, name: e.target.value }))} placeholder="pl. Standard hétköznap" />
              </div>
              <div>
                <Label>Leírás</Label>
                <Input value={templateForm.description} onChange={(e) => setTemplateForm(prev => ({ ...prev, description: e.target.value }))} placeholder="Rövid leírás (opcionális)" />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>Mégsem</Button>
                <Button onClick={confirmSaveTemplate} disabled={!templateForm.name.trim()}>Mentés</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Blackout Date Dialog */}
        <Dialog open={isBlackoutDialogOpen} onOpenChange={setIsBlackoutDialogOpen}>
          <DialogContent className={`${isMobile ? 'max-w-[95vw]' : 'max-w-md'}`}>
            <DialogHeader><DialogTitle>Nap zárolása</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Dátum *</Label>
                <Input type="date" value={blackoutForm.date} onChange={(e) => setBlackoutForm(prev => ({ ...prev, date: e.target.value }))} min={format(new Date(), 'yyyy-MM-dd')} />
              </div>
              <div>
                <Label>Ok</Label>
                <Input value={blackoutForm.reason} onChange={(e) => setBlackoutForm(prev => ({ ...prev, reason: e.target.value }))} placeholder="pl. Karácsonyi szünet" />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsBlackoutDialogOpen(false)}>Mégsem</Button>
                <Button onClick={addBlackoutDate} disabled={!blackoutForm.date}>Zárolás</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default CapacityManagement;
