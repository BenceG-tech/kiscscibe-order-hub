import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import { hu } from "date-fns/locale";

interface RecentOrder {
  id: string;
  code: string;
  name: string;
  total_huf: number;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, string> = {
  new: "Új",
  preparing: "Készül",
  ready: "Kész",
  completed: "Átadva",
  cancelled: "Lemondva",
};

const statusColors: Record<string, string> = {
  new: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  preparing: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  ready: "bg-green-500/15 text-green-400 border-green-500/30",
  completed: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/15 text-destructive border-destructive/30",
};

const RecentOrdersFeed = () => {
  const [orders, setOrders] = useState<RecentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchRecent = async () => {
    const { data } = await supabase
      .from("orders")
      .select("id, code, name, total_huf, status, created_at")
      .order("created_at", { ascending: false })
      .limit(5);
    setOrders(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchRecent();

    const channel = supabase
      .channel("dashboard-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchRecent();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg">Legutóbbi rendelések</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => navigate("/admin/orders")} className="gap-1">
          Összes <ArrowRight className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Betöltés...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">Még nincs rendelés ma.</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => navigate("/admin/orders")}
                className="w-full flex items-center gap-3 px-4 sm:px-6 py-3 hover:bg-muted/50 transition-colors text-left"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm">{order.code}</span>
                    <span className="text-sm text-muted-foreground truncate">{order.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {format(new Date(order.created_at), "HH:mm", { locale: hu })}
                  </div>
                </div>
                <span className="font-semibold text-sm whitespace-nowrap">
                  {order.total_huf.toLocaleString("hu-HU")} Ft
                </span>
                <Badge className={`text-[11px] border ${statusColors[order.status] || ""}`}>
                  {statusLabels[order.status] || order.status}
                </Badge>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentOrdersFeed;
