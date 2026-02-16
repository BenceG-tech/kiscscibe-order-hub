import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";

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
  cancelled: { label: "Lemondva", color: "bg-red-100 text-red-800" },
};

const OrderHistoryLookup = () => {
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const normalizePhone = (raw: string): string => {
    let p = raw.replace(/\s+/g, "").replace(/-/g, "");
    if (p.startsWith("06")) p = "+36" + p.slice(2);
    if (!p.startsWith("+")) p = "+36" + p;
    return p;
  };

  const handleSearch = async () => {
    if (!phone.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const normalized = normalizePhone(phone);
      const { data, error } = await supabase.rpc("get_customer_orders", {
        customer_phone: normalized,
      });
      if (error) throw error;
      setOrders((data as OrderRow[]) || []);
    } catch (err) {
      console.error("Order history lookup error:", err);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">+36</span>
          <Input
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="Telefonszámod"
            className="pl-12"
            onKeyDown={e => e.key === "Enter" && handleSearch()}
          />
        </div>
        <Button onClick={handleSearch} disabled={loading || !phone.trim()}>
          <Search className="h-4 w-4 mr-1" />
          {loading ? "..." : "Keresés"}
        </Button>
      </div>

      {searched && orders.length === 0 && !loading && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nem találtunk korábbi rendelést ehhez a telefonszámhoz.
        </p>
      )}

      {orders.length > 0 && (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {orders.map(order => {
            const s = statusMap[order.status] || { label: order.status, color: "bg-gray-100 text-gray-800" };
            const date = new Date(order.created_at);
            return (
              <a
                key={order.id}
                href={`/order-confirmation?code=${order.code}&phone=${encodeURIComponent(normalizePhone(phone))}`}
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
