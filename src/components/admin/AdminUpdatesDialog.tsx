import { useEffect, useMemo, useState } from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CHANGELOG, type ChangelogEntry } from "@/data/adminChangelog";

const STORAGE_KEY = "admin_updates_dismissed_v1";
const STORAGE_ALL_KEY = "admin_updates_all_dismissed_until";
const DAYS_VISIBLE = 7;
const DAYS_LIST = 30;

const entryId = (e: ChangelogEntry) => `${e.date}|${e.title}`;

const typeStyle = (t: string) => {
  switch (t) {
    case "new":
      return { label: "ÚJ", className: "bg-emerald-600 text-white" };
    case "improved":
      return { label: "FEJLESZTÉS", className: "bg-blue-600 text-white" };
    case "fixed":
      return { label: "JAVÍTÁS", className: "bg-amber-500 text-white" };
    default:
      return { label: "FRISSÍTÉS", className: "bg-primary text-primary-foreground" };
  }
};

function loadDismissed(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const AdminUpdatesDialog = () => {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setDismissed(loadDismissed());
    const onStorage = () => setDismissed(loadDismissed());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [tick, open]);

  const entries = useMemo(() => {
    const cutoff = Date.now() - DAYS_LIST * 24 * 60 * 60 * 1000;
    return CHANGELOG.filter((e) => {
      const ts = new Date(e.date).getTime();
      return !Number.isNaN(ts) && ts >= cutoff;
    });
  }, []);

  const unseenCount = useMemo(() => {
    const cutoff = Date.now() - DAYS_VISIBLE * 24 * 60 * 60 * 1000;
    let allDismissedUntil = 0;
    try {
      allDismissedUntil = parseInt(localStorage.getItem(STORAGE_ALL_KEY) || "0", 10) || 0;
    } catch {
      /* ignore */
    }
    if (Date.now() < allDismissedUntil) return 0;
    return CHANGELOG.filter((e) => {
      const ts = new Date(e.date).getTime();
      if (Number.isNaN(ts) || ts < cutoff) return false;
      return !dismissed.includes(entryId(e));
    }).length;
  }, [dismissed]);

  const persist = (next: string[]) => {
    setDismissed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    setTick((t) => t + 1);
  };

  const toggle = (e: ChangelogEntry) => {
    const id = entryId(e);
    if (dismissed.includes(id)) {
      persist(dismissed.filter((x) => x !== id));
    } else {
      persist([...dismissed, id]);
    }
  };

  const restoreAll = () => {
    persist([]);
    try {
      localStorage.removeItem(STORAGE_ALL_KEY);
    } catch {
      /* ignore */
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9"
          aria-label="Frissítések"
          title="Frissítések"
        >
          <Bell className="h-4 w-4" />
          {unseenCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
              {unseenCount > 9 ? "9+" : unseenCount}
            </span>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[calc(100dvh-2rem)] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between gap-2 pr-6">
            <span>Frissítések és újítások</span>
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={restoreAll}>
              Mind visszaállítása
            </Button>
          </DialogTitle>
        </DialogHeader>
        <div className="overflow-y-auto -mx-6 px-6 space-y-2">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground">Nincs új frissítés.</p>
          )}
          {entries.map((e) => {
            const id = entryId(e);
            const isDismissed = dismissed.includes(id);
            const s = typeStyle(e.type);
            return (
              <div
                key={id}
                className={`rounded-md border p-3 ${isDismissed ? "opacity-60" : "bg-card"}`}
              >
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <Badge className={`${s.className} text-[10px] px-1.5 py-0 h-4`}>
                    {s.label}
                  </Badge>
                  <span className="text-sm font-semibold flex-1 min-w-0 break-words">
                    {e.title}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{e.date}</span>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap break-words">
                  {e.description}
                </p>
                <div className="flex justify-end mt-2">
                  <Button
                    variant={isDismissed ? "default" : "outline"}
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => toggle(e)}
                  >
                    {isDismissed ? "Visszaállítás" : "Megtekintve"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
