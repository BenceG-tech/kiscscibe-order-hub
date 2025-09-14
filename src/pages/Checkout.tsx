import { useState, useEffect } from "react";
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
  
  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate("/etlap");
      return;
    }
    
    fetchTimeSlots();
  }, [cart.items.length, navigate]);
  
  const fetchTimeSlots = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const { data, error } = await supabase
        .from("capacity_slots")
        .select("date, timeslot, max_orders, booked_orders")
        .gte("date", today.toISOString().split("T")[0])
        .lte("date", nextWeek.toISOString().split("T")[0])
        .order("date")
        .order("timeslot");
      
      if (error) throw error;
      
      const slots = data?.map(slot => ({
        date: slot.date,
        timeslot: slot.timeslot,
        available_capacity: slot.max_orders - slot.booked_orders
      })).filter(slot => slot.available_capacity > 0) || [];
      
      setTimeSlots(slots);
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
  };
  
  const isBusinessHours = () => {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Monday-Friday: 7:00-16:00, Saturday-Sunday: closed
    if (currentDay === 0 || currentDay === 6) return false; // Weekend closed
    return currentHour >= 7 && currentHour < 16; // Monday-Friday
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
    
    // Validate pickup time is not in the past
    if (formData.pickup_type === 'scheduled' && formData.pickup_time) {
      const selectedTime = new Date(formData.pickup_time);
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
          pickup_time: formData.pickup_type === "asap" ? null : 
            new Date(`${formData.pickup_date}T${formData.pickup_time}`).toISOString(),
          items: cart.items.map(item => ({
            item_id: item.id,
            name_snapshot: item.name,
            qty: item.quantity,
            unit_price_huf: item.price_huf,
            daily_type: item.daily_type,
            daily_date: item.daily_date,
            daily_id: item.daily_id,
            modifiers: item.modifiers.map(mod => ({
              label_snapshot: mod.label,
              price_delta_huf: mod.price_delta_huf
            }))
          }))
        }
      });
      
      if (error) throw error;
      
      // Clear cart and redirect to confirmation
      clearCart();
      navigate(`/order-confirmation?code=${data.order_code}`);
      
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
                    
                    <RadioGroup
                      value={formData.pickup_type}
                      onValueChange={(value: "asap" | "scheduled") => 
                        setFormData(prev => ({ ...prev, pickup_type: value }))
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="asap" id="asap" disabled={!canOrderToday} />
                        <Label htmlFor="asap" className={!canOrderToday ? "text-muted-foreground" : ""}>
                          Minél hamarabb (15-20 perc)
                          {!canOrderToday && (
                            <Badge variant="secondary" className="ml-2">Zárva</Badge>
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
                              {timeSlots.map((slot) => (
                                <SelectItem 
                                  key={`${slot.date}|${slot.timeslot}`}
                                  value={`${slot.date}|${slot.timeslot}`}
                                >
                                  {formatTimeSlot(slot.date, slot.timeslot)} 
                                  <Badge variant="outline" className="ml-2">
                                    {slot.available_capacity} hely
                                  </Badge>
                                </SelectItem>
                              ))}
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
                  
                  <Button
                    type="submit"
                    className="w-full bg-gradient-to-r from-primary to-primary-glow hover:shadow-warm"
                    disabled={isSubmitting || (formData.pickup_type === "scheduled" && (!formData.pickup_date || !formData.pickup_time))}
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