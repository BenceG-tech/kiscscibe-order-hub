import { CheckCircle2, AlertTriangle, MailX, Mail, MailCheck, Clock } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

import type { EmailStatusSummary } from "@/lib/emailLogAggregate";
export type { EmailStatusSummary } from "@/lib/emailLogAggregate";
export { aggregateEmailLogs } from "@/lib/emailLogAggregate";

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
