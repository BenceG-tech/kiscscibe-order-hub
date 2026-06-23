import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { LoadingSpinner } from "@/components/ui/loading";
import { Phone, RefreshCw, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface OrderAttempt {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  cart_snapshot: any;
  total_huf: number | null;
  error_message: string | null;
  created_at: string;
}

interface AbandonedCart {
  id: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  cart_snapshot: any;
  total_huf: number | null;
  converted_order_id: string | null;
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
      {arr.map((it: any, i: number) => {
        const qty = it.qty || it.quantity || 1;
        const price = it.unit_price_huf || it.price_huf || 0;
        return (
          <li key={i} className="flex justify-between gap-2">
            <span className="truncate">
              {it.name_snapshot || it.name || "Tétel"} × {qty}
            </span>
            <span className="text-muted-foreground tabular-nums">
              {(price * qty).toLocaleString()} Ft
            </span>
          </li>
        );
      })}
    </ul>
  );
};

export const FailedAttemptsList = () => {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<OrderAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("order_attempts" as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setAttempts((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteOne = async (id: string) => {
    const { error } = await supabase.from("order_attempts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setAttempts((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Itt látod, ha valaki próbálta leadni a rendelést, de hibára futott. Hívd vissza és segíts!
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Frissítés</span>
        </Button>
      </div>

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
              <Button variant="ghost" size="sm" onClick={() => deleteOne(a.id)}>
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
    </div>
  );
};

export const AbandonedCartsList = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from("abandoned_carts" as any)
      .select("*")
      .is("converted_order_id", null)
      .lt("last_activity_at", cutoff)
      .order("last_activity_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setItems((data as any) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const deleteOne = async (id: string) => {
    const { error } = await supabase.from("abandoned_carts" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      setItems((prev) => prev.filter((a) => a.id !== id));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Vendégek, akik elkezdték a rendelést, de 5+ perce nem aktívak és nem fejezték be.
        </p>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          <span className="ml-2 hidden sm:inline">Frissítés</span>
        </Button>
      </div>

      {loading && <LoadingSpinner />}
      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Nincs félbehagyott kosár.
          </CardContent>
        </Card>
      )}

      {items.map((c) => (
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
              <Button variant="ghost" size="sm" onClick={() => deleteOne(c.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <CartPreview items={c.cart_snapshot} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
