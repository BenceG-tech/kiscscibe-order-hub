import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Trash2, TrendingDown, AlertTriangle, Plus } from "lucide-react";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { hu } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

interface WasteEntry {
  id: string;
  date: string;
  item_name: string;
  planned_portions: number | null;
  sold_portions: number | null;
  wasted_portions: number;
  notes: string | null;
  created_at: string;
}

const CHART_COLORS = ["hsl(var(--primary))", "hsl(var(--destructive))", "hsl(var(--accent))", "#f59e0b", "#8b5cf6"];

const WasteTracking = () => {
  const [entries, setEntries] = useState<WasteEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [closingDay, setClosingDay] = useState(false);
  const [manualEntry, setManualEntry] = useState({ item_name: "", wasted_portions: 0, notes: "" });
  const [showManualForm, setShowManualForm] = useState(false);
  const { toast } = useToast();

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    const thirtyDaysAgo = subDays(new Date(), 30).toISOString().split('T')[0];
    const { data, error } = await supabase
      .from("daily_waste_log")
      .select("*")
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching waste log:", error);
    } else {
      setEntries(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEntries(); }, [fetchEntries]);

  const handleCloseDay = async () => {
    setClosingDay(true);
    try {
      const today = format(new Date(), "yyyy-MM-dd");

      // Fetch daily offers with remaining portions
      const { data: offers } = await supabase
        .from("daily_offers")
        .select("id, date, remaining_portions, max_portions")
        .eq("date", today);

      // Fetch daily offer items with names
      const offerIds = (offers || []).map(o => o.id);
      let offerItems: any[] = [];
      if (offerIds.length > 0) {
        const { data } = await supabase
          .from("daily_offer_items")
          .select("daily_offer_id, item_id, menu_items(name)")
          .in("daily_offer_id", offerIds);
        offerItems = data || [];
      }

      // Fetch daily menus
      const { data: menus } = await supabase
        .from("daily_offer_menus")
        .select("id, daily_offer_id, remaining_portions, max_portions")
        .in("daily_offer_id", offerIds);

      const wasteEntries: any[] = [];

      // Log offer-level waste
      for (const offer of (offers || [])) {
        if (offer.remaining_portions && offer.remaining_portions > 0) {
          const items = offerItems.filter(i => i.daily_offer_id === offer.id);
          const itemNames = items.map(i => (i.menu_items as any)?.name).filter(Boolean).join(", ");
          wasteEntries.push({
            date: today,
            item_name: itemNames || `Napi ajánlat (${offer.id.slice(0, 8)})`,
            planned_portions: offer.max_portions,
            sold_portions: (offer.max_portions || 0) - (offer.remaining_portions || 0),
            wasted_portions: offer.remaining_portions,
            notes: "Automatikus nap lezárás",
          });
        }
      }

      // Log menu-level waste
      for (const menu of (menus || [])) {
        if (menu.remaining_portions && menu.remaining_portions > 0) {
          wasteEntries.push({
            date: today,
            item_name: `Napi menü`,
            planned_portions: menu.max_portions,
            sold_portions: (menu.max_portions || 0) - (menu.remaining_portions || 0),
            wasted_portions: menu.remaining_portions,
            notes: "Automatikus nap lezárás",
          });
        }
      }

      if (wasteEntries.length === 0) {
        toast({ title: "Nincs pazarlás!", description: "Ma nem maradt el nem kelt adag." });
      } else {
        const { error } = await supabase.from("daily_waste_log").insert(wasteEntries);
        if (error) throw error;
        toast({ title: "Nap lezárva", description: `${wasteEntries.length} tétel pazarlás naplózva.` });
        fetchEntries();
      }
    } catch (err: any) {
      toast({ title: "Hiba", description: err.message, variant: "destructive" });
    } finally {
      setClosingDay(false);
    }
  };

  const handleManualAdd = async () => {
    if (!manualEntry.item_name || manualEntry.wasted_portions <= 0) return;
    const today = format(new Date(), "yyyy-MM-dd");
    const { error } = await supabase.from("daily_waste_log").insert({
      date: today,
      item_name: manualEntry.item_name,
      wasted_portions: manualEntry.wasted_portions,
      notes: manualEntry.notes || null,
    });
    if (error) {
      toast({ title: "Hiba", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Rögzítve" });
      setManualEntry({ item_name: "", wasted_portions: 0, notes: "" });
      setShowManualForm(false);
      fetchEntries();
    }
  };

  // Aggregate data for charts
  const dailyTotals = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.date] = (acc[e.date] || 0) + e.wasted_portions;
    return acc;
  }, {});

  const chartData = Object.entries(dailyTotals)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-14)
    .map(([date, total]) => ({
      date: format(new Date(date), "MM.dd"),
      wasted: total,
    }));

  const itemTotals = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.item_name] = (acc[e.item_name] || 0) + e.wasted_portions;
    return acc;
  }, {});

  const topWasted = Object.entries(itemTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, total]) => ({ name, value: total }));

  const totalWasted = entries.reduce((sum, e) => sum + e.wasted_portions, 0);
  const totalPlanned = entries.reduce((sum, e) => sum + (e.planned_portions || 0), 0);
  const wasteRate = totalPlanned > 0 ? Math.round((totalWasted / totalPlanned) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={handleCloseDay} disabled={closingDay} variant="destructive">
          {closingDay ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <TrendingDown className="h-4 w-4 mr-2" />}
          Nap lezárása (pazarlás naplózása)
        </Button>
        <Button variant="outline" onClick={() => setShowManualForm(!showManualForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Kézi rögzítés
        </Button>
      </div>

      {/* Manual entry form */}
      {showManualForm && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Input
              placeholder="Étel neve"
              value={manualEntry.item_name}
              onChange={(e) => setManualEntry(prev => ({ ...prev, item_name: e.target.value }))}
            />
            <Input
              type="number"
              placeholder="El nem kelt adagok"
              value={manualEntry.wasted_portions || ""}
              onChange={(e) => setManualEntry(prev => ({ ...prev, wasted_portions: parseInt(e.target.value) || 0 }))}
            />
            <Textarea
              placeholder="Megjegyzés (opcionális)"
              value={manualEntry.notes}
              onChange={(e) => setManualEntry(prev => ({ ...prev, notes: e.target.value }))}
            />
            <Button onClick={handleManualAdd} disabled={!manualEntry.item_name || manualEntry.wasted_portions <= 0}>
              Mentés
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Összpazarlás (30 nap)</p>
            <p className="text-3xl font-bold text-destructive">{totalWasted} adag</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Pazarlási arány</p>
            <p className="text-3xl font-bold">{wasteRate}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-sm text-muted-foreground">Érintett napok</p>
            <p className="text-3xl font-bold">{Object.keys(dailyTotals).length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily trend chart */}
      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Napi pazarlás trend (utolsó 14 nap)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px" }}
                    labelStyle={{ color: "hsl(var(--foreground))" }}
                  />
                  <Bar dataKey="wasted" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} name="Pazarolt adagok" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top wasted items */}
      {topWasted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Legtöbbet pazarolt ételek (30 nap)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topWasted} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                      {topWasted.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {topWasted.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-sm">{item.name}</span>
                    </div>
                    <Badge variant="secondary">{item.value} adag</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Legutóbbi bejegyzések</CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <p className="text-muted-foreground text-sm">Még nincs pazarlási adat.</p>
          ) : (
            <div className="space-y-2">
              {entries.slice(0, 20).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div>
                    <p className="font-medium text-sm">{entry.item_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(entry.date), "yyyy. MMM d.", { locale: hu })}
                      {entry.planned_portions ? ` · Tervezett: ${entry.planned_portions}, Eladott: ${entry.sold_portions}` : ""}
                    </p>
                  </div>
                  <Badge variant="destructive">{entry.wasted_portions} adag</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default WasteTracking;
