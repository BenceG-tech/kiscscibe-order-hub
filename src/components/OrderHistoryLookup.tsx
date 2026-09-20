import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Search, ExternalLink, AlertCircle } from "lucide-react";
import { normalizeLookupPhone, normalizeOrderCode, validateLookupInput } from "@/lib/orderLookup";

interface OrderRow {
  id: string;
  code: string;
  total_huf: number;
  status: string;
  created_at: string;
  pickup_time: string | null;
}

const statusMap: Record<string, { label: string; color: string }> = {
  new: { label: "Új", color: "bg-blue-100 text-blue-800" },
  preparing: { label: "Készül", color: "bg-yellow-100 text-yellow-800" },
  ready: { label: "Átvehető", color: "bg-green-100 text-green-800" },
  completed: { label: "Kész", color: "bg-gray-100 text-gray-800" },
  cancelled: { label: "Lemondva", color: "bg-destructive/15 text-destructive" },
};


const OrderHistoryLookup = () => {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    const validationError = validateLookupInput(code, phone);
    if (validationError) {
      setError(validationError);
      setSearched(false);
      setOrders([]);
      return;
    }

    setError(null);
    setLoading(true);
    setSearched(true);
    try {
      // Security: both the order code AND the phone number are required.
      // Phone alone must never enumerate a customer's orders.
      const { data, error: rpcError } = await supabase.rpc("get_customer_order_secure", {
        order_code: normalizeOrderCode(code),
        customer_phone: normalizeLookupPhone(phone),
      });
      if (rpcError) throw rpcError;
      const rows = (data as OrderRow[] | null) || [];
      setOrders(rows.slice(0, 1));
    } catch (err) {
      console.error("Order lookup error:", err);
      setOrders([]);
      setError("A keresés most nem sikerült. Próbáld újra kicsit később.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="lookup-code" className="text-xs">Rendelési kód</Label>
          <Input
            id="lookup-code"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="pl. L69199"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lookup-phone" className="text-xs">Telefonszám</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+36</span>
            <Input
              id="lookup-phone"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="301234567"
              className="pl-12"
              onKeyDown={e => e.key === "Enter" && handleSearch()}
            />
          </div>
        </div>
      </div>

      <Button onClick={handleSearch} disabled={loading} className="w-full min-h-[44px]">
        <Search className="h-4 w-4 mr-1" />
        {loading ? "Keresés..." : "Rendelés keresése"}
      </Button>

      <p className="text-xs text-muted-foreground">
        Biztonsági okból a rendelési kód és a telefonszám együtt szükséges.
      </p>

      {error && (
        <p className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </p>
      )}

      {searched && !error && orders.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nem találtunk ilyen rendelést. Ellenőrizd a kódot és a telefonszámot.
        </p>
      )}

      {orders.length > 0 && (
        <div className="space-y-2">
          {orders.map(order => {
            const s = statusMap[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
            const date = new Date(order.created_at);
            return (
              <a
                key={order.id}
                href={`/order-confirmation?code=${encodeURIComponent(order.code)}&phone=${encodeURIComponent(normalizeLookupPhone(phone))}`}
                className="flex items-center justify-between p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{order.code}</span>
                    <Badge className={`${s.color} text-xs`}>{s.label}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {date.toLocaleDateString("hu-HU")} {date.toLocaleTimeString("hu-HU", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{order.total_huf.toLocaleString()} Ft</span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryLookup;
