import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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
import { ArrowLeft, Check, Clock, CreditCard, ShoppingCart, User, FileText, AlertTriangle, RefreshCw } from "lucide-react";
import { persistCheckoutSnapshot, useAbandonedCartTracking } from "@/hooks/useAbandonedCartTracking";

const DEV = import.meta.env.DEV;

// ─── Opening-hours business rules (single source of truth) ─────────────────
// Mon–Fri only. Weekends closed. Same-day orders accepted only until 15:30.
//   Breakfast pickup window: 07:00 – 10:00
//   Lunch pickup window:     10:30 – 16:00
const TODAY_ORDER_CUTOFF_MIN = 15 * 60 + 30;
const BREAKFAST_START_MIN = 7 * 60;
const BREAKFAST_END_MIN = 10 * 60;
const LUNCH_START_MIN = 10 * 60 + 30;
const LUNCH_END_MIN = 16 * 60;

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

const normalizeHungarianPhone = (v: string): string => {
  let digits = v.replace(/\D/g, "");
  if (digits.startsWith("0036")) digits = digits.slice(4);
  else if (digits.startsWith("36") && digits.length >= 10) digits = digits.slice(2);
  if (digits.startsWith("06")) digits = digits.slice(2);
  else if (digits.startsWith("0")) digits = digits.slice(1);
  return digits;
};

const validatePhone = (v: string): string | undefined => {
  if (!v) return undefined;
  const digits = normalizeHungarianPhone(v);
  if (digits.length < 8 || digits.length > 9) return "Kérjük, adj meg egy érvényes telefonszámot (pl. 30 123 4567 vagy 06 30 123 4567)";
  return undefined;
};

const validateEmail = (v: string): string | undefined => {
  if (!v) return undefined;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return "Kérjük, adj meg egy érvényes email címet";
  return undefined;
};

