import { CheckCircle2, AlertTriangle, MailX, Mail, MailCheck, Clock } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

export type EmailStatusSummary = {
  admin: "sent" | "partial" | "failed" | "pending";
  customer: "sent" | "failed" | "skipped" | "pending";
  lastAt?: string;
};

/** Compact inline icon pair showing admin + customer email dispatch status. */
export const EmailStatusBadge = ({ status }: { status?: EmailStatusSummary }) => {
  if (!status) return null;

  const adminIcon = (() => {
    switch (status.admin) {
      case "sent":
        return { Icon: CheckCircle2, cls: "text-green-600", label: "Admin email kiment (info + tulaj)" };
      case "partial":
        return { Icon: AlertTriangle, cls: "text-amber-500", label: "Admin email: csak az egyik címzett kapta meg" };
      case "failed":
        return { Icon: AlertTriangle, cls: "text-destructive", label: "Admin email küldés SIKERTELEN" };
      default:
        return { Icon: Clock, cls: "text-muted-foreground/60", label: "Admin email még nem történt" };
    }
  })();

  const customerIcon = (() => {
    switch (status.customer) {
      case "sent":
        return { Icon: MailCheck, cls: "text-green-600", label: "Vevői visszaigazolás kiment" };
      case "failed":
        return { Icon: MailX, cls: "text-destructive", label: "Vevői visszaigazolás SIKERTELEN" };
      case "skipped":
        return { Icon: Mail, cls: "text-muted-foreground/60", label: "Vevő nem adott meg emailt (kihagyva)" };
      default:
        return { Icon: Clock, cls: "text-muted-foreground/60", label: "Vevői email még nem történt" };
    }
  })();

  return (
    <TooltipProvider>
      <span className="inline-flex items-center gap-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex ${adminIcon.cls}`}>
              <adminIcon.Icon className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{adminIcon.label}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <span className={`inline-flex ${customerIcon.cls}`}>
              <customerIcon.Icon className="h-3.5 w-3.5" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{customerIcon.label}</TooltipContent>
        </Tooltip>
      </span>
    </TooltipProvider>
  );
};

/** Aggregate raw email_send_log rows into a per-order summary. */
export function aggregateEmailLogs(
  rows: Array<{ order_id: string | null; email_type: string; status: string; created_at: string }>,
): Map<string, EmailStatusSummary> {
  const byOrder = new Map<string, EmailStatusSummary>();
  for (const row of rows) {
    if (!row.order_id) continue;
    const existing = byOrder.get(row.order_id) || {
      admin: "pending" as const,
      customer: "pending" as const,
    };

    if (row.email_type === "admin_notification") {
      // Two recipients expected. Track sent/failed counts implicitly.
      if (existing.admin === "pending") {
        existing.admin = row.status === "sent" ? "sent" : row.status === "failed" ? "failed" : "pending";
      } else if (existing.admin === "sent" && row.status === "failed") {
        existing.admin = "partial";
      } else if (existing.admin === "failed" && row.status === "sent") {
        existing.admin = "partial";
      } else if (existing.admin === "sent" && row.status === "sent") {
        existing.admin = "sent";
      } else if (existing.admin === "failed" && row.status === "failed") {
        existing.admin = "failed";
      }
    } else if (row.email_type === "customer_confirmation") {
      if (row.status === "sent") existing.customer = "sent";
      else if (row.status === "failed") existing.customer = "failed";
      else if (row.status === "skipped") existing.customer = "skipped";
    }

    if (!existing.lastAt || row.created_at > existing.lastAt) existing.lastAt = row.created_at;
    byOrder.set(row.order_id, existing);
  }
  return byOrder;
}
