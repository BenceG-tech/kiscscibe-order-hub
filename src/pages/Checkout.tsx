import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { LoadingSpinner } from "@/components/ui/loading";
import { Badge } from "@/components/ui/badge";
import ModernNavigation from "@/components/ModernNavigation";
import { ArrowLeft, Clock, CreditCard, User } from "lucide-react";

interface TimeSlot {
  date: string;
  timeslot: string;
  available_capacity: number;
  max_capacity: number;
  utilization_percent: number;
}

const Checkout = () => {
  const { state: cart, clearCart } = useCart();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
    pickup_type: "asap" as "asap" | "scheduled",
    pickup_date: "",
    pickup_time: "",
    payment_method: "cash" as "cash" | "card"
  });
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Extract daily item dates from cart with useMemo for efficiency
  const dailyDates = useMemo(() => {
    const dailyItems = cart.items.filter(item => item.daily_date);
    const uniqueDates = [...new Set(dailyItems.map(item => item.daily_date))];
    return uniqueDates.filter(Boolean) as string[];
  }, [cart.items]);

  // Safe date creation to avoid timezone issues
  const makeDate = (dateStr: string): Date => {
    // Create date using local timezone to avoid UTC conversion issues
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const generateBusinessHourSlots = (date: string): TimeSlot[] => {
    const slotDate = makeDate(date);
    const dayOfWeek = slotDate.getDay();
    
    // Skip Sundays (0)
    if (dayOfWeek === 0) return [];
    
    const slots: TimeSlot[] = [];
    let startHour = 7;
    let endHour = 15;
    
    // Saturday has different hours
    if (dayOfWeek === 6) {
      startHour = 8;
      endHour = 14;
    }
    
    // Generate 30-minute slots
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        slots.push({
          date,
          timeslot: timeString,
          available_capacity: 8, // Default capacity
          max_capacity: 8,
          utilization_percent: 0
        });
      }
    }
    
    return slots;
  };

  const fetchTimeSlots = useCallback(async () => {
    setLoading(true);
    try {
      const today = new Date();
      
      // Step 1: Determine target dates
      let targetDates: string[] = [];
      
      if (dailyDates.length > 0) {
        targetDates = dailyDates;
      } else {
        const currentDate = new Date(today);
        currentDate.setDate(currentDate.getDate() + 1);
        let daysAdded = 0;
        let maxDays = 10;
        
        while (daysAdded < 5 && maxDays > 0) {
          const year = currentDate.getFullYear();
          const month = String(currentDate.getMonth() + 1).padStart(2, '0');
          const day = String(currentDate.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const dayOfWeek = currentDate.getDay();
          
          if (dayOfWeek !== 0) {
            targetDates.push(dateStr);
            daysAdded++;
          }
          
          currentDate.setDate(currentDate.getDate() + 1);
          maxDays--;
        }
      }
      
      // Step 1.5: Fetch blackout dates and filter them out
      const { data: blackoutData } = await supabase
        .from("blackout_dates")
        .select("date")
        .in("date", targetDates);
      
      const blackoutSet = new Set((blackoutData || []).map(b => b.date));
      targetDates = targetDates.filter(d => !blackoutSet.has(d));
      
      // Step 2: Generate all possible business hour slots for target dates
      let allSlots: TimeSlot[] = [];
      for (const date of targetDates) {
        const dateSlots = generateBusinessHourSlots(date);
        allSlots = [...allSlots, ...dateSlots];
      }
      
      // Step 3: Fetch capacity data from database
      const { data: capacityData, error } = await supabase
        .from("capacity_slots")
        .select("date, timeslot, max_orders, booked_orders, buffer_minutes")
        .in("date", targetDates)
        .order("date")
        .order("timeslot");
      
      if (error) {
        console.error("Error fetching capacity data:", error);
      }
      
      // Step 4: Build capacity map and buffer set
      const capacityMap = new Map<string, { max_orders: number; booked_orders: number; buffer_minutes: number }>();
      const bufferBlockedSlots = new Set<string>();
      
      if (capacityData) {
        for (const slot of capacityData) {
          const key = `${slot.date}_${slot.timeslot}`;
          capacityMap.set(key, {
            max_orders: slot.max_orders,
            booked_orders: slot.booked_orders,
            buffer_minutes: slot.buffer_minutes || 0
          });
          
          // Mark buffer-blocked slots
          if (slot.buffer_minutes > 0) {
            const [h, m] = slot.timeslot.split(':').map(Number);
            const slotMinutes = h * 60 + m;
            for (let b = 1; b <= Math.ceil(slot.buffer_minutes / 30); b++) {
              const bufferMin = slotMinutes + b * 30;
              const bufH = Math.floor(bufferMin / 60);
              const bufM = bufferMin % 60;
              const bufKey = `${slot.date}_${String(bufH).padStart(2, '0')}:${String(bufM).padStart(2, '0')}:00`;
              bufferBlockedSlots.add(bufKey);
            }
          }
        }
      }
      
      // Step 5: Apply capacity data, filter, and add utilization info
      const finalSlots = allSlots
        .map(slot => {
          const key = `${slot.date}_${slot.timeslot}`;
          const capacity = capacityMap.get(key);
          
          if (capacity) {
            const maxCap = capacity.max_orders;
            const booked = capacity.booked_orders;
            return {
              ...slot,
              available_capacity: maxCap - booked,
              max_capacity: maxCap,
              utilization_percent: maxCap > 0 ? Math.round((booked / maxCap) * 100) : 0
            };
          }
          
          return slot;
        })
        .filter(slot => {
          const key = `${slot.date}_${slot.timeslot}`;
          
          // Filter out buffer-blocked slots
          if (bufferBlockedSlots.has(key)) return false;
          
          // Keep full slots (we'll show them as disabled) but filter truly unavailable
          // Filter out past slots
          const slotDate = makeDate(slot.date);
          const [hours, minutes] = slot.timeslot.split(':').map(Number);
          slotDate.setHours(hours, minutes, 0, 0);
          
          const now = new Date();
          if (slotDate <= now) return false;
          
          return true;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.timeslot.localeCompare(b.timeslot);
        });
      
      setTimeSlots(finalSlots);
      
      // Auto-select first available slot if no slot is selected
      const availableSlots = finalSlots.filter(s => s.available_capacity > 0);
      if (availableSlots.length > 0 && !formData.pickup_time) {
        const firstSlot = availableSlots[0];
        setFormData(prev => ({
          ...prev,
          pickup_date: firstSlot.date,
          pickup_time: firstSlot.timeslot
        }));
      }
      
      if (finalSlots.length === 0) {
        toast({
          title: "Figyelmeztetés",
          description: "Nincsenek elérhető időpontok",
          variant: "destructive"
        });
      }
      
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni az időpontokat",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [dailyDates, toast, formData.pickup_time]);

  // Redirect if cart is empty and handle initial setup
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate("/etlap");
      return;
    }
    
    // Auto-select scheduled pickup if cart has daily items
    if (dailyDates.length > 0 && formData.pickup_type === "asap") {
      setFormData(prev => ({ ...prev, pickup_type: "scheduled" }));
    }
    
    fetchTimeSlots();
  }, [cart.items.length, navigate, dailyDates, fetchTimeSlots, formData.pickup_type]);

  const getDailyItemDates = () => dailyDates;

  // Check if cart has mixed daily items from different dates
  const hasMultipleDailyDates = () => {
    const dailyDates = getDailyItemDates();
    return dailyDates.length > 1;
  };

  // Get the constraint message for pickup time
  const getPickupConstraint = () => {
    const dailyDates = getDailyItemDates();
    if (dailyDates.length === 0) return null;
    
    if (dailyDates.length === 1) {
      const date = new Date(dailyDates[0]);
      return `Napi ajánlat/menü miatt csak ${date.toLocaleDateString("hu-HU", { 
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}-án lehet átvenni`;
    }
    
    return "Különböző dátumú napi ajánlatok/menük miatt korlátozott időpontok";
  };

  
  const isBusinessHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Check if it's Sunday (closed)
    if (currentDay === 0) return false; // Sunday closed
    
    // Check opening hours
    if (currentDay >= 1 && currentDay <= 5) { // Monday-Friday
      return currentHour >= 7 && currentHour < 15;
    } else if (currentDay === 6) { // Saturday
      return currentHour >= 8 && currentHour < 14;
    }
    
    return false;
  };
  
  const formatTimeSlot = (date: string, time: string) => {
    const dateObj = new Date(date);
    const timeObj = new Date(`2000-01-01T${time}`);
    
    return `${dateObj.toLocaleDateString("hu-HU", { 
      month: "short", 
      day: "numeric" 
    })} ${timeObj.toLocaleTimeString("hu-HU", { 
      hour: "2-digit", 
      minute: "2-digit" 
    })}`;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('=== RENDELÉS LEADÁS DEBUG ===');
    console.log('Form data:', formData);
    console.log('Cart items:', cart.items);
    console.log('Daily dates:', dailyDates);
    console.log('Multiple daily dates:', hasMultipleDailyDates());
    console.log('Business hours:', isBusinessHours());
    
    // Prevent submission if cart has multiple daily dates
    if (hasMultipleDailyDates()) {
      toast({
        title: "Hiba",
        description: "Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre",
        variant: "destructive"
      });
      return;
    }
    
    // Validate pickup time is not in the past
    if (formData.pickup_type === 'scheduled' && formData.pickup_date && formData.pickup_time) {
      const selectedTime = new Date(`${formData.pickup_date}T${formData.pickup_time}`);
      const now = new Date();
      
      if (selectedTime < now) {
        toast({
          title: "Hiba",
          description: "Múltbeli időpontra nem lehet rendelni",
          variant: "destructive"
        });
        return;
      }
      
      // Check business hours
      const dayOfWeek = selectedTime.getDay();
      const hour = selectedTime.getHours();
      
      // Check if it's Sunday (closed)
      if (dayOfWeek === 0) {
        toast({
          title: "Hiba", 
          description: "Vasárnap zárva tartunk",
          variant: "destructive"
        });
        return;
      }
      
      // Check opening hours
      let isValidTime = false;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Monday-Friday
        isValidTime = hour >= 7 && hour < 15;
      } else if (dayOfWeek === 6) { // Saturday
        isValidTime = hour >= 8 && hour < 14;
      }
      
      if (!isValidTime) {
        toast({
          title: "Hiba",
          description: "A kiválasztott időpont nyitvatartási időn kívül esik",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      console.log('Calling submit-order edge function...');
      
      // Call the submit-order edge function
      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: {
          customer: {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            notes: formData.notes || null
          },
          payment_method: formData.payment_method,
          pickup_date: formData.pickup_type === "asap" ? null : formData.pickup_date,
          pickup_time_slot: formData.pickup_type === "asap" ? null : formData.pickup_time,
          items: cart.items.map(item => ({
            item_id: item.id,
            name_snapshot: item.name,
            qty: item.quantity,
            unit_price_huf: item.price_huf,
            daily_type: item.daily_type,
            daily_date: item.daily_date,
            daily_id: item.daily_id ?? item.menu_id,
            modifiers: (item.modifiers || []).map(mod => ({
              label_snapshot: mod.label,
              price_delta_huf: mod.price_delta_huf
            })),
            sides: (item.sides || []).map(side => ({
              id: side.id,
              name: side.name,
              price_huf: side.price_huf
            }))
          }))
        }
      });
      
      console.log('Edge function response:', { data, error });
      
      if (error) throw error;
      
      // Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order-confirmation?code=${data.order_code}&phone=${encodeURIComponent(formData.phone)}&email=${encodeURIComponent(formData.email)}`);
      
    } catch (error: any) {
      console.error("Order submission error:", error);
      toast({
        title: "Hiba a rendelés leadásakor",
        description: error.message || "Kérjük próbálja újra",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const canOrderToday = isBusinessHours();
  
  if (cart.items.length === 0) {
    return null; // Will redirect in useEffect
  }
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/etlap")}
              className="mb-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vissza az étlaphoz
            </Button>
            
            <h1 className="text-3xl font-bold text-foreground">Rendelés véglegesítése</h1>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Rendelés összesítője
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cart.items.map((item, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name}</h4>
                      {item.modifiers.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {item.modifiers.map(mod => mod.label).join(", ")}
                        </p>
                      )}
                      <p className="text-sm">Mennyiség: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {((item.price_huf + item.modifiers.reduce((sum, mod) => sum + mod.price_delta_huf, 0)) * item.quantity).toLocaleString()} Ft
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Végösszeg:</span>
                  <span className="text-primary">{cart.total.toLocaleString()} Ft</span>
                </div>
              </CardContent>
            </Card>
            
            {/* Checkout Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Adatok megadása
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Customer Info */}
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Név *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        required
                        placeholder="Teljes név"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefonszám *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                        required
                        placeholder="+36 XX XXX XXXX"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail cím *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        required
                        placeholder="pelda@email.com"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="notes">Megjegyzés</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                        placeholder="További kérések, allergének, stb."
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  {/* Pickup Time */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Átvételi idő
                    </Label>
                    
                    {/* Show pickup constraint for daily items */}
                    {getPickupConstraint() && (
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                          ℹ️ {getPickupConstraint()}
                        </p>
                      </div>
                    )}
                    
                    {/* Show warning for multiple daily dates */}
                    {hasMultipleDailyDates() && (
                      <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm text-red-800 dark:text-red-200 font-medium">
                          ⚠️ A kosárban különböző dátumú napi ajánlatok/menük vannak. Kérjük távolítsa el az egyiket.
                        </p>
                      </div>
                    )}
                    
                    <RadioGroup
                      value={formData.pickup_type}
                      onValueChange={(value: "asap" | "scheduled") => 
                        setFormData(prev => ({ ...prev, pickup_type: value }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem 
                          value="asap" 
                          id="asap" 
                          disabled={!canOrderToday || getDailyItemDates().length > 0} 
                        />
                        <Label htmlFor="asap" className={(!canOrderToday || getDailyItemDates().length > 0) ? "text-muted-foreground" : ""}>
                          Minél hamarabb (15-20 perc)
                          {!canOrderToday && (
                            <Badge variant="secondary" className="ml-2">Zárva</Badge>
                          )}
                          {getDailyItemDates().length > 0 && (
                            <Badge variant="secondary" className="ml-2">Csak ütemezetten</Badge>
                          )}
                        </Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="scheduled" id="scheduled" />
                        <Label htmlFor="scheduled">Időpont foglalása</Label>
                      </div>
                    </RadioGroup>
                    
                    {formData.pickup_type === "scheduled" && (
                      <div className="space-y-3">
                        {loading ? (
                          <div className="flex justify-center py-4">
                            <LoadingSpinner className="h-6 w-6" />
                          </div>
                        ) : (
                          <Select
                            value={`${formData.pickup_date}|${formData.pickup_time}`}
                            onValueChange={(value) => {
                              const [date, time] = value.split("|");
                              setFormData(prev => ({ 
                                ...prev, 
                                pickup_date: date, 
                                pickup_time: time 
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Válasszon időpontot" />
                            </SelectTrigger>
                            <SelectContent>
                              {timeSlots.length === 0 ? (
                                <div className="p-3 text-sm text-muted-foreground space-y-2">
                                  <p>Nincs elérhető időpont ehhez a rendeléshez.</p>
                                  {loading && <p className="text-xs">Betöltés...</p>}
                                  {!loading && (
                                    <p className="text-xs">
                                      Próbálja újra később, vagy válasszon másik napra.
                                    </p>
                                  )}
                                </div>
                              ) : (
                                timeSlots.map((slot) => {
                                  const isFull = slot.available_capacity <= 0;
                                  const isAlmostFull = slot.utilization_percent >= 80 && !isFull;
                                  
                                  return (
                                    <SelectItem 
                                      key={`${slot.date}|${slot.timeslot}`}
                                      value={`${slot.date}|${slot.timeslot}`}
                                      disabled={isFull}
                                      className={isFull ? "opacity-50" : ""}
                                    >
                                      <span className="flex items-center gap-2">
                                        {formatTimeSlot(slot.date, slot.timeslot)}
                                        {isFull ? (
                                          <Badge variant="destructive" className="text-xs">Tele</Badge>
                                        ) : isAlmostFull ? (
                                          <Badge className="text-xs bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Majdnem tele!</Badge>
                                        ) : (
                                          <Badge variant="outline" className="text-xs">{slot.available_capacity} hely</Badge>
                                        )}
                                      </span>
                                    </SelectItem>
                                  );
                                })
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <Separator />
                  
                  {/* Payment Method */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Fizetési mód</Label>
                    <RadioGroup
                      value={formData.payment_method}
                      onValueChange={(value: "cash" | "card") => 
                        setFormData(prev => ({ ...prev, payment_method: value }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="cash" />
                        <Label htmlFor="cash">Készpénz átvételkor</Label>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="card" id="card" />
                        <Label htmlFor="card">Bankkártya átvételkor</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Submit Button with Helpful Feedback */}
                  <div className="space-y-2">
                    {(hasMultipleDailyDates() || (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time))) && (
                      <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                        {hasMultipleDailyDates() && (
                          <p>• Távolítsa el a különböző dátumú napi ajánlatokat</p>
                        )}
                        {formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time) && (
                          <p>• Válasszon időpontot az átvételhez</p>
                        )}
                      </div>
                    )}
                    
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
                      disabled={
                        isSubmitting || 
                        hasMultipleDailyDates() ||
                        (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time))
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Rendelés leadása...
                        </>
                      ) : (
                        `Rendelés leadása - ${cart.total.toLocaleString()} Ft`
                      )}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Checkout;