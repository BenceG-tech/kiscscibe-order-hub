import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Scale, Clock, AlertTriangle, FileText } from "lucide-react";
import type { Invoice } from "@/hooks/useInvoices";
import InfoTip from "@/components/admin/InfoTip";

interface Props {
  invoices: Invoice[];
}

const InvoiceSummaryCards = ({ invoices }: Props) => {
  const stats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let incomingTotal = 0;
    let outgoingTotal = 0;
    let pendingCount = 0;
    let pendingAmount = 0;
    let overdueCount = 0;
    let overdueAmount = 0;

    for (const inv of invoices) {
      if (inv.type === "incoming") {
        incomingTotal += inv.gross_amount;
      } else {
        outgoingTotal += inv.gross_amount;
      }

      if (inv.status === "pending" || inv.status === "draft") {
        pendingCount++;
        pendingAmount += inv.gross_amount;
      }

      if (
        inv.due_date &&
        new Date(inv.due_date) < today &&
        inv.status !== "paid" &&
        inv.status !== "cancelled"
      ) {
        overdueCount++;
        overdueAmount += inv.gross_amount;
      }
    }

    return {
      incomingTotal,
      outgoingTotal,
      result: outgoingTotal - incomingTotal,
      pendingCount,
      pendingAmount,
      overdueCount,
      overdueAmount,
      totalCount: invoices.length,
    };
  }, [invoices]);

  const fmt = (n: number) =>
    n.toLocaleString("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-destructive/10 p-2 shrink-0">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">Költségek <InfoTip text="Az összes bejövő számla összege a szűrt időszakban." side="bottom" /></p>
            <p className="text-lg font-bold text-destructive truncate">{fmt(stats.incomingTotal)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-green-500/10 p-2 shrink-0">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">Bevételek <InfoTip text="Az összes kimenő számla és rendelés-bizonylat összege." side="bottom" /></p>
            <p className="text-lg font-bold text-green-600 truncate">{fmt(stats.outgoingTotal)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`rounded-full p-2 shrink-0 ${stats.result >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
            <Scale className={`h-5 w-5 ${stats.result >= 0 ? "text-green-600" : "text-destructive"}`} />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">Eredmény <InfoTip text="Bevételek mínusz költségek." side="bottom" /></p>
            <p className={`text-lg font-bold truncate ${stats.result >= 0 ? "text-green-600" : "text-destructive"}`}>
              {stats.result >= 0 ? "+" : ""}{fmt(stats.result)}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-yellow-500/10 p-2 shrink-0">
            <Clock className="h-5 w-5 text-yellow-600" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground flex items-center gap-1">Függőben <InfoTip text="Piszkozat vagy függőben lévő számlák." side="bottom" /></p>
            <p className="text-lg font-bold text-yellow-600 truncate">{stats.pendingCount} db</p>
            <p className="text-[11px] text-muted-foreground truncate">{fmt(stats.pendingAmount)}</p>
          </div>
        </CardContent>
      </Card>
      {stats.overdueCount > 0 && (
        <Card className="border-destructive/30">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="rounded-full bg-destructive/10 p-2 shrink-0">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">Lejárt <InfoTip text="Lejárt fizetési határidejű, nem fizetett számlák." side="bottom" /></p>
              <p className="text-lg font-bold text-destructive truncate">{stats.overdueCount} db</p>
              <p className="text-[11px] text-muted-foreground truncate">{fmt(stats.overdueAmount)}</p>
            </div>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-primary/10 p-2 shrink-0">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Összes bizonylat</p>
            <p className="text-lg font-bold truncate">{stats.totalCount} db</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSummaryCards;
