import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { hu } from "date-fns/locale";
import AdminLayout from "./AdminLayout";
import DashboardStatCard from "@/components/admin/DashboardStatCard";
import RecentOrdersFeed from "@/components/admin/RecentOrdersFeed";
import DashboardAlerts from "@/components/admin/DashboardAlerts";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { ShoppingBag, Activity, Gauge, TrendingUp, Calendar, Package, ArrowRight, Mail, Loader2 } from "lucide-react";
import AnnouncementEditor from "@/components/admin/AnnouncementEditor";

interface Stats {
  todayOrders: number;
  todayRevenue: number;
  activeOrders: number;
  avgOrderValue: number;
  capacityUsed: number | null;
  capacityTotal: number | null;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    todayOrders: 0,
    todayRevenue: 0,
    activeOrders: 0,
    avgOrderValue: 0,
    capacityUsed: null,
    capacityTotal: null,
  });
  const [loading, setLoading] = useState(true);
  const [sendingReport, setSendingReport] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      const todayStr = format(new Date(), "yyyy-MM-dd");
      const todayStart = `${todayStr}T00:00:00`;

      const [ordersRes, offerRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total_huf, status, created_at")
          .gte("created_at", todayStart),
        supabase
          .from("daily_offers")
          .select("id, max_portions, remaining_portions")
          .eq("date", todayStr)
          .limit(1),
      ]);

      const orders = ordersRes.data || [];
      const todayOrders = orders.length;
      const todayRevenue = orders.reduce((sum, o) => sum + (o.total_huf || 0), 0);
      const activeOrders = orders.filter((o) =>
        ["new", "preparing", "ready"].includes(o.status)
      ).length;
      const avgOrderValue = todayOrders > 0 ? Math.round(todayRevenue / todayOrders) : 0;

      let capacityUsed: number | null = null;
      let capacityTotal: number | null = null;
      const offer = offerRes.data?.[0];
      if (offer && offer.max_portions) {
        capacityTotal = offer.max_portions;
        capacityUsed = offer.max_portions - (offer.remaining_portions ?? 0);
      }

      setStats({ todayOrders, todayRevenue, activeOrders, avgOrderValue, capacityUsed, capacityTotal });
      setLoading(false);
    };

    fetchStats();

    // Realtime refresh for orders
    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchStats();
      })
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, []);

  const capacityLabel =
    stats.capacityTotal !== null
      ? `${Math.round(((stats.capacityUsed ?? 0) / stats.capacityTotal) * 100)}%`
      : "–";
  const capacitySubtitle =
    stats.capacityTotal !== null
      ? `${stats.capacityUsed}/${stats.capacityTotal} adag`
      : "Nincs mai ajánlat";

  return (
    <AdminLayout>
      <div className="py-4 sm:py-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Irányítópult</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {format(new Date(), "yyyy. MMMM d., EEEE", { locale: hu })}
          </p>
        </div>

        {/* Alerts */}
        <DashboardAlerts />

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <DashboardStatCard
            title="Mai rendelések"
            value={loading ? "–" : stats.todayOrders}
            subtitle={loading ? "" : `${stats.todayRevenue.toLocaleString("hu-HU")} Ft`}
            icon={ShoppingBag}
          />
          <DashboardStatCard
            title="Aktív rendelések"
            value={loading ? "–" : stats.activeOrders}
            subtitle="Új + Készül + Kész"
            icon={Activity}
            iconClassName={stats.activeOrders > 0 ? "bg-amber-500/15" : undefined}
          />
          <DashboardStatCard
            title="Mai kapacitás"
            value={loading ? "–" : capacityLabel}
            subtitle={capacitySubtitle}
            icon={Gauge}
          />
          <DashboardStatCard
            title="Átlagos rendelés"
            value={loading ? "–" : `${stats.avgOrderValue.toLocaleString("hu-HU")} Ft`}
            icon={TrendingUp}
          />
        </div>

        {/* Announcement Editor */}
        <AnnouncementEditor />

        {/* Recent Orders */}
        <RecentOrdersFeed />

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/admin/daily-menu")}
          >
            <Calendar className="h-5 w-5" />
            <span>Holnapi menü beállítása</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/admin/orders")}
          >
            <ShoppingBag className="h-5 w-5" />
            <span>Mai rendelések</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/admin/menu")}
          >
            <Package className="h-5 w-5" />
            <span>Étlap szerkesztés</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            disabled={sendingReport}
            onClick={async () => {
              setSendingReport(true);
              try {
                const { data, error } = await supabase.functions.invoke("send-daily-report");
                if (error) throw error;
                toast({ title: "Riport elküldve!", description: `Bevétel: ${data?.revenue?.toLocaleString() || 0} Ft, ${data?.orders || 0} rendelés` });
              } catch (err: any) {
                toast({ title: "Hiba", description: err.message, variant: "destructive" });
              } finally {
                setSendingReport(false);
              }
            }}
          >
            {sendingReport ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mail className="h-5 w-5" />}
            <span>Teszt napi riport</span>
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
