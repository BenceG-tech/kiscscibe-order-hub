import { useState } from "react";
import AdminLayout from "./AdminLayout";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ActivityLogList } from "@/components/admin/activity/ActivityLogList";
import { ActivityLogDetailDialog } from "@/components/admin/activity/ActivityLogDetailDialog";
import { MODULE_LABELS, useAdminAuditLog, type AdminAuditLogEntry } from "@/hooks/useAdminAuditLog";
import { FileClock, Search, RotateCcw } from "lucide-react";

const Activity = () => {
  const [search, setSearch] = useState("");
  const [module, setModule] = useState("all");
  const [action, setAction] = useState("all");
  const [actor, setActor] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [selected, setSelected] = useState<AdminAuditLogEntry | null>(null);

  const { data: entries = [], isLoading } = useAdminAuditLog({ search, module, action, actor, from, to });

  const resetFilters = () => {
    setSearch("");
    setModule("all");
    setAction("all");
    setActor("");
    setFrom("");
    setTo("");
  };

  return (
    <AdminLayout>
      <div className="py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileClock className="h-6 w-6" />
            Módosítási napló
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visszakövethető, ki mikor mit módosított az admin felületen.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Szűrők</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <div className="relative lg:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Keresés elemre, táblára, emailre…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger><SelectValue placeholder="Modul" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden modul</SelectItem>
                  {Object.entries(MODULE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={action} onValueChange={setAction}>
                <SelectTrigger><SelectValue placeholder="Művelet" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Minden művelet</SelectItem>
                  <SelectItem value="insert">Létrehozás</SelectItem>
                  <SelectItem value="update">Módosítás</SelectItem>
                  <SelectItem value="delete">Törlés</SelectItem>
                </SelectContent>
              </Select>
              <Input placeholder="Felhasználó email" value={actor} onChange={(e) => setActor(e.target.value)} />
              <Button variant="outline" onClick={resetFilters} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Törlés
              </Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 max-w-md">
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
          </CardContent>
        </Card>

        <ActivityLogList entries={entries} isLoading={isLoading} onSelect={setSelected} />
        <ActivityLogDetailDialog entry={selected} open={!!selected} onOpenChange={(open) => !open && setSelected(null)} />
      </div>
    </AdminLayout>
  );
};

export default Activity;