const Checkout = () => {
  const { state: cart, clearCart, applyCoupon, removeCoupon, isCartLoaded } = useCart();
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
    payment_method: "cash" as "cash" | "pos"
  });
  
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponMessage, setCouponMessage] = useState<{ success: boolean; text: string } | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Hard duplicate-submit lock: gates the very first line of handleSubmit,
  // BEFORE React re-render can disable the button. Prevents duplicate orders
  // on double-tap, slow networks, or race conditions.
  const submissionLockRef = useRef(false);
  // Stable per-attempt idempotency bucket. Reused if the previous attempt
  // failed on network/timeout so the backend dedupes the retry.
  const idempotencyBucketRef = useRef<number | null>(null);

  // Track abandoned carts while the user fills in checkout
  const cartSessionId = useAbandonedCartTracking({
    cartItems: cart.items,
    totalHuf: cart.totalAfterDiscount || cart.total,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    step: "details",
  });

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
  const requiredFieldsMissing = !formData.name || !formData.phone;

  const getBudapestNowParts = () => {
    const now = new Date();
    const date = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Budapest",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(now);
    const time = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Budapest",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(now);
    return { date, time };
  };

  const minutesFromTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  const getDayOfWeekFromDateStr = (dateStr: string) => {
    const [year, month, day] = dateStr.split("-").map(Number);
    return new Date(Date.UTC(year, month - 1, day)).getUTCDay();
  };

  // Does this cart include only breakfast items? Then use breakfast pickup window.
  // Otherwise use lunch window (or both if mixed - defensively allow lunch).
  const cartIsBreakfastOnly = useMemo(() => {
    if (cart.items.length === 0) return false;
    return cart.items.every((it) => (it as any).is_breakfast === true);
  }, [cart.items]);

  const isWithinPickupWindow = (date: string, time?: string) => {
    const dayOfWeek = getDayOfWeekFromDateStr(date);
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;
    if (!time) return true;
    const mins = minutesFromTime(time);
    if (cartIsBreakfastOnly) {
      return mins >= BREAKFAST_START_MIN && mins <= BREAKFAST_END_MIN;
    }
    // Default (lunch / mixed): allow the full lunch window.
    return mins >= LUNCH_START_MIN && mins <= LUNCH_END_MIN;
  };

  // Backwards-compat alias used elsewhere in this file
  const isBudapestLunchWindow = isWithinPickupWindow;

  const canOrderForToday = () => {
    const bp = getBudapestNowParts();
    return minutesFromTime(bp.time) < TODAY_ORDER_CUTOFF_MIN;
  };

  const canUseAsap = () => {
    const bp = getBudapestNowParts();
    if (!isWithinPickupWindow(bp.date, bp.time)) return false;
    if (!canOrderForToday()) return false;
    if (dailyDates.length === 0) return true;
    return dailyDates.length === 1 && dailyDates[0] === bp.date;
  };
  
  // Debug: log which condition blocks the submit button
  useEffect(() => {
    const isDisabled = isSubmitting || hasMultipleDailyDates() || hasValidationErrors || requiredFieldsMissing || (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time));
    if (isDisabled) {
      if (DEV) console.log('[Checkout] Submit blocked:', {
        isSubmitting,
        hasMultipleDailyDates: hasMultipleDailyDates(),
        hasValidationErrors,
        fieldErrors,
        requiredFieldsMissing,
        pickupType: formData.pickup_type,
        pickupDate: formData.pickup_date,
        pickupTime: formData.pickup_time,
      });
    }
  }, [isSubmitting, hasValidationErrors, requiredFieldsMissing, formData]);
  
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

    // Closed on weekends (Saturday=6, Sunday=0)
    if (dayOfWeek === 0 || dayOfWeek === 6) return [];

    const slots: TimeSlot[] = [];
    // Lunch service: 10:30 – 15:00, every 30 minutes
    const startMinutes = 10 * 60 + 30;
    const endMinutes = 15 * 60;
    for (let m = startMinutes; m <= endMinutes; m += 30) {
      const hour = Math.floor(m / 60);
      const minute = m % 60;
      const timeString = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`;
      slots.push({
        date,
        timeslot: timeString,
        available_capacity: 8,
        max_capacity: 8,
        utilization_percent: 0
      });
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
          
          const bp = getBudapestNowParts();
          if (slot.date < bp.date) return false;
          if (slot.date === bp.date) {
            const slotMinutes = minutesFromTime(slot.timeslot);
            // 10-min lead time. Backend still validates 10:30–15:00 window, so
            // any slot inside business hours + 10 min lead is safe.
            const minAllowedMinutes = minutesFromTime(bp.time) + 10;
            if (slotMinutes <= minAllowedMinutes) return false;
          }
          
          return true;
        })
        .sort((a, b) => {
          if (a.date !== b.date) return a.date.localeCompare(b.date);
          return a.timeslot.localeCompare(b.timeslot);
        });
      
      setTimeSlots(finalSlots);
      
      const availableSlots = finalSlots.filter(s => s.available_capacity > 0);
      if (availableSlots.length > 0 && !formData.pickup_time) {
        // If there is exactly one daily-item date in cart, force the auto-selected
        // slot to that date so pickup_date can never diverge from the daily date.
        const forcedDate = dailyDates.length === 1 ? dailyDates[0] : null;
        const firstSlot = forcedDate
          ? (availableSlots.find(s => s.date === forcedDate) || availableSlots[0])
          : availableSlots[0];
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
    if (isCartLoaded && cart.items.length === 0) {
      navigate("/etlap");
      return;
    }
    
    if (dailyDates.length > 0 && formData.pickup_type === "asap" && !canUseAsap()) {
      setFormData(prev => ({ ...prev, pickup_type: "scheduled" }));
    }
    
    fetchTimeSlots();
  }, [isCartLoaded, cart.items.length, navigate, dailyDates, fetchTimeSlots, formData.pickup_type]);

  const getDailyItemDates = () => dailyDates;

  const hasMultipleDailyDates = () => {
    const dailyDates = getDailyItemDates();
    return dailyDates.length > 1;
  };

  const getPickupConstraint = () => {
    const dailyDates = getDailyItemDates();
    if (dailyDates.length === 0) return null;
    
    if (dailyDates.length === 1) {
      const date = makeDate(dailyDates[0]);
      return `Napi ajánlat/menü miatt csak ${date.toLocaleDateString("hu-HU", {
        year: "numeric", 
        month: "long", 
        day: "numeric" 
      })}-án lehet átvenni`;
    }
    
    return "Különböző dátumú napi ajánlatok/menük miatt korlátozott időpontok";
  };

  const isBusinessHours = () => {
    return canUseAsap();
  };
  
  const formatTimeSlot = (date: string, time: string) => {
    const dateObj = makeDate(date);
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

    const normalizedForTracking = normalizeHungarianPhone(formData.phone);
    const trackingPhone = normalizedForTracking ? `+36${normalizedForTracking}` : formData.phone;

    await persistCheckoutSnapshot({
      sessionId: cartSessionId,
      cartItems: cart.items,
      totalHuf: cart.totalAfterDiscount || cart.total,
      name: formData.name,
      phone: trackingPhone,
      email: formData.email,
      step: "submit_attempt",
    });

    const persistValidationBlock = async (message: string) => {
      await persistCheckoutSnapshot({
        sessionId: cartSessionId,
        cartItems: cart.items,
        totalHuf: cart.totalAfterDiscount || cart.total,
        name: formData.name,
        phone: trackingPhone,
        email: formData.email,
        step: "validation_blocked",
        errorMessage: message,
      });
    };

    // Mark all fields touched and run validation
    setTouched({ name: true, phone: true, email: true });
    const nameErr = validateName(formData.name);
    const phoneErr = validatePhone(formData.phone);
    const emailErr = validateEmail(formData.email);

    // Required-field checks with explicit user feedback
    const missing: string[] = [];
    if (!formData.name) missing.push("Név");
    if (!formData.phone) missing.push("Telefonszám");

    if (missing.length > 0) {
      const message = `Kérjük töltsd ki: ${missing.join(", ")}`;
      await persistValidationBlock(message);
      toast({
        title: "Hiányzó adatok",
        description: message,
        variant: "destructive",
      });
      return;
    }

    if (nameErr || phoneErr || emailErr) {
      setFieldErrors({ name: nameErr, phone: phoneErr, email: emailErr });
      await persistValidationBlock(nameErr || phoneErr || emailErr || "Hibás adatok");
      toast({
        title: "Hibás adatok",
        description: nameErr || phoneErr || emailErr,
        variant: "destructive",
      });
      return;
    }

    if (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time)) {
      await persistValidationBlock("Nincs kiválasztva átvételi időpont");
      toast({
        title: "Válassz időpontot",
        description: "Az átvételhez kérjük válassz egy elérhető időpontot a listából.",
        variant: "destructive",
      });
      return;
    }

    
    if (DEV) console.log('=== RENDELÉS LEADÁS DEBUG ===', {
      itemCount: cart.items.length,
      dailyDates,
      multipleDailyDates: hasMultipleDailyDates(),
      businessHours: isBusinessHours(),
    });
    
    if (hasMultipleDailyDates()) {
      await persistValidationBlock("Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre");
      toast({
        title: "Hiba",
        description: "Különböző dátumú napi ajánlatok/menük nem rendelhetőek egyszerre",
        variant: "destructive"
      });
      return;
    }
    
    if (formData.pickup_type === 'scheduled' && formData.pickup_date && formData.pickup_time) {
      const bp = getBudapestNowParts();
      const selectedMinutes = minutesFromTime(formData.pickup_time);
      const selectedIsPast =
        formData.pickup_date < bp.date ||
        (formData.pickup_date === bp.date && selectedMinutes <= minutesFromTime(bp.time));
      
      if (selectedIsPast) {
        await persistValidationBlock("Múltbeli időpontra nem lehet rendelni");
        toast({
          title: "Hiba",
          description: "Múltbeli időpontra nem lehet rendelni",
          variant: "destructive"
        });
        return;
      }
      
      const dayOfWeek = getDayOfWeekFromDateStr(formData.pickup_date);
      
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        await persistValidationBlock("Hétvégén zárva tartunk");
        toast({
          title: "Hiba", 
          description: "Hétvégén zárva tartunk",
          variant: "destructive"
        });
        return;
      }
      
      if (!isBudapestLunchWindow(formData.pickup_date, formData.pickup_time)) {
        await persistValidationBlock("A kiválasztott időpont nyitvatartási időn kívül esik (10:30–15:00)");
        toast({
          title: "Hiba",
          description: "A kiválasztott időpont nyitvatartási időn kívül esik (10:30–15:00)",
          variant: "destructive"
        });
        return;
      }
    }

    setIsSubmitting(true);

    let normalizedPhone = "";
    let submitBody: Record<string, any> | null = null;
    let timeoutId: number | undefined;

    try {
      if (DEV) console.log('Calling submit-order edge function...');
      normalizedPhone = normalizeHungarianPhone(formData.phone);
      submitBody = {
        customer: {
          name: formData.name,
          phone: `+36${normalizedPhone}`,
          email: formData.email || null,
          notes: (tableNumber ? `[Asztal: ${tableNumber}] ` : '') + (formData.notes || '') || null
        },
        payment_method: formData.payment_method,
        pickup_date: formData.pickup_type === "asap"
          ? null
          : (dailyDates.length === 1 ? dailyDates[0] : formData.pickup_date),
        pickup_time_slot: formData.pickup_type === "asap" ? null : formData.pickup_time,
        coupon_code: cart.coupon?.code || null,
        session_id: cartSessionId,
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
      };

      const invokePromise = supabase.functions.invoke("submit-order", { body: submitBody });
      invokePromise.catch(() => undefined);

      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new Error("A rendelés leadása túl sokáig tart. A rendelési kísérletet rögzítettük, az étterem látni fogja."));
        }, 30000);
      });

      const { data, error } = await Promise.race([invokePromise, timeoutPromise]);
      if (timeoutId) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
      
      if (DEV) console.log('Edge function response:', { ok: !error, hasData: Boolean(data) });
      
      if (error) throw error;
      
      clearCart();
      navigate(`/order-confirmation?code=${data.order_code}&phone=${encodeURIComponent(`+36${normalizedPhone}`)}&email=${encodeURIComponent(formData.email || "")}`);
      
    } catch (error: any) {
      console.error("Order submission error:", error);
      await persistCheckoutSnapshot({
        sessionId: cartSessionId,
        cartItems: cart.items,
        totalHuf: cart.totalAfterDiscount || cart.total,
        name: formData.name,
        phone: normalizedPhone ? `+36${normalizedPhone}` : formData.phone,
        email: formData.email,
        step: "submit_failed",
        errorMessage: error?.message || "Ismeretlen rendelésleadási hiba",
      });
      toast({
        title: "Hiba a rendelés leadásakor",
        description: error.message || "A rendelési kísérletet rögzítettük. Kérjük próbáld újra, vagy jelezd az étteremnek.",
        variant: "destructive"
      });
    } finally {
      if (timeoutId) window.clearTimeout(timeoutId);
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
                          📅 {makeDate(item.daily_date).toLocaleDateString("hu-HU", { month: "short", day: "numeric" })}
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
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
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
                          inputMode="tel"
                          autoComplete="tel"
                          value={formData.phone}
                          onChange={(e) => {
                            // Only keep digits/spaces; then silently strip the
                            // country code / trunk prefix the user may have typed
                            // in addition to the visible "+36" chip.
                            let val = e.target.value.replace(/[^\d\s]/g, '');
                            const digitsOnly = val.replace(/\s/g, '');
                            if (digitsOnly.startsWith('0036')) val = val.replace(/^\s*0036\s?/, '');
                            else if (digitsOnly.startsWith('36') && digitsOnly.length > 9) val = val.replace(/^\s*36\s?/, '');
                            else if (digitsOnly.startsWith('06')) val = val.replace(/^\s*06\s?/, '');
                            setFormData(prev => ({ ...prev, phone: val }));
                          }}
                          onBlur={() => handleBlur("phone")}
                          required
                          placeholder="30 123 4567"
                          className="rounded-l-none"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">Csak a számokat írd, országhívó nem kell (pl. 30 123 4567).</p>
                      {fieldErrors.phone && (
                        <p className="text-sm text-destructive mt-1">{fieldErrors.phone}</p>
                      )}
                    </div>
                    
                    <div>
                      <Label htmlFor="email">E-mail cím</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        onBlur={() => handleBlur("email")}
                        placeholder="pelda@email.com (opcionális)"
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
                          disabled={!canUseAsap()} 
                        />
                        <Label htmlFor="asap" className={!canUseAsap() ? "text-muted-foreground" : ""}>
                          Minél hamarabb (15-20 perc)
                          {!canOrderToday && (
                            <Badge variant="secondary" className="ml-2">Zárva</Badge>
                          )}
                          {getDailyItemDates().length > 0 && !canUseAsap() && (
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
                        ) : timeSlots.length === 0 ? (
                          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground space-y-1">
                            <p>Nincs elérhető időpont ehhez a rendeléshez.</p>
                            <p className="text-xs">Próbálja újra később, vagy válasszon másik napra.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <p className="text-sm text-muted-foreground">Válasszon átvételi időpontot:</p>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                              {timeSlots.map((slot) => {
                                const isFull = slot.available_capacity <= 0;
                                const isAlmostFull = slot.utilization_percent >= 80 && !isFull;
                                const isSelected = formData.pickup_date === slot.date && formData.pickup_time === slot.timeslot;
                                return (
                                  <button
                                    type="button"
                                    key={`${slot.date}|${slot.timeslot}`}
                                    disabled={isFull}
                                    onClick={() =>
                                      setFormData(prev => ({
                                        ...prev,
                                        pickup_date: slot.date,
                                        pickup_time: slot.timeslot,
                                      }))
                                    }
                                    className={`flex flex-col items-start gap-1 rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                                      isSelected
                                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                                        : "border-border hover:bg-accent"
                                    } ${isFull ? "opacity-50 cursor-not-allowed" : ""}`}
                                  >
                                    <span className="font-medium">{formatTimeSlot(slot.date, slot.timeslot)}</span>
                                    {isFull ? (
                                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">Tele</Badge>
                                    ) : isAlmostFull ? (
                                      <Badge className="text-[10px] px-1.5 py-0 bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30">Majdnem tele</Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{slot.available_capacity} hely</Badge>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
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
                      onValueChange={(value: "cash" | "pos") => 
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
                          <RadioGroupItem value="pos" id="pos" />
                          <Label htmlFor="pos">Bankkártya átvételkor</Label>
                        </div>
                        <p className="text-xs text-muted-foreground ml-6">Bankkártyás fizetés átvételkor</p>
                      </div>
                    </RadioGroup>
                  </div>
                  
                  {/* Submit Button with Helpful Feedback */}
                  <div className="space-y-2">
                    {(hasMultipleDailyDates() || requiredFieldsMissing || hasValidationErrors || (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time))) && (
                      <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg space-y-1">
                        {requiredFieldsMissing && (
                          <p>• Kérjük töltse ki a kötelező mezőket (név, telefon)</p>
                        )}
                        {hasValidationErrors && !requiredFieldsMissing && (
                          <p>• Kérjük javítsa a hibás mezőket</p>
                        )}
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
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <LoadingSpinner className="h-4 w-4 mr-2" />
                          Rendelés feldolgozása…
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
