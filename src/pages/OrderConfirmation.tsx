import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ModernNavigation from "@/components/ModernNavigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, MapPin, Clock, ShoppingCart, Printer } from "lucide-react";
import { useRestaurantSettings, formatOpeningHoursOneLiner } from "@/hooks/useRestaurantSettings";
import FavoriteOrderButton from "@/components/FavoriteOrderButton";
import type { FavoriteOrderItem } from "@/hooks/useFavoriteOrders";

interface OrderItemOption {
  id: string;
  label_snapshot: string;
  option_type: string | null;
  price_delta_huf: number;
}

interface Order {
  id: string;
  code: string;
  name: string;
  phone: string;
  pickup_time: string;
  total_huf: number;
  status: string;
  notes?: string;
  created_at: string;
}

interface OrderItem {
  id: string;
  name_snapshot: string;
  unit_price_huf: number;
  qty: number;
  line_total_huf: number;
  options?: OrderItemOption[];
}

const OrderConfirmation = () => {
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const orderCode = searchParams.get('code');
  const { openingHours, address } = useRestaurantSettings();

  useEffect(() => {
    if (orderCode) {
      fetchOrder();
    }
  }, [orderCode]);

  const fetchOrder = async () => {
    if (!orderCode) return;

    try {
      setLoading(true);
      
      const phone = searchParams.get('phone');
      if (!phone) {
        console.error('Phone number missing from URL parameters');
        setLoading(false);
        return;
      }

      const { data: orderData, error: orderError } = await supabase
        .rpc('get_customer_order_secure', {
          order_code: orderCode,
          customer_phone: phone
        });

      if (orderError || !orderData || orderData.length === 0) {
        console.error('Error fetching order or order not found:', orderError);
        setOrder(null);
        setLoading(false);
        return;
      }

      const order = orderData[0];
      setOrder(order);
      
      const { data: itemsData, error: itemsError } = await supabase
        .from('order_items')
        .select('*, order_item_options(*)')
        .eq('order_id', order.id);

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        return;
      }

      const mappedItems: OrderItem[] = (itemsData || []).map((item: any) => ({
        id: item.id,
        name_snapshot: item.name_snapshot,
        unit_price_huf: item.unit_price_huf,
        qty: item.qty,
        line_total_huf: item.line_total_huf,
        options: (item.order_item_options || []).filter(
          (opt: any) => opt.option_type !== 'daily_meta'
        ),
      }));

      setOrderItems(mappedItems);
    } catch (error) {
      console.error('Error fetching order:', error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'new': return 'Új rendelés';
      case 'prepping': return 'Készítés alatt';
      case 'ready': return 'Átvehető';
      case 'completed': return 'Kész';
      case 'cancelled': return 'Lemondva';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'prepping': return 'bg-yellow-100 text-yellow-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatPickupTime = (timeString: string) => {
    const date = new Date(timeString);
    return date.toLocaleString('hu-HU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const mapsQuery = encodeURIComponent(address.full);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNavigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <ModernNavigation />
        <div className="pt-20 pb-12">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Card className="shadow-soft border-primary/20">
              <CardContent className="p-12">
                <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-6 flex items-center justify-center">
                  <span className="text-2xl">❌</span>
                </div>
                <h1 className="text-2xl font-bold mb-4 text-destructive">
                  Rendelés nem található
                </h1>
                <p className="text-muted-foreground mb-8">
                  A megadott rendelési kód nem található a rendszerben.
                </p>
                <Button asChild>
                  <Link to="/etlap">
                    Új rendelés leadása
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ModernNavigation />
      
      <div className="pt-20 pb-12">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Success Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-green-100 rounded-full mx-auto mb-6 flex items-center justify-center">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold mb-4 text-green-700">
              Rendelés leadva!
            </h1>
            <p className="text-xl text-muted-foreground">
              Köszönjük a rendelést! A pultnál a rendelési kódot mondd be.
            </p>
          </div>

          {/* Order Code */}
          <Card className="mb-6 border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-sm font-medium text-muted-foreground mb-2">
                Rendelési kód
              </h2>
              <div className="text-4xl font-bold text-primary mb-4">
                #{order.code}
              </div>
              <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                {getStatusText(order.status)}
              </Badge>
            </CardContent>
          </Card>

          {/* Order Details */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rendelés részletei</h3>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Átvételi idő</p>
                    <p className="text-sm text-muted-foreground">
                      {order.pickup_time ? formatPickupTime(order.pickup_time) : 'Hamarosan'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 text-muted-foreground flex items-center justify-center">👤</span>
                  <div>
                    <p className="font-medium">Név</p>
                    <p className="text-sm text-muted-foreground">{order.name}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="h-5 w-5 text-muted-foreground flex items-center justify-center">📞</span>
                  <div>
                    <p className="font-medium">Telefon</p>
                    <p className="text-sm text-muted-foreground">{order.phone}</p>
                  </div>
                </div>

                {order.notes && (
                  <div className="flex items-start gap-3">
                    <span className="h-5 w-5 text-muted-foreground flex items-center justify-center mt-0.5">📝</span>
                    <div>
                      <p className="font-medium">Megjegyzés</p>
                      <p className="text-sm text-muted-foreground">{order.notes}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Rendelt tételek</h3>
              <div className="space-y-3">
                {orderItems.map((item) => (
                  <div key={item.id} className="py-2 border-b border-muted last:border-0">
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium">{item.name_snapshot}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.unit_price_huf} Ft × {item.qty} db
                        </p>
                      </div>
                      <p className="font-semibold">
                        {item.line_total_huf} Ft
                      </p>
                    </div>
                    {item.options && item.options.length > 0 && (
                      <div className="mt-1 ml-4 space-y-0.5">
                        {item.options.map((opt) => (
                          <p key={opt.id} className="text-xs text-muted-foreground">
                            ↳ {opt.label_snapshot}
                            {opt.price_delta_huf > 0 && (
                              <span className="ml-1 text-primary font-medium">
                                (+{opt.price_delta_huf} Ft)
                              </span>
                            )}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                <div className="border-t pt-3 mt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Összesen:</span>
                    <span className="text-primary">{order.total_huf} Ft</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Restaurant Info Card */}
          <Card className="mb-6 border-primary/20 bg-muted/30">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-3">Kiscsibe Reggeliző & Étterem</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{address.full}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary flex-shrink-0" />
                  <span>{formatOpeningHoursOneLiner(openingHours)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 print:hidden">
            <Button asChild className="flex-1">
              <Link to="/etlap">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Új rendelés
              </Link>
            </Button>
            <FavoriteOrderButton
              orderName={order.name}
              items={orderItems.map((item): FavoriteOrderItem => ({
                item_id: item.id,
                name: item.name_snapshot,
                price_huf: item.unit_price_huf,
                sides: [],
                modifiers: (item.options || []).map(o => ({ id: o.id, label: o.label_snapshot, price_delta_huf: o.price_delta_huf })),
              }))}
              totalHuf={order.total_huf}
            />
            <Button variant="outline" asChild className="flex-1">
              <a 
                href={`https://maps.google.com/?q=${mapsQuery}`}
                target="_blank" 
                rel="noopener noreferrer"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Útvonalterv
              </a>
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Nyomtatás
            </Button>
          </div>

          {/* Email Status */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300 text-center">
              📧 A rendelés részleteit e-mailben is elküldtük
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
