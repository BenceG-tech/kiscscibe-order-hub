import { usePaymentReminders } from "@/hooks/usePaymentReminders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, Clock, CalendarClock } from "lucide-react";
import InfoTip from "./InfoTip";

const fmt = (n: number) =>
  n.toLocaleString("hu-HU", { style: "currency", currency: "HUF", maximumFractionDigits: 0 });

const PaymentReminders = () => {
  const { data, isLoading } = usePaymentReminders();

  if (isLoading || !data) return null;

  const { overdue, dueToday, upcoming } = data;
  const total = overdue.length + dueToday.length + upcoming.length;
  if (total === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <CalendarClock className="h-4 w-4" />
          Fizetési emlékeztetők
          <InfoTip text="Lejáró és lejárt fizetési határidejű számlák." />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {overdue.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-destructive/10 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium truncate">{r.partner_name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs">{Math.abs(r.days_until)} napja lejárt</span>
              <span className="font-semibold">{fmt(r.gross_amount)}</span>
            </div>
          </div>
        ))}
        {dueToday.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span className="font-medium truncate">{r.partner_name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs">Ma jár le</span>
              <span className="font-semibold">{fmt(r.gross_amount)}</span>
            </div>
          </div>
        ))}
        {upcoming.map((r) => (
          <div key={r.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-muted text-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <span className="font-medium truncate">{r.partner_name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs text-muted-foreground">{r.days_until} nap múlva</span>
              <span className="font-semibold">{fmt(r.gross_amount)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PaymentReminders;
