import { Card, CardContent } from "@/components/ui/card";
import { TrendingDown, TrendingUp, Scale } from "lucide-react";
import type { Invoice } from "@/hooks/useInvoices";
import InfoTip from "@/components/admin/InfoTip";

interface Props {
  invoices: Invoice[];
}

const InvoiceSummaryCards = ({ invoices }: Props) => {
  const incoming = invoices
    .filter((i) => i.type === "incoming")
    .reduce((s, i) => s + i.gross_amount, 0);
  const outgoing = invoices
    .filter((i) => i.type === "outgoing" || i.type === "order_receipt")
    .reduce((s, i) => s + i.gross_amount, 0);
  const result = outgoing - incoming;

  const fmt = (n: number) =>
    n.toLocaleString("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-destructive/10 p-2">
            <TrendingDown className="h-5 w-5 text-destructive" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">Költségek (bejövő) <InfoTip text="Az összes bejövő számla összege a szűrt időszakban." side="bottom" /></p>
            <p className="text-lg font-bold text-destructive">{fmt(incoming)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className="rounded-full bg-green-500/10 p-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">Bevételek (kimenő) <InfoTip text="Az összes kimenő számla és rendelés-bizonylat összege." side="bottom" /></p>
            <p className="text-lg font-bold text-green-600">{fmt(outgoing)}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          <div className={`rounded-full p-2 ${result >= 0 ? "bg-green-500/10" : "bg-destructive/10"}`}>
            <Scale className={`h-5 w-5 ${result >= 0 ? "text-green-600" : "text-destructive"}`} />
          </div>
          <div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">Eredmény <InfoTip text="Bevételek mínusz költségek. Pozitív szám = nyereség." side="bottom" /></p>
            <p className={`text-lg font-bold ${result >= 0 ? "text-green-600" : "text-destructive"}`}>
              {result >= 0 ? "+" : ""}{fmt(result)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InvoiceSummaryCards;
