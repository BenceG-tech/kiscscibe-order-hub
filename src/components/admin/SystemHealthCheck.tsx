import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, XCircle, ShieldCheck, Loader2, Info, Wrench, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { HEALTH_CHECK_EXPLANATIONS } from "@/data/healthCheckExplanations";
import { HealthCheckDetailDialog } from "./HealthCheckDetailDialog";

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
  const [fixing, setFixing] = useState<string | null>(null);
  const [fixingAll, setFixingAll] = useState(false);
  const [result, setResult] = useState<HealthResult | null>(null);
  const [detailCheck, setDetailCheck] = useState<Check | null>(null);

  const run = async (silent = false) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("system-health-check");
      if (error) throw error;
      setResult(data as HealthResult);
      if (!silent) {
        const summary = (data as HealthResult).summary;
        if (summary.fail > 0) {
          toast({ title: "Figyelem!", description: `${summary.fail} hiba található.`, variant: "destructive" });
        } else if (summary.warn > 0) {
          toast({ title: "Ellenőrzés kész", description: `${summary.warn} figyelmeztetés.` });
        } else {
          toast({ title: "Minden rendben!", description: "Az összes ellenőrzés sikeres." });
        }
      }
    } catch (e: any) {
      toast({ title: "Hiba", description: e?.message || "Nem sikerült futtatni az ellenőrzést", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fixOne = async (checkId: string) => {
    if (checkId === "submit_order" || checkId === "db_write") {
      await run();
      return;
    }
    setFixing(checkId);
    try {
      const { data, error } = await supabase.functions.invoke("system-health-fix", {
        body: { check_id: checkId },
      });
      if (error) throw error;
      const res = data as { success: boolean; message: string; detail?: string };
      toast({
        title: res.success ? "Javítva" : "Nem sikerült",
        description: res.message,
        variant: res.success ? "default" : "destructive",
      });
      await run(true);
    } catch (e: any) {
      toast({ title: "Hiba", description: e?.message || "Javítás sikertelen", variant: "destructive" });
    } finally {
      setFixing(null);
    }
  };

  const fixAll = async () => {
    if (!result) return;
    const fixable = result.checks.filter(
      (c) => c.status !== "ok" && HEALTH_CHECK_EXPLANATIONS[c.id]?.fixable,
    );
    if (fixable.length === 0) return;
    setFixingAll(true);
    let ok = 0;
    let failed = 0;
    for (const c of fixable) {
      if (c.id === "submit_order" || c.id === "db_write") continue;
      try {
        const { data } = await supabase.functions.invoke("system-health-fix", {
          body: { check_id: c.id },
        });
        if ((data as any)?.success) ok++; else failed++;
      } catch {
        failed++;
      }
    }
    toast({
      title: "Tömeges javítás kész",
      description: `Sikeres: ${ok}, sikertelen: ${failed}.`,
    });
    setFixingAll(false);
    await run(true);
  };

  const overallBadge = () => {
    if (!result) return null;
    if (result.summary.fail > 0)
      return <Badge variant="destructive">Hiba ({result.summary.fail})</Badge>;
    if (result.summary.warn > 0)
      return <Badge className="bg-amber-500 text-white hover:bg-amber-500/90">Figyelmeztetés ({result.summary.warn})</Badge>;
    return <Badge className="bg-emerald-600 text-white hover:bg-emerald-600/90">Minden rendben</Badge>;
  };

  const hasFixable = !!result?.checks.some(
    (c) => c.status !== "ok" && HEALTH_CHECK_EXPLANATIONS[c.id]?.fixable,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <CardTitle className="text-base sm:text-lg">Rendszer önellenőrzés</CardTitle>
            {overallBadge()}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {hasFixable && (
              <Button
                onClick={fixAll}
                disabled={fixingAll || loading || !!fixing}
                size="sm"
                variant="secondary"
              >
                {fixingAll ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Javítás…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-2" />Hibák javítása</>
                )}
              </Button>
            )}
            <Button onClick={() => run()} disabled={loading || fixingAll} size="sm">
              {loading ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Ellenőrzés…</>
              ) : (
                "Ellenőrzés futtatása"
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Egy kattintással leellenőrzi, hogy minden rendben van-e. A hibák mellett található "Javítás" gombbal
          azonnal orvosolhatod az ismert problémákat.
        </p>
      </CardHeader>

      {result && (
        <CardContent className="space-y-2">
          <ul className="space-y-2">
            {result.checks.map((c) => {
              const exp = HEALTH_CHECK_EXPLANATIONS[c.id];
              const canFix = c.status !== "ok" && exp?.fixable;
              return (
                <li
                  key={c.id}
                  className="flex items-start gap-3 p-2 rounded-md border bg-card/50"
                >
                  <StatusIcon status={c.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.label}</p>
                    <p className="text-xs text-muted-foreground">{c.message}</p>
                    {c.detail && (
                      <p className="text-xs text-muted-foreground/80 mt-1 font-mono break-all">{c.detail}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2 text-xs"
                        onClick={() => setDetailCheck(c)}
                      >
                        <Info className="h-3.5 w-3.5 mr-1" />
                        Részletek
                      </Button>
                      {canFix && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          onClick={() => fixOne(c.id)}
                          disabled={fixing === c.id || fixingAll}
                        >
                          {fixing === c.id ? (
                            <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                          ) : (
                            <Wrench className="h-3.5 w-3.5 mr-1" />
                          )}
                          {exp?.fixLabel || "Javítás"}
                        </Button>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <p className="text-[11px] text-muted-foreground text-right">
            Utolsó futtatás: {new Date(result.ran_at).toLocaleString("hu-HU")}
          </p>
        </CardContent>
      )}

      <HealthCheckDetailDialog
        check={detailCheck}
        open={!!detailCheck}
        onOpenChange={(o) => !o && setDetailCheck(null)}
      />
    </Card>
  );
};
