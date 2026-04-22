import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ACTION_LABELS, MODULE_LABELS, type AdminAuditLogEntry } from "@/hooks/useAdminAuditLog";
import { Eye } from "lucide-react";

interface ActivityLogListProps {
  entries: AdminAuditLogEntry[];
  isLoading: boolean;
  onSelect: (entry: AdminAuditLogEntry) => void;
}

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat("hu-HU", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));

const actionVariant = (action: string) => {
  if (action === "delete") return "destructive" as const;
  if (action === "insert") return "default" as const;
  return "secondary" as const;
};

export const ActivityLogList = ({ entries, isLoading, onSelect }: ActivityLogListProps) => {
  if (isLoading) {
    return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">Napló betöltése…</div>;
  }

  if (entries.length === 0) {
    return <div className="rounded-md border bg-card p-6 text-sm text-muted-foreground">Nincs találat a megadott szűrőkkel.</div>;
  }

  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Idő</TableHead>
            <TableHead>Felhasználó</TableHead>
            <TableHead>Modul</TableHead>
            <TableHead>Művelet</TableHead>
            <TableHead>Érintett elem</TableHead>
            <TableHead className="text-right">Részletek</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="whitespace-nowrap text-muted-foreground">{formatDateTime(entry.created_at)}</TableCell>
              <TableCell className="font-medium max-w-[180px] truncate">{entry.actor_name || entry.actor_email || "Ismeretlen"}</TableCell>
              <TableCell>{MODULE_LABELS[entry.module] || entry.module}</TableCell>
              <TableCell>
                <Badge variant={actionVariant(entry.action)}>{ACTION_LABELS[entry.action] || entry.action}</Badge>
              </TableCell>
              <TableCell className="max-w-[260px] truncate">{entry.entity_label || entry.entity_table}</TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="sm" onClick={() => onSelect(entry)}>
                  <Eye className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
