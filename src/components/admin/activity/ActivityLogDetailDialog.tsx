import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ACTION_LABELS, MODULE_LABELS, type AdminAuditLogEntry } from "@/hooks/useAdminAuditLog";

interface ActivityLogDetailDialogProps {
  entry: AdminAuditLogEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("hu-HU", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const valueToText = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.join(", ");
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export const ActivityLogDetailDialog = ({ entry, open, onOpenChange }: ActivityLogDetailDialogProps) => {
  if (!entry) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[calc(100dvh-2rem)] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Módosítás részletei</DialogTitle>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-5 text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoRow label="Ki" value={entry.actor_name || entry.actor_email || "Ismeretlen"} />
              <InfoRow label="Mikor" value={formatDateTime(entry.created_at)} />
              <InfoRow label="Modul" value={MODULE_LABELS[entry.module] || entry.module} />
              <InfoRow label="Művelet" value={ACTION_LABELS[entry.action] || entry.action} />
              <InfoRow label="Érintett elem" value={entry.entity_label || entry.entity_id || "—"} />
              <InfoRow label="Tábla" value={entry.entity_table} />
            </div>

            {entry.action === "update" && entry.changed_fields.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Változott mezők</h3>
                <div className="space-y-2">
                  {entry.changed_fields.map((field) => (
                    <div key={field} className="rounded-md border bg-card p-3">
                      <div className="font-medium text-foreground mb-1">{field}</div>
                      <div className="grid grid-cols-[1fr_auto_1fr] gap-2 text-xs text-muted-foreground items-start">
                        <span className="break-words">{valueToText(entry.before_data?.[field])}</span>
                        <span>→</span>
                        <span className="break-words text-foreground">{valueToText(entry.after_data?.[field])}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {entry.action !== "update" && (
              <div className="rounded-md border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{ACTION_LABELS[entry.action]}</Badge>
                  <span className="text-muted-foreground">{entry.entity_label}</span>
                </div>
                <pre className="text-xs whitespace-pre-wrap break-words text-muted-foreground">
                  {JSON.stringify(entry.action === "delete" ? entry.before_data : entry.after_data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-md border bg-card p-3">
    <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1">{label}</div>
    <div className="font-medium break-words">{value}</div>
  </div>
);
