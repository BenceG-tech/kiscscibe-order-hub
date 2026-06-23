import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

type CheckStatus = "ok" | "warn" | "fail";
interface Check {
  id: string;
  label: string;
  status: CheckStatus;
  message: string;
  detail?: string;
}
interface HealthResult {
  ran_at: string;
  summary: { ok: number; warn: number; fail: number };
  checks: Check[];
}

const StatusIcon = ({ status }: { status: CheckStatus }) => {
  if (status === "ok") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (status === "warn") return <AlertTriangle className="h-5 w-5 text-amber-500" />;
  return <XCircle className="h-5 w-5 text-destructive" />;
};

export const SystemHealthCheck = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);

  const run = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-health-check");
      if (error) throw error;
      setResult(data as HealthResult);
      const summary = (data as HealthResult).summary;
      if (summary.fail > 0) {
        toast({
          title: "Figyelem!",
          description: `${summary.fail} hiba található. Nézd meg a részleteket.`,
          variant: "destructive",
        });
      } else if (summary.warn > 0) {
        toast({
          title: "Ellenőrzés kész",
          description: `${summary.warn} figyelmeztetés. Minden lényeges működik.`,
        });
      } else {
        toast({ title: "Minden rendben!", description: "Az összes ellenőrzés sikeres." });
      }
    } catch (e: any) {
      toast({ title: "Hiba", description: e?.message || "Nem sikerült futtatni az ellenőrzést", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const overallBadge = () => {
    if (!result) return null;
    if (result.summary.fail > 0)
      return <Badge variant="destructive">Hiba ({result.summary.fail})</Badge>;
    if (result.summary.warn > 0)
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">Figyelmeztetés ({result.summary.warn})</Badge>;
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">Minden rendben</Badge>;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Rendszer önellenőrzés</CardTitle>
            {overallBadge()}
          </div>
          <Button onClick={run} disabled={loading} size="sm">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Ellenőrzés…
              </>
            ) : (
              "Ellenőrzés futtatása"
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Egy kattintással leellenőrzi, hogy minden rendben van-e: napi ajánlat, idősávok, rendelés leadás,
          adatbázis, e-mail.
        </p>
      </CardHeader>

      {result && (
        <CardContent className="space-y-2">
          <ul className="space-y-2">
            {result.checks.map((c) => (
              <li
                key={c.id}
                className="flex items-start gap-3 p-2 rounded-md border bg-card/50"
              >
                <StatusIcon status={c.status} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{c.label}</p>
                  <p className="text-xs text-muted-foreground">{c.message}</p>
                  {c.detail && (
                    <p className="text-xs text-muted-foreground/80 mt-1 font-mono">{c.detail}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-muted-foreground text-right">
            Utolsó futtatás: {new Date(result.ran_at).toLocaleString("hu-HU")}
          </p>
        </CardContent>
      )}
    </Card>
  );
};
