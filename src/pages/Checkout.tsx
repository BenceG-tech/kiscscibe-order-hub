import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { ArrowLeft, Check, Clock, CreditCard, ShoppingCart, User, FileText } from "lucide-react";

// --- Progress Indicator Component ---
const CheckoutProgress = () => {
  const steps = [
    { label: "Kosár", icon: ShoppingCart, status: "done" as const },
    { label: "Adatok", icon: User, status: "current" as const },
    { label: "Összesítő", icon: FileText, status: "upcoming" as const },
  ];

  return (
    <div className="flex items-center justify-center w-full mb-8">
      {steps.map((step, index) => (
        <div key={step.label} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`flex items-center justify-center w-9 h-9 rounded-full border-2 transition-colors ${
                step.status === "done"
                  ? "bg-green-600 border-green-600 text-white"
                  : step.status === "current"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-muted-foreground/30 bg-muted text-muted-foreground"
              }`}
            >
              {step.status === "done" ? (
                <Check className="h-5 w-5" />
              ) : (
                <step.icon className="h-4 w-4" />
              )}
            </div>
            <span
              className={`mt-1.5 text-xs font-medium ${
                step.status === "done"
                  ? "text-green-600"
                  : step.status === "current"
                  ? "text-primary font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div
              className={`w-12 sm:w-20 h-0.5 mx-2 mt-[-1rem] ${
                step.status === "done" ? "bg-green-600" : "bg-muted-foreground/20"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

interface TimeSlot {
  date: string;
  timeslot: string;
  available_capacity: number;
  max_capacity: number;
  utilization_percent: number;
}

// --- Validation helpers ---
const validateName = (v: string): string | undefined => {
  if (v.length > 0 && v.length < 2) return "A név legalább 2 karakter legyen";
  if (v.length > 100) return "A név legfeljebb 100 karakter lehet";
  return undefined;
};

const validatePhone = (v: string): string | undefined => {
  if (!v) return undefined;
  const digits = v.replace(/\s/g, "");
  if (!/^\d{9}$/.test(digits)) return "Kérjük, adj meg egy érvényes telefonszámot";
  return undefined;
};

const validateEmail = (v: string): string | undefined => {
  if (!v) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Kérjük, adj meg egy érvényes email címet";
  return undefined;
};

const Checkout = () => {
  const { state: cart, clearCart, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tableNumber = searchParams.get('table');
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
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);

  // --- Inline validation state ---
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; phone?: string; email?: string }>({});
  const [touched, setTouched] = useState<{ name?: boolean; phone?: boolean; email?: boolean }>({});

  // Debounced validation
  useEffect(() => {
    const timer = setTimeout(() => {
      const errors: typeof fieldErrors = {};
      if (touched.name) errors.name = validateName(formData.name);
      if (touched.phone) errors.phone = validatePhone(formData.phone);
      if (touched.email) errors.email = validateEmail(formData.email);
      setFieldErrors(errors);
    }, 300);
    return () => clearTimeout(timer);
  }, [formData.name, formData.phone, formData.email, touched]);

  const handleBlur = (field: "name" | "phone" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const hasValidationErrors = Object.values(fieldErrors).some(Boolean);
  const requiredFieldsMissing = !formData.name || !formData.phone || !formData.email;
  
  // Extract daily item dates from cart with useMemo for efficiency
  const dailyDates = useMemo(() => {
    const dailyItems = cart.items.filter(item => item.daily_date);
    const uniqueDates = [...new Set(dailyItems.map(item => item.daily_date))];
    return uniqueDates.filter(Boolean) as string[];
  }, [cart.items]);

  // Safe date creation to avoid timezone issues
  const makeDate = (dateStr: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const generateBusinessHourSlots = (date: string): TimeSlot[] => {
    const slotDate = makeDate(date);
    const dayOfWeek = slotDate.getDay();
    
    if (dayOfWeek === 0) return [];
    
    const slots: TimeSlot[] = [];
    let startHour = 7;
    let endHour = 15;
    
    if (dayOfWeek === 6) {
      startHour = 8;
      endHour = 14;
    }
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
        slots.push({
          date,
          timeslot: timeString,
          available_capacity: 8,
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
      
      const { data: blackoutData } = await supabase
        .from("blackout_dates")
        .select("date")
        .in("date", targetDates);
      
      const blackoutSet = new Set((blackoutData || []).map(b => b.date));
      targetDates = targetDates.filter(d => !blackoutSet.has(d));
      
      let allSlots: TimeSlot[] = [];
      for (const date of targetDates) {
        const dateSlots = generateBusinessHourSlots(date);
        allSlots = [...allSlots, ...dateSlots];
      }
      
      const { data: capacityData, error } = await supabase
        .from("capacity_slots")
        .select("date, timeslot, max_orders, booked_orders, buffer_minutes")
        .in("date", targetDates)
        .order("date")
        .order("timeslot");
      
      if (error) {
        console.error("Error fetching capacity data:", error);
      }
      
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
          
          if (bufferBlockedSlots.has(key)) return false;
          
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

  useEffect(() => {
    if (cart.items.length === 0) {
      navigate("/etlap");
      return;
    }
    
    if (dailyDates.length > 0 && formData.pickup_type === "asap") {
      setFormData(prev => ({ ...prev, pickup_type: "scheduled" }));
    }
    
    fetchTimeSlots();
  }, [cart.items.length, navigate, dailyDates, fetchTimeSlots, formData.pickup_type]);

  const getDailyItemDates = () => dailyDates;

  const hasMultipleDailyDates = () => {
    const dailyDates = getDailyItemDates();
    return dailyDates.length > 1;
  };

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
    const currentDay = now.getDay();
    
    if (currentDay === 0) return false;
    
    if (currentDay >= 1 && currentDay <= 5) {
      return currentHour >= 7 && currentHour < 15;
    } else if (currentDay === 6) {
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

    // Run validation as safety net
    const nameErr = validateName(formData.name);
    const phoneErr = validatePhone(formData.phone);
    const emailErr = validateEmail(formData.email);
    if (nameErr || phoneErr || emailErr) {
      setTouched({ name: true, phone: true, email: true });
      setFieldErrors({ name: nameErr, phone: phoneErr, email: emailErr });
      return;
    }
    
    console.log('=== RENDELÉS LEADÁS DEBUG ===');
    console.log('Form data:', formData);
    console.log('Cart items:', cart.items);
    console.log('Daily dates:', dailyDates);
    console.log('Multiple daily dates:', hasMultipleDailyDates());
    console.log('Business hours:', isBusinessHours());
    
    if (hasMultipleDailyDates()) {
      toast({
        title: "Hiba",
        description: "Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre",
        variant: "destructive"
      });
      return;
    }
    
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
      
      const dayOfWeek = selectedTime.getDay();
      const hour = selectedTime.getHours();
      
      if (dayOfWeek === 0) {
        toast({
          title: "Hiba", 
          description: "Vasárnap zárva tartunk",
          variant: "destructive"
        });
        return;
      }
      
      let isValidTime = false;
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        isValidTime = hour >= 7 && hour < 15;
      } else if (dayOfWeek === 6) {
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
      
      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: {
          customer: {
            name: formData.name,
            phone: `+36${formData.phone.replace(/\s/g, '')}`,
            email: formData.email,
            notes: (tableNumber ? `[Asztal: ${tableNumber}] ` : '') + (formData.notes || '') || null
          },
          payment_method: formData.payment_method,
          pickup_date: formData.pickup_type === "asap" ? null : formData.pickup_date,
          pickup_time_slot: formData.pickup_type === "asap" ? null : formData.pickup_time,
          coupon_code: cart.coupon?.code || null,
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
    return null;
  }
  
  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Progress Indicator */}
          <CheckoutProgress />

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
                      {item.sides && item.sides.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          Köret: {item.sides.map(side => side.name).join(', ')}
                        </p>
                      )}
                      {item.daily_date && (
                        <p className="text-xs text-muted-foreground">
                          📅 {new Date(item.daily_date).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
                        </p>
                      )}
                      <p className="text-sm">Mennyiség: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {((item.price_huf + item.modifiers.reduce((sum, mod) => sum + mod.price_delta_huf, 0) + (item.sides?.reduce((sum, s) => sum + s.price_huf, 0) || 0)) * item.quantity).toLocaleString()} Ft
                      </p>
                    </div>
                  </div>
                ))}
                
                <Separator />
                
                {/* Coupon Section */}
                <div className="space-y-2">
                  {cart.coupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-950/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="text-sm font-medium text-green-800 dark:text-green-200">
                          🎟️ Kupon: <span className="font-mono">{cart.coupon.code}</span>
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-400">
                          -{cart.coupon.discount_huf.toLocaleString()} Ft kedvezmény
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={removeCoupon} className="text-destructive">
                        ✕
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Kupon kód"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                        className="uppercase font-mono"
                      />
                      <Button
                        variant="outline"
                        disabled={!couponCode.trim() || couponLoading}
                        onClick={async () => {
                          setCouponLoading(true);
                          setCouponMessage(null);
                          const result = await applyCoupon(couponCode);
                          setCouponMessage({ success: result.success, text: result.message });
                          if (result.success) setCouponCode("");
                          setCouponLoading(false);
                        }}
                      >
                        {couponLoading ? "..." : "Alkalmaz"}
                      </Button>
                    </div>
                  )}
                  {couponMessage && (
                    <p className={`text-xs ${couponMessage.success ? 'text-green-600' : 'text-destructive'}`}>
                      {couponMessage.text}
                    </p>
                  )}
                </div>
                
                <Separator />
                
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Végösszeg:</span>
                  <div className="text-right">
                    {cart.coupon && (
                      <span className="text-sm line-through text-muted-foreground mr-2">{cart.total.toLocaleString()} Ft</span>
                    )}
                    <span className="text-primary">{cart.totalAfterDiscount.toLocaleString()} Ft</span>
                  </div>
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
                        onBlur={() => handleBlur("name")}
                        required
                        placeholder="Teljes név"
                      />
                      {fieldErrors.name && (
                        <p className="text-sm text-destructive mt-1">{fieldErrors.name}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="phone">Telefonszám *</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-input bg-muted text-muted-foreground text-sm font-medium">
                          +36
                        </span>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^\d\s]/g, '');
                            setFormData(prev => ({ ...prev, phone: val }));
                          }}
                          onBlur={() => handleBlur("phone")}
                          required
                          placeholder="30 123 4567"
                          className="rounded-l-none"
                        />
                      </div>
                      {fieldErrors.phone && (
                        <p className="text-sm text-destructive mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail cím *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        onBlur={() => handleBlur("email")}
                        required
                        placeholder="pelda@email.com"
                      />
                      {fieldErrors.email && (
                        <p className="text-sm text-destructive mt-1">{fieldErrors.email}</p>
                      )}
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
                    
                    {getPickupConstraint() && (
                      <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3">
                        <p className="text-sm text-orange-800 dark:text-orange-200 font-medium">
                          ℹ️ {getPickupConstraint()}
                        </p>
                      </div>
                    )}
                    
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
                      <div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="cash" id="cash" />
                          <Label htmlFor="cash">Készpénz átvételkor</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">Fizetés átvételkor a helyszínen</p>
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card">Bankkártya átvételkor</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">Bankkártyás fizetés átvételkor</p>
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
                        hasValidationErrors ||
                        requiredFieldsMissing ||
                        (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time))
                      }
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Rendelés leadása...
                        </>
                      ) : (
                        `Rendelés leadása - ${cart.totalAfterDiscount.toLocaleString()} Ft`
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
