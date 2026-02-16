import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp, TrendingDown, Minus, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface PricingSuggestion {
  item_name: string;
  current_price: number;
  suggested_price: number;
  direction: "increase" | "decrease" | "keep";
  reasoning: string;
}

const PricingSuggestions = () => {
  const [suggestions, setSuggestions] = useState<PricingSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [ordersAnalyzed, setOrdersAnalyzed] = useState<number | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data, error } = await supabase.functions.invoke("ai-pricing-suggestions", {
        body: {},
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setSuggestions(data.suggestions || []);
      setOrdersAnalyzed(data.orders_analyzed || null);
      setMessage(data.message || null);

      if (data.suggestions?.length > 0) {
        toast.success(`${data.suggestions.length} árazási javaslat generálva`);
      }
    } catch (err: any) {
      console.error("Pricing suggestions error:", err);
      toast.error("Hiba az AI javaslatok generálásakor");
    } finally {
      setLoading(false);
    }
  };

  const getDirectionIcon = (dir: string) => {
    switch (dir) {
      case "increase": return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "decrease": return <TrendingDown className="h-4 w-4 text-amber-600" />;
      default: return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getDirectionColor = (dir: string) => {
    switch (dir) {
      case "increase": return "border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30";
      case "decrease": return "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30";
      default: return "border-border bg-muted/30";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI árazási javaslatok
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Az elmúlt 90 nap eladási adatai alapján generált javaslatok.
          </p>
        </div>
        <Button onClick={fetchSuggestions} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {loading ? "Elemzés..." : "Javaslatok frissítése"}
        </Button>
      </div>

      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-700 dark:text-amber-300">
          Tapasztalati becslés — kizárólag tájékoztató jellegű. Az árazási döntéseket mindig saját mérlegelés alapján hozd meg.
        </p>
      </div>

      {ordersAnalyzed !== null && (
        <p className="text-sm text-muted-foreground">
          Elemzett rendelések: <strong>{ordersAnalyzed}</strong> db (elmúlt 90 nap)
        </p>
      )}

      {message && suggestions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {message}
          </CardContent>
        </Card>
      )}

      {suggestions.length > 0 && (
        <div className="grid gap-3">
          {suggestions.map((s, i) => (
            <Card key={i} className={`${getDirectionColor(s.direction)} transition-colors`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">{getDirectionIcon(s.direction)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{s.item_name}</span>
                      <Badge variant="outline" className="text-xs">
                        {s.current_price.toLocaleString()} Ft
                      </Badge>
                      {s.direction !== "keep" && (
                        <>
                          <span className="text-muted-foreground">→</span>
                          <Badge className="text-xs" variant={s.direction === "increase" ? "default" : "secondary"}>
                            {s.suggested_price.toLocaleString()} Ft
                          </Badge>
                        </>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{s.reasoning}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PricingSuggestions;
