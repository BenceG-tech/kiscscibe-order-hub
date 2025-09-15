import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "./AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoadingSpinner } from "@/components/ui/loading";
import { useToast } from "@/components/ui/use-toast";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Phone,
  Calendar,
  MapPin,
  CreditCard,
  Package
} from "lucide-react";

interface OrderItem {
  id: string;
  name_snapshot: string;
  qty: number;
  unit_price_huf: number;
  line_total_huf: number;
}

interface Order {
  id: string;
  code: string;
  name: string;
  phone: string;
  total_huf: number;
  status: string;
  payment_method: string;
  pickup_time: string;
  created_at: string;
  notes?: string;
  items?: OrderItem[];
}

const OrdersManagement = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription with sound notification
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders'
        },
        (payload) => {
          console.log('New order received:', payload);
          
          // Play notification sound
          try {
            const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+H0u2oeBDSG0fPTgjMGKm++7qV5Nw0');
            audio.play().catch(e => console.log('Audio play failed:', e));
          } catch (e) {
            console.log('Audio not supported:', e);
          }
          
          // Show toast notification
          toast({
            title: "Új rendelés érkezett!",
            description: `Rendelés kód: ${payload.new.code}`,
            duration: 5000,
          });
          
          fetchOrders();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [toast]);

  const fetchOrders = async () => {
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      toast({
        title: "Hiba",
        description: "Nem sikerült betölteni a rendeléseket",
        variant: "destructive"
      });
      return;
    }

    // Fetch order items for each order
    const ordersWithItems = await Promise.all(
      (ordersData || []).map(async (order) => {
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('id, name_snapshot, qty, unit_price_huf, line_total_huf')
          .eq('order_id', order.id);
        
        return {
          ...order,
          items: itemsData || []
        };
      })
    );

    setOrders(ordersWithItems);
    setLoading(false);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase
      .from('orders')
      .update({ status: newStatus })
      .eq('id', orderId);

    if (error) {
      toast({
        title: "Hiba",
        description: "Nem sikerült frissíteni a rendelés állapotát",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Siker",
      description: "Rendelés állapota frissítve",
    });

    // Refresh orders to update UI
    fetchOrders();
  };

  const getStatusConfig = (status: string) => {
    const configs = {
      new: { label: "Új", color: "bg-blue-100 text-blue-800", icon: Clock },
      preparing: { label: "Készítés alatt", color: "bg-yellow-100 text-yellow-800", icon: Package },
      ready: { label: "Kész", color: "bg-green-100 text-green-800", icon: CheckCircle },
      completed: { label: "Átvéve", color: "bg-gray-100 text-gray-800", icon: CheckCircle },
      cancelled: { label: "Lemondva", color: "bg-red-100 text-red-800", icon: XCircle },
    };
    return configs[status as keyof typeof configs] || configs.new;
  };

  const filterOrders = (status: string) => {
    if (status === "all") return orders;
    return orders.filter(order => order.status === status);
  };

  const getOrderCounts = () => {
    return {
      new: orders.filter(o => o.status === 'new').length,
      preparing: orders.filter(o => o.status === 'preparing').length,
      ready: orders.filter(o => o.status === 'ready').length,
      all: orders.length
    };
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-12">
          <LoadingSpinner className="h-8 w-8" />
        </div>
      </AdminLayout>
    );
  }

  const counts = getOrderCounts();

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Rendelések kezelése</h1>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              Összesen: {orders.length} rendelés
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="new" className="relative">
              Új rendelések
              {counts.new > 0 && (
                <Badge className="ml-2 bg-blue-600 text-white">{counts.new}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="preparing" className="relative">
              Készítés alatt
              {counts.preparing > 0 && (
                <Badge className="ml-2 bg-yellow-600 text-white">{counts.preparing}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready" className="relative">
              Kész
              {counts.ready > 0 && (
                <Badge className="ml-2 bg-green-600 text-white">{counts.ready}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Összes</TabsTrigger>
          </TabsList>

          {["new", "preparing", "ready", "all"].map((tabValue) => (
            <TabsContent key={tabValue} value={tabValue} className="mt-6">
              <div className="grid gap-4">
                {filterOrders(tabValue === "all" ? "" : tabValue).map((order) => {
                  const statusConfig = getStatusConfig(order.status);
                  const StatusIcon = statusConfig.icon;

                  return (
                    <Card key={order.id} className="hover:shadow-lg transition-all duration-300">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="flex items-center gap-3">
                              <span className="text-lg">#{order.code}</span>
                              <Badge className={statusConfig.color}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {statusConfig.label}
                              </Badge>
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              <Calendar className="h-4 w-4 inline mr-1" />
                              {new Date(order.created_at).toLocaleString('hu-HU')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {order.total_huf} Ft
                            </p>
                            <p className="text-sm text-muted-foreground">
                              <CreditCard className="h-4 w-4 inline mr-1" />
                              {order.payment_method === 'cash' ? 'Készpénz' : 'Kártya'}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="pt-0">
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                          <div>
                            <h4 className="font-semibold mb-2">Vevő adatok:</h4>
                            <p className="text-sm">
                              <strong>Név:</strong> {order.name}
                            </p>
                            <p className="text-sm">
                              <Phone className="h-4 w-4 inline mr-1" />
                              {order.phone}
                            </p>
                            {order.pickup_time && (
                              <p className="text-sm">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Átvétel: {new Date(order.pickup_time).toLocaleString('hu-HU')}
                              </p>
                            )}
                          </div>
                          
                          {order.notes && (
                            <div>
                              <h4 className="font-semibold mb-2">Megjegyzés:</h4>
                              <p className="text-sm bg-muted p-2 rounded">
                                {order.notes}
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Order Items */}
                        {order.items && order.items.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold mb-2">Rendelt tételek:</h4>
                            <div className="bg-muted/50 p-3 rounded space-y-2">
                              {order.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                  <div>
                                    <span className="font-medium">{item.name_snapshot}</span>
                                    <span className="text-muted-foreground ml-2">× {item.qty}</span>
                                  </div>
                                  <span className="font-medium">{item.line_total_huf} Ft</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 flex-wrap">
                          {order.status === 'new' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'preparing')}
                              className="bg-yellow-600 hover:bg-yellow-700"
                            >
                              Készítés megkezdése
                            </Button>
                          )}
                          
                          {order.status === 'preparing' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'ready')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Kész jelölése
                            </Button>
                          )}
                          
                          {order.status === 'ready' && (
                            <Button
                              size="sm"
                              onClick={() => updateOrderStatus(order.id, 'completed')}
                              className="bg-gray-600 hover:bg-gray-700"
                            >
                              Átvéve
                            </Button>
                          )}
                          
                          {['new', 'preparing'].includes(order.status) && (
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => updateOrderStatus(order.id, 'cancelled')}
                            >
                              Lemondás
                            </Button>
                          )}
                          
                          <Button size="sm" variant="outline" asChild>
                            <a href={`tel:${order.phone}`}>
                              <Phone className="h-4 w-4 mr-1" />
                              Hívás
                            </a>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
                
                {filterOrders(tabValue === "all" ? "" : tabValue).length === 0 && (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">
                        Nincs {tabValue !== "all" ? "ilyen állapotú" : ""} rendelés
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default OrdersManagement;