import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/ui/loading";
import { Phone, RefreshCw, AlertTriangle, ShoppingCart, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import AdminLayout from "./AdminLayout";

interface OrderAttempt {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  cart_snapshot: any;
  total_huf: number | null;
  error_message: string | null;
  payment_method: string | null;
  pickup_date: string | null;
  pickup_time_slot: string | null;
  created_at: string;
}

interface AbandonedCart {
  id: string;
  session_id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  cart_snapshot: any;
  total_huf: number | null;
  step: string | null;
  converted_order_id: string | null;
  created_at: string;
  last_activity_at: string;
}

const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const CartPreview = ({ items }: { items: any }) => {
  const arr = Array.isArray(items) ? items : [];
  if (arr.length === 0) {
    return <p className="text-sm text-muted-foreground">Üres kosár.</p>;
  }
  return (
    <ul className="space-y-1 text-sm">
      {arr.map((it, i) => (
        <li key={i} className="flex justify-between gap-2">
          <span className="truncate">
            {it.name_snapshot || it.name || "Tétel"} × {it.qty || it.quantity || 1}
          </span>
          <span className="text-muted-foreground tabular-nums">
            {((it.unit_price_huf || it.price_huf || 0) * (it.qty || it.quantity || 1)).toLocaleString()} Ft
          </span>
        </li>
      ))}
    </ul>
  );
};

const FailedOrders = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<OrderAttempt[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [attemptsRes, abandonedRes] = await Promise.all([
      supabase
        .from("order_attempts" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
      supabase
        .from("abandoned_carts" as any)
        .select("*")
        .is("converted_order_id", null)
        .lt("last_activity_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
        .order("last_activity_at", { ascending: false })
        .limit(200),
    ]);

    if (attemptsRes.error) {
      toast({ title: "Hiba", description: attemptsRes.error.message, variant: "destructive" });
    } else {
      setAttempts((attemptsRes.data as any) || []);
    }
    if (abandonedRes.error) {
      toast({ title: "Hiba", description: abandonedRes.error.message, variant: "destructive" });
    } else {
      setAbandoned((abandonedRes.data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteAttempt = async (id: string) => {
    const { error } = await supabase.from("order_attempts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setAttempts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const deleteAbandoned = async (id: string) => {
    const { error } = await supabase.from("abandoned_carts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setAbandoned((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <AdminLayout>
      <div className="mx-auto max-w-screen-xl px-3 sm:px-4 py-4 sm:py-6 space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Sikertelen és félbehagyott rendelések</h1>
            <p className="text-sm text-muted-foreground">
              Itt látod, ha valaki próbált rendelni de hibára futott, vagy elkezdte de nem fejezte be.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            <span className="ml-2 hidden sm:inline">Frissítés</span>
          </Button>
        </div>

        <Tabs defaultValue="failed" className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="failed" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Sikertelen ({attempts.length})
            </TabsTrigger>
            <TabsTrigger value="abandoned" className="gap-2">
              <ShoppingCart className="h-4 w-4" />
              Félbehagyott ({abandoned.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="failed" className="space-y-3">
            {loading && <LoadingSpinner />}
            {!loading && attempts.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nincs sikertelen próbálkozás. 🎉
                </CardContent>
              </Card>
            )}
            {attempts.map((a) => (
              <Card key={a.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {a.customer_name || "Névtelen"}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          • {formatDateTime(a.created_at)}
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {a.customer_phone && (
                          <a
                            href={`tel:${a.customer_phone}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {a.customer_phone}
                          </a>
                        )}
                        {a.customer_email && <span>· {a.customer_email}</span>}
                        {a.total_huf ? (
                          <Badge variant="secondary">{a.total_huf.toLocaleString()} Ft</Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteAttempt(a.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0 space-y-3">
                  <div className="bg-destructive/10 text-destructive rounded-md px-3 py-2 text-sm">
                    <strong>Hiba:</strong> {a.error_message || "Ismeretlen"}
                  </div>
                  <Accordion type="single" collapsible>
                    <AccordionItem value="cart" className="border-none">
                      <AccordionTrigger className="py-2 text-sm">
                        Kosár tartalma ({Array.isArray(a.cart_snapshot) ? a.cart_snapshot.length : 0} tétel)
                      </AccordionTrigger>
                      <AccordionContent>
                        <CartPreview items={a.cart_snapshot} />
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="abandoned" className="space-y-3">
            {loading && <LoadingSpinner />}
            {!loading && abandoned.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nincs félbehagyott kosár.
                </CardContent>
              </Card>
            )}
            {abandoned.map((c) => (
              <Card key={c.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div className="space-y-1">
                      <CardTitle className="text-base">
                        {c.customer_name || "Névtelen"}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          • utolsó aktivitás: {formatDateTime(c.last_activity_at)}
                        </span>
                      </CardTitle>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        {c.customer_phone && (
                          <a
                            href={`tel:${c.customer_phone}`}
                            className="inline-flex items-center gap-1 text-primary hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {c.customer_phone}
                          </a>
                        )}
                        {c.customer_email && <span>· {c.customer_email}</span>}
                        {c.total_huf ? (
                          <Badge variant="secondary">{c.total_huf.toLocaleString()} Ft</Badge>
                        ) : null}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => deleteAbandoned(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <CartPreview items={c.cart_snapshot} />
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default FailedOrders;
